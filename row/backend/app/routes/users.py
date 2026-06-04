import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from ..database import authenticate_user, get_all_users, create_user, update_user, delete_user, Employee, AsyncSessionLocal, select
from ..auth import create_access_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/users", tags=["users"])

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1, max_length=100)

class CreateUserRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1, max_length=100)
    display_name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., min_length=1, max_length=20)
    phone: str = Field("", max_length=11)

class UpdateUserRequest(BaseModel):
    display_name: str = Field("", max_length=100)
    phone: str = Field("", max_length=11)
    role: str = Field("", max_length=20)
    password: str = Field("", max_length=100)

@router.post("/login")
async def login(req: LoginRequest):
    user = await authenticate_user(req.username, req.password)
    if user:
        token = create_access_token({"sub": user["id"], "username": user["username"], "role": user["role"]})
        return {"status": "success", "user": user, "token": token}
    raise HTTPException(status_code=401, detail="用户名或密码错误")

@router.get("")
async def list_users():
    users = await get_all_users()
    return {"status": "success", "data": users}

@router.post("")
async def add_user(req: CreateUserRequest):
    if not req.username or not req.password or not req.display_name or not req.role:
        raise HTTPException(status_code=400, detail="缺少必填字段")
    if req.role not in ["MANAGER", "STAFF", "CUSTOMER"]:
        raise HTTPException(status_code=400, detail="角色只能是 MANAGER、STAFF 或 CUSTOMER")
    
    result = await create_user({
        "username": req.username,
        "password": req.password,
        "display_name": req.display_name,
        "role": req.role,
        "phone": req.phone,
        "created_by": "admin"
    })
    
    if result["success"]:
        user_id = result.get("user_id")
        if req.role in ["MANAGER", "STAFF"] and user_id:
            try:
                async with AsyncSessionLocal() as session:
                    count_result = await session.execute(select(Employee))
                    emp_id = f"E{str(len(count_result.scalars().all()) + 1).zfill(3)}"
                    employee = Employee(
                        id=emp_id, user_id=user_id, name=req.display_name,
                        role="店长" if req.role == "MANAGER" else "员工",
                        phone=req.phone
                    )
                    session.add(employee)
                    await session.commit()
            except Exception as e:
                logger.warning(f"Failed to create employee record: {e}")
        return {"status": "success", "message": result["message"], "user_id": user_id}
    raise HTTPException(status_code=400, detail=result["message"])

@router.put("/{user_id}")
async def modify_user(user_id: str, req: UpdateUserRequest):
    result = await update_user(user_id, req.dict(exclude_unset=True))
    if result["success"]:
        return {"status": "success", "message": result["message"]}
    raise HTTPException(status_code=400, detail=result["message"])

@router.delete("/{user_id}")
async def remove_user(user_id: str):
    result = await delete_user(user_id)
    if result["success"]:
        return {"status": "success", "message": result["message"]}
    raise HTTPException(status_code=400, detail=result["message"])
