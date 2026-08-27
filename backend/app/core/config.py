from pathlib import Path
import os

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
CORS_ORIGINS = [item.strip() for item in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if item.strip()]
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
