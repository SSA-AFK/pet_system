import asyncio
import logging
from datetime import datetime
from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..database import get_kb, Appointment, Client, Inventory, Service, AsyncSessionLocal, select
from ..gemini import is_valid_api_key, generate_text

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/gemini", tags=["gemini"])


class AnalyzeBusinessRequest(BaseModel):
    stats: dict[str, Any] | None = None
    recentSales: list[dict[str, Any]] | None = None
    lowStock: list[dict[str, Any]] | None = None
    activeStaff: list[dict[str, Any]] | None = None


class SuggestGroomingRequest(BaseModel):
    petType: str = ""
    breed: str = ""
    age: str = ""
    coatType: str = ""
    skinCondition: str = ""
    coatCondition: str = ""


class PetHealthRequest(BaseModel):
    petBrief: str = ""
    symptom: str = ""
    imageBase64: str = ""


class ChatRequest(BaseModel):
    role: str = ""
    message: str = ""
    history: list[dict[str, Any]] | None = None


def _mock_business_analysis(stats: dict | None, low_stock: list | None) -> str:
    s = stats or {}
    ls = low_stock or []
    names = "、".join([i.get("name", "冻干宠粮") for i in ls]) if ls else "冻干宠粮"
    count = len(ls) if ls else 3
    return (
        f"### 📊 经营现状深度分析\n"
        f"- **营收动能强劲**：本月总营收达 **{s.get('monthlyRevenue', '￥45,800')}**，相较上月稳健增长 **{s.get('revenueGrowth', '12.4%')}**。这表明当前的定价策略和服务配比符合市场需求。\n"
        f"- **会员存量价值凸显**：客户群体中，**洗护次卡、美容套餐**等高频消费仍占大头，本月新增会员 **{s.get('newMembers', '45')}** 位，会员流失率极低。\n"
        f"- **库存与供应链短板**：当前面临 **{count}** 项关键商品（如{names}）库存见底。这会导致客户到店购买落空，流失高毛利的商品搭售机会。\n\n"
        f"### 🔮 下季度营收预测\n"
        "- **增长性预估**：按照目前 **12.4%** 的环比增速，结合即将到来的夏季（宠物洗护美容的需求爆发期），保守估计下季度总营收将达到 **￥148,000 - ￥162,000**，环比可进一步提升 **15%-18%**。\n"
        "- **关键突破点**：洗护服务效率一旦通过合理排班调优释放，即可每天多承接 3-5 单预约，直接贡献额外 ￥12,000/月 纯利润。\n\n"
        "### 👤 核心客户画像及消费偏好\n"
        "- **高阶养宠新贵（占40%）**：多为繁华街区年轻白领，偏好日系造型美容、精油SPA、高端烘焙粮。对价格不敏感，极度重视服务细节和宠物体验。\n"
        "- **刚需精致养猫家庭（占35%）**：以猫咪洗护、定期驱虫及冻干零食为主。该群体多选择周末预约，到店伴随逗留，重度依赖AI健康智能建议和积分商城。\n"
        "- **大众实用养犬家庭（占25%）**：中大型犬洗澡、刚需犬粮采购，重视性价比和会员卡储值优惠。\n\n"
        "### 💡 落地优化建议\n"
        "1. **服务预约分流**：根据员工排班，提供工作日\u201c预约洗护8.5折\u201d或多送10智能会员积分策略，降低周末爆单压力。\n"
        f"2. **AI库存联动采购**：设定阈值，通过系统自动对低库存商品（如 {names}）进行预警，并在每周一统一向供应商发起采购。\n"
        "3. **精准交叉体验推荐**：针对仅进行洗护的会员，在其到店时通过系统赠送\u201c微量元素除臭SPA体验券\u201d，撬动高端增值服务的转化率。"
    )


def _mock_grooming_suggestion(breed: str, skin: str, coat: str) -> str:
    b = breed or "比熊"
    s = skin or "局部有皮肤红疹"
    c = coat or "稍有打结"
    return (
        f"### 🧴 沐浴香波与 SPA 配方推荐\n"
        f"- **洗剂选用**：针对该 {b} 身上【{s}】的情况，坚决避免使用去脂力过强的碱性沐浴露。推荐选用 **燕麦修护低敏香波**（温和舒缓、止痒），二剂搭配 **草本消炎精油浴/微气泡死海盐SPA** 浸泡8-10分钟，可以有效消炎并滋润干燥红疹部位。\n"
        f"- **毛发调理**：由于毛发【{c}】，在冲洗前必须先用温水稀释 **轻透草本护毛素**，均匀涂抹并静置3分钟，软化死结后再顺毛冲洗。\n"
        "- **合适水温**：恒温 **36℃ - 38℃**，水温不宜过高，避免刺激有红疹的皮脂腺。\n\n"
        f"### ✂️ 修剪与造型设计\n"
        f"- **造型推荐**：鉴于 {b} 的卷毛膨松特性，推荐定制经典的 **日系棉花糖圆头装**（耳部与头顶圆润过渡，弱化红疹耳道的突兀感）。\n"
        "- **实操安全避嫌**：\n"
        f"  - 【重度防范区】：{s} 的红肿部位，下刀修毛时**严禁用梳剪直接紧贴皮肤**，须距离皮肤保留至少 0.5 厘米，改用小号直剪以\u201c飞剪\u201d手法轻柔修正。\n"
        "  - 臀部及内股皮肤比较稚嫩，同样要避开直吹与锐利刀片。\n\n"
        "### 💆 实操细节与手法建议\n"
        "1. **解结手法**：切勿生拉硬拽！先喷洒 **解结喷雾**，用排梳配针梳从毛尖开始，分层由外向内打散，如有顽固结块，可用单片剪刀竖向将结切成细股，再行梳理。\n"
        "2. **吹风手法**：使用中温低速。头脸部逆向吹风，吹干的同时用针梳向外拉松卷毛以建立蓬松感。在吹扫肚子和胯下有皮肤红疹部位时，改用**清凉自然风**，谨防热烘加重瘙痒。\n"
        "3. **情绪抚慰**：入水前先在耳边开水流让其适应，并轻抚其胸口。服务中适时奖励一粒洁齿冻干，安抚紧张情绪。\n\n"
        "### ⏱️ 服务时长估算与收费建议\n"
        "- **耗时估算**：基础洗护 50 分钟 + 局部消炎 SPA 15 分钟 + 剪刀精修 45 分钟，总预计 **110 分钟**。\n"
        "- **溢价建议**：基础洗剪级别收费 **￥150**，因增加了**皮肤药浴护理与解结去死毛**，建议增收高阶皮肤调理费 **￥30-￥50**，全套方案售价 **￥180 - ￥200**。"
    )


def _mock_pet_health(pet_brief: str, symptom: str) -> str:
    pb = pet_brief or "宠物"
    sy = symptom or "挠眼睛、抓耳朵，出现红肿或有些褐色分泌物"
    return (
        f"### 🩺 初步疾病可能性判定\n"
        f"根据您描述的【{pb}】症状（{sy}），结合临床常见病例，高度怀疑以下两点原因：\n"
        "1. **耳痒螨感染（耳螨）**：这是犬猫最常见的耳道寄生虫。极易引起剧烈震耳和频繁抓挠，分泌物多呈散落的、类似咖啡渣的黑褐色粉末。\n"
        "2. **马拉色菌/真菌性耳道炎**：多因耳道潮湿（如洗澡后未完全吹干）或过敏引发。常伴有红斑、酸臭异味和油腻耳垢。\n\n"
        "### 🏥 居家观察与护理指南\n"
        "- **翻开耳廓观察**：用手机手电筒轻照宠物内耳廊，检查红肿的范围，是否有抓挠导致的血肿或破溃，并问一下是否有较为强烈的酸臭气味。\n"
        "- **严禁干棉签盲掏**：千万不要使用普通的干棉签直接伸入耳道深处掏挖，这会把耳垢推入更深处，甚至擦伤耳道。\n"
        "- **食欲状态追踪**：观察其进食、日常精神。如能正常玩耍和吃粮，多属于局部表皮或耳道骚痒；如开始精神不振、反复甩头并伴有高热，则可能已经蔓延到中耳及内耳。\n\n"
        "### 💊 安全药物与居家护理品建议\n"
        "- **精细清洗耳道**：推荐选用含有 **水杨酸或大蒜素配方的温和宠物洗耳液**（如维克、耳肤灵等品牌）。使用时，将药液直接滴入宠物耳道（5-8滴），轻揉耳根部 15-20 秒，发出沙沙的声音，然后放手让宠物自己将污垢甩出，最后用干净的纯棉柔巾/化妆棉擦净外耳道多余液体。\n"
        "- **每日频次**：如果是耳螨，建议先使用耳道清洁液清理，再配合抗寄生虫滴耳药（如耳康、硼酸冰片等），连续护理 7-14 天为一个周期。\n\n"
        "### 🚨 触发紧急送医指征\n"
        "若出现以下任何一样症状，需立刻前往线下宠物医院诊断：\n"
        "- 宠物抓挠得过度剧烈，耳廓处出现**红肿发热的大血泡（耳血肿）**。\n"
        "- 头部长期呈现**一侧歪斜**、走路丧失平衡感，或出现眼睛震颤。\n"
        "- 甩头时宠物发出极其痛苦的痛苦鸣叫，极度抗拒主人触碰耳周。\n\n"
        "***注：以上基于AI医学知识图谱分析，仅作为日常护理和基础判定参考。宠物若出现高热、萎靡、不吃不喝或急性呕吐，请务必第一时间送去正规宠物医院线下确诊治疗。***"
    )


def _mock_chat_message(kb_type: str, kb_content: str, message: str) -> str:
    msg = (message or "").lower()

    if kb_type == "admin":
        if any(w in msg for w in ["比例", "提成", "盈亏", "钱"]):
            return (
                "🐾 您好！当前根据我们最新维护的《经营管理知识库》，我们店有如下财务与佣金佣金比例：\n\n"
                "- **黄金盈亏比**：洗护服务占 60%，用品搭售 30%，寄养/SPA 10%\n"
                "- **技师佣金提成**：基础提成 10%，高阶SPA或皮肤调理额外计 15% 提成，关联零售 5%。\n"
                "- **储值权益**：黄金卡送 100元，钻石卡送 500元。\n\n"
                "您还需要我对其他提成规则或财务模型做经营建议吗？💡"
            )
        if any(w in msg for w in ["排班", "迟到", "考勤", "上班"]):
            return (
                "⏰ 您好，关于员工考勤与排班。目前执行的标准是：\n\n"
                "- **早班 (09:00-18:00)**：主要负责检查宠物、发放早粮、开店卫生环境消杀。\n"
                "- **晚班 (12:00-21:00)**：主要负责封馆清仓、现金对账及安全防护检查。\n"
                "- **考勤规定**：迟到 15 分钟以内豁免，若超过 30 分钟按事假半天记。连续迟到三次会影响提成哦。"
            )
        if any(w in msg for w in ["库存", "警告", "报警", "订货"]):
            return (
                "📦 关于商品与洗剂备料：\n\n"
                "- **预警下限**：主粮/冻干类安全阈值为 10 件；沐浴液及消耗用品不得低于 5 瓶/件。\n"
                "- **补货时间**：每周一上午 10 点，通过后台联动自动向供应商提报物料储备清单。\n\n"
                "请随时吩咐我协助向采购渠道发送申请！"
            )
        return (
            "👑 您好，老板！我是您的 **\u201c店铺经营分析AI\u201d**。\n\n"
            f"我已经接入了您刚刚编辑过的 **《经营管理知识库》**：\n\n"
            "---\n"
            f"{kb_content[:250]}...\n"
            "---\n\n"
            "请问您需要调整哪些服务定价、考勤标准或者是了解具体的库存策略呢？请直接告诉我！🐾"
        )

    if kb_type == "staff":
        if any(w in msg for w in ["造型", "比熊", "贵宾", "修剪"]):
            return (
                "✂️ 美容师伙伴您好！根据《洗护美容安全手册》中修剪指南：\n\n"
                "- **比熊/贵宾日系圆头**：将耳根提起并与头顶无缝剪圆，避免由于过度掏空导致皮肉外漏。\n"
                "- **修剪手法**：腿部毛发由外朝内梳理蓬松，使用长剪刀垂直剪成圆柱造型，保持活泼视觉效果。\n\n"
                "操作时请注意安抚宠物情绪，避免利器刮伤肚子和腋下喔。"
            )
        if any(w in msg for w in ["皮", "痒", "疹", "药"]):
            return (
                "🧴 收到！关于皮肤红疹/敏感宠物的洗护方案：\n\n"
                "- **推荐配方**：使用 **燕麦舒缓低敏洗发水**，严格将水温稳固在 **36℃-38℃** 温热水之间，全身揉按保持 5 分钟充分止痒吸收。\n"
                "- **重度异味/湿疹**：使用配套 **死海盐/海洋泥SPA**，浴后尽快擦干。"
            )
        if any(w in msg for w in ["咬", "抓", "敏感", "凶"]):
            return (
                "🚨 安全生产重于泰山！店员洗护防咬指南：\n\n"
                "- **高频应激猫咪**：采用\u201c三轻法则\u201d（手轻、动作轻、声音轻），搭配专用猫洗护袋，头部不可使用高功率吹水机强吹。\n"
                "- **凶猛犬只**：洗户前穿戴防护手套，戴上合规尺寸的塑料嘴套，或者到店后先给几粒安慰级冻干再行抚摸。"
            )
        return (
            "✂️ 您好，专业的美容技师！我已经和您的 **《洗护美容与安全实操规程》** 完成对接。\n\n"
            "您可以使用此 AI 查找比错修型、泡澡泥SPA配料或是防应激紧急干预标准。请输入您的实操疑问！🐾"
        )

    # customer
    if any(w in msg for w in ["挠", "朵", "黑", "痒"]):
        return (
            "🐶 亲爱的家长您好！根据我们萌宠知识库的建议：\n\n"
            "- **疑似耳螨感染**：宠物挠耳朵、甩头伴有咖啡渣色褐屑多属于耳螨。 \n"
            "- **清洁手法**：绝不建议拿干棉签硬掏。应常备 **宠物专用温柔耳道清洗液**，一侧滴 5-8 滴，轻轻捏住耳根揉捏 15 秒使液体进入中耳，松手让它自由甩出污泥后，再拿棉布/湿巾将外耳边缘的灰泥轻轻抹干净。严重需送院检查！"
        )
    if any(w in msg for w in ["充", "会员", "取消", "价格"]):
        return (
            "💳 会员卡使用及规则问题：\n\n"
            "- **钻石会员卡**：折合全场洗护美容服务 **8.5 折**，储值 3000 元送 500 元。\n"
            "- **黄金会员卡**：折合全场洗护服务 **9 折**，储值 1000 元送 100 元。\n"
            "- **取消规则**：为保障预约，请至少**提前 4 小时**从线上小程序进行退改签预约。"
        )
    if any(w in msg for w in ["不能吃", "禁食", "毒", "巧克力"]):
        return (
            "🦴 紧急健康科普：**宠物严禁食用**以下食品！\n\n"
            "- 巧克力、咖啡因\n"
            "- 洋葱粒、大蒜、青葱\n"
            "- 提子/葡萄（容易引发急性肾衰竭）\n"
            "- 木糖醇软糖、坚果、破碎锋利的鸭鸡骨头。\n\n"
            "若误食以上，请在黄金4小时内送往宠物急诊进行催吐！"
        )
    return (
        "👋 您好，尊敬的宠物店尊贵会员！我是您的 **\u201c萌宠管家AI\u201d**。\n\n"
        "我已经为您加载了专属的 **《宠物健康自助答疑与店务FAQ知识库》** 咨询库。您可以直接提问关于：\n\n"
        "1. 会员积分与优惠折扣标准 (如: 黄金卡、钻石卡权益)\n"
        "2. 猫狗耳朵发红甩头、耳螨等居家简单调理\n"
        "3. 宠物误食巧克力、洋葱等自救手册\n\n"
        "欢迎向我提问关于您宝贝的一切健康小常识！🌸"
    )


@router.post("/analyze-business")
async def analyze_business(req: AnalyzeBusinessRequest):
    try:
        stats = req.stats or {}
        low_stock = req.lowStock or []
        active_staff = req.activeStaff or []
        recent_sales = req.recentSales or []

        staff_desc = ", ".join(
            f"{s.get('name', '')}({s.get('role', '')}, 今日排班:{s.get('shift', '')})"
            for s in active_staff
        )
        sales_desc = "\n".join(
            f"- 【{s.get('category', '')}】{s.get('description', '')}，金额：￥{s.get('amount', '')}，时间：{s.get('time', '')}"
            for s in recent_sales
        )
        stock_desc = "\n".join(
            f"- 【{i.get('name', '')}】当前库存：{i.get('stock', '')}{i.get('unit', '')}，安全阈值：{i.get('minStock', '')}{i.get('unit', '')}"
            for i in low_stock
        )

        # Query database for enhanced analytics
        total_clients = 0
        new_clients_month = 0
        repeat_customers = 0
        top_services_desc = "暂无数据"
        low_stock_items_count = len(low_stock) if low_stock else 0
        total_stock = 0
        stock_desc_enhanced = stock_desc
        total_appointments = 0
        busy_days = "暂无数据"
        cancel_rate = "0%"

        try:
            async with AsyncSessionLocal() as session:
                # Client retention metrics
                clients_result = await session.execute(select(Client).where(Client.is_active == True))
                all_clients = clients_result.scalars().all()
                total_clients = len(all_clients)
                current_month = datetime.now().strftime("%Y-%m")
                new_clients_month = sum(
                    1 for c in all_clients if c.join_date and c.join_date.startswith(current_month)
                )
                repeat_customers = sum(1 for c in all_clients if c.points and c.points >= 500)

                # Service profitability - top services by count
                services_result = await session.execute(select(Service).where(Service.is_active == True))
                all_services = services_result.scalars().all()
                appointments_result = await session.execute(select(Appointment))
                all_appointments = appointments_result.scalars().all()
                total_appointments = len(all_appointments)

                service_counts: dict[str, int] = {}
                for a in all_appointments:
                    service_counts[a.service_name] = service_counts.get(a.service_name, 0) + 1
                top_services_list = sorted(service_counts.items(), key=lambda x: x[1], reverse=True)[:5]
                if top_services_list:
                    top_services_desc = "\n".join(
                        f"   - {name}: 预约 {count} 次，单价 ￥{next((s.price for s in all_services if s.name == name), 0)}"
                        for name, count in top_services_list
                    )

                # Inventory turnover
                inv_result = await session.execute(select(Inventory).where(Inventory.is_active == True))
                all_inventory = inv_result.scalars().all()
                low_stock_items_count = sum(1 for i in all_inventory if i.stock <= i.min_stock)
                total_stock = sum(i.stock for i in all_inventory)
                stock_desc_enhanced = "\n".join(
                    f"   - {i.name}: 库存 {i.stock}{i.unit}（阈值 {i.min_stock}{i.unit}，{'⚠️ 低库存' if i.stock <= i.min_stock else '✅ 正常'}）"
                    for i in all_inventory
                )

                # Appointment trends
                if all_appointments:
                    day_counts: dict[str, int] = {}
                    cancelled = 0
                    for a in all_appointments:
                        if a.date_time:
                            try:
                                dt = datetime.strptime(a.date_time, "%Y-%m-%d %H:%M")
                                day_name = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][dt.weekday()]
                                day_counts[day_name] = day_counts.get(day_name, 0) + 1
                            except (ValueError, IndexError):
                                pass
                        if a.status == "cancelled":
                            cancelled += 1
                    if day_counts:
                        sorted_days = sorted(day_counts.items(), key=lambda x: x[1], reverse=True)
                        busy_days = "、".join(f"{d}({c}单)" for d, c in sorted_days[:3])
                    cancel_rate = f"{(cancelled / total_appointments * 100):.1f}%" if total_appointments > 0 else "0%"

        except Exception as db_err:
            logger.warning(f"Database query failed for enhanced analytics: {db_err}")

        prompt = (
            "你是一位经验丰富的宠物行业商业顾问和数据分析师。\n"
            "根据以下宠物店真实运营数据，为店主（超级管理员）提供一份深度的【智能经营分析、营收预测、客户画像与优化建议】：\n\n"
            "### 店铺运营现状\n"
            "1. 核心指标：\n"
            f"   - 本月总营收：{stats.get('monthlyRevenue', '￥45,800')} (增长率: {stats.get('revenueGrowth', '+12.4%')})\n"
            f"   - 会员总数：{stats.get('totalMembers', f'{total_clients}人')} (本月新增: {stats.get('newMembers', f'+{new_clients_month}人')})\n"
            f"   - 待处理预约：{stats.get('pendingAppointments', '12单')}\n"
            f"   - 库存警告数：{low_stock_items_count} 件商品库存紧张\n"
            "2. 员工效率：\n"
            f"   - 活跃在岗员工数：{len(active_staff) if active_staff else 4}人\n"
            f"   - 主要在岗：{staff_desc}\n"
            "3. 关键业务流数据（最近销售）：\n"
            f"   {sales_desc}\n"
            "4. 低库存警告：\n"
            f"   {stock_desc}\n\n"
            "### 客户留存指标\n"
            f"   - 客户总数：{total_clients} 人\n"
            f"   - 本月新增客户：{new_clients_month} 人\n"
            f"   - 回头客（积分≥500）：{repeat_customers} 人，占比 {f'{(repeat_customers / total_clients * 100):.1f}' if total_clients > 0 else '0'}%\n\n"
            "### 服务盈利分析\n"
            f"   热门服务排行（按预约次数）：\n{top_services_desc}\n\n"
            "### 库存周转情况\n"
            f"   全店库存总量：{total_stock} 件，低库存商品：{low_stock_items_count} 项\n"
            f"   库存详情：\n{stock_desc_enhanced}\n\n"
            "### 预约趋势\n"
            f"   - 总预约量：{total_appointments} 单\n"
            f"   - 最忙时段/日：{busy_days}\n"
            f"   - 取消率：{cancel_rate}\n\n"
            "请结合上述数据，产出以下结构化报告（使用结构清晰、精美的 Markdown 格式，语气专业且具有前瞻性）：\n"
            "一、 📊 经营现状深度分析（总结优势、指出经营瓶颈，特别结合营收和库存警告）\n"
            "二、 🔮 下季度营收预测（基于增长率给出量化的预测值及支撑逻辑）\n"
            "三、 👤 核心客户画像及消费偏好（美容洗护 vs 宠粮用品 的客户区分，结合客户留存率、回头客比例提供精准营销方向）\n"
            "四、 📈 服务与库存运营洞察（分析热门服务的盈利贡献、低库存商品的补货紧迫性、库存周转效率）\n"
            "五、 📅 排班与预约优化（基于最忙时段和取消率，建议最优人员排班策略和预约分流方案）\n"
            "六、 💡 落地优化建议（提供至少3条具体的行动方案，包括员工排班、库存调拨、会员裂变、服务定价等）"
        )

        if not is_valid_api_key():
            return {"content": _mock_business_analysis(req.stats, req.lowStock)}

        text = await generate_text(prompt)
        return {"content": text}
    except Exception as e:
        logger.error(f"Error generating business analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e) or "Generate business analysis failed")


@router.post("/suggest-grooming")
async def suggest_grooming(req: SuggestGroomingRequest):
    try:
        prompt = (
            "你是一位顶级的宠物美容总监和中兽医皮肤调理师。\n"
            "请针对以下宠物信息，定制一套高水准的洗护/美容方案和员工实操建议。\n\n"
            "【宠物基础情况】\n"
            f"- 种类/品种：{req.petType or '犬'} / {req.breed or '比熊'}\n"
            f"- 年龄：{req.age or '2岁'}\n"
            f"- 毛质：{req.coatType or '卷毛/蓬松'}\n"
            f"- 皮肤情况：{req.skinCondition or '正常，局部有些许干燥红疹'}\n"
            f"- 毛发状况：{req.coatCondition or '稍有打结，无光泽'}\n\n"
            "请从专业角度，详细撰写以下内容（结构清晰，使用精美的 Markdown 格式，重点突出的图标符号）：\n"
            "1. 🧴 【沐浴香波与spa配方推荐】：（根据皮肤和毛发状况，如控油、舒缓、除臭、蓬松护毛等，推荐具体的洗剂分类、水温及配料）\n"
            "2. ✂️ 【修剪与造型设计】：（结合品种和毛质，推荐适合的造型，如圆头装、松鼠尾、泰迪装等，并指出需要避开的敏感或受损皮肤区域）\n"
            "3. 💆 【实操细节与手法建议】：（如遇敏感、打结毛发的解毛手法，吹干时的风温和逆向或顺向吹梳，情绪安抚技巧等）\n"
            "4. ⏱️ 【服务时长估算与收费建议】：（给出该方案推荐的合理服务时长及进阶溢价点）"
        )

        if not is_valid_api_key():
            return {"content": _mock_grooming_suggestion(req.breed, req.skinCondition, req.coatCondition)}

        text = await generate_text(prompt)
        return {"content": text}
    except Exception as e:
        logger.error(f"Error generating grooming suggestion: {e}")
        raise HTTPException(status_code=500, detail=str(e) or "Generate grooming suggestion failed")


@router.post("/pet-health")
async def pet_health(req: PetHealthRequest):
    try:
        prompt_text = (
            "你是一位资深的注册执业宠物医师（全科兽医专家）。\n"
            "客户通过前台小程序发起了咨询。\n"
            f"宠物简况：{req.petBrief or '猫咪/未注明'}\n"
            f"问题/症状描述：{req.symptom or '最近频繁用爪子挠耳朵，有黑褐色分泌物，食欲有点不好。'}\n\n"
            "请针对上述症状，从专业医学角度给出系统化意见。\n"
            "你的回复必须包括以下几个精美排版的模块：\n"
            "1. 🩺 【初步疾病可能性判定】：（根据症状详述最可能的原因，如耳道耳螨、马拉色菌感染、换季红疹、消化不良等）\n"
            "2. 🏥 【居家观察与护理指南】：（提供简单安全的居家清洁、喂食、观察要素，指导客户如何确认问题是否恶化）\n"
            "3. 💊 【安全药物/护理品建议】：（列举安全的、温和不需要处方的洗耳液、洗眼水、益生菌或常规护理产品）\n"
            "4. 🚨 【触发紧急送医指征】：（列出哪些症状一旦发生，必须极速送犬猫急诊，起到预警作用）\n\n"
            "【免责声明】：请在回答末尾添加以下中文格式化的严谨医嘱提示（用斜体粗体标记）：\u201c*注：以上基于AI医学知识图谱分析，仅作为日常护理和基础判定参考。宠物若出现高热、萎靡、不吃不喝或急性呕吐，请务必第一时间送去正规宠物医院线下确诊治疗。*\u201d"
        )

        if not is_valid_api_key():
            return {"content": _mock_pet_health(req.petBrief, req.symptom)}

        if req.imageBase64:
            from ..gemini import generate_multimodal
            from google.genai import types

            mime_type = "image/png" if "png" in req.imageBase64 else "image/jpeg"
            raw_data = req.imageBase64.split(";base64,")[-1] if ";base64," in req.imageBase64 else req.imageBase64
            image_part = types.Part(inline_data=types.Blob(mime_type=mime_type, data=raw_data))
            text_part = types.Part.from_text(text=prompt_text + "\n\n【用户上传了宠物照片/患处特写，请在分析中结合照片反馈】")
            text = await generate_multimodal([image_part, text_part])
        else:
            text = await generate_text(prompt_text)

        return {"content": text}
    except Exception as e:
        logger.error(f"Error generating pet health feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e) or "Generate pet health feedback failed")


@router.post("/chat")
async def chat(req: ChatRequest):
    try:
        user_role = (req.role or "").lower()
        if "admin" in user_role or "manager" in user_role or "boss" in user_role:
            kb_type = "admin"
            kb_name = "店铺经营与连锁管理知识库"
        elif "staff" in user_role or "groomer" in user_role:
            kb_type = "staff"
            kb_name = "洗护美容与安全实操规程"
        else:
            kb_type = "customer"
            kb_name = "宠物健康自助答疑与店务FAQ知识库"

        kb_content = await get_kb(kb_type) or ""

        if not is_valid_api_key():
            await asyncio.sleep(0.8)
            return {"content": _mock_chat_message(kb_type, kb_content, req.message)}

        # Role definition + knowledge base → system_instruction (cached by Gemini)
        sys_instruction = (
            f"你是一位非常有亲和力、专业且严谨的宠物门店AI超级助理。你的名字叫\u201c萌宠管家AI\u201d。\n"
            f"目前你针对的用户身份拥有【{req.role or 'CUSTOMER'}】权限，因此你被专门对接了专属的《{kb_name}》。\n\n"
            "在回答时，你必须严格遵循以下两个准则：\n"
            "1. 优先阅读并提取下方的【专属内部知识库】的内容，如果用户的提问能够与知识库中的规章、配方、业务规范产生关联，请务必直接、详细地应用它们。如果用户提问超过了知识库范围，用你的专业全科宠物知识来友好解答。\n"
            "2. 回答格式请使用精美的 Markdown，配合生动的 Emoji 图标（如 🧴 🐾 🦴 ⭐ 🏥 💡 等），使排版清晰，段落之间有呼吸感。\n\n"
            "【引用的专属内部知识库内容如下：】\n"
            f"{kb_content}\n"
        )

        # User prompt: only conversation history + current question
        user_prompt = f"当前用户的新问题：{req.message}"
        if req.history and len(req.history) > 0:
            history_lines = []
            for h in req.history:
                role_label = "用户" if h.get("role") == "user" else "AI助理"
                parts = h.get("parts", [])
                text = parts[0].get("text", "") if parts else h.get("message", "")
                history_lines.append(f"{role_label}: {text}")
            user_prompt = "以下是先前的交流记录：\n" + "\n".join(history_lines) + f"\n\n最新提问：{req.message}"

        text = await generate_text(user_prompt, system_instruction=sys_instruction)
        return {"content": text}
    except Exception as e:
        logger.error(f"Error generating conversational chat response: {e}")
        raise HTTPException(status_code=500, detail=str(e) or "Generate conversational chat failed")
