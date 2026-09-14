"""Sarvam AI Service for Multilingual Speech & Language Intelligence.

Provides authoritative integration with Sarvam AI APIs:
- Speech-to-Text (STT) via Saaras v3
- Text-to-Speech (TTS) via Bulbul v3
- Multilingual Translation via Mayura v1
- Indian Script & Language Detection (Hindi, Tamil, Telugu, Gujarati, Bengali, etc.)
- Speech Text Cleaner for acoustic naturalness
"""

import re
import io
import logging
from typing import Optional, Dict, Any, List
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# Mapping from script range to Indic language code
INDIC_SCRIPTS = [
    (re.compile(r"[\u0900-\u097F]"), "hi-IN", "Hindi"),
    (re.compile(r"[\u0980-\u09FF]"), "bn-IN", "Bengali"),
    (re.compile(r"[\u0A00-\u0A7F]"), "pa-IN", "Punjabi"),
    (re.compile(r"[\u0A80-\u0AFF]"), "gu-IN", "Gujarati"),
    (re.compile(r"[\u0B00-\u0B7F]"), "od-IN", "Odia"),
    (re.compile(r"[\u0B80-\u0BFF]"), "ta-IN", "Tamil"),
    (re.compile(r"[\u0C00-\u0C7F]"), "te-IN", "Telugu"),
    (re.compile(r"[\u0C80-\u0CFF]"), "kn-IN", "Kannada"),
    (re.compile(r"[\u0D00-\u0D7F]"), "ml-IN", "Malayalam"),
    (re.compile(r"[\u1C50-\u1C7F]"), "sat-IN", "Santali"),
    (re.compile(r"[\u0600-\u06FF]"), "ur-IN", "Urdu"),
]

# Supported language codes by Sarvam AI (All 22 Scheduled Indian Languages + English)
SUPPORTED_SARVAM_LANGUAGES = {
    "en-IN": "English",
    "hi-IN": "Hindi",
    "mr-IN": "Marathi",
    "bn-IN": "Bengali",
    "gu-IN": "Gujarati",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
    "kn-IN": "Kannada",
    "ml-IN": "Malayalam",
    "pa-IN": "Punjabi",
    "od-IN": "Odia",
    "as-IN": "Assamese",
    "ur-IN": "Urdu",
    "sa-IN": "Sanskrit",
    "ne-IN": "Nepali",
    "kok-IN": "Konkani",
    "ks-IN": "Kashmiri",
    "mai-IN": "Maithili",
    "sd-IN": "Sindhi",
    "doi-IN": "Dogri",
    "mni-IN": "Manipuri",
    "brx-IN": "Bodo",
    "sat-IN": "Santali",
}

# ISO / 2-letter / common code normalization to official Sarvam BCP-47 locale
LANGUAGE_NORMALIZATION_MAP = {
    "en": "en-IN",
    "hi": "hi-IN",
    "mr": "mr-IN",
    "bn": "bn-IN",
    "gu": "gu-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "pa": "pa-IN",
    "od": "od-IN",
    "or": "od-IN",
    "as": "as-IN",
    "ur": "ur-IN",
    "sa": "sa-IN",
    "ne": "ne-IN",
    "kok": "kok-IN",
    "ks": "ks-IN",
    "mai": "mai-IN",
    "sd": "sd-IN",
    "doi": "doi-IN",
    "mni": "mni-IN",
    "brx": "brx-IN",
    "sat": "sat-IN",
    # Name aliases
    "english": "en-IN",
    "hindi": "hi-IN",
    "marathi": "mr-IN",
    "bengali": "bn-IN",
    "bangla": "bn-IN",
    "gujarati": "gu-IN",
    "tamil": "ta-IN",
    "telugu": "te-IN",
    "kannada": "kn-IN",
    "malayalam": "ml-IN",
    "punjabi": "pa-IN",
    "odia": "od-IN",
    "oriya": "od-IN",
    "assamese": "as-IN",
    "urdu": "ur-IN",
    "sanskrit": "sa-IN",
    "nepali": "ne-IN",
    "konkani": "kok-IN",
    "kashmiri": "ks-IN",
    "maithili": "mai-IN",
    "sindhi": "sd-IN",
    "dogri": "doi-IN",
    "manipuri": "mni-IN",
    "meitei": "mni-IN",
    "bodo": "brx-IN",
    "santali": "sat-IN",
}

# Supported TTS acoustic languages in Bulbul v3
SARVAM_TTS_LANGUAGES = {
    "en-IN", "hi-IN", "bn-IN", "gu-IN", "kn-IN",
    "ml-IN", "mr-IN", "od-IN", "pa-IN", "ta-IN", "te-IN"
}

# Default speakers for bulbul:v3
DEFAULT_SPEAKERS = {
    "female": "priya",
    "male": "aditya",
}


def normalize_language_code(code: Optional[str]) -> str:
    """Normalize any language code (e.g. 'hi', 'hi-IN', 'HINDI', 'pa') to Sarvam BCP-47 format."""
    if not code:
        return "en-IN"
    cleaned = code.strip()
    # Check exact match in supported
    for valid_code in SUPPORTED_SARVAM_LANGUAGES.keys():
        if cleaned.lower() == valid_code.lower():
            return valid_code
    # Base 2/3 letter code lookup
    base = cleaned.split("-")[0].lower()
    if base in LANGUAGE_NORMALIZATION_MAP:
        return LANGUAGE_NORMALIZATION_MAP[base]
    # Name alias lookup
    if cleaned.lower() in LANGUAGE_NORMALIZATION_MAP:
        return LANGUAGE_NORMALIZATION_MAP[cleaned.lower()]
    return "en-IN"


class SarvamService:
    """Service layer for Sarvam AI Indic Speech & Language Intelligence."""

    def __init__(self):
        self.api_key = settings.SARVAM_API_KEY
        self.base_url = settings.SARVAM_BASE_URL.rstrip("/")
        self.stt_model = settings.SARVAM_STT_MODEL or "saaras:v3"
        self.tts_model = settings.SARVAM_TTS_MODEL or "bulbul:v3"
        self.tts_speaker = settings.SARVAM_TTS_SPEAKER or "priya"
        self.translate_model = settings.SARVAM_TRANSLATE_MODEL or "mayura:v1"

    def is_configured(self) -> bool:
        """Returns True if a valid Sarvam API key is configured."""
        return bool(self.api_key and self.api_key.strip())

    def detect_language(self, text: str) -> str:
        """Detect language code based on Indian Unicode script blocks or Latin fallback."""
        if not text:
            return "en-IN"
        for pattern, lang_code, _ in INDIC_SCRIPTS:
            if pattern.search(text):
                return lang_code
        return "en-IN"

    def clean_text_for_speech(self, text: str, max_chars: int = 450) -> str:
        """Strips markdown links, tables, hashes, bullets, and emojis for natural speech synthesis."""
        if not text:
            return ""
        # Remove markdown URLs and keep label: [Label](url) -> Label
        clean = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
        # Remove code blocks
        clean = re.sub(r"```[\s\S]*?```", "", clean)
        clean = re.sub(r"`[^`]*`", "", clean)
        # Remove headers
        clean = re.sub(r"#+\s*", "", clean)
        # Remove table formatting
        clean = re.sub(r"\|[^\n]+\|", "", clean)
        # Remove bold and italic symbols
        clean = re.sub(r"[*_~]", "", clean)
        # Remove bullet symbols
        clean = re.sub(r"[•\-–—►▪■]\s*", "", clean)
        # Collapse multiple newlines and spaces
        clean = re.sub(r"\s+", " ", clean).strip()
        # Truncate to reasonable sentence length for audio output
        if len(clean) > max_chars:
            # Cut at last sentence period / purna viram before max_chars
            last_p = max(clean.rfind(".", 0, max_chars), clean.rfind("।", 0, max_chars), clean.rfind("?", 0, max_chars))
            if last_p > 100:
                clean = clean[:last_p + 1]
            else:
                clean = clean[:max_chars] + "..."
        return clean

    async def speech_to_text(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        model: Optional[str] = None,
        language_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Transcribe spoken audio into text using Sarvam AI Saaras v3."""
        if not self.is_configured():
            logger.warning("SARVAM_API_KEY is not configured.")
            return {"transcript": "", "language_code": "unknown", "error": "API key not configured"}

        url = f"{self.base_url}/speech-to-text"
        headers = {
            "api-subscription-key": self.api_key.strip()
        }
        data = {
            "model": model or self.stt_model,
        }
        if language_code:
            data["language_code"] = normalize_language_code(language_code)

        files = {
            "file": (filename, audio_bytes, "audio/wav")
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, headers=headers, data=data, files=files)
                if resp.status_code != 200:
                    logger.error(f"Sarvam STT error {resp.status_code}: {resp.text}")
                    return {"transcript": "", "language_code": "unknown", "error": resp.text}
                result = resp.json()
                return {
                    "transcript": result.get("transcript", ""),
                    "language_code": result.get("language_code", "hi-IN"),
                    "language_probability": result.get("language_probability", 1.0),
                    "request_id": result.get("request_id"),
                }
        except Exception as e:
            logger.error(f"Failed to call Sarvam STT: {e}", exc_info=True)
            return {"transcript": "", "language_code": "unknown", "error": str(e)}

    async def text_to_speech(
        self,
        text: str,
        target_language_code: Optional[str] = None,
        speaker: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Optional[str]:
        """Convert text into high-quality base64 WAV audio using Sarvam AI Bulbul v3."""
        if not self.is_configured():
            logger.warning("SARVAM_API_KEY is not configured.")
            return None

        # Clean text for spoken acoustic flow
        spoken_text = self.clean_text_for_speech(text)
        if not spoken_text:
            return None

        lang = normalize_language_code(target_language_code) if target_language_code else self.detect_language(spoken_text)
        # Default to hi-IN or en-IN if lang not supported in Bulbul v3 acoustic voices
        if lang not in SARVAM_TTS_LANGUAGES:
            lang = "hi-IN" if any(c in spoken_text for c in "कखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह") else "en-IN"

        url = f"{self.base_url}/text-to-speech"
        headers = {
            "Content-Type": "application/json",
            "api-subscription-key": self.api_key.strip()
        }
        payload = {
            "inputs": [spoken_text],
            "target_language_code": lang,
            "speaker": speaker or self.tts_speaker,
            "pitch": 0,
            "pace": 1.0,
            "loudness": 1.5,
            "speech_sample_rate": 8000,
            "enable_preprocessing": True,
            "model": model or self.tts_model,
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code != 200:
                    logger.error(f"Sarvam TTS error {resp.status_code}: {resp.text}")
                    return None
                data = resp.json()
                audios = data.get("audios", [])
                return audios[0] if audios else None
        except Exception as e:
            logger.error(f"Failed to call Sarvam TTS: {e}", exc_info=True)
            return None

    async def translate(
        self,
        text: str,
        source_language_code: str = "en-IN",
        target_language_code: str = "hi-IN",
        mode: str = "formal",
        model: Optional[str] = None,
    ) -> str:
        """Translate text between English and Indian languages using Sarvam Mayura v1.
        Automatically chunks text exceeding 950 characters to comply with Sarvam's 1000 char limit.
        """
        if not self.is_configured() or not text:
            return text

        source_code = normalize_language_code(source_language_code)
        target_code = normalize_language_code(target_language_code)

        if source_code == target_code:
            return text

        # If text is within Sarvam's 1000 char limit, translate directly
        if len(text) <= 950:
            return await self._translate_single_chunk(text, source_code, target_code, mode, model)

        # Chunk text by paragraphs or double newlines
        paragraphs = text.split("\n\n")
        chunks = []
        curr_chunk = []
        curr_len = 0

        for p in paragraphs:
            p_len = len(p) + 2
            if curr_len + p_len > 900 and curr_chunk:
                chunks.append("\n\n".join(curr_chunk))
                curr_chunk = [p]
                curr_len = p_len
            else:
                curr_chunk.append(p)
                curr_len += p_len

        if curr_chunk:
            chunks.append("\n\n".join(curr_chunk))

        translated_chunks = []
        for ch in chunks:
            # If individual chunk is still > 950, cut it safely
            safe_ch = ch[:950]
            tr = await self._translate_single_chunk(safe_ch, source_code, target_code, mode, model)
            translated_chunks.append(tr)

        return "\n\n".join(translated_chunks)

    async def _translate_single_chunk(
        self,
        text: str,
        source_language_code: str,
        target_language_code: str,
        mode: str,
        model: Optional[str] = None,
    ) -> str:
        src = normalize_language_code(source_language_code)
        tgt = normalize_language_code(target_language_code)

        if src == tgt:
            return text

        url = f"{self.base_url}/translate"
        headers = {
            "Content-Type": "application/json",
            "api-subscription-key": self.api_key.strip()
        }
        payload = {
            "input": text[:950],
            "source_language_code": src,
            "target_language_code": tgt,
            "mode": mode,
            "model": model or self.translate_model,
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code != 200:
                    logger.error(f"Sarvam Translate error {resp.status_code}: {resp.text}")
                    return text
                data = resp.json()
                return data.get("translated_text", text)
        except Exception as e:
            logger.error(f"Failed to call Sarvam Translate: {e}", exc_info=True)
            return text


# Global service instance
sarvam_service = SarvamService()
