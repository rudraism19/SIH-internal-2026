import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.schemas.chat import (
    VoiceTranscribeResponse,
    VoiceSynthesizeRequest,
    VoiceSynthesizeResponse,
)
from app.services.sarvam_service import sarvam_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["Voice & Multilingual"])


@router.post("/transcribe", response_model=VoiceTranscribeResponse)
async def transcribe_audio(
    file: UploadFile = File(..., description="Audio file to transcribe (WAV, MP3, WebM, OGG)"),
    language_code: Optional[str] = Form(None, description="Optional expected Indic language code, e.g. 'hi-IN'"),
):
    """Transcribe spoken audio into Indian language text using Sarvam AI Saaras v3."""
    if not sarvam_service.is_configured():
        raise HTTPException(
            status_code=503,
            detail="Sarvam AI speech service is not configured. Please verify SARVAM_API_KEY.",
        )

    try:
        audio_bytes = await file.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file provided.")

        result = await sarvam_service.speech_to_text(
            audio_bytes=audio_bytes,
            filename=file.filename or "audio.wav",
            language_code=language_code,
        )

        if not result.get("transcript"):
            error_msg = result.get("error", "No transcript generated.")
            logger.warning(f"Audio transcription empty or failed: {error_msg}")
            return VoiceTranscribeResponse(
                transcript="",
                language_code=result.get("language_code", "unknown"),
                language_probability=0.0,
                success=False,
            )

        return VoiceTranscribeResponse(
            transcript=result["transcript"],
            language_code=result.get("language_code", "hi-IN"),
            language_probability=result.get("language_probability", 1.0),
            success=True,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during audio transcription: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.post("/synthesize", response_model=VoiceSynthesizeResponse)
async def synthesize_voice(request: VoiceSynthesizeRequest):
    """Convert text into high-quality base64 WAV speech audio using Sarvam AI Bulbul v3."""
    if not sarvam_service.is_configured():
        raise HTTPException(
            status_code=503,
            detail="Sarvam AI speech service is not configured. Please verify SARVAM_API_KEY.",
        )

    try:
        audio_b64 = await sarvam_service.text_to_speech(
            text=request.text,
            target_language_code=request.language_code,
            speaker=request.speaker,
            model=request.model,
        )

        if not audio_b64:
            raise HTTPException(status_code=500, detail="Voice synthesis failed to generate audio.")

        return VoiceSynthesizeResponse(
            audio_base64=audio_b64,
            audio_format="audio/wav",
            success=True,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during voice synthesis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Voice synthesis failed: {str(e)}")
