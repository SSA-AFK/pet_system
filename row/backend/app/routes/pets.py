import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from ..database import Pet, AsyncSessionLocal, select

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/pets", tags=["pets"])

PET_TYPE_AVATARS = {
    "dog": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20golden%20retriever%20face%20icon%2C%20flat%20design%2C%20minimalist%2C%20white%20background&image_size=square",
    "cat": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20orange%20tabby%20cat%20face%20icon%2C%20flat%20design%2C%20minimalist%2C%20white%20background&image_size=square",
    "rabbit": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20white%20rabbit%20face%20icon%2C%20flat%20design%2C%20minimalist%2C%20white%20background&image_size=square",
    "hamster": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20hamster%20face%20icon%2C%20flat%20design%2C%20minimalist%2C%20white%20background&image_size=square",
    "other": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20pet%20paw%20print%20icon%2C%20flat%20design%2C%20minimalist%2C%20white%20background&image_size=square",
}

def get_pet_avatar(pet_type: str) -> str:
    return PET_TYPE_AVATARS.get(pet_type, PET_TYPE_AVATARS["other"])

class PetRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., min_length=1, max_length=20)
    breed: str = Field(..., min_length=1, max_length=100)
    age: str = Field("", max_length=20)
    owner_name: str = Field("", max_length=100)
    owner_phone: str = Field("", max_length=11)
    health_notes: str = Field("", max_length=500)

@router.get("")
async def list_pets():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Pet))
        pets = result.scalars().all()
        return {"status": "success", "data": [
            {"id": p.id, "name": p.name, "type": p.type, "breed": p.breed,
             "age": p.age or "", "ownerName": p.owner_name or "", "ownerPhone": p.owner_phone or "",
             "avatar": get_pet_avatar(p.type),
             "healthNotes": p.health_notes or "", "status": p.status or "waiting"}
            for p in pets
        ]}

@router.post("")
async def create_pet(req: PetRequest):
    async with AsyncSessionLocal() as session:
        try:
            count_result = await session.execute(select(Pet))
            new_id = f"P{str(len(count_result.scalars().all()) + 1).zfill(3)}"
            pet = Pet(id=new_id, name=req.name, type=req.type, breed=req.breed,
                     age=req.age, owner_name=req.owner_name, owner_phone=req.owner_phone,
                     health_notes=req.health_notes)
            session.add(pet)
            await session.commit()
            return {"status": "success", "message": "宠物创建成功", "id": new_id}
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=str(e))

@router.put("/{pet_id}")
async def update_pet(pet_id: str, req: PetRequest):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Pet).where(Pet.id == pet_id))
        pet = result.scalar_one_or_none()
        if not pet:
            raise HTTPException(status_code=404, detail="宠物不存在")
        pet.name = req.name
        pet.type = req.type
        pet.breed = req.breed
        pet.age = req.age
        pet.owner_name = req.owner_name
        pet.owner_phone = req.owner_phone
        pet.health_notes = req.health_notes
        await session.commit()
        return {"status": "success", "message": "宠物更新成功"}

@router.delete("/{pet_id}")
async def delete_pet(pet_id: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Pet).where(Pet.id == pet_id))
        pet = result.scalar_one_or_none()
        if not pet:
            raise HTTPException(status_code=404, detail="宠物不存在")
        await session.delete(pet)
        await session.commit()
        return {"status": "success", "message": "宠物已删除"}
