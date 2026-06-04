import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from sqlalchemy import func

from ..database import AsyncSessionLocal, select, Appointment, Client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analytics", tags=["analytics"])

LEVEL_PRIORITY = {
    "钻石卡会员": 3,
    "黄金卡会员": 2,
    "普通会员": 1,
}


def _calculate_risk(days_since_last: int, appt_count_90d: int, level: str) -> tuple[str, int, str]:
    """Calculate churn risk level, score (0-100) and reason."""
    risk_score = 0
    reasons = []

    # Factor 1: days since last appointment
    if days_since_last > 30:
        risk_score += 50
        reasons.append(f"距上次预约已 {days_since_last} 天（超过30天）")
    elif days_since_last > 14:
        risk_score += 25
        reasons.append(f"距上次预约已 {days_since_last} 天（超过14天）")
    else:
        risk_score += 5
        reasons.append(f"近期活跃，距上次预约仅 {days_since_last} 天")

    # Factor 2: appointment frequency in last 90 days
    if appt_count_90d == 0:
        risk_score += 30
        reasons.append("近90天无预约记录")
    elif appt_count_90d <= 1:
        risk_score += 15
        reasons.append(f"近90天仅 {appt_count_90d} 次预约，频率偏低")
    else:
        risk_score -= 10
        reasons.append(f"近90天有 {appt_count_90d} 次预约，较为活跃")

    # Factor 3: member level
    priority = LEVEL_PRIORITY.get(level, 1)
    if priority >= 3:
        risk_score -= 10
        reasons.append(f"{level}，高价值客户")
    elif priority >= 2:
        risk_score -= 5
        reasons.append(f"{level}，有一定忠诚度")
    else:
        risk_score += 10
        reasons.append(f"{level}，黏性较低")

    # Clamp score
    risk_score = max(0, min(100, risk_score))

    if risk_score >= 50:
        risk_level = "high"
    elif risk_score >= 25:
        risk_level = "medium"
    else:
        risk_level = "low"

    return risk_level, risk_score, "；".join(reasons)


@router.get("/churn-risk")
async def churn_risk():
    """计算所有客户的流失风险，基于最近预约时间、预约频率和会员等级。"""
    try:
        now = datetime.utcnow()
        ninety_days_ago = now - timedelta(days=90)

        async with AsyncSessionLocal() as session:
            # Fetch all active clients
            client_result = await session.execute(
                select(Client).where(Client.is_active == True)
            )
            clients = client_result.scalars().all()

            data = []
            for c in clients:
                # Get the latest appointment for this client by name+phone
                filters = [Appointment.client_name == c.name]
                if c.phone:
                    filters.append(Appointment.client_phone == c.phone)

                latest_result = await session.execute(
                    select(Appointment)
                    .where(*filters)
                    .order_by(Appointment.date_time.desc())
                    .limit(1)
                )
                latest_appt = latest_result.scalar_one_or_none()

                # Count appointments in last 90 days
                count_result = await session.execute(
                    select(func.count(Appointment.id)).where(*filters)
                )
                total_count = count_result.scalar() or 0

                # Parse date_time to determine recency
                days_since_last = 999
                appt_count_90d = 0

                if latest_appt and latest_appt.date_time:
                    try:
                        last_dt = datetime.strptime(latest_appt.date_time, "%Y-%m-%d %H:%M")
                        days_since_last = (now - last_dt).days
                    except ValueError:
                        pass

                # Count appointments within 90 days
                all_appts_result = await session.execute(
                    select(Appointment).where(*filters)
                )
                all_appts = all_appts_result.scalars().all()
                for a in all_appts:
                    if a.date_time:
                        try:
                            a_dt = datetime.strptime(a.date_time, "%Y-%m-%d %H:%M")
                            if a_dt >= ninety_days_ago:
                                appt_count_90d += 1
                        except ValueError:
                            pass

                risk_level, risk_score, reason = _calculate_risk(
                    days_since_last, appt_count_90d, c.level or "普通会员"
                )

                data.append({
                    "clientId": c.id,
                    "name": c.name,
                    "riskLevel": risk_level,
                    "riskScore": risk_score,
                    "reason": reason,
                })

            # Sort by risk score descending
            data.sort(key=lambda x: x["riskScore"], reverse=True)
            return {"status": "success", "data": data}

    except Exception as e:
        logger.error(f"Error calculating churn risk: {e}")
        raise HTTPException(status_code=500, detail=str(e) or "Calculate churn risk failed")


@router.get("/schedule-suggest")
async def schedule_suggest():
    """分析预约模式，推荐最优排班方案：按时段和星期统计预约密度。"""
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Appointment))
            appointments = result.scalars().all()

        # day_of_week -> count, time_slot -> count, (day, slot) -> count
        dow_counts: dict[int, int] = {i: 0 for i in range(7)}  # 0=Mon..6=Sun
        slot_counts: dict[str, int] = {}
        dow_slot_counts: dict[tuple[int, str], int] = {}

        for a in appointments:
            if not a.date_time:
                continue
            try:
                dt = datetime.strptime(a.date_time, "%Y-%m-%d %H:%M")
            except ValueError:
                continue

            dow = dt.weekday()  # 0=Monday
            hour = dt.hour

            # Define time slots
            if 9 <= hour < 12:
                slot = "morning"
            elif 12 <= hour < 15:
                slot = "midday"
            elif 15 <= hour < 18:
                slot = "afternoon"
            elif 18 <= hour < 21:
                slot = "evening"
            else:
                slot = "other"

            dow_counts[dow] = dow_counts.get(dow, 0) + 1
            slot_counts[slot] = slot_counts.get(slot, 0) + 1
            key = (dow, slot)
            dow_slot_counts[key] = dow_slot_counts.get(key, 0) + 1

        # Build peak slots sorted by count desc
        DOW_NAMES = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
        SLOT_LABELS = {
            "morning": "上午 (09:00-12:00)",
            "midday": "中午 (12:00-15:00)",
            "afternoon": "下午 (15:00-18:00)",
            "evening": "晚间 (18:00-21:00)",
            "other": "其他时段",
        }

        peak_slots = []
        for (dow, slot), count in sorted(dow_slot_counts.items(), key=lambda x: -x[1]):
            if count > 0:
                peak_slots.append({
                    "dayOfWeek": DOW_NAMES[dow],
                    "dayIndex": dow,
                    "timeSlot": slot,
                    "timeSlotLabel": SLOT_LABELS.get(slot, slot),
                    "appointmentCount": count,
                })

        # Generate staffing suggestions
        suggestions = []
        for dow in range(7):
            day_name = DOW_NAMES[dow]
            day_total = dow_counts.get(dow, 0)
            if day_total == 0:
                suggestions.append({
                    "dayOfWeek": day_name,
                    "staffNeeded": 1,
                    "note": f"{day_name}预约较少，安排 1 人值班即可",
                })
            elif day_total <= 3:
                suggestions.append({
                    "dayOfWeek": day_name,
                    "staffNeeded": 2,
                    "note": f"{day_name}有 {day_total} 个预约，建议安排 2 名员工",
                })
            elif day_total <= 6:
                suggestions.append({
                    "dayOfWeek": day_name,
                    "staffNeeded": 3,
                    "note": f"{day_name}预约较多（{day_total}个），建议安排 3 名员工并确保美容师在岗",
                })
            else:
                suggestions.append({
                    "dayOfWeek": day_name,
                    "staffNeeded": 4,
                    "note": f"{day_name}为高峰日（{day_total}个预约），建议全员在岗并开启快速通道",
                })

        return {
            "status": "success",
            "data": {
                "peakSlots": peak_slots,
                "suggestions": suggestions,
            },
        }

    except Exception as e:
        logger.error(f"Error generating schedule suggestion: {e}")
        raise HTTPException(status_code=500, detail=str(e) or "Generate schedule suggestion failed")
