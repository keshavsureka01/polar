from app.core.engine import load_config


def battery_state(dispatch_point):
    battery = load_config()["battery"]
    return {"soc_percent": dispatch_point["battery_soc_percent"], "charge_kw": dispatch_point["battery_charge_kw"], "discharge_kw": dispatch_point["battery_discharge_kw"], "minimum_soc_percent": battery["minimum_soc_percent"], "emergency_reserve_percent": battery["emergency_reserve_percent"]}
