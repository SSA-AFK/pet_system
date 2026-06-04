from sqlalchemy import Column, String, Text, DateTime, Boolean, Float, Integer, select, delete
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime
import hashlib
from passlib.context import CryptContext
from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async_engine = create_async_engine(settings.async_database_url, echo=False)
AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)
Base = declarative_base()

class KnowledgeBase(Base):
    __tablename__ = "knowledge_bases"
    
    id = Column(String, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # SUPER_ADMIN, MANAGER, STAFF, CUSTOMER
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, nullable=True)

class Service(Base):
    __tablename__ = "services"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    duration = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Inventory(Base):
    __tablename__ = "inventory"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    stock = Column(Integer, nullable=False)
    unit = Column(String, nullable=False)
    min_stock = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    shift = Column(String, nullable=True)
    attendance = Column(String, default="未签到")
    attendance_time = Column(String, nullable=True)
    monthly_revenue = Column(Float, default=0.0)
    base_salary = Column(Float, default=0.0)
    commission_rate = Column(Float, default=10.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Pet(Base):
    __tablename__ = "pets"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    breed = Column(String, nullable=False)
    age = Column(String, nullable=True)
    owner_name = Column(String, nullable=True)
    owner_phone = Column(String, nullable=True)
    health_notes = Column(Text, nullable=True)
    status = Column(String, default="idle")
    created_at = Column(DateTime, default=datetime.utcnow)

class Client(Base):
    __tablename__ = "clients"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    wechat = Column(String, nullable=True)
    level = Column(String, default="普通会员")
    points = Column(Integer, default=0)
    balance = Column(Float, default=0.0)
    join_date = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(String, primary_key=True, index=True)
    pet_id = Column(String, nullable=True)
    pet_name = Column(String, nullable=False)
    pet_type = Column(String, nullable=True)
    pet_age = Column(String, nullable=True)
    pet_weight = Column(String, nullable=True)
    breed = Column(String, nullable=True)
    service_name = Column(String, nullable=False)
    client_name = Column(String, nullable=False)
    client_phone = Column(String, nullable=True)
    client_wechat = Column(String, nullable=True)
    date_time = Column(String, nullable=False)
    groomer_name = Column(String, nullable=True)
    status = Column(String, default="pending")
    total_price = Column(Float, default=0)
    progress_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Support both bcrypt and legacy sha256 hashes
    if hashed_password.startswith("$2"):
        return pwd_context.verify(plain_password, hashed_password)
    # Legacy sha256 fallback
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

DEFAULT_KNOWLEDGE_BASES = {
    "admin": """# 宠物店日常经营与连锁管理规范

## 1. 核心财务与盈亏平衡
- 黄金盈亏比：洗护美容服务营收应占 60%，宠粮商品搭售占 30%，特色SPA及寄养占 10%。
- 会员卡充值管理：充值返赠最高不超过 15%，确保现金流健康。黄金卡储值 ￥1000（送100），钻石卡储值 ￥3000（送500）。
- 佣金分配规则：技师基础提成 10%，完成高阶SPA或皮肤治疗服务提成 15%，搭售低库存商品提成 5%。

## 2. 员工考勤与班次排定
- 早班 (09:00-18:00)：负责开店、设备消毒、检查宠物状态及发放早粮。
- 晚班 (12:00-21:00)：负责晚间清仓、垃圾清运、结算收银、更新宠物状态及确保店面安全。
- 考勤异常：迟到 15 分钟内不扣，超出半小时按事假半天计，连续 3 次迟到扣除绩效提成。

## 3. 库存预警与自动订货规则
- 安全库存下限：主粮/冻干类不得低于 10 包。洗剂用品不得低于 5 瓶。
- 进货周期：每周一上午 10:00 统一向签约供应链下达补货清单。""",
    "staff": """# 宠物洗护美容技术规程与安全手册

## 1. 贵宾/比熊犬日系修修剪造型要点
- 日系棉花糖圆头：耳根向上轻提，与头顶毛发无缝修剪成圆形，避免修剪过短导致皮肤暴露。
- 腿段修剪：腿部毛发用排梳向外拉松，剪刀垂直地修出圆柱状，保持行走时的轻盈蓬松感。

## 2. 局部皮肤炎症浴疗配方
- 燕麦低敏洗剂：适合过度干燥、有轻度微量抓痕的犬猫。水温严格控制在 36℃-38℃（恒温），浸泡 5 分钟，顺毛轻按。
- 死海盐SPA海泥：适用于湿疹、真菌性耳垢异味的重度护养，浴后须用毛巾包覆保温。

## 3. 情绪梳理与咬伤预防要点
- 猫咪敏感应激：使用"三轻"原则（动作轻、声音轻、水流轻）。使用猫袋辅助，禁止大功率吹风机直吹头部。
- 咬伤防范：操作凶猛犬或高应激宠物时，必须戴防咬手套，嘴套尺寸需合规，操作前喂食高能冻干。""",
    "customer": """# 宠物健康自助答疑与门店服务 FAQ

## 1. 常见耳朵瘙痒与黑褐色分泌物（耳螨相关）
- 症状判定：宠物频繁甩头、用后脑勺擦地。耳道内有黑褐色咖啡渣样分泌物。
- 护理建议：严禁用干棉签深掏。使用宠物专用洗耳液（如维克、耳肤灵），每次滴入 5-8 滴，揉捏耳根 15 秒后任其甩出，再擦净外耳壁。

## 2. 会员预约与充值扣款 FAQ
- 预约取消：请至少提前 4 小时在小程序中取消。迟到超过 30 分钟预约自动顺延或作废。
- 会员卡余额：每消费 10 元积 1 分。钻石卡会员独享全场洗护美容 8.5 折优惠，黄金卡会员享受 9.0 折。

## 3. 饮食黑名单
- 绝对禁食：巧克力、洋葱、大蒜、葡萄、木糖醇、坚果及禽类细碎管状骨头。""",
}

async def seed_default_data():
    async with AsyncSessionLocal() as session:
        try:
            for kb_type, content in DEFAULT_KNOWLEDGE_BASES.items():
                result = await session.execute(
                    select(KnowledgeBase).where(KnowledgeBase.id == kb_type)
                )
                existing = result.scalar_one_or_none()
                if not existing:
                    kb = KnowledgeBase(id=kb_type, content=content)
                    session.add(kb)
            await session.commit()
        finally:
            await session.close()

DEFAULT_SERVICES = [
    {"id": "SVC001", "name": "基础洗护套餐", "category": "洗护", "price": 98.0, "duration": 45, "description": "适合短毛犬猫的基础清洁洗护"},
    {"id": "SVC002", "name": "深层洁净 SPA 浴", "category": "SPA护理", "price": 220.0, "duration": 80, "description": "死海盐/矿物泥高端 SPA 浴"},
    {"id": "SVC003", "name": "猫咪低应激洗护", "category": "洗护", "price": 120.0, "duration": 50, "description": "使用猫袋辅助，三轻原则"},
    {"id": "SVC004", "name": "日系圆头造型修剪", "category": "美容", "price": 250.0, "duration": 75, "description": "比熊/贵宾棉花糖圆头造型"},
    {"id": "SVC005", "name": "寄养一天", "category": "寄养", "price": 100.0, "duration": 1440, "description": "含两次喂食和两次遛弯"},
]

DEFAULT_INVENTORY = [
    {"id": "INV001", "name": "皇家小型犬成犬粮 2kg", "category": "宠粮", "stock": 45, "unit": "袋", "min_stock": 10, "price": 128.0},
    {"id": "INV002", "name": "渴望六种鱼猫粮 1.8kg", "category": "宠粮", "stock": 32, "unit": "袋", "min_stock": 8, "price": 235.0},
    {"id": "INV003", "name": "克里斯汀森经典洗毛液 3.78L", "category": "洗护用品", "stock": 5, "unit": "瓶", "min_stock": 5, "price": 155.0},
    {"id": "INV004", "name": "维克耳漂 60ml", "category": "药品", "stock": 8, "unit": "瓶", "min_stock": 5, "price": 72.0},
    {"id": "INV005", "name": "麦富迪冻干鸡胸肉 500g", "category": "零食", "stock": 50, "unit": "袋", "min_stock": 15, "price": 58.0},
    {"id": "INV006", "name": "贵为网球发声球", "category": "玩具", "stock": 20, "unit": "个", "min_stock": 5, "price": 35.0},
]

DEFAULT_EMPLOYEES = [
    {"id": "E001", "user_id": "U001", "name": "张老板", "role": "店主/CEO", "phone": "13800000001", "shift": "全天班", "attendance": "已签到", "attendance_time": "2025-05-27 08:55:00", "monthly_revenue": 256000.0, "base_salary": 0.0, "commission_rate": 0.0},
    {"id": "E002", "user_id": "U002", "name": "陈店长", "role": "店长/运营总监", "phone": "13800000002", "shift": "早班", "attendance": "已签到", "attendance_time": "2025-05-27 08:50:00", "monthly_revenue": 180500.0, "base_salary": 10000.0, "commission_rate": 12.0},
    {"id": "E003", "user_id": None, "name": "李助理", "role": "店员/收银", "phone": "13800000004", "shift": "晚班", "attendance": "未签到", "attendance_time": "", "monthly_revenue": 0.0, "base_salary": 4500.0, "commission_rate": 10.0},
    {"id": "E004", "user_id": "U003", "name": "高级美容师丽丽", "role": "资深洗护美容师", "phone": "13800000003", "shift": "早班", "attendance": "已签到", "attendance_time": "2025-05-27 08:45:00", "monthly_revenue": 48900.0, "base_salary": 6000.0, "commission_rate": 15.0},
]

DEFAULT_PETS = [
    {"id": "P001", "name": "小白", "type": "dog", "breed": "比熊犬", "age": "2岁", "owner_name": "陈女士", "owner_phone": "13800138000", "health_notes": "轻微耳螨，需定期清理", "status": "idle"},
    {"id": "P002", "name": "糖糖", "type": "dog", "breed": "泰迪犬", "age": "3岁", "owner_name": "王总", "owner_phone": "13900139000", "health_notes": "皮肤敏感，需用低敏洗剂", "status": "idle"},
    {"id": "P003", "name": "金宝", "type": "dog", "breed": "金毛犬", "age": "4岁", "owner_name": "刘先生", "owner_phone": "13700137000", "health_notes": "右后腿关节需注意护理", "status": "bath"},
    {"id": "P004", "name": "布丁", "type": "cat", "breed": "布偶猫", "age": "1岁", "owner_name": "赵女士", "owner_phone": "13600136000", "health_notes": "已完成全部疫苗接种", "status": "groom"},
]

DEFAULT_CLIENTS = [
    {"id": "C001", "name": "陈女士", "phone": "13800138000", "level": "黄金卡会员", "points": 3240, "balance": 3850.0, "join_date": "2025-06-15"},
    {"id": "C002", "name": "王总", "phone": "13900139000", "level": "钻石卡会员", "points": 8800, "balance": 12800.0, "join_date": "2025-06-10"},
    {"id": "C003", "name": "刘先生", "phone": "13700137000", "level": "黄金卡会员", "points": 1580, "balance": 500.0, "join_date": "2026-05-25"},
    {"id": "C004", "name": "赵女士", "phone": "13600136000", "level": "普通会员", "points": 240, "balance": 0.0, "join_date": "2026-05-26"},
]

DEFAULT_APPOINTMENTS = [
    {"id": "A001", "pet_id": "P001", "pet_name": "小白", "pet_type": "dog", "breed": "比熊犬", "service_name": "日系圆头造型修剪", "client_name": "陈女士", "client_phone": "13800138000", "date_time": "2026-06-02 10:00", "groomer_name": "", "status": "pending", "progress_notes": ""},
    {"id": "A002", "pet_id": "P003", "pet_name": "金宝", "pet_type": "dog", "breed": "金毛犬", "service_name": "基础洗护套餐", "client_name": "刘先生", "client_phone": "13700137000", "date_time": "2026-06-02 10:30", "groomer_name": "高级美容师丽丽", "status": "processing", "progress_notes": "右后腿关节轻柔处理"},
    {"id": "A003", "pet_id": "P004", "pet_name": "布丁", "pet_type": "cat", "breed": "布偶猫", "service_name": "猫咪低应激洗护", "client_name": "赵女士", "client_phone": "13600136000", "date_time": "2026-06-02 11:00", "groomer_name": "高级美容师丽丽", "status": "processing", "progress_notes": ""},
    {"id": "A004", "pet_id": "P002", "pet_name": "糖糖", "pet_type": "dog", "breed": "泰迪犬", "service_name": "深层洁净 SPA 浴", "client_name": "王总", "client_phone": "13900139000", "date_time": "2026-06-02 09:00", "groomer_name": "高级美容师丽丽", "status": "completed", "progress_notes": "皮肤敏感区域已特别护理"},
]

async def seed_all_tables():
    async with AsyncSessionLocal() as session:
        try:
            for svc in DEFAULT_SERVICES:
                if not (await session.execute(select(Service).where(Service.id == svc["id"]))).scalar_one_or_none():
                    session.add(Service(**svc))
            for inv in DEFAULT_INVENTORY:
                if not (await session.execute(select(Inventory).where(Inventory.id == inv["id"]))).scalar_one_or_none():
                    session.add(Inventory(**inv))
            for emp in DEFAULT_EMPLOYEES:
                if not (await session.execute(select(Employee).where(Employee.id == emp["id"]))).scalar_one_or_none():
                    session.add(Employee(**emp))
            for pet in DEFAULT_PETS:
                if not (await session.execute(select(Pet).where(Pet.id == pet["id"]))).scalar_one_or_none():
                    session.add(Pet(**pet))
            for cli in DEFAULT_CLIENTS:
                if not (await session.execute(select(Client).where(Client.id == cli["id"]))).scalar_one_or_none():
                    session.add(Client(**cli))
            for app in DEFAULT_APPOINTMENTS:
                if not (await session.execute(select(Appointment).where(Appointment.id == app["id"]))).scalar_one_or_none():
                    session.add(Appointment(**app))
            await session.commit()
        finally:
            await session.close()

async def get_all_kb() -> dict[str, str]:
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(select(KnowledgeBase))
            kbs = result.scalars().all()
            return {kb.id: kb.content for kb in kbs}
        finally:
            await session.close()

async def get_kb(kb_type: str) -> str | None:
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(
                select(KnowledgeBase).where(KnowledgeBase.id == kb_type)
            )
            kb = result.scalar_one_or_none()
            return kb.content if kb else None
        finally:
            await session.close()

async def update_kb(kb_type: str, content: str) -> bool:
    if kb_type not in VALID_KB_TYPES:
        return False
    
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(
                select(KnowledgeBase).where(KnowledgeBase.id == kb_type)
            )
            kb = result.scalar_one_or_none()
            if kb:
                kb.content = content
                kb.updated_at = datetime.utcnow()
            else:
                kb = KnowledgeBase(id=kb_type, content=content)
                session.add(kb)
            await session.commit()
            return True
        except Exception as e:
            await session.rollback()
            return False
        finally:
            await session.close()

VALID_KB_TYPES = {"admin", "staff", "customer"}

DEFAULT_USERS = [
    {"id": "U001", "username": "admin", "password": "123456", "display_name": "张老板", "role": "SUPER_ADMIN", "phone": "13800000001"},
    {"id": "U002", "username": "manager", "password": "123456", "display_name": "陈店长", "role": "MANAGER", "phone": "13800000002"},
    {"id": "U003", "username": "staff", "password": "123456", "display_name": "高级美容师丽丽", "role": "STAFF", "phone": "13800000003"},
    {"id": "U004", "username": "member", "password": "123456", "display_name": "陈女士 (黄金卡会员)", "role": "CUSTOMER", "phone": "13800138000"},
]

async def seed_default_users():
    async with AsyncSessionLocal() as session:
        try:
            for user_data in DEFAULT_USERS:
                result = await session.execute(
                    select(User).where(User.username == user_data["username"])
                )
                existing = result.scalar_one_or_none()
                if not existing:
                    user = User(
                        id=user_data["id"],
                        username=user_data["username"],
                        password_hash=hash_password(user_data["password"]),
                        display_name=user_data["display_name"],
                        role=user_data["role"],
                        phone=user_data["phone"],
                        created_by="system"
                    )
                    session.add(user)
            await session.commit()
        finally:
            await session.close()

async def authenticate_user(username: str, password: str) -> dict | None:
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(
                select(User).where(User.username == username, User.is_active == True)
            )
            user = result.scalar_one_or_none()
            if user and verify_password(password, user.password_hash):
                return {
                    "id": user.id,
                    "username": user.username,
                    "display_name": user.display_name,
                    "role": user.role,
                    "phone": user.phone
                }
            return None
        finally:
            await session.close()

async def get_all_users() -> list[dict]:
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(select(User).where(User.is_active == True))
            users = result.scalars().all()
            return [
                {
                    "id": u.id,
                    "username": u.username,
                    "display_name": u.display_name,
                    "role": u.role,
                    "phone": u.phone,
                    "created_at": u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else "",
                    "created_by": u.created_by or ""
                }
                for u in users
            ]
        finally:
            await session.close()

async def create_user(user_data: dict) -> dict:
    async with AsyncSessionLocal() as session:
        try:
            existing = await session.execute(
                select(User).where(User.username == user_data["username"])
            )
            if existing.scalar_one_or_none():
                return {"success": False, "message": "用户名已存在"}
            
            new_id = f"U{str(len((await get_all_users())) + 1).zfill(3)}"
            user = User(
                id=new_id,
                username=user_data["username"],
                password_hash=hash_password(user_data["password"]),
                display_name=user_data["display_name"],
                role=user_data["role"],
                phone=user_data.get("phone", ""),
                created_by=user_data.get("created_by", "admin")
            )
            session.add(user)
            await session.commit()
            return {"success": True, "message": "用户创建成功", "user_id": new_id}
        except Exception as e:
            await session.rollback()
            return {"success": False, "message": str(e)}
        finally:
            await session.close()

async def update_user(user_id: str, user_data: dict) -> dict:
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(
                select(User).where(User.id == user_id)
            )
            user = result.scalar_one_or_none()
            if not user:
                return {"success": False, "message": "用户不存在"}
            
            if "display_name" in user_data:
                user.display_name = user_data["display_name"]
            if "phone" in user_data:
                user.phone = user_data["phone"]
            if "role" in user_data:
                user.role = user_data["role"]
            if "password" in user_data and user_data["password"]:
                user.password_hash = hash_password(user_data["password"])
            
            await session.commit()
            return {"success": True, "message": "用户更新成功"}
        except Exception as e:
            await session.rollback()
            return {"success": False, "message": str(e)}
        finally:
            await session.close()

async def delete_user(user_id: str) -> dict:
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(
                select(User).where(User.id == user_id)
            )
            user = result.scalar_one_or_none()
            if not user:
                return {"success": False, "message": "用户不存在"}
            
            user.is_active = False
            await session.commit()
            return {"success": True, "message": "用户已删除"}
        except Exception as e:
            await session.rollback()
            return {"success": False, "message": str(e)}
        finally:
            await session.close()