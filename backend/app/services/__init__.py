"""Services package for BIS Assistant.

Provides modular service layers for Groq, Supabase, Catalogue, Ingestion, and future layers.
"""
from app.services.chat_service import ChatService, chat_service
from app.services.catalogue_service import CatalogueService, catalogue_service
from app.services.ingestion_service import IngestionService, ingestion_service
from app.services.groq_service import GroqService
from app.services.gemini_service import GeminiService
from app.services.langchain_service import LangChainService
from app.services.supabase_service import SupabaseService
from app.services.sarvam_service import SarvamService
from app.services.viasocket_service import ViaSocketService

__all__ = [
    "ChatService",
    "chat_service",
    "CatalogueService",
    "catalogue_service",
    "IngestionService",
    "ingestion_service",
    "GroqService",
    "GeminiService",
    "LangChainService",
    "SupabaseService",
    "SarvamService",
    "ViaSocketService",
]
