import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from ..database import Inventory, AsyncSessionLocal, select

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/inventory", tags=["inventory"])

class InventoryRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(..., min_length=1, max_length=50)
    stock: int = Field(..., ge=0)
    unit: str = Field(..., min_length=1, max_length=20)
    min_stock: int = Field(..., ge=0)
    price: float = Field(..., gt=0)

@router.get("")
async def list_inventory():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Inventory).where(Inventory.is_active == True))
        items = result.scalars().all()
        return {"status": "success", "data": [
            {"id": i.id, "name": i.name, "category": i.category, "stock": i.stock,
             "unit": i.unit, "minStock": i.min_stock, "price": i.price}
            for i in items
        ]}

@router.post("")
async def create_inventory(req: InventoryRequest):
    async with AsyncSessionLocal() as session:
        try:
            count_result = await session.execute(select(Inventory))
            new_id = f"INV{str(len(count_result.scalars().all()) + 1).zfill(3)}"
            item = Inventory(id=new_id, name=req.name, category=req.category,
                           stock=req.stock, unit=req.unit, min_stock=req.min_stock, price=req.price)
            session.add(item)
            await session.commit()
            return {"status": "success", "message": "商品创建成功", "id": new_id}
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=str(e))

@router.put("/{item_id}")
async def update_inventory(item_id: str, req: InventoryRequest):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Inventory).where(Inventory.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="商品不存在")
        item.name = req.name
        item.category = req.category
        item.stock = req.stock
        item.unit = req.unit
        item.min_stock = req.min_stock
        item.price = req.price
        await session.commit()
        return {"status": "success", "message": "商品更新成功"}

@router.delete("/{item_id}")
async def delete_inventory(item_id: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Inventory).where(Inventory.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="商品不存在")
        item.is_active = False
        await session.commit()
        return {"status": "success", "message": "商品已删除"}
