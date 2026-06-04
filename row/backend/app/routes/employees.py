import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from ..database import Employee, AsyncSessionLocal, select

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/employees", tags=["employees"])

class EmployeeRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., min_length=1, max_length=50)
    phone: str = Field("", max_length=11)
    shift: str = Field("", max_length=50)
    base_salary: float = Field(0.0, ge=0)
    commission_rate: float = Field(10.0, ge=0)

@router.get("")
async def list_employees():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Employee).where(Employee.is_active == True))
        employees = result.scalars().all()
        return {"status": "success", "data": [
            {"id": e.id, "userId": e.user_id or "", "name": e.name, "role": e.role,
             "phone": e.phone or "", "shift": e.shift or "", "attendance": e.attendance,
             "attendanceTime": e.attendance_time or "", "monthlyRevenue": e.monthly_revenue,
             "baseSalary": e.base_salary, "commissionRate": e.commission_rate}
            for e in employees
        ]}

@router.post("")
async def create_employee(req: EmployeeRequest):
    async with AsyncSessionLocal() as session:
        try:
            count_result = await session.execute(select(Employee))
            new_id = f"E{str(len(count_result.scalars().all()) + 1).zfill(3)}"
            employee = Employee(id=new_id, name=req.name, role=req.role,
                              phone=req.phone, shift=req.shift,
                              base_salary=req.base_salary, commission_rate=req.commission_rate)
            session.add(employee)
            await session.commit()
            return {"status": "success", "message": "员工创建成功", "id": new_id}
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=str(e))

@router.put("/{employee_id}")
async def update_employee(employee_id: str, req: EmployeeRequest):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Employee).where(Employee.id == employee_id))
        employee = result.scalar_one_or_none()
        if not employee:
            raise HTTPException(status_code=404, detail="员工不存在")
        employee.name = req.name
        employee.role = req.role
        employee.phone = req.phone
        employee.shift = req.shift
        employee.base_salary = req.base_salary
        employee.commission_rate = req.commission_rate
        await session.commit()
        return {"status": "success", "message": "员工更新成功"}

@router.delete("/{employee_id}")
async def delete_employee(employee_id: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Employee).where(Employee.id == employee_id))
        employee = result.scalar_one_or_none()
        if not employee:
            raise HTTPException(status_code=404, detail="员工不存在")
        employee.is_active = False
        await session.commit()
        return {"status": "success", "message": "员工已删除"}

@router.post("/{employee_id}/attendance")
async def toggle_attendance(employee_id: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Employee).where(Employee.id == employee_id))
        employee = result.scalar_one_or_none()
        if not employee:
            raise HTTPException(status_code=404, detail="员工不存在")
        
        now = datetime.now().strftime("%Y-%m-%d %H:%M")
        if employee.attendance == "已签到":
            employee.attendance = "已签退"
            employee.attendance_time = now
            await session.commit()
            return {"status": "success", "message": "签退成功", "attendance": "已签退", "time": now}
        else:
            employee.attendance = "已签到"
            employee.attendance_time = now
            await session.commit()
            return {"status": "success", "message": "签到成功", "attendance": "已签到", "time": now}