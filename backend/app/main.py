import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.errors import register_error_handlers
from app.api.routes import api_router
from app.api.routes.health import router as health_router

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Async lifespan context manager for startup and shutdown events."""
    logger.info(f"Starting {settings.PROJECT_NAME} in '{settings.ENVIRONMENT}' environment...")
    logger.info(f"CORS origins allowed: {settings.CORS_ORIGINS}")

    # Warm up embedding model in background so the first user query has zero cold-start delay
    def warmup_embedding():
        try:
            from app.services.embedding_service import embedding_service
            _ = embedding_service.model
            logger.info("Embedding service model pre-warmed successfully.")
        except Exception as e:
            logger.warning(f"Embedding pre-warmup warning: {e}")

    import asyncio
    try:
        loop = asyncio.get_running_loop()
        loop.run_in_executor(None, warmup_embedding)
    except Exception as e:
        logger.warning(f"Could not spawn warmup executor: {e}")

    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}...")


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FastAPI backend foundation for BIS Assistant (Indian Standards & BIS Services)",
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# 1. Register Error Handlers
register_error_handlers(app)

# 2. Configure CORS Middleware (for Vite React frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mount Routes
# Top-level /health endpoint
app.include_router(health_router)

# API routes mounted at /api -> /api/chat and /api/health
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["Root"])
async def root():
    """Root entry point providing basic API metadata."""
    return {
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "health": "/health",
        "chat_endpoint": "/api/chat",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
