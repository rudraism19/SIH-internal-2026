"""Factory Audit Simulator & CAPA API Endpoints."""

import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Query, Body

from app.services.audit_service import audit_service

logger = logging.getLogger(__name__)

router = APIRouter()


class AuditEvaluationRequest(BaseModel):
    standard: Optional[str] = Field(None, description="Indian Standard code (e.g. 'IS 2347', 'IS 4151', 'UNIVERSAL')")
    responses: Dict[str, str] = Field(default_factory=dict, description="Map of item_id -> 'yes' | 'partial' | 'no' | 'na'")
    factory_name: Optional[str] = Field(None, description="Name of manufacturing plant")
    factory_location: Optional[str] = Field(None, description="City / State of plant")


@router.get(
    "/checklist",
    summary="Get Statutory Audit Inspection Checklist",
    description="Returns pre-configured BIS factory inspection criteria for a standard.",
)
async def get_audit_checklist(
    standard: Optional[str] = Query(None, description="Standard code (e.g. 'IS 2347', 'IS 4151', 'UNIVERSAL')"),
) -> Dict[str, Any]:
    try:
        data = audit_service.get_checklist(standard)
        return data
    except Exception as e:
        logger.error(f"Failed to fetch audit checklist: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


@router.post(
    "/evaluate",
    summary="Evaluate Factory Audit Readiness & Generate CAPA",
    description="Evaluates responses, computes weighted percentage score, and compiles Corrective Action Plan.",
)
async def evaluate_audit(
    payload: AuditEvaluationRequest = Body(...),
) -> Dict[str, Any]:
    try:
        evaluation = audit_service.evaluate_audit(
            standard_key=payload.standard,
            responses=payload.responses,
            factory_name=payload.factory_name,
            factory_location=payload.factory_location,
        )
        return evaluation
    except Exception as e:
        logger.error(f"Failed to evaluate audit: {e}", exc_info=True)
        return {"success": False, "error": str(e)}
