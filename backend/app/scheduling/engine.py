import datetime

from app.zones.models import Zone


def generate_zone_tasks(zone: Zone) -> list[dict]:
    crop = zone.crop_type
    planting = zone.planting_date
    cycle = zone.estimated_cycle_days

    if not cycle or cycle <= 0:
        return []

    mid_cycle = planting + datetime.timedelta(days=cycle // 2)
    quarter_cycle = planting + datetime.timedelta(days=cycle // 4)
    harvest_date = planting + datetime.timedelta(days=cycle)

    tasks = [
        {"title": f"Prepare soil for {crop}", "due_date": planting},
        {"title": f"Plant {crop}", "due_date": planting},
        {"title": f"Irrigate {crop}", "due_date": quarter_cycle},
        {"title": f"Fertilize {crop}", "due_date": mid_cycle},
        {"title": f"Harvest {crop}", "due_date": harvest_date},
    ]
    return tasks
