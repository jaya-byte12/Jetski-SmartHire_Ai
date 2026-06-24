import os
import time
import json
import logging
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

# Import routers and service singletons
from routers import resume, analyze, career
from services.storage_service import storage_service
from services.firestore_service import firestore_service
from services.gemini_service import gemini_service
from models.schemas import HealthResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("smarthire.main")

app = FastAPI(
    title="SmartHire AI API",
    description="Resume Intelligence and Career Roadmap API backend using FastAPI and Gemini",
    version="1.0.0"
)

# CORS Configuration
# Allow frontend origins: local vite dev server and standard production domains
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://smarthire-ai.web.app",
    "https://smarthire-ai.firebaseapp.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Global Token-Bucket Rate Limiter Middleware
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 30, window_seconds: int = 60):
        """
        Global rate limiter: default 30 requests per minute per IP.
        """
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.clients = {}  # client_ip -> [tokens, last_update_time]

    async def dispatch(self, request: Request, call_next):
        # Exclude docs and health checks from rate limiting
        if request.url.path in ["/health", "/docs", "/openapi.json"]:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        if client_ip not in self.clients:
            self.clients[client_ip] = [self.max_requests, now]

        tokens, last_update = self.clients[client_ip]

        # Calculate replenished tokens since last request
        elapsed = now - last_update
        replenishment = elapsed * (self.max_requests / self.window_seconds)
        tokens = min(self.max_requests, tokens + replenishment)

        if tokens < 1:
            logger.warning(f"Rate limit exceeded for client: {client_ip}")
            return Response(
                content=json.dumps({"detail": "Rate limit exceeded. Please wait before retrying."}),
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                media_type="application/json"
            )

        # Deduct a token
        self.clients[client_ip] = [tokens - 1, now]
        return await call_next(request)

# Add Rate Limiter Middleware
app.add_middleware(RateLimitMiddleware, max_requests=40, window_seconds=60)

# Setup Storage directory and Mount static files to serve uploaded resumes locally
local_storage_dir = Path(__file__).parent / ".storage"
local_storage_dir.mkdir(exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(local_storage_dir)), name="uploads")

# Include Routers
app.include_router(resume.router)
app.include_router(analyze.router)
app.include_router(career.router)

@app.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="API Health check endpoint",
    description="Returns backend server health status and integrations check (GCP & Gemini)"
)
async def health_check():
    """
    Health check endpoint for Cloud Run and external monitoring.
    Verifies connection status to Firebase/GCP services and Gemini API configuration.
    """
    gcp_connected = not (storage_service.local_mode or firestore_service.local_mode)
    gemini_connected = not gemini_service.local_mode
    
    return HealthResponse(
        status="healthy",
        gcp_connected=gcp_connected,
        gemini_connected=gemini_connected
    )
