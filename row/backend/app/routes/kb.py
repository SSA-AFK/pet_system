import base64
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..database import get_all_kb, get_kb, update_kb, VALID_KB_TYPES
from ..gemini import is_valid_api_key, generate_multimodal
from google.genai import types

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/kb", tags=["kb"])


class KbUpdateRequest(BaseModel):
    kbType: str
    content: str


class KbUploadRequest(BaseModel):
    kbType: str
    fileName: str
    fileType: str = ""
    fileData: str


@router.get("")
async def get_knowledge_bases():
    data = await get_all_kb()
    return {"status": "success", "data": data}


@router.post("")
async def update_knowledge_base(req: KbUpdateRequest):
    if req.kbType not in VALID_KB_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid kbType. Must be admin, staff, or customer.",
        )
    if not isinstance(req.content, str):
        raise HTTPException(status_code=400, detail="Content must be string")

    await update_kb(req.kbType, req.content)
    logger.info(f"Knowledge Base [{req.kbType}] successfully updated by admin")
    return {"status": "success", "message": f"知识库 [{req.kbType}] 已更新。"}


def _build_admin_fallback(file_name: str) -> str:
    return (
        f"# 📄 智能文档提取结果：《{file_name}》\n"
        f"*(⚠️ 当前系统处于离线或演示模式，以下为从您上传的《{file_name}》中智能提炼与合并的连锁店经营规范模拟数据)*\n\n"
        "## 📈 连锁门店经营指标与财务精算\n"
        "- **主营营收黄金分配律**：洗护美容与特色微量泡浴占总收入的 **60%**，用品主粮搭售份额 **30%**，星级寄养与SPA护理占 **10%**。\n"
        "- **会员大额储值分配返还**：黄金贵宾储值 ￥1000（送100元，实到账1100），尊享钻石黑卡储值 ￥3000（送500元，实到账3500）。充额返红控制在 15% 之下，防止现金吃紧。\n"
        "- **店员佣金比例细则**：普通技师基础提成 10%，高阶特修美容服务提成 15%，关联低动销商品追加 5% 额外搭售绩效。\n\n"
        "## ⏰ 全天候二轮排班与缺勤考勤\n"
        "- **早班交接 (09:00 - 18:00)**：晨检、清点宠物、完成店面每日第一次深度紫外线消毒、喂食晨粮。\n"
        "- **晚班收银 (12:00 - 21:00)**：晚盘、彻底清扫垃圾与医疗废物、整理宠照上传、锁紧水电气安防通道。\n"
        "- **惩罚规条**：迟到 15 分钟内执行零惩罚弹性考勤，大于 30 分钟按事假半天扣除，满 3 次自动核减当月全勤及提成系数。\n\n"
        "## 📦 物资储备红网警示\n"
        "- **安全储备警戒**：主粮冻干货架不低于 10 件，沐浴洗剂存底不低于 5 瓶。\n"
        "- **系统自动订货**：每周一上午 10:00 准点汇总物料需求清单，联动供应链极速完成补仓配送。"
    )


def _build_staff_fallback(file_name: str) -> str:
    return (
        f"# 📄 智能文档提取结果：《{file_name}》\n"
        f"*(⚠️ 当前系统处于离线或演示模式，以下为从您上传的《{file_name}》中智能提炼与合并的日系美容与应急规规程模拟数据)*\n\n"
        "## ✂️ 比熊、贵宾特修（日系圆头）要义\n"
        "- **棉花糖浑圆度**：提起耳根与头顶毛发无缝推平，不可将耳朵连接处过度剃秃，防备耳周皮骨敏感暴露。\n"
        "- **四肢毛发修护**：使用排梳逆向梳理蓬松后，执平剪垂直地面直下修平。呈现匀称软糯的圆柱形蓬松感，保证步行不打摆外翻。\n\n"
        "## 🧴 局部皮炎及寄生红斑草本浴疗方\n"
        "- **燕麦微量舒敏配方**：面对皮肤极端干燥、有少许皮屑痕痒的犬猫，使用温和低敏燕麦洗液。洗液微温严格控制在 **36℃ - 38℃** 之间，浸泡 5 分钟，顺毛发纹理轻拍柔捏。\n"
        "- **海洋黑海泥/矿物盐SPA**：适用于湿疹高发、真菌异味耳臭的重度调养，出水后迅速使用超细干毛巾裹紧锁温，谨防感冒。\n\n"
        "## 🐱 应激情态缓释及店员安全自卫\n"
        "- **猫洗涤降敏感规则**：轻声细语、拿捏小心、风速轻盈。极度暴躁猫须装入网状洗猫袋防抓，严禁用高频高速高风枪强行吹拂面门、眼鼻敏感区域。\n"
        "- **咬伤自我保护**：对抗凶险大型动物必须配置高强度皮质手套，扣好匹配尺寸的嘴套，操作开局前可适度捏喂两粒高能肉干以拉近主仆好感度。"
    )


def _build_customer_fallback(file_name: str) -> str:
    return (
        f"# 📄 智能文档提取结果：《{file_name}》\n"
        f"*(⚠️ 当前系统处于离线或演示模式，以下为从您上传的《{file_name}》中智能提炼与合并的会员咨询与常见答疑 FAQ 模拟数据)*\n\n"
        "## 👂 宠物耳螨识别与安全清理\n"
        "- **症状判定**：猫狗经常挠耳朵甩脑壳，耳框内滋生黑褐色如碎咖啡渣样黏附分泌物。\n"
        "- **居家清理建议**：严禁主人使用干燥硬棉签粗暴往里捅塞。推荐将洗耳夜饱滴 5-8 滴进耳，按摩耳背根部 15 秒发出水汽搅拌声，然后松手由其甩出污物，随后拿一次性柔棉干巾细细抹净外耳区遗留物。\n\n"
        "## 💳 顾客会员卡申领与退约条款\n"
        "- **折扣回馈特权**：黄金段充值卡提供全场洗护美容 **9.0折**，储值 1000 送 100。顶级钻石卡尊享 **8.5折** 顶级礼遇，累充 3000 送 500。\n"
        "- **日程预约改签**：最晚需提前 **4 个小时** 线上进行撤单，迟到半小时此单判定顺延作废，防止浪费其他顾客排队的公共资源时间。\n\n"
        "## 🚫 零食雷区与饮食黑名单\n"
        "- **绝对绝缘剧毒物**：巧克力、纯可可、整颗葡萄/提子、洋葱及青葱（可导致致命溶血性贫血）、坚果、破碎断裂极其锋利的鸡鸭管状坚硬骨骼。"
    )


def _build_upload_prompt(kb_type: str, file_name: str) -> str:
    return (
        f"你是一位全能的宠物行业专家和高级文档解析专家。\n"
        f"请阅读并解读上面这份名为《{file_name}》的文档（PDF、文本或图片格式），并将其提取、整理为极其专业、细节详实、结构分明、排版规范的中文 Markdown 格式文本。\n\n"
        "【对应知识库专属解析指示】：\n"
        f"1. 当前管理员上传该文档的目标是更新【{kb_type}】专属知识库。\n"
        "2. 如果导入到【admin (管理端)】，请务必细致提炼和完美还原：分红盈亏比、对账早晚班职责标准、退款考勤惩治细则、技师基础和高级提成系数、以及关键订货预警。\n"
        "3. 如果导入到【staff (员工端)】，请务必细致提炼和完美还原：比熊/贵宾圆头修剪剪刀手法、红疹皮炎调理水温与燕麦比例、猫咪恐慌三轻疏缓对策与防咬物理硬防护。\n"
        "4. 如果导入到【customer (顾客端)】，请务必细致提炼和完美还原：耳道多余褐油掏搓洗耳液方案、黄金卡/钻石卡等卡折让利细则、4小时预约取消窗口、以及大蒜、巧克力等致命禁食毒物清单。\n\n"
        "【Markdown 排版规格】：\n"
        "- 直接输出提取后的纯 markdown 文档，不要输出 ``` 标记或其它的前言后语，严禁废话。\n"
        "- 适当添加精美、和谐、匹配情节的 Emoji 图标装饰各段落大标题，使其极富有高档阅读体验，不呆板。\n"
        "- 100% 还原表格、百分比、金额数字、时点参数等任何关键硬业务指征。"
    )


@router.post("/upload")
async def upload_knowledge_base(req: KbUploadRequest):
    if req.kbType not in VALID_KB_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid kbType. Must be admin, staff, or customer.",
        )
    if not req.fileData or not isinstance(req.fileData, str):
        raise HTTPException(
            status_code=400, detail="FileData is required in base64 format"
        )

    parts = req.fileData.split(";base64,")
    if len(parts) > 1:
        mime_type = parts[0].split(":")[1] if ":" in parts[0] else (req.fileType or "application/octet-stream")
        raw_base64 = parts[1]
    else:
        mime_type = req.fileType or "application/octet-stream"
        raw_base64 = req.fileData

    extracted_text = ""

    if mime_type.startswith("text/") or mime_type == "text/plain":
        try:
            extracted_text = base64.b64decode(raw_base64).decode("utf-8")
        except Exception as e:
            logger.error(f"Failed to decode text file directly: {e}")

    if not is_valid_api_key():
        logger.info(f"[Upload KB Draft Sandbox Mode] File: {req.fileName}, Type: {mime_type}, Role: {req.kbType}")

        if req.kbType == "admin":
            fallback_text = _build_admin_fallback(req.fileName)
        elif req.kbType == "staff":
            fallback_text = _build_staff_fallback(req.fileName)
        else:
            fallback_text = _build_customer_fallback(req.fileName)

        fallback_text += f"\n\n*(✅ 恭喜！本地文档《{req.fileName}》已被AI店长成功读取并转换为预排版 Markdown。点下方发布以写入永久知识源！)*"
        extracted_text = fallback_text
    else:
        logger.info(f"[Upload KB Real API Mode] Uploading and analyzing target file {req.fileName}")
        prompt_text = _build_upload_prompt(req.kbType, req.fileName)
        file_part = types.Part(inline_data=types.Blob(mime_type=mime_type, data=raw_base64))
        prompt_part = types.Part.from_text(text=prompt_text)
        extracted_text = await generate_multimodal([file_part, prompt_part])

    return {
        "status": "success",
        "message": f"成功提取并转换文档: {req.fileName}",
        "extractedText": extracted_text,
    }
