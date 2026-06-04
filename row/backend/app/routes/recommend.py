import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..gemini import is_valid_api_key, generate_text

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/recommend", tags=["recommend"])


class ServiceRecommendRequest(BaseModel):
    species: str = ""
    age: str = ""
    health_notes: str = ""


class ProductRecommendRequest(BaseModel):
    pet_info: str = ""
    purchase_history: list[str] | None = None


def _mock_service_recommend(species: str, age: str, health_notes: str) -> str:
    sp = species or "犬"
    ag = age or "2岁"
    hn = health_notes or "无特殊健康问题"
    return (
        f"### 🐾 AI 智能服务推荐\n\n"
        f"根据您的 **{sp}**（年龄：{ag}，健康备注：{hn}），为您推荐以下服务：\n\n"
        "#### ⭐ 首推服务\n"
        f"1. **基础洗护套餐**（￥98 / 45分钟）\n"
        f"   - 适合 {sp} 的日常清洁护理，温和配方不刺激皮肤\n"
        "2. **深层洁净 SPA 浴**（￥220 / 80分钟）\n"
        "   - 含死海盐矿物泥 SPA，深层清洁毛孔，改善毛发光泽\n\n"
        "#### 💡 附加建议\n"
        f"- 由于 {ag} 的 {sp} 皮肤较为娇嫩，建议搭配 **燕麦低敏洗剂**\n"
        "- 如有耳道清洁需求，可加购耳道护理（￥30）\n"
        "- 首次体验可享受会员折扣，建议办理黄金卡（储值 ￥1000 送 ￥100）\n\n"
        "#### 📅 推荐预约时段\n"
        "- 工作日上午 10:00-11:00 人流较少，体验更佳\n"
        "- 周末建议提前 1 天预约，避免排队等候"
    )


def _mock_product_recommend(pet_info: str, purchase_history: list[str]) -> str:
    pi = pet_info or "宠物"
    history_desc = "、".join(purchase_history) if purchase_history else "暂无购买记录"
    return (
        f"### 🛒 AI 智能商品推荐\n\n"
        f"根据您的 **{pi}** 信息及购买历史（{history_desc}），为您精选以下商品：\n\n"
        "#### 🥇 必购推荐\n"
        "1. **渴望六种鱼猫粮 1.8kg**（￥235）\n"
        "   - 高蛋白低敏配方，适合肠胃敏感的毛孩\n"
        "2. **麦富迪冻干鸡胸肉 500g**（￥58）\n"
        "   - 纯肉冻干零食，训练奖励或日常加餐首选\n\n"
        "#### 🎯 基于购买历史的互补推荐\n"
        "- 已购主粮 → 建议搭配 **营养膏/益生菌** 促进消化吸收\n"
        "- 已购洗护产品 → 建议补充 **护毛素/解结喷雾** 完善洗护体验\n"
        "- 未购玩具 → 推荐 **贵为网球发声球**（￥35），增加互动乐趣\n\n"
        "#### 💰 当前优惠\n"
        "- 会员专属：黄金卡 9 折 / 钻石卡 8.5 折\n"
        "- 满 ￥300 包邮到家，满 ￥500 赠宠物零食小样"
    )


@router.post("/services")
async def recommend_services(req: ServiceRecommendRequest):
    try:
        prompt = (
            "你是一位资深的宠物门店服务顾问，擅长根据宠物特征推荐最合适的服务项目。\n\n"
            "【宠物信息】\n"
            f"- 物种：{req.species or '犬'}\n"
            f"- 年龄：{req.age or '未知'}\n"
            f"- 健康备注：{req.health_notes or '无'}\n\n"
            "可选服务列表：\n"
            "1. 基础洗护套餐 - ￥98 / 45分钟 - 适合短毛犬猫的基础清洁\n"
            "2. 深层洁净 SPA 浴 - ￥220 / 80分钟 - 死海盐矿物泥高端 SPA\n"
            "3. 猫咪低应激洗护 - ￥120 / 50分钟 - 使用猫袋辅助，三轻原则\n"
            "4. 日系圆头造型修剪 - ￥250 / 75分钟 - 比熊/贵宾造型\n"
            "5. 寄养一天 - ￥100 / 天 - 含两次喂食和遛弯\n\n"
            "请从上述服务中推荐最适合的 2-3 项，并说明推荐理由。\n"
            "使用精美的 Markdown 格式，配合 emoji，推荐内容需包含：\n"
            "1. ⭐ 首推服务及理由\n"
            "2. 💡 附加建议（搭配服务、会员优惠等）\n"
            "3. 📅 推荐预约时段"
        )

        if not is_valid_api_key():
            return {"content": _mock_service_recommend(req.species, req.age, req.health_notes)}

        text = await generate_text(prompt)
        return {"content": text}
    except Exception as e:
        logger.error(f"Error generating service recommendation: {e}")
        raise HTTPException(status_code=500, detail=str(e) or "Generate service recommendation failed")


@router.post("/products")
async def recommend_products(req: ProductRecommendRequest):
    try:
        history_desc = "、".join(req.purchase_history) if req.purchase_history else "暂无购买记录"
        prompt = (
            "你是一位资深的宠物用品零售顾问，擅长根据客户购买历史和宠物信息推荐商品。\n\n"
            "【客户信息】\n"
            f"- 宠物信息：{req.pet_info or '未提供'}\n"
            f"- 购买历史：{history_desc}\n\n"
            "可选商品列表：\n"
            "1. 皇家小型犬成犬粮 2kg - ￥128\n"
            "2. 渴望六种鱼猫粮 1.8kg - ￥235\n"
            "3. 克里斯汀森经典洗毛液 3.78L - ￥155\n"
            "4. 维克耳漂 60ml - ￥72\n"
            "5. 麦富迪冻干鸡胸肉 500g - ￥58\n"
            "6. 贵为网球发声球 - ￥35\n\n"
            "请根据购买历史和宠物信息，推荐 2-4 件最合适的商品。\n"
            "使用精美的 Markdown 格式，配合 emoji，推荐内容需包含：\n"
            "1. 🥇 必购推荐及理由\n"
            "2. 🎯 基于购买历史的互补推荐\n"
            "3. 💰 当前优惠活动"
        )

        if not is_valid_api_key():
            return {"content": _mock_product_recommend(req.pet_info, req.purchase_history or [])}

        text = await generate_text(prompt)
        return {"content": text}
    except Exception as e:
        logger.error(f"Error generating product recommendation: {e}")
        raise HTTPException(status_code=500, detail=str(e) or "Generate product recommendation failed")
