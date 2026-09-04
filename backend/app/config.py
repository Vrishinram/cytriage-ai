import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
RUNBOOKS_DIR_PATH = Path(os.getenv("RUNBOOKS_DIR_PATH", str(DATA_DIR / "runbooks")))
DEMO_ALERTS_PATH = Path(os.getenv("DEMO_ALERTS_PATH", str(DATA_DIR / "alerts_demo.json")))
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.65"))
