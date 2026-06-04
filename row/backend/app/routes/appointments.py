import logging
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from ..database import Appointment, AsyncSessionLocal, select, Pet

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/appointments", tags=["appointments"])

class AppointmentRequest(BaseModel):
    pet_id: str = Field("", max_length=20)
    pet_name: str = Field(..., min_length=1, max_length=100)
    pet_type: str = Field("dog", max_length=20)
    pet_age: str = Field("", max_length=20)
    pet_weight: str = Field("", max_length=20)
    breed: str = Field("", max_length=100)
    service_name: str = Field(..., min_length=1, max_length=100)
    client_name: str = Field(..., min_length=1, max_length=100)
    client_phone: str = Field("", max_length=11)
    client_wechat: str = Field("", max_length=100)
    date_time: str = Field(..., min_length=1, max_length=50)
    groomer_name: str = Field("", max_length=100)
    status: str = Field("pending", max_length=20)
    total_price: float = Field(0, ge=0)
    progress_notes: str = Field("", max_length=500)

class UpdateStatusRequest(BaseModel):
    status: str = Field(..., min_length=1, max_length=20)
    groomer_name: str = Field("", max_length=100)
    progress_notes: str = Field("", max_length=500)

@router.get("")
async def list_appointments():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Appointment).order_by(Appointment.date_time.desc()))
        apps = result.scalars().all()
        return {"status": "success", "data": [
            {"id": a.id, "petId": a.pet_id or "", "petName": a.pet_name, "petType": a.pet_type or "dog",
             "petAge": a.pet_age or "", "petWeight": a.pet_weight or "",
             "breed": a.breed or "", "serviceName": a.service_name, "clientName": a.client_name,
             "clientPhone": a.client_phone or "", "clientWechat": a.client_wechat or "",
             "dateTime": a.date_time,
             "groomerName": a.groomer_name or "", "status": a.status,
             "totalPrice": a.total_price or 0,
             "progressNotes": a.progress_notes or "",
             "price": a.total_price or 0}
            for a in apps
        ]}

@router.post("")
async def create_appointment(req: AppointmentRequest):
    async with AsyncSessionLocal() as session:
        try:
            count_result = await session.execute(select(Appointment))
            new_id = f"A{str(len(count_result.scalars().all()) + 1).zfill(3)}"
            app = Appointment(
                id=new_id, pet_id=req.pet_id, pet_name=req.pet_name, pet_type=req.pet_type,
                pet_age=req.pet_age, pet_weight=req.pet_weight,
                breed=req.breed, service_name=req.service_name, client_name=req.client_name,
                client_phone=req.client_phone, client_wechat=req.client_wechat,
                date_time=req.date_time,
                groomer_name=req.groomer_name, status=req.status,
                total_price=req.total_price,
                progress_notes=req.progress_notes
            )
            session.add(app)
            # 自动同步宠物信息到宠物档案
            if req.pet_name and req.client_phone:
                existing = await session.execute(
                    select(Pet).where(Pet.name == req.pet_name, Pet.owner_phone == req.client_phone)
                )
                if not existing.scalar_one_or_none():
                    pet_count = await session.execute(select(Pet))
                    pet_id = f"P{str(len(pet_count.scalars().all()) + 1).zfill(3)}"
                    pet = Pet(
                        id=pet_id, name=req.pet_name, type=req.pet_type or "other",
                        breed=req.breed or "未知", age=req.pet_age or "",
                        owner_name=req.client_name, owner_phone=req.client_phone,
                        health_notes=req.progress_notes or ""
                    )
                    session.add(pet)
            await session.commit()
            return {"status": "success", "message": "预约创建成功", "id": new_id}
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=str(e))

@router.put("/{appointment_id}")
async def update_appointment(appointment_id: str, req: AppointmentRequest):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Appointment).where(Appointment.id == appointment_id))
        app = result.scalar_one_or_none()
        if not app:
            raise HTTPException(status_code=404, detail="预约不存在")
        app.pet_name = req.pet_name
        app.pet_type = req.pet_type
        app.pet_age = req.pet_age
        app.pet_weight = req.pet_weight
        app.breed = req.breed
        app.service_name = req.service_name
        app.client_name = req.client_name
        app.client_phone = req.client_phone
        app.client_wechat = req.client_wechat
        app.date_time = req.date_time
        app.groomer_name = req.groomer_name
        app.status = req.status
        app.total_price = req.total_price
        app.progress_notes = req.progress_notes
        await session.commit()
        return {"status": "success", "message": "预约更新成功"}

@router.patch("/{appointment_id}/status")
async def update_status(appointment_id: str, req: UpdateStatusRequest):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Appointment).where(Appointment.id == appointment_id))
        app = result.scalar_one_or_none()
        if not app:
            raise HTTPException(status_code=404, detail="预约不存在")
        app.status = req.status
        if req.groomer_name:
            app.groomer_name = req.groomer_name
        if req.progress_notes:
            app.progress_notes = req.progress_notes
        await session.commit()
        return {"status": "success", "message": "状态更新成功"}

@router.delete("/{appointment_id}")
async def delete_appointment(appointment_id: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Appointment).where(Appointment.id == appointment_id))
        app = result.scalar_one_or_none()
        if not app:
            raise HTTPException(status_code=404, detail="预约不存在")
        await session.delete(app)
        await session.commit()
        return {"status": "success", "message": "预约已删除"}
