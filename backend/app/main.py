from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.routes import webhooks, dashboard, dev_tools, indian_recovery
from app.config import settings
from app.database import init_db
from app.ws_manager import ws_manager

from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

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
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration
origins = ["https://YOUR-FRONTEND-DOMAIN.vercel.app"] if settings.environment == "production" else [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$" if settings.environment != "production" else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enterprise Security Headers Middleware (OWASP Standard)
@app.middleware("http")
async def add_enterprise_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response

from fastapi.responses import JSONResponse
import logging

app_logger = logging.getLogger("revenue_recovery.app")

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    app_logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Security incident logged."}
    )

# WebSocket Endpoint for Real-Time Streaming
@app.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial handshake ping
        await websocket.send_json({
            "type": "connection_established",
            "message": "Connected to Autonomous AI Revenue Recovery Live Stream",
            "environment": settings.environment
        })
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        app_logger.warning(f"WebSocket connection exception: {e}")
        ws_manager.disconnect(websocket)

# Route registration
app.include_router(webhooks.router)
app.include_router(dashboard.router)
app.include_router(indian_recovery.router)

if settings.environment != "production":
    app.include_router(dev_tools.router)

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "AI Revenue Recovery Agent",
        "environment": settings.environment
    }
