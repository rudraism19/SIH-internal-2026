"""
Application Dossier Router — Manakonline Form-V e-BIS Builder Endpoints
"""

from fastapi import APIRouter, Query, Body, HTTPException
from typing import Dict, Any, Optional
from app.services.dossier_service import get_dossier_template, validate_dossier_application

router = APIRouter()


@router.get("/template", summary="Get Pre-Filled Manakonline Form-V Template")
async def fetch_template(
    standard: str = Query("IS 2347", description="Indian Standard code (e.g. IS 2347, IS 4151, IS 269)"),
    form_type: str = Query("Form-V", description="Statutory Form Type (Form-V for Scheme-I)")
) -> Dict[str, Any]:
    """
    Returns the pre-filled statutory application template with required machinery,
    test instruments, raw material specifications, and enclosures checklist.
    """
    try:
        return get_dossier_template(standard, form_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate template: {str(e)}")


@router.post("/validate", summary="Validate e-BIS Form-V Dossier Completeness")
async def validate_dossier(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    Validates applicant form particulars, manufacturing machinery schedule,
    laboratory test instruments, and statutory enclosures against BIS requirements.
    """
    try:
        return validate_dossier_application(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")
