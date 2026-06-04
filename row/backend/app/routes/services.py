import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from ..database import Service, AsyncSessionLocal, select

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/services", tags=["services"])

class ServiceRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(..., min_length=1, max_length=50)
    price: float = Field(..., gt=0)
    duration: int = Field(..., gt=0)
    description: str = Field("", max_length=500)

@router.get("")
async def list_services():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Service).where(Service.is_active == True))
        services = result.scalars().all()
        return {"status": "success", "data": [
            {"id": s.id, "name": s.name, "category": s.category, "price": s.price,
             "duration": s.duration, "description": s.description or ""}
            for s in services
        ]}

@router.post("")
async def create_service(req: ServiceRequest):
    async with AsyncSessionLocal() as session:
        try:
            count_result = await session.execute(select(Service))
            new_id = f"SVC{str(len(count_result.scalars().all()) + 1).zfill(3)}"
            service = Service(id=new_id, name=req.name, category=req.category,
                            price=req.price, duration=req.duration, description=req.description)
            session.add(service)
            await session.commit()
            return {"status": "success", "message": "服务创建成功", "id": new_id}
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=str(e))

@router.put("/{service_id}")
async def update_service(service_id: str, req: ServiceRequest):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Service).where(Service.id == service_id))
        service = result.scalar_one_or_none()
        if not service:
            raise HTTPException(status_code=404, detail="服务不存在")
        service.name = req.name
        service.category = req.category
        service.price = req.price
        service.duration = req.duration
        service.description = req.description
        await session.commit()
        return {"status": "success", "message": "服务更新成功"}

@router.delete("/{service_id}")
async def delete_service(service_id: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Service).where(Service.id == service_id))
        service = result.scalar_one_or_none()
        if not service:
            raise HTTPException(status_code=404, detail="服务不存在")
        service.is_active = False
        await session.commit()
        return {"status": "success", "message": "服务已删除"}
