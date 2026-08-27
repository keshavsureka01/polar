from fastapi import APIRouter, Query
from app.core.engine import dashboard

router = APIRouter(prefix="/api")

@router.get("/forecast")
def get_forecast(hours: int = Query(default=48, ge=1, le=168)):
    return {"hours": hours, "data": dashboard()["forecast"][:hours]}
