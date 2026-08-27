from fastapi import APIRouter
from app.core.engine import dashboard

router = APIRouter(prefix="/api")

@router.get("/station")
def get_station():
    return dashboard()
