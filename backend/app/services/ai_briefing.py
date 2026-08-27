from app.core.engine import recommendation


def deterministic_briefing(state):
    return state.get("recommendation", recommendation([], "normal"))
