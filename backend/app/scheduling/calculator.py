import datetime

from app.zones.models import Zone

CROP_WATERING_INTERVALS: dict[str, int] = {
    "corn": 3,
    "wheat": 4,
    "rice": 2,
    "tomato": 2,
    "cucumber": 2,
    "pepper": 2,
    "lettuce": 1,
    "carrot": 3,
    "onion": 3,
    "potato": 4,
    "soy": 3,
    "cotton": 4,
    "grape": 3,
    "strawberry": 2,
    "melon": 3,
    "pumpkin": 3,
    "beans": 3,
    "peas": 3,
    "other": 3,
}

DEFAULT_WATER_AMOUNT = 3.0
DEFAULT_INTERVAL_DAYS = 3


def generate_watering_schedule(zone: Zone) -> list[dict]:
    crop = (zone.crop_type or "").strip().lower()
    interval = CROP_WATERING_INTERVALS.get(crop, DEFAULT_INTERVAL_DAYS)
    if interval <= 0:
        interval = DEFAULT_INTERVAL_DAYS

    cycle_days = zone.estimated_cycle_days
    if not cycle_days or cycle_days <= 0:
        return []

    planting = zone.planting_date
    if not planting:
        return []

    today = datetime.date.today()
    harvest_date = planting + datetime.timedelta(days=cycle_days)

    start = max(today, planting)
    if start > harvest_date:
        return []

    schedule = []
    current = start
    while current <= harvest_date:
        schedule.append({
            "due_date": current,
            "water_amount": DEFAULT_WATER_AMOUNT,
            "label": "Regular watering",
        })
        current += datetime.timedelta(days=interval)

    return schedule
