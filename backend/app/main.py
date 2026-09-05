from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .api.endpoints import router as api_router
from .config import BASE_DIR
from .services.vector_store import vector_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load and index Markdown runbooks
    print("[Lifespan] Booting NetTriage AI Backend Engine...")
    vector_store.load_and_index_runbooks()
    print("[Lifespan] Knowledge Base & Vector Index ready.")
    from .api.endpoints import trigger_triage_clustering
    await trigger_triage_clustering()
    print("[Lifespan] Initialized demo incident clusters (inc-001, inc-002, inc-003).")
    yield
    print("[Lifespan] Shutting down NetTriage AI Backend Engine.")


app = FastAPI(
    title="NetTriage AI - Telecom Network Incident Triage Assistant",
    description="Autonomous alert storm clustering and runbook triage assistant for network and security operations centers.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API
app.include_router(api_router)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "NetTriage AI",
        "indexed_runbooks": len(vector_store.runbooks),
        "indexed_chunks": len(vector_store.chunks),
    }


# Middleware to cleanly resolve extensionless HTML routes for static export
@app.middleware("http")
async def static_html_rewrite_middleware(request: Request, call_next):
    path = request.url.path
    if not path.startswith("/api/") and not path.startswith("/health") and "." not in path.split("/")[-1]:
        clean_path = path.strip("/")
        if clean_path:
            direct_html = frontend_dist / f"{clean_path}.html"
            if direct_html.exists():
                return FileResponse(str(direct_html))
            nested_index = frontend_dist / clean_path / "index.html"
            if nested_index.exists():
                return FileResponse(str(nested_index))
    return await call_next(request)


# Mount built frontend for single-command judge execution
frontend_out = BASE_DIR / "frontend" / "out"
frontend_dist = frontend_out if frontend_out.exists() else (BASE_DIR / "frontend" / "dist")
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    print(f"[StaticFiles] Mounting production frontend from: {frontend_dist}")
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="static_frontend")


@app.exception_handler(404)
async def custom_404_handler(request: Request, exc):
    if not request.url.path.startswith("/api/"):
        index_file = frontend_dist / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
    return JSONResponse(status_code=404, content={"detail": "Not Found"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
