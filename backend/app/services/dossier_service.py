"""
BIS Application Dossier Service — Manakonline e-BIS Form-V Generator
Encodes statutory application requirements under Regulation 4 of the
BIS (Conformity Assessment) Regulations, 2018 for Scheme-I (ISI Mark).
"""

from typing import Dict, Any, List, Optional
from datetime import datetime

# Master Standard-Specific Machinery, Testing Instruments, and Raw Material Templates
STANDARDS_DOSSIER_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "IS 2347": {
        "standard_number": "IS 2347:2017",
        "product_name": "Domestic Pressure Cookers",
        "division_council": "Mechanical Engineering Division (MED 32)",
        "certification_scheme": "Scheme-I (Standard Mark / ISI)",
        "applicable_qco": "Domestic Pressure Cookers (Quality Control) Order, 2020",
        "raw_materials": [
            {
                "material_name": "Aluminium Alloy Sheet / Strip",
                "specification": "IS 21:1992 (Grade 19000 / 31000)",
                "mandatory_test": "Chemical composition & tensile strength",
                "test_certificate_required": True,
            },
            {
                "material_name": "Stainless Steel Sheet / Plate",
                "specification": "IS 6911:2017 (Grade 304 / 316 Food Grade)",
                "mandatory_test": "Intergranular corrosion & XRF grade verification",
                "test_certificate_required": True,
            },
            {
                "material_name": "Rubber Sealing Gaskets",
                "specification": "IS 7466:1994 (Food Contact Grade)",
                "mandatory_test": "Total extractives, elongation at break, compression set",
                "test_certificate_required": True,
            },
            {
                "material_name": "Fusible Safety Plugs / Alloys",
                "specification": "IS 2347:2017 Clause 6.4",
                "mandatory_test": "Melting point verification (120°C - 135°C)",
                "test_certificate_required": True,
            },
        ],
        "mandatory_machinery": [
            {
                "operation": "Body & Lid Blanking & Drawing",
                "machinery_name": "Hydraulic Deep Draw Press (250-400 Tonnes)",
                "installed_capacity": "1,500 units/day",
                "power_hp": "35 HP",
            },
            {
                "operation": "Trimming & Bead Rolling",
                "machinery_name": "Heavy Duty Edge Trimming & Spinning Lathe",
                "installed_capacity": "2,000 units/day",
                "power_hp": "7.5 HP",
            },
            {
                "operation": "Surface Treatment / Hard Anodizing",
                "machinery_name": "Electrolytic Hard Anodizing Tank with Chiller Unit",
                "installed_capacity": "1,200 units/day",
                "power_hp": "50 HP",
            },
            {
                "operation": "Handle Bracket & Stud Welding",
                "machinery_name": "Capacitor Discharge Stud Welding Machine",
                "installed_capacity": "2,500 units/day",
                "power_hp": "5 KVA",
            },
            {
                "operation": "Lid Interlocking & Final Assembly",
                "machinery_name": "Pneumatic Riveting Machine & Assembly Fixture",
                "installed_capacity": "1,800 units/day",
                "power_hp": "3 HP",
            },
        ],
        "inhouse_testing_equipment": [
            {
                "parameter": "Proof Hydrostatic Pressure Test (Clause 8.1)",
                "equipment_name": "Hydrostatic Pressure Test Rig with Calibrated Digital Gauge",
                "range_capacity": "0 - 10 kg/cm² (Accuracy Class 0.5)",
                "calibration_frequency": "Every 6 Months (NABL Traceable)",
                "least_count": "0.05 kg/cm²",
            },
            {
                "parameter": "Hydraulic Bursting Pressure Test (Clause 8.2)",
                "equipment_name": "High-Pressure Hydraulic Burst Test Chamber with Shatter Shield",
                "range_capacity": "0 - 25 kg/cm²",
                "calibration_frequency": "Every 12 Months",
                "least_count": "0.1 kg/cm²",
            },
            {
                "parameter": "Operating Pressure & Pressure Relief (Clause 8.3)",
                "equipment_name": "Steam Test Bench with Controlled Boiling Source & Manometer",
                "range_capacity": "0 - 2.5 kg/cm² (Steam Rated)",
                "calibration_frequency": "Every 6 Months",
                "least_count": "0.01 kg/cm²",
            },
            {
                "parameter": "Safety Release Device Blow-off (Clause 8.4)",
                "equipment_name": "Compressed Air Test Fixture with Pressure Transducer",
                "range_capacity": "0 - 5 kg/cm²",
                "calibration_frequency": "Every 6 Months",
                "least_count": "0.02 kg/cm²",
            },
            {
                "parameter": "Wall Thickness & Dimension Checks",
                "equipment_name": "Digital Vernier Caliper & Ball-Anvil Micrometer",
                "range_capacity": "0 - 300 mm & 0 - 25 mm",
                "calibration_frequency": "Every 12 Months",
                "least_count": "0.01 mm / 0.001 mm",
            },
        ],
        "technical_personnel_min_criteria": "Graduate in Mechanical/Chemical Engineering or Diploma with minimum 3 years factory testing experience.",
    },
    "IS 4151": {
        "standard_number": "IS 4151:2020",
        "product_name": "Protective Helmets for Two-Wheeler Riders",
        "division_council": "Mechanical Engineering Division (MED 26)",
        "certification_scheme": "Scheme-I (Standard Mark / ISI)",
        "applicable_qco": "Helmets for Riders of Two-Wheeler Motor Vehicles (Quality Control) Order, 2020",
        "raw_materials": [
            {
                "material_name": "Outer Shell Thermoplastic Granules (ABS / Polycarbonate)",
                "specification": "Virgin High-Impact Grade ABS / Polycarbonate",
                "mandatory_test": "Melt Flow Index (MFI) & Izod Impact Strength",
                "test_certificate_required": True,
            },
            {
                "material_name": "Expanded Polystyrene (EPS) Liner Beads",
                "specification": "IS 4151:2020 Clause 5.2 (High Energy Absorbing)",
                "mandatory_test": "Density (20 - 45 kg/m³) & Compressive Resistance",
                "test_certificate_required": True,
            },
            {
                "material_name": "Retention Webbing & Buckle Material",
                "specification": "IS 4151:2020 Clause 6.1 (Nylon / Polyester)",
                "mandatory_test": "Breaking strength (>3 kN) & Quick-release slippage",
                "test_certificate_required": True,
            },
            {
                "material_name": "Visor Sheet (Polycarbonate)",
                "specification": "IS 9973 / IS 4151:2020 Clause 7 (Optical Grade)",
                "mandatory_test": "Luminous transmittance (>85%) & Impact deflection",
                "test_certificate_required": True,
            },
        ],
        "mandatory_machinery": [
            {
                "operation": "Outer Shell Moulding",
                "machinery_name": "Automatic Injection Moulding Machine (350-500 Tonnes)",
                "installed_capacity": "1,000 shells/day",
                "power_hp": "45 HP",
            },
            {
                "operation": "EPS Liner Pre-foaming & Shape Moulding",
                "machinery_name": "EPS Shape Moulding Machine with Steam Boiler Unit",
                "installed_capacity": "1,200 liners/day",
                "power_hp": "30 HP",
            },
            {
                "operation": "Paint & Clear Coat Application",
                "machinery_name": "Pressurized Dust-Free Spray Painting Booth & Baking Oven",
                "installed_capacity": "800 units/day",
                "power_hp": "15 HP",
            },
            {
                "operation": "Retention System Riveting",
                "machinery_name": "Pneumatic Orbital Riveter for Chin Strap Anchorages",
                "installed_capacity": "1,500 units/day",
                "power_hp": "2 HP",
            },
            {
                "operation": "Visor Laser Trimming & Fitting",
                "machinery_name": "CNC Visor Cutting Machine & Pivot Assembly Fixture",
                "installed_capacity": "1,500 units/day",
                "power_hp": "5 HP",
            },
        ],
        "inhouse_testing_equipment": [
            {
                "parameter": "Shock Absorption / Impact Attenuation Test (Clause 9.2)",
                "equipment_name": "Guided Free-Fall Impact Test Rig with Triaxial Accelerometer & Headforms",
                "range_capacity": "0 - 500 g Acceleration Measurement (Flat & Kerbstone Anvils)",
                "calibration_frequency": "Every 6 Months (Accelerometer NABL Calibrated)",
                "least_count": "0.1 g",
            },
            {
                "parameter": "Retention System Dynamic Test (Clause 9.3)",
                "equipment_name": "Dynamic Webbing Elongation & Drop Weight Rig (10 kg drop)",
                "range_capacity": "0 - 150 mm Elongation Transducer",
                "calibration_frequency": "Every 12 Months",
                "least_count": "0.1 mm",
            },
            {
                "parameter": "Penetration Resistance Test (Clause 9.4)",
                "equipment_name": "Conical Striker Free-Fall Rig (3 kg cone, 60° angle)",
                "range_capacity": "1 - 3 Metres Drop Height",
                "calibration_frequency": "Every 12 Months",
                "least_count": "1 mm",
            },
            {
                "parameter": "Environmental Conditioning Chambers (Clause 9.1)",
                "equipment_name": "Thermal Chamber (+50°C), Low Temp Chamber (-20°C), Water Immersion Tank",
                "range_capacity": "-30°C to +80°C with digital PID controller",
                "calibration_frequency": "Every 6 Months",
                "least_count": "0.1°C",
            },
            {
                "parameter": "Visor Luminous Transmittance & Optical Clarity",
                "equipment_name": "Spectrophotometer / Lux Optical Bench",
                "range_capacity": "0 - 100% Luminous Transmittance",
                "calibration_frequency": "Every 12 Months",
                "least_count": "0.1%",
            },
        ],
        "technical_personnel_min_criteria": "Degree in Polymer Science / Mechanical Engineering with demonstrated training on Triaxial Impact Testing.",
    },
    "IS 269": {
        "standard_number": "IS 269:2015",
        "product_name": "Ordinary Portland Cement (33, 43, 53 Grade)",
        "division_council": "Civil Engineering Division (CED 2)",
        "certification_scheme": "Scheme-I (Standard Mark / ISI)",
        "applicable_qco": "Cement (Quality Control) Order, 2003",
        "raw_materials": [
            {
                "material_name": "Limestone (CaCO3)",
                "specification": "Captive Mining / Procurement Grade (>80% CaCO3)",
                "mandatory_test": "CaO, SiO2, Al2O3, Fe2O3 chemical titration & XRF",
                "test_certificate_required": True,
            },
            {
                "material_name": "Mineral Gypsum (CaSO4.2H2O)",
                "specification": "IS 1290 (Purity >70%)",
                "mandatory_test": "SO3 content & purity determination",
                "test_certificate_required": True,
            },
            {
                "material_name": "Performance Improver (Fly Ash / Slag)",
                "specification": "IS 3812 (Part 1) / IS 12089 (max 5% as per IS 269)",
                "mandatory_test": "Fineness & moisture content",
                "test_certificate_required": True,
            },
        ],
        "mandatory_machinery": [
            {
                "operation": "Clinker Grinding & Cement Milling",
                "machinery_name": "Closed Circuit Ball Mill with High Efficiency Dynamic Separator",
                "installed_capacity": "100 Tonnes/hour",
                "power_hp": "2,500 HP",
            },
            {
                "operation": "Gypsum & Clinker Proportioning",
                "machinery_name": "Gravimetric Weigh Feeders with PLC Control",
                "installed_capacity": "120 Tonnes/hour",
                "power_hp": "15 HP",
            },
            {
                "operation": "Automated Packing & Marking",
                "machinery_name": "Electronic Rotary Packer with ISI Marking Printer",
                "installed_capacity": "120 Tonnes/hour (2,400 bags/hour)",
                "power_hp": "45 HP",
            },
        ],
        "inhouse_testing_equipment": [
            {
                "parameter": "Compressive Strength (3, 7, 28 Days) (IS 4031 Part 6)",
                "equipment_name": "Digital Compression Testing Machine (CTM) with Pacing Rate Indicator",
                "range_capacity": "0 - 2,000 kN (Accuracy Class 1.0)",
                "calibration_frequency": "Every 6 Months (NABL Certified Proving Ring)",
                "least_count": "0.1 kN",
            },
            {
                "parameter": "Fineness by Specific Surface (IS 4031 Part 2)",
                "equipment_name": "Blaine's Air Permeability Apparatus with Manometer Liquid",
                "range_capacity": "225 - 500 m²/kg (NIST Standard Reference Cement 114q calibrated)",
                "calibration_frequency": "Every Month Reference Check",
                "least_count": "1 m²/kg",
            },
            {
                "parameter": "Standard Consistency & Setting Times (IS 4031 Part 4 & 5)",
                "equipment_name": "Vicat Apparatus with Initial and Final Needles & Plunger",
                "range_capacity": "0 - 50 mm Scale",
                "calibration_frequency": "Every 12 Months",
                "least_count": "1 mm",
            },
            {
                "parameter": "Soundness by Le-Chatelier & Autoclave (IS 4031 Part 3)",
                "equipment_name": "Le-Chatelier Water Bath with Split Cylinder Moulds & High Pressure Autoclave",
                "range_capacity": "Room Temp to Boiling & 21 kg/cm² Steam Pressure",
                "calibration_frequency": "Every 6 Months",
                "least_count": "0.5 mm / 0.1 kg/cm²",
            },
            {
                "parameter": "Complete Chemical Analysis (IS 4032)",
                "equipment_name": "Muffle Furnace (1,000°C), Analytical Digital Balance (0.1 mg), Flame Photometer",
                "range_capacity": "Loss on Ignition, Insoluble Residue, SO3, Magnesia, Alkali",
                "calibration_frequency": "Every 6 Months",
                "least_count": "0.0001 g",
            },
        ],
        "technical_personnel_min_criteria": "M.Sc. / B.Sc. Chemistry or Chemical Engineering graduate with minimum 2 years cement testing laboratory experience.",
    },
    "UNIVERSAL": {
        "standard_number": "Scheme-I Baseline",
        "product_name": "Universal Industrial Product (Scheme-I ISI Mark)",
        "division_council": "General Bureau of Indian Standards Quality Council",
        "certification_scheme": "Scheme-I (Standard Mark / ISI)",
        "applicable_qco": "BIS Conformity Assessment Regulations, 2018 (Regulation 4)",
        "raw_materials": [
            {
                "material_name": "Primary Engineering Raw Material",
                "specification": "Applicable Indian Standard / OEM Specification",
                "mandatory_test": "Chemical composition, mechanical properties, dimension tolerance",
                "test_certificate_required": True,
            },
            {
                "material_name": "Consumables & Sub-Components",
                "specification": "Conforming to statutory environmental & safety limits",
                "mandatory_test": "Incoming inspection against Mill Test Certificate",
                "test_certificate_required": True,
            },
        ],
        "mandatory_machinery": [
            {
                "operation": "Primary Fabrication / Forming",
                "machinery_name": "Production Processing Machine with calibrated speed/feed indicators",
                "installed_capacity": "As per rated nameplate",
                "power_hp": "Industrial 3-Phase",
            },
            {
                "operation": "Final Finishing / Treatment",
                "machinery_name": "Finishing & Coating Installation with environmental controls",
                "installed_capacity": "Matched to assembly rate",
                "power_hp": "Industrial 3-Phase",
            },
            {
                "operation": "ISI Embossing / Laser Marking",
                "machinery_name": "Automated ISI Mark & CML Number Stamper / Laser Marker",
                "installed_capacity": "100% of finished production",
                "power_hp": "Single Phase",
            },
        ],
        "inhouse_testing_equipment": [
            {
                "parameter": "100% Routine Quality Verification (SIT Schedule)",
                "equipment_name": "Primary In-house Testing Rig specified in Standard Manual",
                "range_capacity": "Full test range with 2x safety margin",
                "calibration_frequency": "Every 6 Months (NABL Traceable)",
                "least_count": "Statutorily prescribed resolution",
            },
            {
                "parameter": "Dimensional & Metrology Verification",
                "equipment_name": "Calibrated Digital Calipers, Micrometers, and Height Gauges",
                "range_capacity": "0 - 300 mm",
                "calibration_frequency": "Every 12 Months",
                "least_count": "0.01 mm",
            },
        ],
        "technical_personnel_min_criteria": "Qualified Quality Control Incharge holding Degree/Diploma in relevant discipline with knowledge of BIS Scheme of Inspection and Testing.",
    },
}

# Standard Statutory Enclosures required for Form-V Application
STATUTORY_ENCLOSURES_CHECKLIST: List[Dict[str, Any]] = [
    {
        "id": "doc_factory_layout",
        "code": "DOC-01",
        "title": "Factory Layout Plan & Site Location Map",
        "description": "Scaled drawing indicating manufacturing shop floor, raw material storage, quarantine zone, in-house lab, and finished goods warehouse.",
        "mandatory": True,
    },
    {
        "id": "doc_electricity_bill",
        "code": "DOC-02",
        "title": "Electricity Bill & Connected Industrial Load Sanction",
        "description": "Latest utility bill and power corporation sanction letter demonstrating adequate industrial electric supply for plant machinery.",
        "mandatory": True,
    },
    {
        "id": "doc_udyam_msme",
        "code": "DOC-03",
        "title": "MSME Udyam Registration / Industrial Licence / ROC",
        "description": "Proof of manufacturing enterprise status (entitling 50% concession on application fee for Micro and Small enterprises).",
        "mandatory": True,
    },
    {
        "id": "doc_trademark_reg",
        "code": "DOC-04",
        "title": "Brand Name / Trademark Registration or TM-A Application",
        "description": "Trademark certificate from Controller General of Patents, Designs and Trade Marks for the brand name to be marked with the ISI logo.",
        "mandatory": True,
    },
    {
        "id": "doc_flow_chart",
        "code": "DOC-05",
        "title": "Manufacturing Process Flow Chart & Stage Inspection Plan",
        "description": "Detailed process flow depicting each production operation, intermediate inspection stages, and scrap rejection points.",
        "mandatory": True,
    },
    {
        "id": "doc_calibration_certs",
        "code": "DOC-06",
        "title": "NABL Traceable Calibration Certificates of Test Equipment",
        "description": "Valid calibration certificates for all in-house testing instruments from an ISO/IEC 17025 accredited laboratory.",
        "mandatory": True,
    },
    {
        "id": "doc_raw_material_certs",
        "code": "DOC-07",
        "title": "Raw Material Test Certificates (MTC / COA) from Suppliers",
        "description": "Batch chemical and mechanical test certificates for raw materials procured from standard-compliant suppliers.",
        "mandatory": True,
    },
    {
        "id": "doc_qc_cv",
        "code": "DOC-08",
        "title": "CV & Degree Certificates of Quality Control Incharge",
        "description": "Curriculum vitae, technical educational credentials, and appointment letter of the full-time dedicated factory quality manager.",
        "mandatory": True,
    },
]


def get_dossier_template(standard: str, form_type: str = "Form-V") -> Dict[str, Any]:
    """
    Returns the pre-filled Form-V application structure and equipment schedule
    for the requested Indian Standard.
    """
    std_key = standard.upper().strip()
    match_key = "UNIVERSAL"
    for key in STANDARDS_DOSSIER_TEMPLATES:
        if key in std_key or std_key in key:
            match_key = key
            break

    template_data = STANDARDS_DOSSIER_TEMPLATES[match_key]

    return {
        "success": True,
        "form_type": form_type,
        "regulation": "Regulation 4, Bureau of Indian Standards (Conformity Assessment) Regulations, 2018",
        "standard_key": match_key,
        "standard_number": template_data["standard_number"],
        "product_name": template_data["product_name"],
        "division_council": template_data["division_council"],
        "certification_scheme": template_data["certification_scheme"],
        "applicable_qco": template_data["applicable_qco"],
        "technical_personnel_min_criteria": template_data["technical_personnel_min_criteria"],
        "raw_materials": template_data["raw_materials"],
        "mandatory_machinery": template_data["mandatory_machinery"],
        "inhouse_testing_equipment": template_data["inhouse_testing_equipment"],
        "statutory_enclosures": STATUTORY_ENCLOSURES_CHECKLIST,
        "default_factory_profile": {
            "applicant_name": "Apex Quality Products Private Limited",
            "factory_address": "Plot No. 42-B, Phase-II, Industrial Growth Centre, Sahibabad, Ghaziabad, UP - 201010",
            "registered_office": "104, Nariman Point Commercial Tower, Mumbai, MH - 400021",
            "gstin": "09AAACA1234F1Z8",
            "msme_udyam": "UDYAM-UP-28-0012345 (Small Enterprise)",
            "connected_load": "125 KVA / 3-Phase Industrial",
            "authorized_signatory": "Rajesh Kumar Sharma (Director - Quality Assurance)",
            "contact_email": "compliance@apexquality.in",
            "contact_phone": "+91 98100 12345",
            "brand_names": "APEX, SURECOOK",
            "varieties_covered": "Standard, Anodized, Induction Base (Sizes: 3L, 5L, 7.5L)",
            "qc_incharge_name": "Er. Vikramaditya Sen",
            "qc_incharge_qualification": "B.Tech Mechanical Engineering, 7 Years Experience in Pressure Vessel QA",
        },
    }


def validate_dossier_application(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates applicant dossier completeness, computes readiness percentage,
    and returns missing regulatory disclosures or required attachments.
    """
    factory_profile = payload.get("factory_profile", {})
    machinery = payload.get("machinery", [])
    testing_equipment = payload.get("testing_equipment", [])
    enclosures = payload.get("enclosures", {})
    standard = payload.get("standard", "UNIVERSAL")

    total_checks = 0
    passed_checks = 0
    missing_items: List[Dict[str, str]] = []

    # 1. Profile Checks (Weight: 20%)
    profile_required = [
        ("applicant_name", "Applicant Legal Entity Name"),
        ("factory_address", "Complete Physical Factory Address"),
        ("gstin", "GSTIN Registration Number"),
        ("connected_load", "Connected Industrial Power Load"),
        ("authorized_signatory", "Authorized Signatory Name & Designation"),
        ("brand_names", "Brand Name / Trademark"),
        ("qc_incharge_name", "Quality Control Incharge Full Name"),
        ("qc_incharge_qualification", "QC Incharge Technical Qualifications"),
    ]

    for field, label in profile_required:
        total_checks += 1
        val = str(factory_profile.get(field, "")).strip()
        if val and len(val) > 2:
            passed_checks += 1
        else:
            missing_items.append({
                "section": "Applicant Profile",
                "item": label,
                "severity": "High",
                "remedy": f"Provide valid {label} in Section 1 of Form-V.",
            })

    # 2. Manufacturing Machinery Checks (Weight: 25%)
    total_checks += 3
    if len(machinery) >= 3:
        passed_checks += 3
    elif len(machinery) > 0:
        passed_checks += 1
        missing_items.append({
            "section": "Manufacturing Machinery",
            "item": "Inadequate Machine Schedule",
            "severity": "Critical",
            "remedy": "BIS requires full-line equipment from raw material forming to final ISI marking.",
        })
    else:
        missing_items.append({
            "section": "Manufacturing Machinery",
            "item": "Zero Machinery Declared",
            "severity": "Critical",
            "remedy": "Declare all installed production machinery with horsepower and daily capacity.",
        })

    # 3. Testing Equipment Checks (Weight: 30%)
    total_checks += 4
    if len(testing_equipment) >= 4:
        passed_checks += 4
    elif len(testing_equipment) >= 2:
        passed_checks += 2
        missing_items.append({
            "section": "In-house Laboratory Equipment",
            "item": "Incomplete Test Instruments",
            "severity": "Critical",
            "remedy": "All statutory routine and routine-acceptance tests mandated by the SIT must have dedicated in-house equipment.",
        })
    else:
        missing_items.append({
            "section": "In-house Laboratory Equipment",
            "item": "Missing In-house Lab Equipment",
            "severity": "Critical",
            "remedy": "BIS cannot grant a licence without a fully operational in-house testing facility.",
        })

    # 4. Statutory Enclosures Verification (Weight: 25%)
    for enc in STATUTORY_ENCLOSURES_CHECKLIST:
        total_checks += 1
        is_attached = enclosures.get(enc["id"]) is True or enclosures.get(enc["id"]) == "yes"
        if is_attached:
            passed_checks += 1
        else:
            missing_items.append({
                "section": "Statutory Enclosures",
                "item": enc["title"],
                "severity": "Critical" if enc["mandatory"] else "Medium",
                "remedy": f"Attach valid {enc['title']} ({enc['description'][:60]}...).",
            })

    completeness_score = round((passed_checks / max(total_checks, 1)) * 100, 1)

    if completeness_score >= 90 and len([m for m in missing_items if m["severity"] == "Critical"]) == 0:
        readiness_status = "READY FOR MANAKONLINE SUBMISSION"
        status_color = "#16a34a"
        status_description = "All statutory sections, machinery schedules, testing instruments, and mandatory enclosures are verified. Ready to upload on manakonline.in."
    elif completeness_score >= 65:
        readiness_status = "PARTIAL — GAPS IDENTIFIED"
        status_color = "#ea580c"
        status_description = "Application contains preliminary particulars, but critical statutory test instruments or attachments remain unverified."
    else:
        readiness_status = "INCOMPLETE — HIGH RISK OF REJECTION"
        status_color = "#dc2626"
        status_description = "Essential manufacturing machinery, laboratory instruments, or statutory enclosures are missing. Rejection by BIS scrutiny officer is certain."

    # Unique Form-V Dossier Tracking Number
    now = datetime.now()
    dossier_ref = f"BIS-DOS-{now.strftime('%Y%m%d')}-{standard.replace(' ', '').replace(':', '')[:6]}-{abs(hash(factory_profile.get('applicant_name', '')))%10000:04d}"

    return {
        "success": True,
        "dossier_reference": dossier_ref,
        "completeness_score": completeness_score,
        "readiness_status": readiness_status,
        "status_color": status_color,
        "status_description": status_description,
        "total_checks": total_checks,
        "passed_checks": passed_checks,
        "missing_items": missing_items,
        "critical_gaps_count": len([m for m in missing_items if m["severity"] == "Critical"]),
        "verified_at": now.isoformat(),
    }
