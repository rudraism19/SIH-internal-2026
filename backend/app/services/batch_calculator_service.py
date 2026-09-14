"""Factory Batch Calculator & Scheme of Inspection and Testing (SIT) Service.

Implements official BIS Scheme of Inspection and Testing (SIT) rules:
- Definition of 1 Control Unit / Production Batch per standard
- Nominal batch size and dynamic batch count calculation
- Mandatory routine factory testing frequencies (100% in-line vs per batch vs periodic destructive)
- Dynamic testing workload calculation based on monthly factory production volume
- Mandatory QA records and logbooks required during BIS supervisory audits
"""

import re
import math
import logging
from typing import Dict, Any, List, Optional
from app.schemas.chat import BatchCalculationInfo, RoutineTestRequirement

logger = logging.getLogger(__name__)

SIT_BATCH_REGISTRY: List[Dict[str, Any]] = [
    # 1. DOMESTIC PRESSURE COOKERS
    {
        "standards": ["IS 2347:2017", "IS 2347"],
        "product_name": "Domestic Pressure Cooker",
        "control_unit_definition": (
            "1,000 pressure cookers or the production of an 8-hour shift (whichever is less), "
            "manufactured from the same grade and heat of aluminium alloy or stainless steel."
        ),
        "nominal_batch_size": 1000,
        "routine_tests": [
            {
                "parameter_name": "Hydraulic Proof Pressure Test (2x Working Pressure)",
                "clause": "Clause 8.2",
                "frequency": "100% Routine In-Line (Every cooker body and lid)",
                "testing_stage": "100% In-Line Routine",
                "multiplier": 1.0,  # 1 test per unit
            },
            {
                "parameter_name": "Operating Pressure & Safety Valve Relief Functionality",
                "clause": "Clause 8.3 & 8.4",
                "frequency": "5 cookers per control unit (1,000 units)",
                "testing_stage": "Per Control Unit",
                "per_batch": 5,
            },
            {
                "parameter_name": "Bursting Pressure Test (Destructive Hydrostatic to Failure)",
                "clause": "Clause 8.5",
                "frequency": "1 cooker in every 5,000 units (or 1 per 5 batches)",
                "testing_stage": "Periodic Destructive Audit",
                "divisor": 5000,
            },
            {
                "parameter_name": "Handle Assembly Load & Rigidity Test",
                "clause": "Clause 8.7",
                "frequency": "3 cookers per control unit (1,000 units)",
                "testing_stage": "Per Control Unit",
                "per_batch": 3,
            },
            {
                "parameter_name": "Thermal Efficiency Determination (Min 50%)",
                "clause": "Clause 8.6",
                "frequency": "1 cooker per week of continuous production",
                "testing_stage": "Weekly In-House Lab",
                "fixed_monthly": 4,
            },
        ],
        "acceptance_criteria": (
            "Zero defectives permitted (AQL 0.0) in safety valve and proof pressure tests. "
            "Any single leakage, deformation, or bursting below 3x operating pressure requires "
            "immediate rejection of the entire control unit and suspension of ISI marking until root cause rectification."
        ),
        "qa_record_keeping": [
            "Form-SIT-1: Daily 100% Hydraulic Proof Testing Register (Body & Lid serials)",
            "Form-SIT-2: Operating Pressure and Safety Valve Release Test Ledger",
            "Gauge Calibration Ledger: Pressure gauges calibrated against Master dead-weight tester every 6 months",
            "Raw Material Test Certificate Ledger (Aluminium alloy IS 21 / Stainless steel IS 6911)",
            "Rejection & Scrap Disposal Register",
        ],
        "keywords": ["pressure cooker", "cooker", "cookware", "2347"],
    },

    # 2. TWO-WHEELER PROTECTIVE HELMETS
    {
        "standards": ["IS 4151:2020", "IS 4151"],
        "product_name": "Two-Wheeler Protective Helmets",
        "control_unit_definition": (
            "500 helmets of the same shell size, model, and liner density produced under continuous uniform conditions."
        ),
        "nominal_batch_size": 500,
        "routine_tests": [
            {
                "parameter_name": "Peripheral Vision Angle (≥ 105°) & Visor Clearance",
                "clause": "Clause 8.1",
                "frequency": "100% Routine In-Line on all assembled helmets",
                "testing_stage": "100% In-Line Routine",
                "multiplier": 1.0,
            },
            {
                "parameter_name": "Dynamic Retention & Chin-Strap Displacement Test",
                "clause": "Clause 8.3",
                "frequency": "2 helmets per control unit of 500",
                "testing_stage": "Per Control Unit",
                "per_batch": 2,
            },
            {
                "parameter_name": "Impact Attenuation Test (Drop Rig Acceleration < 300g)",
                "clause": "Clause 8.2",
                "frequency": "2 helmets per control unit (1 ambient, 1 conditioned)",
                "testing_stage": "Destructive Batch Test",
                "per_batch": 2,
            },
            {
                "parameter_name": "Penetration Resistance Test (3kg Conical Dart)",
                "clause": "Clause 8.4",
                "frequency": "1 helmet per 1,000 units produced (every 2 batches)",
                "testing_stage": "Periodic Destructive Audit",
                "divisor": 1000,
            },
        ],
        "acceptance_criteria": (
            "Zero non-conformities allowed. If peak acceleration exceeds 300g or the retention system yields "
            "more than 25mm dynamically, the entire batch of 500 helmets is rejected and quarantined."
        ),
        "qa_record_keeping": [
            "Drop Tower Accelerometer Rig Calibration Certificate (Annual NABL)",
            "Pre-Conditioning Chamber Temperature and Humidity Ledger (-10°C / +50°C)",
            "Retention Rig Dynamic Load vs Extension Record Sheet",
            "Batch Traceability and EPS Liner Density Register",
        ],
        "keywords": ["helmet", "helmets", "two-wheeler helmet", "protective helmet", "4151"],
    },

    # 3. TOILET SOAP
    {
        "standards": ["IS 2888:2004", "IS 2888"],
        "product_name": "Toilet Soap (Cakes)",
        "control_unit_definition": (
            "1 plodder run or 10 metric tonnes (approx. 100,000 cakes of 100g each) of uniform soap base formulation."
        ),
        "nominal_batch_size": 100000,
        "routine_tests": [
            {
                "parameter_name": "Total Fatty Matter (TFM) Determination",
                "clause": "Annex A",
                "frequency": "1 composite sample per plodder batch / charge",
                "testing_stage": "Per Control Unit",
                "per_batch": 1,
            },
            {
                "parameter_name": "Moisture and Volatile Matter at 105°C",
                "clause": "Annex B",
                "frequency": "2 samples per 8-hour production shift",
                "testing_stage": "Per Shift Verification",
                "per_batch": 4,
            },
            {
                "parameter_name": "Free Caustic Alkali & Matter Insoluble in Alcohol",
                "clause": "Annex C & D",
                "frequency": "1 composite sample per 10 MT control batch",
                "testing_stage": "Per Control Unit",
                "per_batch": 1,
            },
            {
                "parameter_name": "Net Stamped Weight & Wrapper Seal Inspection",
                "clause": "Clause 6",
                "frequency": "5 cakes every 30 minutes from each wrapping line",
                "testing_stage": "In-Line Routine",
                "per_batch": 80,
            },
        ],
        "acceptance_criteria": (
            "Grade 1 toilet soap must strictly maintain TFM ≥ 76.0% and Free Caustic Alkali ≤ 0.05%. "
            "If composite sample fails TFM, the entire 10 MT batch must be re-melted and reprocessed."
        ),
        "qa_record_keeping": [
            "Soap Pan Saponification and Plodder Batch Manufacturing Record (BMR)",
            "Daily Analytical Chemistry Testing Ledger",
            "Automated Check-Weigher Gravimetric Calibration Record",
        ],
        "keywords": ["soap", "toilet soap", "bathing bar", "2888"],
    },

    # 4. PACKAGED DRINKING WATER
    {
        "standards": ["IS 14543:2016", "IS 14543"],
        "product_name": "Packaged Drinking Water",
        "control_unit_definition": (
            "1 continuous filling run of not more than 5,000 sealed bottles (or 4 hours of filling, whichever is less)."
        ),
        "nominal_batch_size": 5000,
        "routine_tests": [
            {
                "parameter_name": "Visual Inspection for Foreign Particulates & Seal Integrity",
                "clause": "Clause 5",
                "frequency": "100% In-Line check under illuminated inspection screen",
                "testing_stage": "100% In-Line Routine",
                "multiplier": 1.0,
            },
            {
                "parameter_name": "pH, Total Dissolved Solids (TDS) & Electrical Conductivity",
                "clause": "Clause 6.1",
                "frequency": "1 bottle tested every 2 hours of filling",
                "testing_stage": "In-Line Routine",
                "per_batch": 2,
            },
            {
                "parameter_name": "In-House Microbiological Culture (Coliforms & E.coli)",
                "clause": "Clause 6.2",
                "frequency": "1 bottle per control batch (incubated for 24-48h)",
                "testing_stage": "Per Control Unit",
                "per_batch": 1,
            },
            {
                "parameter_name": "Total Viable Count (TVC / Aerobic Plate Count)",
                "clause": "Clause 6.2",
                "frequency": "1 sample per 8-hour shift incubated at 37°C & 22°C",
                "testing_stage": "Per Shift Verification",
                "per_batch": 2,
            },
        ],
        "acceptance_criteria": (
            "Total zero tolerance for microbiological contamination: Coliforms and E.coli must be Absent in 250ml. "
            "Any single pathogen detection triggers immediate quarantine and recall of the entire 5,000-bottle batch."
        ),
        "qa_record_keeping": [
            "Daily Microbiology Incubator Temperature & Plate Count Ledger",
            "UV Lamp Intensity & Ozone Dosing Daily Verification Register",
            "RO Membrane Clean-in-Place (CIP) & Filter Sanitization Log",
        ],
        "keywords": ["water", "drinking water", "packaged water", "14543"],
    },

    # 5. TMT STEEL REBARS
    {
        "standards": ["IS 1786:2008", "IS 1786"],
        "product_name": "High Strength Deformed Steel Bars (TMT Rebars)",
        "control_unit_definition": (
            "1 heat or melt of liquid steel (max 50 metric tonnes) rolled into a single nominal bar diameter."
        ),
        "nominal_batch_size": 50,  # 50 metric tonnes
        "routine_tests": [
            {
                "parameter_name": "0.2% Proof Stress, Tensile Strength & Elongation",
                "clause": "Clause 8.1",
                "frequency": "1 tensile test sample per 25 metric tonnes of rolled bar",
                "testing_stage": "Per 25 MT Sub-lot",
                "per_batch": 2,
            },
            {
                "parameter_name": "180° Cold Bend Test & Rebend Test (Tension Zone Ductility)",
                "clause": "Clause 8.2 & 8.3",
                "frequency": "1 bend test and 1 rebend test per 25 metric tonnes",
                "testing_stage": "Per 25 MT Sub-lot",
                "per_batch": 2,
            },
            {
                "parameter_name": "Chemical Composition by Optical Emission Spectrometer (C, S, P, Ceq)",
                "clause": "Clause 4",
                "frequency": "1 ladle analysis per heat / melt",
                "testing_stage": "Per Melt / Heat",
                "per_batch": 1,
            },
            {
                "parameter_name": "Nominal Mass, Rib Height & Transverse Rib Spacing",
                "clause": "Clause 5",
                "frequency": "1 test sample taken every 2 hours of continuous rolling",
                "testing_stage": "In-Line Rolling Audit",
                "per_batch": 4,
            },
        ],
        "acceptance_criteria": (
            "Tensile to Yield ratio (TS/YS) must be ≥ 1.10 for earthquake-resistant (Fe 500D) grades. "
            "No crack or rupture permitted on rebend pin mandrel. Failing tensile tests require re-testing 2 additional samples."
        ),
        "qa_record_keeping": [
            "Heat-wise Ladle Spectrometer Chemical Composition Ledger",
            "Universal Testing Machine (UTM) Tensile & Elongation Logbook",
            "Mill Test Certificate (MTC) Dispatched Traceability Ledger",
        ],
        "keywords": ["steel", "tmt", "rebar", "deformed bar", "1786"],
    },

    # 6. SMARTPHONES & IT EQUIPMENT (CRS)
    {
        "standards": ["IS 13252 (Part 1):2010", "IS 13252"],
        "product_name": "Smartphones & IT Equipment",
        "control_unit_definition": (
            "1,000 units or 1 production day's output of the same model and BOM revision."
        ),
        "nominal_batch_size": 1000,
        "routine_tests": [
            {
                "parameter_name": "Dielectric Withstand / High-Voltage (Hi-Pot 1.5 kV) Test",
                "clause": "Clause 5.2.2",
                "frequency": "100% Routine In-Line on all assembled units",
                "testing_stage": "100% In-Line Routine",
                "multiplier": 1.0,
            },
            {
                "parameter_name": "Protective Earth Continuity (Bonding Resistance ≤ 0.1 Ω)",
                "clause": "Clause 2.6",
                "frequency": "100% of units with accessible metallic enclosures",
                "testing_stage": "100% In-Line Routine",
                "multiplier": 1.0,
            },
            {
                "parameter_name": "Operational Safety & Battery Charging Cut-off Verification",
                "clause": "Clause 4.3",
                "frequency": "5 units per control lot of 1,000",
                "testing_stage": "Per Control Unit",
                "per_batch": 5,
            },
            {
                "parameter_name": "Drop Test (1.0 meter onto hardwood surface)",
                "clause": "Clause 4.2",
                "frequency": "1 unit per 5,000 units produced",
                "testing_stage": "Periodic Mechanical Audit",
                "divisor": 5000,
            },
        ],
        "acceptance_criteria": (
            "Zero dielectric breakdown allowed under 1,500V test. Unit failing electric shock safety must be "
            "quarantined and scrapped."
        ),
        "qa_record_keeping": [
            "Automated End-of-Line (EOL) Hi-Pot Tester Output Log",
            "ESD Protection & Grounding Integrity Verification Register",
            "Critical Component Safety Part List (BOM) Verification Ledger",
        ],
        "keywords": ["phone", "mobile", "smartphone", "laptop", "tablet", "electronics", "13252"],
    },
]


class BatchCalculatorService:
    """Service to calculate factory production control batches and routine testing schedules under BIS SIT."""

    def __init__(self):
        self._registry = SIT_BATCH_REGISTRY

    def extract_production_volume(self, text: str) -> Optional[int]:
        """Extracts production volume integer from user query text.
        
        Handles:
        - '50,000 units', '50000 cookers', '50000 monthly'
        - '200k units', '200 k' -> 200000
        - '1,00,000 bars' -> 100000
        - '25000'
        """
        if not text:
            return None

        clean_text = text.replace(",", "")

        # Look for '200k' or '50k' pattern
        k_match = re.search(r"(\d+(?:\.\d+)?)\s*[kK]\b", clean_text)
        if k_match:
            try:
                val = float(k_match.group(1))
                return int(val * 1000)
            except ValueError:
                pass

        # Look for 'lakh' or 'lac' pattern (e.g. 1.5 lakh, 2 lac)
        lakh_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:lakh|lac|lacs|lakhs)\b", clean_text, re.IGNORECASE)
        if lakh_match:
            try:
                val = float(lakh_match.group(1))
                return int(val * 100000)
            except ValueError:
                pass

        # Look for numbers preceded or followed by production/units/month
        pattern = r"(?:produce|manufacture|make|capacity|volume|output|batch|about)?\s*(\d{2,9})\s*(?:units|cookers|helmets|bars|cakes|bottles|pieces|tonnes|mt|monthly|per month|a month)?"
        matches = re.findall(pattern, clean_text, re.IGNORECASE)
        candidates = []
        for m in matches:
            if m:
                try:
                    val = int(m)
                    # Filter out year numbers like 2017, 2020, 2024 or standard numbers like 2347, 4151
                    if val in [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2347, 4151, 1460, 2888, 14543, 1786, 13252, 7615, 8517, 6506, 3401]:
                        continue
                    if val >= 50:  # meaningful production volume
                        candidates.append(val)
                except ValueError:
                    continue

        if candidates:
            return max(candidates)

        return None

    def get_sit_for_standard(self, standard_number: str) -> Optional[Dict[str, Any]]:
        """Look up SIT entry by standard number."""
        if not standard_number:
            return None
        norm_std = standard_number.strip().upper()
        for entry in self._registry:
            for std in entry["standards"]:
                if std.upper() in norm_std or norm_std in std.upper():
                    return entry
        return None

    def get_sit_for_product(self, product: str) -> Optional[Dict[str, Any]]:
        """Look up SIT entry by product keyword."""
        if not product:
            return None
        p_lower = product.lower()
        for entry in self._registry:
            if any(kw in p_lower for kw in entry["keywords"]):
                return entry
        return None

    def calculate_batch_and_testing(
        self,
        sit_entry: Any,
        production_volume: Optional[int] = None,
    ) -> Optional[BatchCalculationInfo]:
        """Calculates control batches and dynamic testing numbers based on production volume."""
        if isinstance(sit_entry, str):
            sit_entry = self.get_sit_for_standard(sit_entry) or self.get_sit_for_product(sit_entry)
        if not sit_entry:
            return None

        nominal_size = sit_entry["nominal_batch_size"]
        calculated_batches = None
        if production_volume and production_volume > 0:
            calculated_batches = max(1, math.ceil(production_volume / nominal_size))

        routine_test_models = []
        for test in sit_entry["routine_tests"]:
            req_tests = None
            if production_volume and production_volume > 0:
                if "multiplier" in test:
                    req_tests = int(production_volume * test["multiplier"])
                elif "per_batch" in test and calculated_batches:
                    req_tests = int(test["per_batch"] * calculated_batches)
                elif "divisor" in test:
                    req_tests = max(1, math.ceil(production_volume / test["divisor"]))
                elif "fixed_monthly" in test:
                    req_tests = test["fixed_monthly"]

            routine_test_models.append(
                RoutineTestRequirement(
                    parameter_name=test["parameter_name"],
                    clause=test.get("clause"),
                    frequency=test["frequency"],
                    testing_stage=test["testing_stage"],
                    tests_required_for_volume=req_tests,
                )
            )

        return BatchCalculationInfo(
            standard_number=sit_entry["standards"][0],
            product_name=sit_entry["product_name"],
            control_unit_definition=sit_entry["control_unit_definition"],
            nominal_batch_size=nominal_size,
            input_production_volume=production_volume,
            calculated_batches_count=calculated_batches,
            routine_tests=routine_test_models,
            acceptance_criteria=sit_entry["acceptance_criteria"],
            qa_record_keeping=sit_entry["qa_record_keeping"],
        )

    def resolve_batch_info(
        self,
        query: str = "",
        standard_number: Optional[str] = None,
        product: Optional[str] = None,
        production_volume: Optional[int] = None,
    ) -> Optional[BatchCalculationInfo]:
        """Resolves SIT batch calculation based on query, standard, and production volume."""
        vol = production_volume or self.extract_production_volume(query)
        sit_entry = None

        if standard_number:
            sit_entry = self.get_sit_for_standard(standard_number)

        if not sit_entry and product:
            sit_entry = self.get_sit_for_product(product)

        if not sit_entry and query:
            q_lower = query.lower()
            std_match = re.search(r"IS\s*(\d+)", query, re.IGNORECASE)
            if std_match:
                sit_entry = self.get_sit_for_standard(f"IS {std_match.group(1)}")

            if not sit_entry:
                for entry in self._registry:
                    if any(kw in q_lower for kw in entry["keywords"]):
                        sit_entry = entry
                        break

        if sit_entry:
            return self.calculate_batch_and_testing(sit_entry, vol)

        return None


# Global service singleton
batch_calculator_service = BatchCalculatorService()
