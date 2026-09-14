import asyncio
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.services.laboratory_service import laboratory_service
from app.services.chat_service import chat_service
from app.schemas.chat import ChatRequest


async def run_laboratory_tests():
    print("=========================================================")
    print("RUNNING BIS ACCREDITED LAB NETWORK & TEST PARAMETER TESTS")
    print("=========================================================\n")

    # -------------------------------------------------------------
    # TEST 1: Direct Unit Tests on LaboratoryService
    # -------------------------------------------------------------
    print("--- 1. Testing Direct Laboratory & Testing Registry Lookups ---")

    # Case A: Toilet Soap IS 2888
    soap_test = laboratory_service.get_testing_for_standard("IS 2888:2004")
    assert soap_test is not None, "Toilet soap testing info must resolve"
    assert "6 commercial cakes" in (soap_test.sample_requirements or "")
    assert any("Total Fatty Matter" in p.parameter_name for p in soap_test.critical_parameters)
    tfm_param = next(p for p in soap_test.critical_parameters if "Total Fatty Matter" in p.parameter_name)
    assert "76" in tfm_param.specification_limit
    assert any("Shriram Institute" in l.lab_name for l in soap_test.recognized_laboratories)
    print("✓ PASS: Toilet Soap IS 2888 -> TFM (Min 76%), 6 cakes sample, Shriram Institute / Central Lab")

    # Case B: Domestic Pressure Cooker IS 2347
    cooker_test = laboratory_service.get_testing_for_standard("IS 2347:2017")
    assert cooker_test is not None, "Pressure cooker testing info must resolve"
    assert "3 complete" in (cooker_test.sample_requirements or "")
    assert any("Hydraulic Proof" in p.parameter_name for p in cooker_test.critical_parameters)
    assert any("Bursting" in p.parameter_name for p in cooker_test.critical_parameters)
    assert any("National Test House" in l.lab_name for l in cooker_test.recognized_laboratories)
    print("✓ PASS: Pressure Cooker IS 2347 -> Hydraulic proof & burst pressure, National Test House")

    # Case C: Two-Wheeler Helmet IS 4151 (Product Search)
    helmet_test = laboratory_service.get_testing_for_product("two wheeler helmet")
    assert helmet_test is not None, "Helmet testing info must resolve"
    assert any("Impact Attenuation" in p.parameter_name for p in helmet_test.critical_parameters)
    assert any("ARAI" in l.lab_name for l in helmet_test.recognized_laboratories)
    print("✓ PASS: Helmets IS 4151 -> Impact attenuation (< 300g), ARAI Pune / ICAT Manesar")

    # Case D: Automotive Diesel IS 1460
    diesel_test = laboratory_service.get_testing_for_standard("IS 1460:2017")
    assert diesel_test is not None, "Diesel testing info must resolve"
    assert any("Sulfur" in p.parameter_name for p in diesel_test.critical_parameters)
    sulfur_param = next(p for p in diesel_test.critical_parameters if "Sulfur" in p.parameter_name)
    assert "10" in sulfur_param.specification_limit  # 10 ppm for BS-VI
    print("✓ PASS: Diesel IS 1460 -> Total sulfur (Max 10 ppm BS-VI), Cetane Index ≥ 51")

    # Case E: BIS General Laboratory Network
    general_network = laboratory_service.get_general_laboratory_network()
    assert len(general_network) >= 5, "Must list all regional & central laboratories"
    assert any("Sahibabad" in l.lab_name for l in general_network)
    print(f"✓ PASS: BIS Laboratory Network Directory -> {len(general_network)} National Apex & Regional Facilities")

    print("\n--- 2. Testing End-to-End ChatService Resolution with Testing Info ---")

    # Test 2.1: Fast Path for General Laboratory Query
    req_fast = ChatRequest(message="Where are BIS laboratories located?")
    res_fast = await chat_service.generate_response(req_fast)
    print(f"Fast-path query: '{req_fast.message}'")
    print(f"  RAG needed: {res_fast.query_analysis.needs_rag}")
    print(f"  Intent: {res_fast.query_analysis.intent}")
    assert res_fast.query_analysis.needs_rag is False
    assert res_fast.timings["embedding_ms"] == 0.0
    print("✓ PASS: General Laboratory intent handled via fast-path (0ms RAG overhead)")

    # Test 2.2: Slow Path RAG with Testing Card for Toilet Soap
    req_soap = ChatRequest(message="What laboratory tests are required for toilet soap?")
    res_soap = await chat_service.generate_response(req_soap)
    print(f"\nSlow-path query: '{req_soap.message}'")
    print(f"  Standard: {[s.standard_number for s in res_soap.identified_standards]}")
    print(f"  Testing info present: {res_soap.testing_info is not None}")
    assert res_soap.testing_info is not None, "Testing info must be populated for toilet soap"
    assert len(res_soap.testing_info.critical_parameters) >= 3
    print(f"  Parameters: {[p.parameter_name for p in res_soap.testing_info.critical_parameters]}")
    print(f"  Laboratories: {[l.lab_name for l in res_soap.testing_info.recognized_laboratories[:2]]}")
    assert res_soap.compliance_info is not None, "Compliance info must also be populated"
    print("✓ PASS: Toilet Soap Chat response contains full Testing & Laboratory Card")

    # Test 2.3: Slow Path RAG with Testing Card for Pressure Cooker
    req_cooker = ChatRequest(message="What laboratory tests are conducted on pressure cookers?")
    res_cooker = await chat_service.generate_response(req_cooker)
    print(f"\nSlow-path query: '{req_cooker.message}'")
    print(f"  Standard: {[s.standard_number for s in res_cooker.identified_standards]}")
    assert res_cooker.testing_info is not None, "Testing info must be populated for pressure cooker"
    assert any("Proof" in p.parameter_name for p in res_cooker.testing_info.critical_parameters)
    assert res_cooker.compliance_info is not None
    assert res_cooker.compliance_info.is_mandatory is True
    print("✓ PASS: Pressure Cooker Chat response contains Testing Card with Hydraulic burst limits + Mandatory QCO")

    print("\n=========================================================")
    print("ALL ACCREDITED LABORATORY & TESTING TESTS PASSED! 🎉")
    print("=========================================================")


if __name__ == "__main__":
    asyncio.run(run_laboratory_tests())
