"""HSN Code to BIS Standard to Customs Port Clearance Navigator.

Bridges:
- ITC-HS / HSN Tariff Codes (4, 6, 8 digits)
- Indian Standards (IS Codes)
- Quality Control Orders (QCOs)
- DGFT Import Policies & ICEGATE Port Clearance Rules
- Bill of Entry mandatory documents (CML No., R-No., MTC)
- Statutory Import Exemptions (100% EOU, SEZ, R&D Prototypes)
"""

import re
import logging
from typing import Dict, List, Optional, Any
from app.schemas.chat import HsnCustomsInfo

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# HSN & CUSTOMS TARIFF COMPLIANCE REGISTRY
# ---------------------------------------------------------------------------
HSN_CUSTOMS_REGISTRY: List[Dict[str, Any]] = [
    # 1. DOMESTIC PRESSURE COOKERS
    {
        "hsn_codes": ["7615.10.11", "7615.10", "7615", "7323.93.10", "7323.93", "7323"],
        "commodity_title": "Pressure Cookers (Aluminium Alloys or Stainless Steel)",
        "standard_number": "IS 2347:2017",
        "product_name": "Domestic Pressure Cooker",
        "import_policy": "Restricted under Mandatory QCO",
        "icegate_mandatory_check": True,
        "required_documents": [
            "Active BIS CML Licence Number under FMCS (Foreign Manufacturers Certification Scheme)",
            "Bill of Entry declaration endorsing Indian Standard IS 2347:2017",
            "Manufacturer Pre-Shipment Conformity & Hydraulic Pressure Test Certificate",
            "Physical ISI Standard Mark with CML number permanently stamped/etched on cooker body",
        ],
        "port_clearance_advisory": (
            "CUSTOMS HOLD WARNING: Under the DPIIT Domestic Pressure Cookers (Quality Control) Order, 2020, "
            "Indian Customs at all sea ports, airports, and ICDs will automatically place an ICEGATE automated hold "
            "on consignments under HSN 7615 / 7323 arriving without a verified BIS FMCS Licence. "
            "Goods cannot be cleared for domestic home consumption or warehousing."
        ),
        "statutory_exemptions": [
            "100% Export Oriented Units (EOU) and Special Economic Zones (SEZ) importing for re-export.",
            "Prototype samples imported strictly for R&D or testing (up to 2 units) with prior DGFT / BIS exemption approval.",
        ],
        "keywords": ["pressure cooker", "cooker", "cookware", "7615", "7323"],
    },

    # 2. TWO-WHEELER PROTECTIVE HELMETS
    {
        "hsn_codes": ["6506.10.10", "6506.10", "6506"],
        "commodity_title": "Safety Helmets for Two-Wheeler Motor Vehicle Riders",
        "standard_number": "IS 4151:2020",
        "product_name": "Protective Helmet for Two-Wheeler Motor Vehicles",
        "import_policy": "Restricted under Mandatory QCO & MoRTH CMVR",
        "icegate_mandatory_check": True,
        "required_documents": [
            "BIS FMCS Licence Number (CML No.) from an active foreign manufacturing unit",
            "Physical ISI Standard Mark permanently embossed on the outer shell and chin strap label",
            "Laboratory Impact Attenuation & Retention Test Certificate under IS 4151:2020",
        ],
        "port_clearance_advisory": (
            "CRITICAL CUSTOMS ADVISORY: Under the Two-Wheeler Helmets (Quality Control) Order and Central Motor "
            "Vehicle Rules (CMVR), import of non-ISI marked two-wheeler helmets is strictly prohibited. "
            "Consignments without active BIS licence face mandatory re-export or destruction at importer's expense."
        ),
        "statutory_exemptions": [
            "Professional motorsport racing helmets meeting international ECE/DOT specifications imported by registered sportspersons under FMSCI/FIA certificates.",
        ],
        "keywords": ["helmet", "two wheeler helmet", "motorcycle helmet", "safety helmet", "6506"],
    },

    # 3. SMARTPHONES & CELLULAR PHONES
    {
        "hsn_codes": ["8517.13.00", "8517.14.00", "8517.12.00", "8517.12", "8517.13", "8517"],
        "commodity_title": "Smartphones and Cellular Telephones",
        "standard_number": "IS 13252 (Part 1):2010",
        "product_name": "Mobile Phones & Cellular Handsets",
        "import_policy": "Compulsory Registration Scheme (CRS) under MeitY CRO",
        "icegate_mandatory_check": True,
        "required_documents": [
            "Valid MeitY / BIS Registration Number (R-XXXXXXXX) registered on the BIS CRS portal",
            "Bill of Entry declaration referencing applicable Indian Standard IS 13252 (Part 1)",
            "Official BIS CRS Standard Mark displayed on phone body/e-label and retail packaging",
            "Lithium-ion Battery safety conformity certificate under IS 16046 (Part 2)",
        ],
        "port_clearance_advisory": (
            "MANDATORY CRS CLEARANCE: ICEGATE customs automatically verifies the R-Number on the MeitY CRS portal. "
            "Shipments lacking a valid R-Number or missing the BIS CRS standard mark on the retail packaging "
            "will be placed on immediate customs hold."
        ),
        "statutory_exemptions": [
            "Commercial prototype equipment imported in quantities less than 100 units strictly for R&D purposes under MeitY exemption approval.",
            "Personal mobile phones imported under passenger baggage allowances.",
        ],
        "keywords": ["mobile phone", "smartphone", "cellular", "cell phone", "phone", "8517"],
    },

    # 4. LAPTOPS, NOTEBOOKS & TABLET COMPUTERS
    {
        "hsn_codes": ["8471.30.10", "8471.30.90", "8471.30", "8471"],
        "commodity_title": "Laptops, Notebooks & Tablet Computers",
        "standard_number": "IS 13252 (Part 1):2010",
        "product_name": "Laptops and Tablets",
        "import_policy": "Compulsory Registration Scheme (CRS) under MeitY CRO",
        "icegate_mandatory_check": True,
        "required_documents": [
            "Valid MeitY / BIS CRS Registration Number (R-XXXXXXXX)",
            "DGFT Import Management System (IMS) authorization reference",
            "BIS CRS Standard Mark displayed on laptop underside and power adapter",
        ],
        "port_clearance_advisory": (
            "CRS & IMS VERIFICATION: Customs verifies that laptops and tablets possess valid BIS CRS registration "
            "and are compliant with DGFT electronic import regulations."
        ),
        "statutory_exemptions": [
            "Single laptop/tablet computer imported as passenger baggage.",
            "R&D prototypes (up to 20 units) imported by tech companies under valid exemption certificate.",
        ],
        "keywords": ["laptop", "notebook", "tablet", "computer", "8471"],
    },

    # 5. TOILET SOAP
    {
        "hsn_codes": ["3401.11.10", "3401.11.90", "3401.11", "3401"],
        "commodity_title": "Soap and Organic Surface-Active Products (Toilet Soap in cakes)",
        "standard_number": "IS 2888:2004",
        "product_name": "Toilet Soap",
        "import_policy": "Free under Open General Licence (OGL) — Voluntary BIS",
        "icegate_mandatory_check": False,
        "required_documents": [
            "Commercial Invoice, Packing List, and Bill of Lading",
            "Cosmetics Import Registration Certificate (Form COS-2) issued by CDSCO under Drugs & Cosmetics Act",
            "Manufacturer Certificate of Analysis (CoA)",
        ],
        "port_clearance_advisory": (
            "NO BIS PORT HOLD: BIS certification under IS 2888:2004 is voluntary for toilet soaps. "
            "Indian Customs will NOT stop shipments for lack of a BIS licence. "
            "However, importers must comply with CDSCO cosmetic import registration rules."
        ),
        "statutory_exemptions": [
            "Not applicable — standard is voluntary under Scheme I.",
        ],
        "keywords": ["soap", "toilet soap", "bathing soap", "detergent", "3401"],
    },

    # 6. AUTOMOTIVE DIESEL FUEL (BS-VI)
    {
        "hsn_codes": ["2710.19.30", "2710.19", "2710"],
        "commodity_title": "High Speed Diesel (HSD) & Automotive Gas Oils",
        "standard_number": "IS 1460:2017",
        "product_name": "Automotive Diesel Fuel (BS-VI)",
        "import_policy": "State Trading Enterprise (STE) / Authorized OMCs Only",
        "icegate_mandatory_check": True,
        "required_documents": [
            "Ministry of Petroleum & Natural Gas (MoPNG) import allocation",
            "Refinery Certificate of Quality verifying Sulfur max 10 ppm (BS-VI norm)",
            "Port Health and Customs laboratory sample test report",
        ],
        "port_clearance_advisory": (
            "RESTRICTED IMPORT: Import of automotive fuels is restricted to State Trading Enterprises (IOCL, BPCL, HPCL) "
            "or authorized entities. Mandatory port sampling verifies BS-VI sulfur limits."
        ),
        "statutory_exemptions": [
            "Bunker fuels for foreign ocean-going vessels in international transit.",
        ],
        "keywords": ["diesel", "automotive diesel", "hsd", "fuel", "gas oil", "2710"],
    },

    # 7. PACKAGED DRINKING WATER & MINERAL WATER
    {
        "hsn_codes": ["2201.10.10", "2201.90.10", "2201.10", "2201.90", "2201"],
        "commodity_title": "Packaged Natural Mineral Water and Drinking Water",
        "standard_number": "IS 14543:2016",
        "product_name": "Packaged Drinking Water",
        "import_policy": "Restricted under FSSAI & Section 16 of BIS Act",
        "icegate_mandatory_check": True,
        "required_documents": [
            "BIS FMCS Licence (ISI Mark) registered on the packaging",
            "FSSAI Import Clearance Certificate (Food Safety and Standards Authority of India)",
            "Port Health Organization (PHO) sample test clearance certificate",
        ],
        "port_clearance_advisory": (
            "DUAL CLEARANCE RESTRICTION: Consignments require both BIS ISI mark certification (FMCS) "
            "and FSSAI food import clearance. 100% of imported water consignments are tested at port laboratories."
        ),
        "statutory_exemptions": [
            "Consignments imported for accredited diplomatic missions under diplomatic immunity.",
        ],
        "keywords": ["drinking water", "mineral water", "packaged water", "water bottle", "2201"],
    },

    # 8. HIGH TENSILE DEFORMED STEEL BARS / TMT REBARS
    {
        "hsn_codes": ["7214.20.90", "7214.20", "7214", "7208", "7216"],
        "commodity_title": "High Tensile Deformed Steel Bars (TMT Rebars) & Structural Steel",
        "standard_number": "IS 1786:2008",
        "product_name": "TMT Rebars & Structural Steel",
        "import_policy": "Restricted under Steel QCO & SIMS",
        "icegate_mandatory_check": True,
        "required_documents": [
            "Steel Import Monitoring System (SIMS) Advance Registration Number",
            "Foreign manufacturer BIS FMCS Licence Number (CML No.)",
            "Mill Test Certificate (MTC) explicitly referencing Indian Standard IS 1786 or IS 2062",
        ],
        "port_clearance_advisory": (
            "STEEL QCO RESTRICTION: Ministry of Steel strictly mandates BIS certification for imported steel. "
            "Non-BIS steel is barred from entry and cannot be auctioned or diverted. SIMS advance registration "
            "(at least 15 days prior to arrival) is compulsory."
        ),
        "statutory_exemptions": [
            "Specialized high-alloy steel grades not manufactured domestically, cleared via Ministry of Steel Technical Committee (TC) exemption.",
        ],
        "keywords": ["steel", "tmt", "rebar", "structural steel", "billet", "7214", "7208"],
    },
]


class HsnCustomsService:
    """Service layer managing ITC-HS / HSN tariff codes, DGFT import policies, and customs port clearance."""

    def __init__(self):
        self._registry = HSN_CUSTOMS_REGISTRY

    def _clean_code(self, code: Optional[str]) -> str:
        """Removes dots, spaces, and formatting from an HSN code (e.g. '7615.10.11' -> '76151011')."""
        if not code:
            return ""
        return re.sub(r"[^\d]", "", code)

    def extract_hsn_from_text(self, text: str) -> Optional[str]:
        """Detects 4, 6, or 8-digit HSN codes in user query using pattern recognition."""
        if not text:
            return None

        # Look for explicit HSN prefixes: "HSN 7615", "HS code 8517.13", "ITC-HS 6506.10"
        prefix_match = re.search(r"(?:hsn|hs|itc[- ]?hs|tariff)\s*(?:code)?\s*[:\-]?\s*(\d{4}(?:\.\d{2}(?:\.\d{2})?)?)", text, re.IGNORECASE)
        if prefix_match:
            return prefix_match.group(1).strip()

        # Look for standalone 4-8 digit numbers matching known HSN headings
        for item in self._registry:
            for code in item["hsn_codes"]:
                pattern = r"\b" + re.escape(code) + r"\b"
                if re.search(pattern, text, re.IGNORECASE):
                    return code

        return None

    def get_customs_for_hsn(self, hsn_code: str) -> Optional[HsnCustomsInfo]:
        """Finds customs compliance details for a given HSN/ITC-HS code."""
        code_clean = self._clean_code(hsn_code)
        if not code_clean:
            return None

        for item in self._registry:
            for cand in item["hsn_codes"]:
                cand_clean = self._clean_code(cand)
                # Match exact, or 4-digit prefix match (e.g. 7615 in 761510)
                if code_clean == cand_clean or code_clean.startswith(cand_clean) or cand_clean.startswith(code_clean):
                    return HsnCustomsInfo(
                        hsn_code=item["hsn_codes"][0],
                        commodity_title=item["commodity_title"],
                        standard_number=item.get("standard_number"),
                        product_name=item["product_name"],
                        import_policy=item["import_policy"],
                        icegate_mandatory_check=item["icegate_mandatory_check"],
                        required_documents=item.get("required_documents", []),
                        port_clearance_advisory=item["port_clearance_advisory"],
                        statutory_exemptions=item.get("statutory_exemptions", []),
                    )

        return None

    def get_customs_for_standard(self, standard_number: str) -> Optional[HsnCustomsInfo]:
        """Finds HSN and customs requirements by Indian Standard number."""
        std_clean = standard_number.strip().upper()
        base_match = re.search(r"(IS\s*\d+)", std_clean)
        base_std = base_match.group(1) if base_match else std_clean

        for item in self._registry:
            item_std = item.get("standard_number", "").upper()
            if base_std in item_std or item_std in std_clean:
                return HsnCustomsInfo(
                    hsn_code=item["hsn_codes"][0],
                    commodity_title=item["commodity_title"],
                    standard_number=item.get("standard_number"),
                    product_name=item["product_name"],
                    import_policy=item["import_policy"],
                    icegate_mandatory_check=item["icegate_mandatory_check"],
                    required_documents=item.get("required_documents", []),
                    port_clearance_advisory=item["port_clearance_advisory"],
                    statutory_exemptions=item.get("statutory_exemptions", []),
                )

        return None

    def get_customs_for_product(self, product_name: str) -> Optional[HsnCustomsInfo]:
        """Finds HSN and customs requirements by product name or keywords."""
        p_lower = product_name.lower().strip()
        p_terms = [t for t in re.findall(r"\w+", p_lower) if len(t) > 2]

        for item in self._registry:
            prod_name = item["product_name"].lower()
            keywords = item.get("keywords", [])
            if prod_name in p_lower or p_lower in prod_name or any(k in p_lower for k in keywords) or any(t in prod_name for t in p_terms):
                return HsnCustomsInfo(
                    hsn_code=item["hsn_codes"][0],
                    commodity_title=item["commodity_title"],
                    standard_number=item.get("standard_number"),
                    product_name=item["product_name"],
                    import_policy=item["import_policy"],
                    icegate_mandatory_check=item["icegate_mandatory_check"],
                    required_documents=item.get("required_documents", []),
                    port_clearance_advisory=item["port_clearance_advisory"],
                    statutory_exemptions=item.get("statutory_exemptions", []),
                )

        return None

    def resolve_customs_info(
        self,
        query: str,
        standard_number: Optional[str] = None,
        product: Optional[str] = None,
        hsn_code: Optional[str] = None,
    ) -> Optional[HsnCustomsInfo]:
        """Master resolution method: checks explicit HSN code, then query regex, then standard, then product."""
        # 1. Check explicit HSN code
        if hsn_code:
            res = self.get_customs_for_hsn(hsn_code)
            if res:
                return res

        # 2. Extract HSN code from raw query
        extracted = self.extract_hsn_from_text(query)
        if extracted:
            res = self.get_customs_for_hsn(extracted)
            if res:
                return res

        # 3. Check by standard number
        if standard_number:
            res = self.get_customs_for_standard(standard_number)
            if res:
                return res

        # 4. Check by product
        if product:
            res = self.get_customs_for_product(product)
            if res:
                return res

        # 5. Check raw query keywords
        return self.get_customs_for_product(query)


# Global service instance
hsn_customs_service = HsnCustomsService()
