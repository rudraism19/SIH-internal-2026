from fastapi import APIRouter
from app.api.routes import health, chat, documents, voice, directory, audit, dossier, auth

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(chat.router)
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(voice.router)
api_router.include_router(directory.router, prefix="/directory", tags=["Directory"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit Simulator"])
api_router.include_router(dossier.router, prefix="/dossier", tags=["Application Dossier"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

__all__ = ["api_router"]
