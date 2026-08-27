from app.core.engine import dashboard


def run_scenario(scenario: str = "normal"):
    return dashboard(scenario)
