import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from ..database import Client, User, AsyncSessionLocal, select, create_user, authenticate_user
from ..auth import create_access_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/clients", tags=["clients"])

class ClientRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field("", max_length=11)
    level: str = Field("普通会员", max_length=20)
    points: int = Field(0, ge=0)
    balance: float = Field(0.0, ge=0)
    join_date: str = Field("", max_length=20)

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., pattern=r"^\d{11}$")
    password: str = Field(..., min_length=1, max_length=100)
    wechat: str = Field("", max_length=100)

class LoginRequest(BaseModel):
    phone: str = Field(..., pattern=r"^\d{11}$")
    password: str = Field(..., min_length=1, max_length=100)

class UpgradeRequest(BaseModel):
    level: str = Field(..., min_length=1, max_length=20)

@router.get("")
async def list_clients():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Client).where(Client.is_active == True))
        clients = result.scalars().all()
        return {"status": "success", "data": [
            {"id": c.id, "name": c.name, "phone": c.phone or "", "wechat": c.wechat or "",
             "level": c.level,
             "points": c.points, "balance": c.balance, "joinDate": c.join_date or "",
             "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
            for c in clients
        ]}

@router.post("")
async def create_client(req: ClientRequest):
    async with AsyncSessionLocal() as session:
        try:
            count_result = await session.execute(select(Client))
            new_id = f"C{str(len(count_result.scalars().all()) + 1).zfill(3)}"
            client = Client(id=new_id, name=req.name, phone=req.phone,
                          level=req.level, points=req.points, balance=req.balance,
                          join_date=req.join_date)
            session.add(client)
            await session.commit()
            return {"status": "success", "message": "客户创建成功", "id": new_id}
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=str(e))

@router.put("/{client_id}")
async def update_client(client_id: str, req: ClientRequest):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Client).where(Client.id == client_id))
        client = result.scalar_one_or_none()
        if not client:
            raise HTTPException(status_code=404, detail="客户不存在")
        client.name = req.name
        client.phone = req.phone
        client.level = req.level
        client.points = req.points
        client.balance = req.balance
        client.join_date = req.join_date
        await session.commit()
        return {"status": "success", "message": "客户更新成功"}

@router.delete("/{client_id}")
async def delete_client(client_id: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Client).where(Client.id == client_id))
        client = result.scalar_one_or_none()
        if not client:
            raise HTTPException(status_code=404, detail="客户不存在")
        client.is_active = False
        await session.commit()
        return {"status": "success", "message": "客户已删除"}

@router.post("/register")
async def register_client(req: RegisterRequest):
    if not req.name or not req.phone or not req.password:
        raise HTTPException(status_code=400, detail="姓名、手机号和密码不能为空")
    async with AsyncSessionLocal() as session:
        # Check if phone already exists in User table
        existing_user = await session.execute(select(User).where(User.username == req.phone))
        if existing_user.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="该手机号已注册")
        # Check if phone already exists in Client table
        existing_client = await session.execute(select(Client).where(Client.phone == req.phone))
        if existing_client.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="该手机号已注册")
        try:
            # Create User record
            user_result = await create_user({
                "username": req.phone,
                "password": req.password,
                "display_name": req.name,
                "role": "CUSTOMER",
                "phone": req.phone
            })
            if not user_result["success"]:
                raise HTTPException(status_code=400, detail=user_result["message"])
            # Create Client record
            count_result = await session.execute(select(Client))
            new_id = f"C{str(len(count_result.scalars().all()) + 1).zfill(3)}"
            client = Client(
                id=new_id, name=req.name, phone=req.phone, wechat=req.wechat,
                level="普通用户", points=0, balance=0.0,
                join_date=datetime.now().strftime("%Y-%m-%d")
            )
            session.add(client)
            await session.commit()
            return {
                "status": "success", "message": "注册成功",
                "client": {
                    "id": new_id, "name": req.name, "phone": req.phone,
                    "wechat": req.wechat,
                    "level": "普通用户", "points": 0, "balance": 0.0,
                    "joinDate": datetime.now().strftime("%Y-%m-%d")
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
async def login_client(req: LoginRequest):
    if not req.phone or not req.password:
        raise HTTPException(status_code=400, detail="手机号和密码不能为空")
    # Authenticate via User table
    user = await authenticate_user(req.phone, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="手机号或密码错误")
    # Get Client info
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Client).where(Client.phone == req.phone, Client.is_active == True))
        client = result.scalar_one_or_none()
        if not client:
            raise HTTPException(status_code=404, detail="客户信息不存在")
        token = create_access_token({"sub": client.id, "name": client.name, "role": "CUSTOMER"})
        return {
            "status": "success",
            "token": token,
            "client": {
                "id": client.id, "name": client.name, "phone": client.phone or "",
                "wechat": client.wechat or "",
                "level": client.level, "points": client.points, "balance": client.balance,
                "joinDate": client.join_date or ""
            }
        }

@router.post("/{client_id}/upgrade")
async def upgrade_client(client_id: str, req: UpgradeRequest):
    valid_levels = ["普通会员", "黄金卡会员", "钻石卡会员"]
    if req.level not in valid_levels:
        raise HTTPException(status_code=400, detail=f"无效的会员等级，可选：{', '.join(valid_levels)}")
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Client).where(Client.id == client_id))
        client = result.scalar_one_or_none()
        if not client:
            raise HTTPException(status_code=404, detail="客户不存在")
        client.level = req.level
        await session.commit()
        return {"status": "success", "message": f"已升级为{req.level}"}
