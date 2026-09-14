"""Accredited Laboratory Network & Test Parameter Intelligence Layer.

Connects Indian Standards to:
1. Mandatory physical, chemical, safety, and microbiological test parameters.
2. Sample quantity and packaging requirements for testing.
3. Estimated turnaround time (TAT).
4. Accredited testing facilities (BIS In-house Central/Regional labs + NABL LRS recognized labs).
"""

import re
import logging
from typing import Dict, List, Optional, Any
from app.schemas.chat import LabFacility, TestParameter, TestingAndLabInfo

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 1. BIS IN-HOUSE & NATIONAL APEX LABORATORIES DIRECTORY
# ---------------------------------------------------------------------------
BIS_LABORATORIES_NETWORK: List[LabFacility] = [
    LabFacility(
        lab_name="BIS Central Laboratory (CL Sahibabad)",
        location="Sahibabad Industrial Area, Ghaziabad (Uttar Pradesh)",
        lab_type="BIS Central Lab",
        accreditation="ISO/IEC 17025 (NABL) & BIS National Apex Laboratory",
        contact_info="cl@bis.gov.in • Plot No. 20/9, Site IV, Sahibabad, Ghaziabad 201010",
    ),
    LabFacility(
        lab_name="BIS Western Regional Laboratory (WRL Mumbai)",
        location="Andheri (East), Mumbai (Maharashtra)",
        lab_type="BIS Regional Lab",
        accreditation="ISO/IEC 17025 (NABL)",
        contact_info="wrl@bis.gov.in • Manakalaya, E9 MIDC, Andheri East, Mumbai 400093",
    ),
    LabFacility(
        lab_name="BIS Southern Regional Laboratory (SRL Chennai)",
        location="Taramani, Chennai (Tamil Nadu)",
        lab_type="BIS Regional Lab",
        accreditation="ISO/IEC 17025 (NABL)",
        contact_info="srl@bis.gov.in • CIT Campus, IV Cross Road, Taramani, Chennai 600113",
    ),
    LabFacility(
        lab_name="BIS Eastern Regional Laboratory (ERL Kolkata)",
        location="Salt Lake, Kolkata (West Bengal)",
        lab_type="BIS Regional Lab",
        accreditation="ISO/IEC 17025 (NABL)",
        contact_info="erl@bis.gov.in • 1/14 C.I.T. Scheme VII M, Salt Lake, Kolkata 700054",
    ),
    LabFacility(
        lab_name="BIS Northern Regional Laboratory (NRL Mohali)",
        location="SAS Nagar, Mohali (Punjab / Chandigarh)",
        lab_type="BIS Regional Lab",
        accreditation="ISO/IEC 17025 (NABL)",
        contact_info="nrl@bis.gov.in • Plot No. 4A, Sector 27B, Mohali 160019",
    ),
    LabFacility(
        lab_name="BIS Branch Laboratory Bangalore",
        location="Peenya Industrial Area, Bangalore (Karnataka)",
        lab_type="BIS Branch Lab",
        accreditation="ISO/IEC 17025 (NABL)",
        contact_info="bnbo@bis.gov.in • Peenya, Bangalore 560058",
    ),
    LabFacility(
        lab_name="BIS Branch Laboratory Patna",
        location="Patliputra Industrial Area, Patna (Bihar)",
        lab_type="BIS Branch Lab",
        accreditation="ISO/IEC 17025 (NABL)",
        contact_info="pbo@bis.gov.in • Patliputra, Patna 800013",
    ),
    LabFacility(
        lab_name="BIS Branch Laboratory Guwahati",
        location="Panjabari, Guwahati (Assam)",
        lab_type="BIS Branch Lab",
        accreditation="ISO/IEC 17025 (NABL)",
        contact_info="gbo@bis.gov.in • Guwahati 781037",
    ),
]


# ---------------------------------------------------------------------------
# 2. STANDARDS TESTING REGISTRY & ACCREDITED LABORATORIES
# ---------------------------------------------------------------------------
TESTING_REGISTRY: Dict[str, Dict[str, Any]] = {
    # 1. TOILET SOAP
    "IS 2888": {
        "standard_number": "IS 2888:2004",
        "product_name": "Toilet Soap",
        "sample_requirements": "6 commercial cakes in intact manufacturer retail packaging (minimum 600g total net mass).",
        "estimated_turnaround": "5 - 7 working days",
        "critical_parameters": [
            TestParameter(
                parameter_name="Total Fatty Matter (TFM)",
                test_method="IS 2888 Table 1, Item (i) / Annex A",
                specification_limit="Type 1: Min 76.0% by mass; Type 2: Min 70.0%; Type 3: Min 60.0%",
                criticality="Mandatory Quality Grade",
            ),
            TestParameter(
                parameter_name="Matter Insoluble in Alcohol",
                test_method="IS 2888 Table 1, Item (iii) / Annex C",
                specification_limit="Type 1: Max 2.5% by mass; Type 2: Max 5.0%; Type 3: Max 10.0%",
                criticality="Key Quality",
            ),
            TestParameter(
                parameter_name="Free Caustic Alkali",
                test_method="IS 2888 Table 1, Item (iv) / Annex D",
                specification_limit="Max 0.05% by mass (expressed as NaOH)",
                criticality="Safety / Skin Irritation",
            ),
            TestParameter(
                parameter_name="Moisture and Volatile Matter at 105°C",
                test_method="IS 2888 Table 1, Item (ii) / Annex B",
                specification_limit="Max 22.0% by mass",
                criticality="Key Quality",
            ),
            TestParameter(
                parameter_name="Rosin Acids & Synthetic Surface Active Agents",
                test_method="IS 2888 Table 1, Item (vi) & (vii)",
                specification_limit="Rosin: Nil (Type 1); Synthetic surfactants: Nil",
                criticality="Mandatory Purity",
            ),
        ],
        "recognized_laboratories": [
            BIS_LABORATORIES_NETWORK[0],  # Central Lab Sahibabad
            BIS_LABORATORIES_NETWORK[1],  # WRL Mumbai
            LabFacility(
                lab_name="Shriram Institute for Industrial Research",
                location="Delhi & Bangalore",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="NABL Accredited / BIS Recognized Lab (LRS Scheme)",
                contact_info="19 University Road, Delhi 110007 • sirdl@shriraminstitute.org",
            ),
            LabFacility(
                lab_name="National Test House (NTH Alipore)",
                location="Alipore, Kolkata (West Bengal)",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="Central Govt Apex NABL Laboratory",
                contact_info="11/1 Judges Court Road, Alipore, Kolkata 700027",
            ),
            LabFacility(
                lab_name="SGS India Pvt. Ltd.",
                location="Gurgaon (Haryana) & Bangalore (Karnataka)",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="ISO/IEC 17025 Accredited Commercial Testing Facility",
                contact_info="Plot No. 250, Udyog Vihar Phase IV, Gurgaon 122015",
            ),
        ],
    },

    # 2. DOMESTIC PRESSURE COOKERS
    "IS 2347": {
        "standard_number": "IS 2347:2017",
        "product_name": "Domestic Pressure Cooker",
        "sample_requirements": "3 complete pressure cookers with lids, gaskets, and operating weight valves.",
        "estimated_turnaround": "7 - 10 working days",
        "critical_parameters": [
            TestParameter(
                parameter_name="Hydraulic Proof Pressure Test",
                test_method="IS 2347 Clause 8.2",
                specification_limit="Subjected to 2x maximum working pressure (0.2 MPa / 2.0 bar) for 2 minutes without leakage or deformation",
                criticality="Safety - Critical",
            ),
            TestParameter(
                parameter_name="Bursting Pressure Test",
                test_method="IS 2347 Clause 8.3",
                specification_limit="Withstands hydrostatic pressure of minimum 3x working pressure (0.3 MPa / 3.0 bar) without bursting",
                criticality="Safety - Critical",
            ),
            TestParameter(
                parameter_name="Operating Pressure Test",
                test_method="IS 2347 Clause 8.1",
                specification_limit="Operating valve regulates steam release reliably between 0.9 and 1.1 bar",
                criticality="Operational Safety",
            ),
            TestParameter(
                parameter_name="Thermal Efficiency Test",
                test_method="IS 2347 Clause 8.5",
                specification_limit="Minimum 50.0% thermal efficiency (Energy conservation compliance)",
                criticality="Mandatory Energy Norm",
            ),
            TestParameter(
                parameter_name="Handle Strength & Cantilever Load",
                test_method="IS 2347 Clause 8.6",
                specification_limit="Withstands 1.5x cantilever load with water without crack, permanent deflection, or handle loosening",
                criticality="Physical Safety",
            ),
            TestParameter(
                parameter_name="Secondary Safety Relief Device (Safety Valve)",
                test_method="IS 2347 Clause 8.4",
                specification_limit="Fuse plug or spring relief operates safely between 1.4x and 2.0x working pressure if vent pipe is clogged",
                criticality="Fail-Safe Requirement",
            ),
        ],
        "recognized_laboratories": [
            BIS_LABORATORIES_NETWORK[0],  # Central Lab Sahibabad
            BIS_LABORATORIES_NETWORK[1],  # WRL Mumbai
            LabFacility(
                lab_name="National Test House (NTH Ghaziabad)",
                location="Kamla Nehru Nagar, Ghaziabad (Uttar Pradesh)",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="Central Govt Apex Testing Laboratory",
                contact_info="Kamla Nehru Nagar, Ghaziabad 201002 • nth-gzb@nic.in",
            ),
            LabFacility(
                lab_name="National Test House (NTH Mumbai)",
                location="Andheri East, Mumbai (Maharashtra)",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="Central Govt Mechanical & Chemical Testing Lab",
                contact_info="Saki Naka, Andheri East, Mumbai 400072",
            ),
            LabFacility(
                lab_name="MSME Testing Centre",
                location="Shaheed Captain Gaur Marg, Okhla, New Delhi",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="Govt of India MSME NABL Accredited Facility",
                contact_info="Okhla Phase III, New Delhi 110020",
            ),
        ],
    },

    # 3. PROTECTIVE HELMETS FOR TWO-WHEELERS
    "IS 4151": {
        "standard_number": "IS 4151:2020",
        "product_name": "Protective Helmet for Two-Wheeler Motor Vehicles",
        "sample_requirements": "6 complete helmets of each nominal shell size with visors and retention systems.",
        "estimated_turnaround": "10 - 14 working days",
        "critical_parameters": [
            TestParameter(
                parameter_name="Impact Attenuation Test",
                test_method="IS 4151 Clause 9.2",
                specification_limit="Headform drop test against flat and hemispherical steel anvils at 7.5 m/s. Peak acceleration < 300g",
                criticality="Safety - Critical",
            ),
            TestParameter(
                parameter_name="Retention System (Chin Strap) Dynamic Extension",
                test_method="IS 4151 Clause 9.3",
                specification_limit="Dynamic drop mass loading: Dynamic displacement ≤ 35 mm; residual elongation ≤ 25 mm; no buckle release",
                criticality="Safety - Critical",
            ),
            TestParameter(
                parameter_name="Peripheral Horizontal Field of Vision",
                test_method="IS 4151 Clause 6.3",
                specification_limit="Unobstructed horizontal angle ≥ 105° on each side of the median longitudinal plane",
                criticality="Mandatory Visibility",
            ),
            TestParameter(
                parameter_name="Penetration Resistance Test",
                test_method="IS 4151 Clause 9.4",
                specification_limit="3.0 kg conical sharp drop dart dropped from 3 metres. Point of dart must not make contact with headform",
                criticality="Penetration Safety",
            ),
            TestParameter(
                parameter_name="Visor Optical & Impact Resistance",
                test_method="IS 4151 Clause 7.2",
                specification_limit="Luminous transmittance ≥ 85% for clear visors; high-speed 6mm steel pellet impact test without shattering",
                criticality="Visual & Face Safety",
            ),
        ],
        "recognized_laboratories": [
            LabFacility(
                lab_name="Automotive Research Association of India (ARAI)",
                location="Kothrud, Pune (Maharashtra)",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="National Apex Automotive Testing Facility / MoRTH & BIS LRS Recognized",
                contact_info="Survey No. 102, Vetal Hill, Off Paud Road, Kothrud, Pune 411038 • info@araiindia.com",
            ),
            LabFacility(
                lab_name="International Centre for Automotive Technology (ICAT)",
                location="Manesar, Gurugram (Haryana)",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="Ministry of Heavy Industries & BIS Recognized Testing Agency",
                contact_info="Plot 26, Sector 3, HSIIDC, IMT Manesar, Gurugram 122050",
            ),
            LabFacility(
                lab_name="Central Institute of Road Transport (CIRT)",
                location="Bhosari, Pune (Maharashtra)",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="MoRTH NABL Accredited Safety Laboratory",
                contact_info="Pune-Nashik Highway, Bhosari, Pune 411026",
            ),
            BIS_LABORATORIES_NETWORK[0],  # Central Lab Sahibabad
        ],
    },

    # 4. AUTOMOTIVE DIESEL FUEL (BS-VI)
    "IS 1460": {
        "standard_number": "IS 1460:2017",
        "product_name": "Automotive Diesel Fuel (BS-VI)",
        "sample_requirements": "2 litres in clean, non-reactive, airtight amber glass or passivated metal containers.",
        "estimated_turnaround": "3 - 5 working days",
        "critical_parameters": [
            TestParameter(
                parameter_name="Cetane Number / Cetane Index",
                test_method="IS 1460 Table 1, Item (i)",
                specification_limit="Minimum 51.0 (Mandatory ignition quality requirement)",
                criticality="Mandatory Combustion",
            ),
            TestParameter(
                parameter_name="Total Sulfur Content",
                test_method="IS 1460 Table 1, Item (v) / ASTM D5453",
                specification_limit="Maximum 10.0 mg/kg (10 ppm) for Bharat Stage VI (BS-VI) nationwide compliance",
                criticality="Statutory Environmental Norm",
            ),
            TestParameter(
                parameter_name="Flash Point (Abel)",
                test_method="IS 1460 Table 1, Item (iv)",
                specification_limit="Minimum 35.0°C",
                criticality="Fire Safety / Storage Norm",
            ),
            TestParameter(
                parameter_name="Kinematic Viscosity at 40°C",
                test_method="IS 1460 Table 1, Item (ii)",
                specification_limit="2.0 to 4.5 mm²/s (cSt)",
                criticality="Engine Lubrication & Injection",
            ),
            TestParameter(
                parameter_name="Density at 15°C",
                test_method="IS 1460 Table 1, Item (iii)",
                specification_limit="820.0 to 845.0 kg/m³",
                criticality="Fuel Delivery Precision",
            ),
            TestParameter(
                parameter_name="Polycyclic Aromatic Hydrocarbons (PAH)",
                test_method="IS 1460 Table 1, Item (xvii)",
                specification_limit="Maximum 8.0% m/m",
                criticality="Emissions / Particulate Control",
            ),
            TestParameter(
                parameter_name="Water Content",
                test_method="IS 1460 Table 1, Item (xi)",
                specification_limit="Maximum 200 mg/kg",
                criticality="Corrosion & Microbial Guard",
            ),
        ],
        "recognized_laboratories": [
            LabFacility(
                lab_name="CSIR - Indian Institute of Petroleum (IIP)",
                location="Mohkampur, Dehradun (Uttarakhand)",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="National Apex Hydrocarbon Research & Testing Laboratory",
                contact_info="Haridwar Road, Mohkampur, Dehradun 248005 • director@iip.res.in",
            ),
            LabFacility(
                lab_name="Indian Oil Corporation R&D Centre (IOCL R&D)",
                location="Sector 13, Faridabad (Haryana)",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="NABL Accredited Fuel Testing Center",
                contact_info="Sector 13, Faridabad 121007",
            ),
            LabFacility(
                lab_name="Automotive Research Association of India (ARAI)",
                location="Pune (Maharashtra)",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="Emission & Fuel Quality Testing Division",
                contact_info="Survey No. 102, Vetal Hill, Kothrud, Pune 411038",
            ),
            LabFacility(
                lab_name="National Test House (NTH Alipore)",
                location="Kolkata (West Bengal)",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="Central Govt Petroleum Testing Laboratory",
                contact_info="11/1 Judges Court Road, Alipore, Kolkata 700027",
            ),
        ],
    },

    # 5. MOBILE PHONES & IT EQUIPMENT (SCHEME II CRS)
    "IS 13252": {
        "standard_number": "IS 13252 (Part 1):2010",
        "product_name": "Mobile Phones & Information Technology Equipment",
        "sample_requirements": "2 to 4 operational production units complete with original rated power adapters, battery packs, and technical user manuals.",
        "estimated_turnaround": "12 - 18 working days",
        "critical_parameters": [
            TestParameter(
                parameter_name="Electric Strength (Dielectric Withstand) Test",
                test_method="IS 13252 Clause 5.2.2",
                specification_limit="1.5 kV AC applied for 60 seconds between primary mains and user-accessible SELV circuits without insulation breakdown",
                criticality="Safety - Shock Hazard",
            ),
            TestParameter(
                parameter_name="Insulation Resistance & Creepage Distance",
                test_method="IS 13252 Clause 2.10 & 5.2.1",
                specification_limit="Adequate physical clearance and creepage spacing for working voltage under pollution degree 2",
                criticality="Fire & Electrical Safety",
            ),
            TestParameter(
                parameter_name="Heating & Maximum Temperature Rise",
                test_method="IS 13252 Clause 4.5",
                specification_limit="External enclosure, battery housing, and semiconductor junctions must not exceed safe thermal limits under maximum load",
                criticality="Thermal Safety",
            ),
            TestParameter(
                parameter_name="Mechanical Drop & Enclosure Impact Test",
                test_method="IS 13252 Clause 4.2.6",
                specification_limit="1.0 metre free fall drop onto smooth hardwood surface. Zero hazardous live parts exposed or broken",
                criticality="Physical Durability",
            ),
            TestParameter(
                parameter_name="Lithium-Ion Battery Safety Verification",
                test_method="IS 16046 (Part 2):2018 / IEC 62133-2",
                specification_limit="Continuous charging, external short circuit, thermal abuse at 130°C, and overcharge protection (Zero fire or explosion)",
                criticality="Battery Safety - Critical",
            ),
        ],
        "recognized_laboratories": [
            LabFacility(
                lab_name="Electronics Regional Test Laboratory (ERTL North)",
                location="Okhla Industrial Area, New Delhi",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="STQC / Ministry of Electronics & IT (MeitY) Apex Lab",
                contact_info="S-Block, Okhla Phase II, New Delhi 110020",
            ),
            LabFacility(
                lab_name="Electronics Regional Test Laboratory (ERTL West)",
                location="Andheri East, Mumbai (Maharashtra)",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="STQC / MeitY Testing Agency",
                contact_info="MIDC Area, Andheri East, Mumbai 400093",
            ),
            LabFacility(
                lab_name="SAMEER (Centre for Electromagnetics)",
                location="Taramani, Chennai (Tamil Nadu)",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="MeitY Autonomous R&D and Safety Testing Laboratory",
                contact_info="CIT Campus, Taramani, Chennai 600113",
            ),
            LabFacility(
                lab_name="TÜV Rheinland (India) Pvt. Ltd.",
                location="Electronic City, Bangalore (Karnataka)",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="NABL & BIS Recognized Testing Agency for Compulsory Registration Scheme (CRS)",
                contact_info="27/B, Doddanakundi Industrial Area, Bangalore 560048",
            ),
            LabFacility(
                lab_name="UL India Pvt. Ltd.",
                location="Kalyani Platina, Bangalore & Manesar",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="NABL Accredited / BIS Recognized CRS Test Facility",
                contact_info="Prestige Technology Park, Bangalore 560103",
            ),
        ],
    },

    # 6. PACKAGED DRINKING WATER
    "IS 14543": {
        "standard_number": "IS 14543:2016",
        "product_name": "Packaged Drinking Water (Other than Natural Mineral Water)",
        "sample_requirements": "10 sealed 1-litre retail bottles taken randomly from a single production batch.",
        "estimated_turnaround": "7 - 10 working days",
        "critical_parameters": [
            TestParameter(
                parameter_name="Microbiological Safety (Pathogenic Bacteria)",
                test_method="IS 14543 Table 1",
                specification_limit="Escherichia coli, Coliform bacteria, Faecal streptococci, Salmonella, Pseudomonas aeruginosa: ABSENT in 250 ml",
                criticality="Public Health - Critical",
            ),
            TestParameter(
                parameter_name="Toxic Heavy Metals (Lead, Arsenic, Cadmium, Mercury)",
                test_method="IS 14543 Table 3",
                specification_limit="Lead: Max 0.01 mg/L; Arsenic: Max 0.01 mg/L; Cadmium: Max 0.003 mg/L; Mercury: Max 0.001 mg/L",
                criticality="Toxicological Safety",
            ),
            TestParameter(
                parameter_name="Pesticide Residues (Individual & Total)",
                test_method="IS 14543 Table 4 / GC-MS & LC-MS/MS",
                specification_limit="Individual pesticide: Max 0.0001 mg/L (0.1 ppb); Total pesticides: Max 0.0005 mg/L (0.5 ppb)",
                criticality="Statutory Purity Norm",
            ),
            TestParameter(
                parameter_name="Total Dissolved Solids (TDS)",
                test_method="IS 14543 Table 2, Item (vi)",
                specification_limit="75.0 to 500.0 mg/L",
                criticality="Key Palatability & Mineral Balance",
            ),
            TestParameter(
                parameter_name="Turbidity & pH",
                test_method="IS 14543 Table 2, Item (ii) & (iii)",
                specification_limit="Turbidity: Max 2.0 NTU; pH: 6.5 to 8.5",
                criticality="Key Physical Parameter",
            ),
        ],
        "recognized_laboratories": [
            BIS_LABORATORIES_NETWORK[0],  # Central Lab Sahibabad
            LabFacility(
                lab_name="Vimta Labs Ltd.",
                location="Genome Valley, Hyderabad (Telangana)",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="NABL Accredited Food & Water Testing Apex Facility",
                contact_info="Life Sciences Park, Genome Valley, Hyderabad 500078 • mktg@vimta.com",
            ),
            LabFacility(
                lab_name="National Test House (NTH Alipore)",
                location="Kolkata (West Bengal)",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="Central Govt Food & Chemical Testing Laboratory",
                contact_info="11/1 Judges Court Road, Alipore, Kolkata 700027",
            ),
            LabFacility(
                lab_name="Shriram Institute for Industrial Research",
                location="Delhi & Bangalore",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="Pesticide Residue & Trace Metal Analysis Division",
                contact_info="19 University Road, Delhi 110007",
            ),
        ],
    },

    # 7. HIGH STRENGTH DEFORMED STEEL BARS (TMT REBAR)
    "IS 1786": {
        "standard_number": "IS 1786:2008",
        "product_name": "High Strength Deformed Steel Bars (TMT Rebars) for Concrete Reinforcement",
        "sample_requirements": "3 straight test pieces of 1-metre length each per cast/heat/nominal diameter.",
        "estimated_turnaround": "4 - 6 working days",
        "critical_parameters": [
            TestParameter(
                parameter_name="0.2% Proof Stress / Yield Strength",
                test_method="IS 1786 Table 3, Item (i)",
                specification_limit="Fe 500D: Min 500.0 N/mm²; Fe 550D: Min 550.0 N/mm²",
                criticality="Structural Load Capacity",
            ),
            TestParameter(
                parameter_name="Tensile Strength to Yield Stress Ratio (TS/YS)",
                test_method="IS 1786 Table 3, Item (ii)",
                specification_limit="Fe 500D: Min 1.10; Fe 550D: Min 1.08 (Critical earthquake / seismic ductility requirement)",
                criticality="Earthquake Safety - Critical",
            ),
            TestParameter(
                parameter_name="Percentage Elongation at Fracture",
                test_method="IS 1786 Table 3, Item (iii)",
                specification_limit="Fe 500D: Min 16.0%; Fe 550D: Min 14.5% on gauge length of 5.65√A",
                criticality="Ductility Norm",
            ),
            TestParameter(
                parameter_name="180° Bend & Re-Bend Test",
                test_method="IS 1786 Clause 9.3 & 9.4",
                specification_limit="Bent 180° around specified mandrel diameter. Zero transverse rupture or cracking on tension zone",
                criticality="Workability & Flexibility",
            ),
            TestParameter(
                parameter_name="Chemical Composition (Harmful Impurities)",
                test_method="IS 1786 Table 1",
                specification_limit="Carbon: Max 0.25%; Sulfur: Max 0.040%; Phosphorus: Max 0.040%; S+P: Max 0.075%",
                criticality="Weldability & Corrosion Resistance",
            ),
        ],
        "recognized_laboratories": [
            LabFacility(
                lab_name="CSIR - National Metallurgical Laboratory (NML)",
                location="Burmamines, Jamshedpur (Jharkhand)",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="Apex National Metallurgical Research & Failure Analysis Lab",
                contact_info="Burmamines, Jamshedpur 831007 • director@nmlindia.org",
            ),
            LabFacility(
                lab_name="National Test House (NTH Alipore)",
                location="Kolkata (West Bengal)",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="Central Govt Physical & Mechanical Steel Testing Lab",
                contact_info="11/1 Judges Court Road, Alipore, Kolkata 700027",
            ),
            LabFacility(
                lab_name="CSIR - Central Mechanical Engineering Research Institute (CMERI)",
                location="Durgapur (West Bengal)",
                lab_type="NABL Accredited (BIS LRS)",
                accreditation="National Mechanical Testing Laboratory",
                contact_info="MG Avenue, Durgapur 713209",
            ),
            BIS_LABORATORIES_NETWORK[0],  # Central Lab Sahibabad
        ],
    },
}


class LaboratoryService:
    """Service layer managing accredited BIS & NABL laboratories and mandatory test parameters."""

    def __init__(self):
        self._network = BIS_LABORATORIES_NETWORK
        self._registry = TESTING_REGISTRY

    def _normalize_code(self, code: Optional[str]) -> str:
        """Normalizes standard code by stripping year and part (e.g. 'IS 2888:2004' -> 'IS 2888')."""
        if not code:
            return ""
        c = code.strip().upper()
        # Strip revision year (e.g. :2004)
        c = re.sub(r":\d{4}$", "", c).strip()
        # Strip Part details for base matching if needed (e.g. IS 13252 (Part 1))
        match = re.match(r"(IS\s*\d+)", c)
        if match:
            return match.group(1).replace(" ", " ").strip()
        return c

    def get_testing_for_standard(self, standard_number: str) -> Optional[TestingAndLabInfo]:
        """Resolves mandatory test parameters and accredited labs for an Indian Standard."""
        std_clean = standard_number.strip().upper()
        base_code = self._normalize_code(std_clean)

        for key, data in self._registry.items():
            if key in std_clean or base_code == key or base_code == self._normalize_code(key):
                return TestingAndLabInfo(
                    standard_number=data["standard_number"],
                    product_name=data["product_name"],
                    sample_requirements=data.get("sample_requirements"),
                    estimated_turnaround=data.get("estimated_turnaround"),
                    critical_parameters=data.get("critical_parameters", []),
                    recognized_laboratories=data.get("recognized_laboratories", []),
                )

        return None

    def get_testing_for_product(self, product_name: str) -> Optional[TestingAndLabInfo]:
        """Resolves test parameters and accredited labs by product keyword."""
        p_lower = product_name.lower().strip()
        p_terms = [t for t in re.findall(r"\w+", p_lower) if len(t) > 2]

        for key, data in self._registry.items():
            prod_name = data["product_name"].lower()
            if prod_name in p_lower or p_lower in prod_name or any(t in prod_name for t in p_terms):
                return TestingAndLabInfo(
                    standard_number=data["standard_number"],
                    product_name=data["product_name"],
                    sample_requirements=data.get("sample_requirements"),
                    estimated_turnaround=data.get("estimated_turnaround"),
                    critical_parameters=data.get("critical_parameters", []),
                    recognized_laboratories=data.get("recognized_laboratories", []),
                )

        return None

    def get_general_laboratory_network(self) -> List[LabFacility]:
        """Returns the primary BIS Central, Regional, and Branch laboratory network."""
        return self._network

    def resolve_testing_info(
        self,
        query: str,
        standard_number: Optional[str] = None,
        product: Optional[str] = None,
    ) -> Optional[TestingAndLabInfo]:
        """Master resolution method querying standard first, then product, then query terms."""
        if standard_number:
            res = self.get_testing_for_standard(standard_number)
            if res:
                return res

        if product:
            res = self.get_testing_for_product(product)
            if res:
                return res

        # Check raw query
        return self.get_testing_for_product(query)


# Global service instance
laboratory_service = LaboratoryService()
