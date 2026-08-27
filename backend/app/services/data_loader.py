from app.core.engine import load_config as load_station_config
from app.core.engine import load_data, load_loads


def load_weather():
    return load_data()[0]


def load_station_load():
    return load_data()[1]


def load_renewable_generation():
    return load_data()[2]


def load_load_configuration():
    return load_loads()
