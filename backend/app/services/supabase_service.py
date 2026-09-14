"""Supabase Database & Auth Service Stub (for future integration)."""
import logging
from typing import Optional, Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)


class SupabaseService:
    """Modular integration stub for Supabase database, vector storage, and auth."""

    def __init__(self, url: Optional[str] = None, key: Optional[str] = None):
        self.url = url or settings.SUPABASE_URL
        self.key = key or settings.SUPABASE_KEY

    async def save_message(self, session_id: str, role: str, content: str) -> Dict[str, Any]:
        """Placeholder for saving conversation turn to Supabase."""
        logger.info(f"Supabase save_message stub: session={session_id}, role={role}")
        return {"status": "saved_mock", "session_id": session_id}

    async def get_history(self, session_id: str) -> List[Dict[str, Any]]:
        """Placeholder for retrieving conversation history from Supabase."""
        logger.info(f"Supabase get_history stub: session={session_id}")
        return []
