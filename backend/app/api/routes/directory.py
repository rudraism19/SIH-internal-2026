"""Directory API Endpoints for BIS Assistant.

Provides live query and search capabilities for:
- Indian Standards (IS Codes) with division filtering and pagination
- Quality Control Orders (QCOs) with ministry gazette filtering
- BIS Recognized Laboratories with city and product capability filtering
- Testing Regimes with turnaround times and critical parameters
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query, status

from app.core.standards_data import MASTER_BIS_STANDARDS
from app.core.database import get_supabase_client
from app.services.laboratory_service import laboratory_service

logger = logging.getLogger(__name__)

router = APIRouter()


def _clean_str(val: Any) -> str:
    return val.lower().strip() if isinstance(val, str) else ""


@router.get(
    "/standards",
    summary="Search Indian Standards (IS Codes)",
    description="Live search over BIS Standards registry with optional division council and mandatory status filters.",
)
async def search_standards(
    query: Optional[str] = Query(None, description="Keyword search query (e.g. 'cooker', 'cement', 'IS 1460')"),
    division: Optional[str] = Query(None, description="Division council filter (e.g. 'MED', 'CHD', 'CED', 'LITD')"),
    mandatory_only: bool = Query(False, description="Filter for mandatory QCO standards only"),
    limit: int = Query(30, ge=1, le=100, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
) -> Dict[str, Any]:
    try:
        results = []
        q_lower = _clean_str(query)
        div_lower = _clean_str(division)

        # 1. Search Master Curated Standards
        for std in MASTER_BIS_STANDARDS:
            meta = std.get("metadata", {})
            std_div = meta.get("division", "").lower()
            is_mand = meta.get("mandatory", False)

            if mandatory_only and not is_mand:
                continue

            if div_lower and div_lower not in std_div:
                continue

            if q_lower:
                match = (
                    q_lower in std.get("standard_number", "").lower()
                    or q_lower in std.get("title", "").lower()
                    or q_lower in std.get("product", "").lower()
                    or q_lower in std.get("category", "").lower()
                    or any(q_lower in kw.lower() for kw in meta.get("keywords", []))
                )
                if not match:
                    continue

            results.append({
                "standard_number": std.get("standard_number"),
                "title": std.get("title"),
                "product": std.get("product"),
                "category": std.get("category"),
                "document_type": std.get("document_type", "Indian Standard"),
                "version": std.get("version"),
                "division": meta.get("division", "General"),
                "certification_scheme": meta.get("certification_scheme", "Scheme I (ISI Mark)"),
                "mandatory": is_mand,
                "qco_order": meta.get("qco_order"),
                "source": "BIS Official Registry",
            })

        # 2. Also check Supabase 'documents' table if available
        client = get_supabase_client()
        if client and q_lower:
            try:
                db_res = (
                    client.table("documents")
                    .select("id, standard_number, title, document_type, version, metadata")
                    .ilike("title", f"%{q_lower}%")
                    .limit(15)
                    .execute()
                )
                existing_stds = {r["standard_number"] for r in results}
                for row in (db_res.data or []):
                    s_num = row.get("standard_number") or "N/A"
                    if s_num not in existing_stds and s_num != "COMPENDIUM":
                        results.append({
                            "standard_number": s_num,
                            "title": row.get("title", ""),
                            "product": s_num,
                            "category": "Indexed Standard",
                            "document_type": row.get("document_type", "Indian Standard"),
                            "version": row.get("version", "Active"),
                            "division": "General",
                            "certification_scheme": "Scheme I (ISI Mark)",
                            "mandatory": True,
                            "qco_order": None,
                            "source": "Supabase Knowledge Base",
                        })
                        existing_stds.add(s_num)
            except Exception as dbe:
                logger.debug(f"Supabase document query note: {dbe}")

        total = len(results)
        offset_int = offset if isinstance(offset, int) else 0
        limit_int = limit if isinstance(limit, int) else 30
        paginated = results[offset_int : offset_int + limit_int]

        return {
            "success": True,
            "total": total,
            "limit": limit_int,
            "offset": offset_int,
            "standards": paginated,
        }
    except Exception as e:
        logger.error(f"Failed to search standards: {e}", exc_info=True)
        return {"success": False, "total": 0, "standards": [], "error": str(e)}


@router.get(
    "/qco",
    summary="List Quality Control Orders (QCOs)",
    description="Search mandatory QCO orders notified by Central Ministries.",
)
async def list_qco_orders(
    query: Optional[str] = Query(None, description="Search term for QCO product, ministry, or standard"),
    ministry: Optional[str] = Query(None, description="Filter by ministry (e.g. 'DPIIT', 'Steel', 'MeitY')"),
) -> Dict[str, Any]:
    try:
        from app.services.compliance_graph import QCO_REGISTRY

        q_lower = _clean_str(query)
        min_lower = _clean_str(ministry)

        results = []
        for qco in QCO_REGISTRY:
            if min_lower and min_lower not in qco.get("ministry", "").lower():
                continue

            if q_lower:
                match = (
                    q_lower in qco.get("qco_name", "").lower()
                    or q_lower in qco.get("ministry", "").lower()
                    or any(q_lower in p.lower() for p in qco.get("products", []))
                    or any(q_lower in s.lower() for s in qco.get("standards", []))
                )
                if not match:
                    continue

            results.append({
                "qco_id": qco.get("qco_id"),
                "qco_name": qco.get("qco_name"),
                "ministry": qco.get("ministry"),
                "standards": qco.get("standards", []),
                "products": qco.get("products", []),
                "scheme": qco.get("scheme", "Scheme I (ISI Mark)"),
                "is_mandatory": qco.get("is_mandatory", True),
                "enforcement_date": qco.get("enforcement_date"),
                "legal_basis": qco.get("legal_basis"),
                "exemptions": qco.get("exemptions", []),
            })

        return {
            "success": True,
            "count": len(results),
            "qco_orders": results,
        }
    except Exception as e:
        logger.error(f"Failed to list QCO orders: {e}", exc_info=True)
        return {"success": False, "count": 0, "qco_orders": [], "error": str(e)}


@router.get(
    "/laboratories",
    summary="Search Recognized BIS Testing Laboratories",
    description="Search official Central, Regional, and Recognized NABL testing laboratories.",
)
async def search_laboratories(
    query: Optional[str] = Query(None, description="Search by lab name, city, state, or product"),
    product: Optional[str] = Query(None, description="Specific product (e.g. 'cement', 'helmet', 'cooker')"),
) -> Dict[str, Any]:
    try:
        from app.services.laboratory_service import BIS_LABORATORIES_NETWORK, TESTING_REGISTRY

        q_lower = _clean_str(query)
        prod_lower = _clean_str(product)

        # Aggregate unique labs and map their testing capabilities
        labs_map: Dict[str, Dict[str, Any]] = {}

        # 1. Base apex BIS labs
        for lab in BIS_LABORATORIES_NETWORK:
            key = lab.lab_name
            is_apex = "Central" in lab.lab_type or "Apex" in (lab.accreditation or "")
            caps = ["All Indian Standards (Apex Lab)"] if is_apex else ["Comprehensive Industrial Standards"]
            labs_map[key] = {
                "lab_name": lab.lab_name,
                "location": lab.location,
                "lab_type": lab.lab_type,
                "accreditation": lab.accreditation or "NABL Accredited",
                "contact_info": lab.contact_info or "Central BIS Helpline",
                "capabilities": caps,
            }

        # 2. Labs from product testing registry
        for std_key, info in TESTING_REGISTRY.items():
            p_name = info.get("product_name", std_key)
            std_num = info.get("standard_number", std_key)
            cap_str = f"{p_name} ({std_num})"
            for lab in info.get("recognized_laboratories", []):
                key = lab.lab_name
                if key not in labs_map:
                    labs_map[key] = {
                        "lab_name": lab.lab_name,
                        "location": lab.location,
                        "lab_type": lab.lab_type,
                        "accreditation": lab.accreditation or "NABL / BIS LRS",
                        "contact_info": lab.contact_info or "Direct Facility",
                        "capabilities": [],
                    }
                if cap_str not in labs_map[key]["capabilities"]:
                    labs_map[key]["capabilities"].append(cap_str)

        all_labs = list(labs_map.values())
        results = []

        for lab in all_labs:
            if prod_lower:
                cap_match = any(prod_lower in c.lower() for c in lab["capabilities"])
                if not cap_match and "All Indian Standards" not in "".join(lab["capabilities"]):
                    continue

            if q_lower:
                match = (
                    q_lower in lab["lab_name"].lower()
                    or q_lower in lab["location"].lower()
                    or q_lower in lab["lab_type"].lower()
                    or any(q_lower in c.lower() for c in lab["capabilities"])
                )
                if not match:
                    continue

            results.append(lab)

        return {
            "success": True,
            "count": len(results),
            "laboratories": results,
        }
    except Exception as e:
        logger.error(f"Failed to search laboratories: {e}", exc_info=True)
        return {"success": False, "count": 0, "laboratories": [], "error": str(e)}


@router.get(
    "/testing",
    summary="Search Testing Parameters and Regimes",
    description="Search test regimes, critical parameters, and turnaround times for Indian Standards.",
)
async def search_testing_regimes(
    query: Optional[str] = Query(None, description="Product or standard code search"),
) -> Dict[str, Any]:
    try:
        from app.services.laboratory_service import TESTING_REGISTRY

        q_lower = _clean_str(query)
        results = []

        for std_key, info in TESTING_REGISTRY.items():
            std_num = info.get("standard_number", std_key)
            prod_name = info.get("product_name", "")
            tat = info.get("estimated_turnaround", "7 to 10 working days")
            sample_req = info.get("sample_requirements", "Representative commercial package")
            params = info.get("critical_parameters", [])

            if q_lower:
                match = (
                    q_lower in std_num.lower()
                    or q_lower in prod_name.lower()
                    or any(q_lower in p.parameter_name.lower() for p in params)
                )
                if not match:
                    continue

            results.append({
                "standard_number": std_num,
                "product_name": prod_name,
                "sample_requirements": sample_req,
                "turnaround_time": tat,
                "parameters_count": len(params),
                "parameters": [
                    {
                        "parameter_name": p.parameter_name,
                        "test_method": p.test_method,
                        "specification_limit": p.specification_limit,
                        "criticality": p.criticality,
                    }
                    for p in params
                ],
            })

        return {
            "success": True,
            "count": len(results),
            "regimes": results,
        }
    except Exception as e:
        logger.error(f"Failed to search testing regimes: {e}", exc_info=True)
        return {"success": False, "count": 0, "regimes": [], "error": str(e)}
