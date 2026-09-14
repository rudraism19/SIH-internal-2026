"""BIS Factory Inspection Audit Intelligence & Corrective Action (CAPA) Service.

Provides statutory self-assessment audit checklists, dynamic readiness scoring,
and automated Corrective & Preventive Action (CAPA) generation for factory quality
managers preparing for Bureau of Indian Standards (BIS) inspections.
"""

import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

# Statutory Pillars Definition
AUDIT_PILLARS = [
    {
        "id": "testing_infrastructure",
        "name": "Testing Infrastructure & Calibration",
        "weight": 25,
        "description": "In-house laboratory capability, valid calibration certificates, and testing instruments.",
    },
    {
        "id": "raw_materials",
        "name": "Raw Material Quality Control",
        "weight": 15,
        "description": "Incoming raw material inspection, supplier Mill Test Certificates (MTC), and traceability.",
    },
    {
        "id": "sit_compliance",
        "name": "Scheme of Inspection & Testing (SIT)",
        "weight": 20,
        "description": "Control unit batch sizing, 100% in-line routine tests, and statistical sampling.",
    },
    {
        "id": "technical_personnel",
        "name": "Technical Personnel & Competency",
        "weight": 15,
        "description": "Dedicated competent quality testing staff and training records.",
    },
    {
        "id": "non_conformance",
        "name": "Non-Conformance & Scrap Segregation",
        "weight": 10,
        "description": "Quarantine area demarcation, rejection logs, and scrap destruction protocols.",
    },
    {
        "id": "statutory_records",
        "name": "Statutory Records & Marking Ledgers",
        "weight": 15,
        "description": "Form-VII production ledgers, CA audit certificates, and Form-VI renewal timeline.",
    },
]

# Standard-specific audit criteria
AUDIT_CHECKLISTS: Dict[str, Dict[str, Any]] = {
    "IS 2347": {
        "standard_number": "IS 2347:2017",
        "product_name": "Domestic Pressure Cookers",
        "scheme": "Scheme I (ISI Mark)",
        "items": [
            # 1. Testing Infrastructure (25%)
            {
                "id": "PC_TI_1",
                "pillar": "testing_infrastructure",
                "title": "Hydrostatic Proof Pressure Rig",
                "description": "Calibrated hydrostatic test rig capable of applying minimum 0.2 MPa (2 bar) pressure smoothly for 2 minutes with master pressure gauge.",
                "clause_ref": "IS 2347 Clause 8.2",
                "criticality": "Critical",
                "capa_recommendation": "Install and calibrate a hydraulic proof pressure testing station with an NABL-certified master pressure gauge calibrated within the last 12 months.",
            },
            {
                "id": "PC_TI_2",
                "pillar": "testing_infrastructure",
                "title": "Bursting Pressure Test Equipment",
                "description": "Hydrostatic pressure test setup capable of minimum 0.3 MPa (3 bar) without leakage or rupture.",
                "clause_ref": "IS 2347 Clause 8.3",
                "criticality": "Critical",
                "capa_recommendation": "Maintain a reinforced protective enclosure hydraulic burst testing rig ensuring safety interlocks during high pressure destructive tests.",
            },
            {
                "id": "PC_TI_3",
                "pillar": "testing_infrastructure",
                "title": "Safety Valve Actuation Test Stand",
                "description": "Pneumatic or hydraulic test stand to verify spring/fusible plug safety relief between 1.4x and 2.0x operating pressure.",
                "clause_ref": "IS 2347 Clause 8.4",
                "criticality": "Critical",
                "capa_recommendation": "Procure or assemble a calibrated safety valve release test fixture to measure actuation pressure within ±0.05 bar accuracy.",
            },
            {
                "id": "PC_TI_4",
                "pillar": "testing_infrastructure",
                "title": "Gauge Calibration Certificates",
                "description": "Valid calibration certificates from an ISO/IEC 17025 accredited NABL laboratory for all test gauges.",
                "clause_ref": "General SIT Guidelines",
                "criticality": "Major",
                "capa_recommendation": "Send all active pressure gauges, micrometers, and vernier calipers to an accredited NABL calibration laboratory immediately.",
            },

            # 2. Raw Materials (15%)
            {
                "id": "PC_RM_1",
                "pillar": "raw_materials",
                "title": "Food Grade Aluminium / Stainless Steel MTC",
                "description": "Mill Test Certificates conforming to IS 21 (aluminium) or IS 6911 (stainless steel grade 304/food grade).",
                "clause_ref": "IS 2347 Clause 4.1",
                "criticality": "Critical",
                "capa_recommendation": "Mandate batch-specific Mill Test Certificates (MTC) from metal suppliers verifying composition limits (lead < 0.05%, copper < 0.1%).",
            },
            {
                "id": "PC_RM_2",
                "pillar": "raw_materials",
                "title": "Food Grade Gasket Certification (IS 7466)",
                "description": "Food contact silicone or rubber gasket test certificates conforming to IS 7466 with migration test compliance.",
                "clause_ref": "IS 2347 Clause 4.3",
                "criticality": "Major",
                "capa_recommendation": "Ensure rubber/silicone gasket batches are sourced with third-party food migration and hardness test reports per IS 7466.",
            },

            # 3. SIT Compliance (20%)
            {
                "id": "PC_SIT_1",
                "pillar": "sit_compliance",
                "title": "100% In-Line Proof Pressure Testing",
                "description": "Every single manufactured cooker body and lid is subjected to routine pressure testing prior to packing.",
                "clause_ref": "SIT for IS 2347, Routine Test",
                "criticality": "Critical",
                "capa_recommendation": "Establish a continuous 100% in-line hydraulic proof pressure inspection station before assembly and packaging lines.",
            },
            {
                "id": "PC_SIT_2",
                "pillar": "sit_compliance",
                "title": "Handle Cantilever Load Test Sampling",
                "description": "Handle assembly static load test (100 N downward load with water) performed at 1 per 1,000 units.",
                "clause_ref": "IS 2347 Clause 8.6",
                "criticality": "Major",
                "capa_recommendation": "Fabricate a dedicated handle deflection fixture and document daily sampling in the Mechanical QA Logbook.",
            },

            # 4. Technical Personnel (15%)
            {
                "id": "PC_TP_1",
                "pillar": "technical_personnel",
                "title": "Qualified Quality Testing Head",
                "description": "At least one qualified degree/diploma holder in engineering/science with documented training on IS 2347 test methods.",
                "clause_ref": "BIS Conformity Assessment Reg 2018",
                "criticality": "Major",
                "capa_recommendation": "Designate a qualified Quality Control In-Charge with appointment letter and formal training on BIS SIT procedures.",
            },

            # 5. Non-Conformance Control (10%)
            {
                "id": "PC_NC_1",
                "pillar": "non_conformance",
                "title": "Quarantine Area for Defective Cookers",
                "description": "Physically segregated, locked, red-painted quarantine zone for cookers that fail pressure testing.",
                "clause_ref": "Factory QMS Standards",
                "criticality": "Critical",
                "capa_recommendation": "Demarcate and paint a locked Non-Conforming Products Quarantine Enclosure to prevent mixing rejected cookers with marked stock.",
            },

            # 6. Statutory Records (15%)
            {
                "id": "PC_SR_1",
                "pillar": "statutory_records",
                "title": "Form-VII Annual Production & Marking Ledger",
                "description": "Updated register recording daily production count, ISI marked count, and monthly marking fee calculation.",
                "clause_ref": "Regulation 7(2), Schedule II",
                "criticality": "Major",
                "capa_recommendation": "Implement the standardized BIS Form-VII Daily Production and Marking Fee Register reconciled with GST invoices.",
            },
            {
                "id": "PC_SR_2",
                "pillar": "statutory_records",
                "title": "Embossed ISI Logo & CM/L Number Tooling",
                "description": "Permanent embossing die or laser etching fixture with exact standard mark dimensions and valid CM/L licence number.",
                "clause_ref": "BIS Marking Regulations",
                "criticality": "Critical",
                "capa_recommendation": "Inspect and sharpen embossing tooling to ensure crisp, indelible engraving of the ISI emblem and 7-digit CM/L licence number.",
            },
        ],
    },

    "IS 4151": {
        "standard_number": "IS 4151:2020",
        "product_name": "Protective Helmets for Two-Wheeler Motorcyclists",
        "scheme": "Scheme I (ISI Mark)",
        "items": [
            # 1. Testing Infrastructure
            {
                "id": "HL_TI_1",
                "pillar": "testing_infrastructure",
                "title": "Drop Tower Impact Attenuation Apparatus",
                "description": "Monorail drop tower with triaxial/uniaxial accelerometer, flat and hemispherical steel anvils, calibrated headforms (Size A, E, J, M, O).",
                "clause_ref": "IS 4151 Clause 9.2",
                "criticality": "Critical",
                "capa_recommendation": "Ensure impact attenuation drop test rig accelerometer calibration is verified with reference drop curve within tolerance (peak < 300g).",
            },
            {
                "id": "HL_TI_2",
                "pillar": "testing_infrastructure",
                "title": "Dynamic Chin Strap Extension Tester",
                "description": "Drop mass loading mechanism (10 kg drop mass from 750 mm) with displacement transducer measuring dynamic elongation (< 35 mm).",
                "clause_ref": "IS 4151 Clause 9.3",
                "criticality": "Critical",
                "capa_recommendation": "Calibrate displacement linear sensors on retention test bench and replace worn quick-release jaw clamps.",
            },
            {
                "id": "HL_TI_3",
                "pillar": "testing_infrastructure",
                "title": "Conditioning Chambers (Hot, Cold, UV, Solvent)",
                "description": "Thermal conditioning chambers capable of -10°C, +50°C, water immersion, and solvent treatment prior to impact.",
                "clause_ref": "IS 4151 Clause 8.1",
                "criticality": "Major",
                "capa_recommendation": "Install digital temperature dataloggers with NABL temperature calibration certificates inside environmental chambers.",
            },

            # 2. Raw Materials
            {
                "id": "HL_RM_1",
                "pillar": "raw_materials",
                "title": "Virgin ABS / Polycarbonate Polymer Certificate",
                "description": "Manufacturer test certificates confirming virgin engineering plastic (no regrind in shell) with melt flow index (MFI) and Izod impact certs.",
                "clause_ref": "IS 4151 Clause 5.1",
                "criticality": "Critical",
                "capa_recommendation": "Establish strict incoming resin density and MFI checks to guarantee 0% reground plastic in helmet outer shells.",
            },
            {
                "id": "HL_RM_2",
                "pillar": "raw_materials",
                "title": "EPS Density & Energy Absorption Liner Specs",
                "description": "Expanded Polystyrene (EPS) density verification records (nominal 25 to 45 g/L depending on impact zone).",
                "clause_ref": "IS 4151 Clause 5.2",
                "criticality": "Major",
                "capa_recommendation": "Conduct incoming EPS core density measurements and weigh every molded impact liner batch.",
            },

            # 3. SIT Compliance
            {
                "id": "HL_SIT_1",
                "pillar": "sit_compliance",
                "title": "Batch Impact Sampling (1 in 500 Helmets)",
                "description": "Destructive drop testing conducted at prescribed frequency for each shell size and liner density configuration.",
                "clause_ref": "SIT for IS 4151",
                "criticality": "Critical",
                "capa_recommendation": "Maintain strict compliance with SIT batch sizing: 1 helmet tested destructively per 500 units produced.",
            },

            # 4. Personnel
            {
                "id": "HL_TP_1",
                "pillar": "technical_personnel",
                "title": "Trained Impact Laboratory Technician",
                "description": "Designated technician experienced in helmet headform alignment, accelerometer calibration, and drop height velocity validation.",
                "clause_ref": "BIS Laboratory Scheme",
                "criticality": "Major",
                "capa_recommendation": "Send internal testing personnel for competency certification on vehicle safety equipment testing at ARAI or CIRT.",
            },

            # 5. Non-Conformance
            {
                "id": "HL_NC_1",
                "pillar": "non_conformance",
                "title": "Immediate Crushing / Scrapping of Failed Shells",
                "description": "Procedure and hydraulic crusher to physically destroy and scrap helmets from failed test batches.",
                "clause_ref": "QCO Enforcement Rules",
                "criticality": "Critical",
                "capa_recommendation": "Implement witnessed hydraulic crushing of rejected helmets to ensure non-conforming shells cannot re-enter the supply chain.",
            },

            # 6. Statutory Records
            {
                "id": "HL_SR_1",
                "pillar": "statutory_records",
                "title": "Batch Number & CM/L Marking Traceability",
                "description": "Indelible inner label and outer rear mark showing IS 4151, size in mm, month/year of manufacture, and CM/L number.",
                "clause_ref": "IS 4151 Clause 10",
                "criticality": "Critical",
                "capa_recommendation": "Verify thermal transfer label durability per Clause 10 (resistant to water and petroleum spirit rub test).",
            },
        ],
    },

    "UNIVERSAL": {
        "standard_number": "Scheme I (General)",
        "product_name": "Any BIS Regulated Industrial / Consumer Product",
        "scheme": "Scheme I (ISI Mark)",
        "items": [
            # 1. Testing Infrastructure
            {
                "id": "GEN_TI_1",
                "pillar": "testing_infrastructure",
                "title": "Complete In-House Testing Equipment as per SIT",
                "description": "Factory maintains full in-house testing equipment specified in the relevant BIS Scheme of Inspection and Testing.",
                "clause_ref": "Conformity Assessment Reg 4",
                "criticality": "Critical",
                "capa_recommendation": "Review BIS Scheme of Inspection and Testing (SIT) equipment list and procure all missing mandatory test apparatus.",
            },
            {
                "id": "GEN_TI_2",
                "pillar": "testing_infrastructure",
                "title": "Valid Calibration of All Test Gauges",
                "description": "All measurement instruments and test machines carry valid calibration certificates from NABL accredited calibration laboratories.",
                "clause_ref": "ISO/IEC 17025 / SIT Guidelines",
                "criticality": "Critical",
                "capa_recommendation": "Execute a Master Calibration Schedule ensuring no testing instrument operates with an expired calibration certificate.",
            },

            # 2. Raw Materials
            {
                "id": "GEN_RM_1",
                "pillar": "raw_materials",
                "title": "Inbound Material Inspection & MTC Records",
                "description": "Quality certificates from approved suppliers for each incoming batch with in-house verification testing.",
                "clause_ref": "SIT Raw Material Clause",
                "criticality": "Major",
                "capa_recommendation": "Establish an Incoming Quality Control (IQC) register recording supplier lot numbers, MTC parameters, and acceptance decisions.",
            },

            # 3. SIT Compliance
            {
                "id": "GEN_SIT_1",
                "pillar": "sit_compliance",
                "title": "Adherence to Prescribed Batch Sizing & Sampling",
                "description": "Production lots are divided into designated control units and sampled strictly according to the statutory SIT frequency.",
                "clause_ref": "SIT Sampling Frequency",
                "criticality": "Critical",
                "capa_recommendation": "Align daily production batching strictly with the BIS Control Unit definition and maintain continuous QA testing logs.",
            },

            # 4. Personnel
            {
                "id": "GEN_TP_1",
                "pillar": "technical_personnel",
                "title": "Approved Quality Control Personnel",
                "description": "Competent technical personnel with requisite qualifications approved by BIS for in-house product testing.",
                "clause_ref": "Regulation 4(1)",
                "criticality": "Major",
                "capa_recommendation": "Designate dedicated testing personnel with science/engineering credentials and maintain training logbooks on the standard.",
            },

            # 5. Non-Conformance
            {
                "id": "GEN_NC_1",
                "pillar": "non_conformance",
                "title": "Demarcated Quarantine Area for Rejected Goods",
                "description": "Separate physical area marked in red for holding non-conforming lots with quarantine logbook.",
                "clause_ref": "QMS Framework",
                "criticality": "Critical",
                "capa_recommendation": "Construct and barricade a distinct quarantine holding room with authorized key-access only to prevent accidental dispatch.",
            },

            # 6. Statutory Records
            {
                "id": "GEN_SR_1",
                "pillar": "statutory_records",
                "title": "Form-VII Production & Marking Fee Ledger",
                "description": "Up-to-date Form-VII ledger tracking actual production, units marked with ISI logo, and statutory marking fees.",
                "clause_ref": "Regulation 7(2)",
                "criticality": "Major",
                "capa_recommendation": "Audit and reconcile Form-VII marking records with monthly excise/GST sales filings to ensure zero discrepancy during inspection.",
            },
            {
                "id": "GEN_SR_2",
                "pillar": "statutory_records",
                "title": "Timely Licence Renewal Horizon (Form-VI)",
                "description": "Licence renewal tracking established between 90 and 30 days prior to validity expiration date.",
                "clause_ref": "Regulation 7(1)",
                "criticality": "Major",
                "capa_recommendation": "Set calendar alerts at 90 days prior to expiry to submit Form-VI with CA-certified production return before the 30-day cutoff.",
            },
        ],
    },
}


class AuditService:
    """Service to evaluate factory audit readiness and generate CAPA."""

    def get_checklist(self, standard_key: Optional[str] = None) -> Dict[str, Any]:
        """Fetches the statutory inspection criteria for a given Indian Standard."""
        normalized = (standard_key or "UNIVERSAL").strip().upper()

        if "2347" in normalized or "COOKER" in normalized:
            selected_key = "IS 2347"
        elif "4151" in normalized or "HELMET" in normalized:
            selected_key = "IS 4151"
        else:
            selected_key = "UNIVERSAL"

        data = AUDIT_CHECKLISTS.get(selected_key, AUDIT_CHECKLISTS["UNIVERSAL"])

        return {
            "success": True,
            "standard_key": selected_key,
            "standard_number": data["standard_number"],
            "product_name": data["product_name"],
            "scheme": data["scheme"],
            "pillars": AUDIT_PILLARS,
            "total_items": len(data["items"]),
            "items": data["items"],
        }

    def evaluate_audit(
        self,
        standard_key: Optional[str],
        responses: Dict[str, str],
        factory_name: Optional[str] = None,
        factory_location: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Evaluates checklist responses, calculates scores, and compiles CAPA."""
        checklist_data = self.get_checklist(standard_key)
        items = checklist_data["items"]
        pillars_map = {p["id"]: p for p in AUDIT_PILLARS}

        pillar_scores: Dict[str, Dict[str, Any]] = {
            p["id"]: {
                "id": p["id"],
                "name": p["name"],
                "weight": p["weight"],
                "total_points": 0.0,
                "earned_points": 0.0,
                "item_count": 0,
                "score_percent": 0.0,
            }
            for p in AUDIT_PILLARS
        }

        capa_items: List[Dict[str, Any]] = []

        for item in items:
            item_id = item["id"]
            pillar_id = item["pillar"]
            resp = responses.get(item_id, "no").lower().strip()

            if resp == "na":
                continue  # Excluded from calculation

            item_weight = 10.0
            pillar_scores[pillar_id]["total_points"] += item_weight
            pillar_scores[pillar_id]["item_count"] += 1

            if resp == "yes":
                pillar_scores[pillar_id]["earned_points"] += item_weight
            elif resp == "partial":
                pillar_scores[pillar_id]["earned_points"] += item_weight * 0.5
                capa_items.append({
                    "item_id": item_id,
                    "title": item["title"],
                    "pillar": pillars_map[pillar_id]["name"],
                    "status": "Partially Conforming",
                    "clause_ref": item["clause_ref"],
                    "criticality": item["criticality"],
                    "deficiency": f"Partial compliance noted: {item['description']}",
                    "recommendation": item["capa_recommendation"],
                    "timeline_days": 15 if item["criticality"] == "Critical" else 30,
                })
            else:  # "no"
                capa_items.append({
                    "item_id": item_id,
                    "title": item["title"],
                    "pillar": pillars_map[pillar_id]["name"],
                    "status": "Non-Conforming",
                    "clause_ref": item["clause_ref"],
                    "criticality": item["criticality"],
                    "deficiency": f"Deficiency identified: {item['description']}",
                    "recommendation": item["capa_recommendation"],
                    "timeline_days": 7 if item["criticality"] == "Critical" else 21,
                })

        # Calculate section percentages & total weighted score
        overall_weighted_score = 0.0
        total_effective_weight = 0.0

        for p_id, p_data in pillar_scores.items():
            if p_data["total_points"] > 0:
                p_pct = (p_data["earned_points"] / p_data["total_points"]) * 100.0
                p_data["score_percent"] = round(p_pct, 1)
                overall_weighted_score += (p_pct * p_data["weight"]) / 100.0
                total_effective_weight += p_data["weight"]
            else:
                p_data["score_percent"] = 100.0

        if total_effective_weight > 0:
            final_score = round((overall_weighted_score / total_effective_weight) * 100.0, 1)
        else:
            final_score = 0.0

        # Determine Audit Readiness Rating
        critical_deficiencies = sum(1 for c in capa_items if c["criticality"] == "Critical")

        if final_score >= 85 and critical_deficiencies == 0:
            rating = "AUDIT READY"
            rating_color = "#16a34a"  # Green
            rating_desc = "Low Risk of Rejection. Factory quality assurance meets statutory BIS inspection criteria."
        elif final_score >= 65 and critical_deficiencies <= 1:
            rating = "CONDITIONAL PASS"
            rating_color = "#ea580c"  # Amber
            rating_desc = "Moderate Risk. Corrective Action Plan (CAPA) must be executed to close identified gaps before inspection."
        else:
            rating = "HIGH RISK OF FAILURE"
            rating_color = "#dc2626"  # Red
            rating_desc = "High Risk of Discrepancy Notice / Stop-Marking Hazard. Critical statutory deficiencies detected."

        # Sort CAPA: Critical first, then Major, then Minor
        severity_order = {"Critical": 0, "Major": 1, "Minor": 2}
        capa_items.sort(key=lambda x: severity_order.get(x["criticality"], 9))

        return {
            "success": True,
            "standard_number": checklist_data["standard_number"],
            "product_name": checklist_data["product_name"],
            "factory_name": factory_name or "Factory Quality Management",
            "factory_location": factory_location or "Manufacturing Facility",
            "overall_score": final_score,
            "rating": rating,
            "rating_color": rating_color,
            "rating_description": rating_desc,
            "critical_deficiencies_count": critical_deficiencies,
            "total_deficiencies_count": len(capa_items),
            "pillars_breakdown": list(pillar_scores.values()),
            "corrective_action_plan": capa_items,
        }


audit_service = AuditService()
