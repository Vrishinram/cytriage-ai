from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.endpoints import router as api_router
from .services.vector_store import vector_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load and index Markdown runbooks
    print("[Lifespan] Booting NetTriage AI Backend Engine...")
    vector_store.load_and_index_runbooks()
    print("[Lifespan] Knowledge Base & FAISS Index ready.")
    yield
    print("[Lifespan] Shutting down NetTriage AI Backend Engine.")


app = FastAPI(
    title="NetTriage AI - Telecom Network Incident Triage Assistant",
    description="Autonomous alert storm clustering and runbook triage assistant for network and security operations centers.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "NetTriage AI",
        "indexed_runbooks": len(vector_store.runbooks),
        "indexed_chunks": len(vector_store.chunks),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
