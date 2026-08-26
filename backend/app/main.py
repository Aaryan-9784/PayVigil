from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.routes import webhooks, dashboard, dev_tools
from app.config import settings
from app.database import init_db

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables on startup
    try:
        await init_db()
    except Exception as e:
        print(f"DB Init note: {e}")
    yield

app = FastAPI(
    title="AI Revenue Recovery Agent",
    description="Autonomous payment failure recovery and revenue protection engine",
    version="1.0.0",
    lifespan=lifespan
)
app.state.limiter = limiter

# CORS Configuration
origins = ["https://YOUR-FRONTEND-DOMAIN.vercel.app"] if settings.environment == "production" else [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Route registration
app.include_router(webhooks.router)
app.include_router(dashboard.router)

if settings.environment != "production":
    app.include_router(dev_tools.router)

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "AI Revenue Recovery Agent",
        "environment": settings.environment
    }
