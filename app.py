import sys
from pathlib import Path

# Ensure project root and backend directory are on sys.path
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

if __name__ == "__main__":
    import uvicorn
    print("[NetTriage AI] Starting application on http://127.0.0.1:8000 ...")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=False)
