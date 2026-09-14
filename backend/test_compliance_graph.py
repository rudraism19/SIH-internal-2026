import asyncio
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.services.compliance_graph import compliance_graph_service
from app.services.chat_service import chat_service
from app.schemas.chat import ChatRequest


async def run_compliance_tests():
    print("=========================================================")
    print("RUNNING BIS COMPLIANCE GRAPH & REGULATORY INTELLIGENCE TESTS")
    print("=========================================================\n")

    # -------------------------------------------------------------
    # TEST 1: Direct Unit Tests on ComplianceGraphService
    # -------------------------------------------------------------
    print("--- 1. Testing Direct Graph Lookups ---")

    # Case A: Pressure Cooker (Mandatory DPIIT QCO)
    pc_status = compliance_graph_service.get_compliance_for_standard("IS 2347:2017")
    assert pc_status.is_mandatory is True, "Pressure cooker must be mandatory"
    assert "DPIIT" in pc_status.ministry or "Commerce" in pc_status.ministry, f"Unexpected ministry: {pc_status.ministry}"
    assert "Domestic Pressure Cooker" in (pc_status.qco_name or ""), f"Unexpected QCO: {pc_status.qco_name}"
    print("✓ PASS: Pressure Cooker IS 2347 -> Mandatory (DPIIT Scheme I ISI Mark)")

    # Case B: Two-Wheeler Helmet (Mandatory DPIIT / MoRTH QCO)
    helmet_status = compliance_graph_service.get_compliance_for_product("two wheeler helmet")
    assert helmet_status is not None, "Helmet must resolve"
    assert helmet_status.is_mandatory is True, "Helmet must be mandatory"
    assert "Helmet" in helmet_status.qco_name, f"Unexpected QCO: {helmet_status.qco_name}"
    print(f"✓ PASS: Two-Wheeler Helmet -> Mandatory ({helmet_status.ministry})")

    # Case C: Mobile Phones (Mandatory MeitY Scheme II CRS)
    mobile_status = compliance_graph_service.get_compliance_for_product("mobile phones")
    assert mobile_status is not None, "Mobile phone must resolve"
    assert mobile_status.is_mandatory is True, "Mobile phone must be mandatory"
    assert "MeitY" in mobile_status.ministry, f"Unexpected ministry: {mobile_status.ministry}"
    assert "CRS" in mobile_status.scheme, f"Scheme must be CRS: {mobile_status.scheme}"
    print(f"✓ PASS: Mobile Phones -> Mandatory MeitY CRS ({mobile_status.scheme})")

    # Case D: Toilet Soap (Voluntary Standard)
    soap_status = compliance_graph_service.get_compliance_for_standard("IS 2888:2004")
    assert soap_status.is_mandatory is False, "Toilet soap must be voluntary"
    assert soap_status.status == "Voluntary", f"Expected Voluntary, got {soap_status.status}"
    print(f"✓ PASS: Toilet Soap IS 2888 -> Voluntary Standard ({soap_status.scheme})")

    # Case E: Automotive Fuels / Diesel (MoPNG Mandatory)
    diesel_status = compliance_graph_service.get_compliance_for_standard("IS 1460:2017")
    assert diesel_status.is_mandatory is True, "Diesel must be mandatory"
    print(f"✓ PASS: Diesel IS 1460 -> Mandatory ({diesel_status.qco_name})")

    print("\n--- 2. Testing End-to-End ChatService Resolution ---")

    # Test 2.1: Fast Path with compliance resolution
    req_fast = ChatRequest(message="How do I get certification for products?")
    res_fast = await chat_service.generate_response(req_fast)
    print(f"Fast-path query: '{req_fast.message}'")
    print(f"  RAG needed: {res_fast.query_analysis.needs_rag}")
    print(f"  Total time: {res_fast.timings['total_ms']}ms")
    print(f"  Success: {res_fast.success}")
    assert res_fast.query_analysis.needs_rag is False, "Generic query must fast path"
    assert res_fast.timings["embedding_ms"] == 0.0, "Fast path must not generate embeddings"
    assert res_fast.timings["retrieval_ms"] == 0.0, "Fast path must not query pgvector"
    assert res_fast.timings["gemini_ms"] == 0.0, "Fast path must not call Gemini"
    print("✓ PASS: Fast-path execution with zero embedding & vector retrieval overhead")

    # Test 2.2: Slow Path RAG with Toilet Soap (Voluntary Compliance Card)
    req_soap = ChatRequest(message="What BIS standard applies to toilet soap?")
    res_soap = await chat_service.generate_response(req_soap)
    print(f"\nSlow-path query: '{req_soap.message}'")
    print(f"  Standard: {[s.standard_number for s in res_soap.identified_standards]}")
    print(f"  Compliance info: {res_soap.compliance_info}")
    assert res_soap.compliance_info is not None, "Soap response must include compliance_info"
    assert res_soap.compliance_info.is_mandatory is False, "Soap must be voluntary"
    print("✓ PASS: Toilet Soap Chat response contains Voluntary compliance card")

    # Test 2.3: Slow Path RAG with Pressure Cooker (Mandatory QCO Card)
    req_pc = ChatRequest(message="Is certification mandatory for pressure cookers?")
    res_pc = await chat_service.generate_response(req_pc)
    print(f"\nSlow-path query: '{req_pc.message}'")
    print(f"  Standard: {[s.standard_number for s in res_pc.identified_standards]}")
    print(f"  Compliance info: {res_pc.compliance_info}")
    assert res_pc.compliance_info is not None, "Pressure cooker response must include compliance_info"
    assert res_pc.compliance_info.is_mandatory is True, "Pressure cooker must be mandatory under QCO"
    assert "DPIIT" in (res_pc.compliance_info.ministry or "") or "Commerce" in (res_pc.compliance_info.ministry or "")
    print("✓ PASS: Pressure Cooker Chat response contains Mandatory QCO compliance card")

    print("\n=========================================================")
    print("ALL BIS COMPLIANCE GRAPH & REGULATORY TESTS PASSED! 🎉")
    print("=========================================================")


if __name__ == "__main__":
    asyncio.run(run_compliance_tests())
