import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

if __name__ == "__main__":
    import uvicorn
    print("[CyTriage Network Assistant] Starting application from backend directory on http://127.0.0.1:8000 ...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
