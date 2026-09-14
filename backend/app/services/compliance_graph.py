"""BIS Compliance Graph & Mandatory Quality Control Order (QCO) Intelligence Layer.

Connects Products, Indian Standards, Quality Control Orders (QCOs), Line Ministries,
Certification Schemes, and Enforcement Status into an interconnected knowledge graph.
"""
import re
import logging
from typing import List, Dict, Any, Optional, Tuple

from app.schemas.chat import ComplianceStatus
from app.core.standards_data import MASTER_BIS_STANDARDS

logger = logging.getLogger(__name__)

# Standard statutory penalty clause under Section 29 of the Bureau of Indian Standards Act, 2016
DEFAULT_PENALTY = (
    "Under Section 29 of the BIS Act, 2016, manufacturing, importing, selling, or distributing "
    "goods without valid certification when covered under a mandatory QCO is punishable with "
    "imprisonment up to two years, substantial monetary fines, and seizure/confiscation of goods."
)

DEFAULT_EXEMPTIONS = [
    "Goods manufactured exclusively for export purposes to overseas markets (100% EOU / SEZ).",
    "Limited prototype samples imported strictly for research and development (R&D) or testing.",
]

# Dedicated Registry of Quality Control Orders and Line Ministries
QCO_REGISTRY: List[Dict[str, Any]] = [
    # -------------------------------------------------------------
    # 1. DPIIT (Ministry of Commerce and Industry)
    # -------------------------------------------------------------
    {
        "qco_id": "DPIIT_PRESSURE_COOKER_2020",
        "qco_name": "Domestic Pressure Cookers (Quality Control) Order, 2020",
        "ministry": "Ministry of Commerce and Industry (DPIIT)",
        "standards": ["IS 2347:2017", "IS 2347"],
        "products": ["Domestic Pressure Cooker", "Pressure Cooker", "Cooker"],
        "scheme": "Scheme I (ISI Mark)",
        "is_mandatory": True,
        "enforcement_date": "1st February 2021 (Active & Enforced)",
        "legal_basis": "Section 16, Section 17 & Section 25 of the Bureau of Indian Standards Act, 2016",
        "exemptions": DEFAULT_EXEMPTIONS,
    },
    {
        "qco_id": "DPIIT_HELMET_2020",
        "qco_name": "Two Wheeler Helmets (Quality Control) Order, 2020",
        "ministry": "Ministry of Road Transport & Highways / DPIIT",
        "standards": ["IS 4151:2020", "IS 4151"],
        "products": ["Two-Wheeler Helmet", "Helmet", "Motorcycle Helmet", "Bike Helmet"],
        "scheme": "Scheme I (ISI Mark)",
        "is_mandatory": True,
        "enforcement_date": "1st June 2021 (Active & Enforced)",
        "legal_basis": "Section 16 of the Bureau of Indian Standards Act, 2016 and Central Motor Vehicles Rules",
        "exemptions": ["Helmets manufactured strictly for export purposes."],
    },
    {
        "qco_id": "DPIIT_FLASKS_2023",
        "qco_name": "Insulated Flasks, Bottles and Containers for Domestic Use (Quality Control) Order, 2023",
        "ministry": "Ministry of Commerce and Industry (DPIIT)",
        "standards": ["IS 17803:2022", "IS 17803", "IS 3703"],
        "products": ["Stainless Steel Water Bottle", "Insulated Flask", "Vacuum Flask", "Water Bottle", "Thermos Flask"],
        "scheme": "Scheme I (ISI Mark)",
        "is_mandatory": True,
        "enforcement_date": "Active & Enforced",
        "legal_basis": "Section 16 of the Bureau of Indian Standards Act, 2016",
        "exemptions": DEFAULT_EXEMPTIONS,
    },
    {
        "qco_id": "DPIIT_GAS_STOVE_2020",
        "qco_name": "Domestic Gas Stoves for use with LPG (Quality Control) Order, 2020",
        "ministry": "Ministry of Commerce and Industry (DPIIT)",
        "standards": ["IS 4246:2002", "IS 4246"],
        "products": ["Domestic Gas Stove", "LPG Stove", "Gas Cooktop", "Chulha"],
        "scheme": "Scheme I (ISI Mark)",
        "is_mandatory": True,
        "enforcement_date": "Active & Enforced",
        "legal_basis": "Section 16 of the Bureau of Indian Standards Act, 2016",
        "exemptions": DEFAULT_EXEMPTIONS,
    },
    {
        "qco_id": "DPIIT_TOYS_2020",
        "qco_name": "Toys (Quality Control) Order, 2020",
        "ministry": "Ministry of Commerce and Industry (DPIIT)",
        "standards": ["IS 9873 (Part 1):2019", "IS 9873", "IS 15644:2006", "IS 15644"],
        "products": ["Toys", "Children Toys", "Electric Toys", "Non-Electric Toys", "Plastic Toys"],
        "scheme": "Scheme I (ISI Mark)",
        "is_mandatory": True,
        "enforcement_date": "1st January 2021 (Active & Enforced)",
        "legal_basis": "Section 16 of the Bureau of Indian Standards Act, 2016",
        "exemptions": ["Toys manufactured exclusively for export by 100% Export Oriented Units."],
    },
    {
        "qco_id": "DPIIT_CABLES_2021",
        "qco_name": "Electrical Wires and Cables (Quality Control) Order",
        "ministry": "Ministry of Commerce and Industry (DPIIT)",
        "standards": ["IS 694:2010", "IS 694", "IS 1554", "IS 7098"],
        "products": ["Electrical Cable", "PVC Wire", "Copper Wire", "Insulated Wire", "Power Cable"],
        "scheme": "Scheme I (ISI Mark)",
        "is_mandatory": True,
        "enforcement_date": "Active & Enforced",
        "legal_basis": "Section 16 of the Bureau of Indian Standards Act, 2016",
        "exemptions": DEFAULT_EXEMPTIONS,
    },
    {
        "qco_id": "DPIIT_PLUGS_2021",
        "qco_name": "Plugs and Socket-Outlets (Quality Control) Order, 2021",
        "ministry": "Ministry of Commerce and Industry (DPIIT)",
        "standards": ["IS 1293:2019", "IS 1293"],
        "products": ["Plug", "Socket-Outlet", "Wall Socket", "Electrical Plug", "Power Strip"],
        "scheme": "Scheme I (ISI Mark)",
        "is_mandatory": True,
        "enforcement_date": "Active & Enforced",
        "legal_basis": "Section 16 of the Bureau of Indian Standards Act, 2016",
        "exemptions": DEFAULT_EXEMPTIONS,
    },
    {
        "qco_id": "DPIIT_CEILING_FAN_2023",
        "qco_name": "Ceiling Fans (Quality Control) Order / Mandatory BEE Star Rating Order",
        "ministry": "Ministry of Commerce and Industry (DPIIT) & BEE",
        "standards": ["IS 374:2019", "IS 374"],
        "products": ["Electric Ceiling Fan", "Ceiling Fan", "Fan"],
        "scheme": "Scheme I (ISI Mark)",
        "is_mandatory": True,
        "enforcement_date": "Active & Enforced",
        "legal_basis": "Section 16 of the Bureau of Indian Standards Act, 2016",
        "exemptions": DEFAULT_EXEMPTIONS,
    },

    # -------------------------------------------------------------
    # 2. MINISTRY OF STEEL
    # -------------------------------------------------------------
    {
        "qco_id": "STEEL_TMT_2020",
        "qco_name": "Steel and Steel Products (Quality Control) Order, 2020",
        "ministry": "Ministry of Steel",
        "standards": ["IS 1786:2008", "IS 1786"],
        "products": ["TMT Rebar", "TMT Bar", "Steel Reinforcement Bar", "High Strength Deformed Steel Bar"],
        "scheme": "Scheme I (ISI Mark)",
        "is_mandatory": True,
        "enforcement_date": "Active & Enforced",
        "legal_basis": "Section 16 of the Bureau of Indian Standards Act, 2016",
        "exemptions": ["Steel imported strictly for specific strategic defence projects or 100% export manufacture."],
    },
    {
        "qco_id": "STEEL_STRUCTURAL_2020",
        "qco_name": "Steel and Steel Products (Quality Control) Order — Structural Steel",
        "ministry": "Ministry of Steel",
        "standards": ["IS 2062:2011", "IS 2062", "IS 2830:2012", "IS 2830"],
        "products": ["Structural Steel", "Hot Rolled Steel", "Carbon Steel Billet", "Steel Billet"],
        "scheme": "Scheme I (ISI Mark)",
        "is_mandatory": True,
        "enforcement_date": "Active & Enforced",
        "legal_basis": "Section 16 of the Bureau of Indian Standards Act, 2016",
        "exemptions": DEFAULT_EXEMPTIONS,
    },

    # -------------------------------------------------------------
    # 3. MINISTRY OF ELECTRONICS & IT (MeitY - Scheme II CRS)
    # -------------------------------------------------------------
    {
        "qco_id": "MEITY_CRS_ELECTRONICS",
        "qco_name": "Electronics and Information Technology Goods (Requirement for Compulsory Registration) Order",
        "ministry": "Ministry of Electronics and Information Technology (MeitY)",
        "standards": ["IS 13252 (Part 1):2010", "IS 13252", "IS 16046:2018", "IS 16046", "IS 616:2017", "IS 616", "IS 15885"],
        "products": [
            "Mobile Phone", "Smartphone", "Laptop", "Notebook Computer", "Tablet", "Power Bank",
            "Smart Watch", "LED Television", "LED Luminaire", "Bluetooth Speaker", "Point of Sale Terminal"
        ],
        "scheme": "Scheme II (CRS - Compulsory Registration Scheme)",
        "is_mandatory": True,
        "enforcement_date": "Active & Enforced",
        "legal_basis": "Section 16 of BIS Act, 2016 & MeitY CRO Notification",
        "exemptions": ["Highly specialized commercial equipment imported in quantities less than 100 units for R&D purposes under MeitY exemption approval."],
    },

    # -------------------------------------------------------------
    # 4. MINISTRY OF CONSUMER AFFAIRS (Drinking Water & Hallmarking)
    # -------------------------------------------------------------
    {
        "qco_id": "CONSUMER_AFFAIRS_WATER",
        "qco_name": "Mandatory Certification Order for Packaged Drinking Water",
        "ministry": "Ministry of Consumer Affairs, Food & Public Distribution / FSSAI",
        "standards": ["IS 14543:2016", "IS 14543", "IS 13428:2005", "IS 13428"],
        "products": ["Packaged Drinking Water", "Drinking Water", "Bottled Water", "Natural Mineral Water", "Mineral Water"],
        "scheme": "Scheme I (ISI Mark)",
        "is_mandatory": True,
        "enforcement_date": "Active & Enforced (Compulsory under FSSAI & BIS regulations)",
        "legal_basis": "Section 16 of BIS Act, 2016 and Food Safety and Standards (Packaging and Labelling) Regulations",
        "exemptions": ["Piped water supply utilities operated by municipal bodies."],
    },
    {
        "qco_id": "CONSUMER_AFFAIRS_GOLD_HALLMARKING",
        "qco_name": "Hallmarking of Gold Jewellery and Gold Artefacts Order, 2020",
        "ministry": "Ministry of Consumer Affairs, Food & Public Distribution",
        "standards": ["IS 1417:2016", "IS 1417"],
        "products": ["Gold Jewellery", "Gold Artefact", "Gold Coin", "Gold 22k", "Gold 18k", "Gold 14k"],
        "scheme": "Mandatory Gold Hallmarking (6-digit HUID)",
        "is_mandatory": True,
        "enforcement_date": "Phased implementation active across all notified districts (Active & Enforced)",
        "legal_basis": "Section 14 & Section 16 of the Bureau of Indian Standards Act, 2016",
        "exemptions": [
            "Jewellers with annual turnover up to Rs 40 lakh.",
            "Export and re-import of jewellery as per Trade Policy.",
            "Articles of gold weighing less than 2 grams.",
        ],
    },

    # -------------------------------------------------------------
    # 5. MINISTRY OF PETROLEUM & NATURAL GAS
    # -------------------------------------------------------------
    {
        "qco_id": "MOPNG_AUTOMOTIVE_FUELS",
        "qco_name": "Bharat Stage VI (BS-VI) Automotive Fuels Mandatory Compliance Notification",
        "ministry": "Ministry of Petroleum and Natural Gas",
        "standards": ["IS 1460:2017", "IS 1460", "IS 2796:2017", "IS 2796"],
        "products": ["Automotive Diesel", "Diesel Fuel", "Diesel", "Automotive Gasoline", "Petrol", "Motor Gasoline"],
        "scheme": "Statutory Bharat Stage VI Mandatory Compliance",
        "is_mandatory": True,
        "enforcement_date": "1st April 2020 (Active & Enforced Nationwide)",
        "legal_basis": "Environment (Protection) Act, 1986 and Motor Vehicles Act",
        "exemptions": ["Off-road specialty industrial blends and marine bunker fuels governed by separate standards."],
    },
    {
        "qco_id": "PESO_LPG_CYLINDERS",
        "qco_name": "Gas Cylinders Rules, 2016 (Mandatory ISI Mark Certification)",
        "ministry": "Ministry of Commerce and Industry / PESO",
        "standards": ["IS 3196 (Part 1):2013", "IS 3196", "IS 3224"],
        "products": ["LPG Cylinder", "Gas Cylinder", "Steel Gas Cylinder", "Cooking Gas Cylinder"],
        "scheme": "Scheme I (ISI Mark)",
        "is_mandatory": True,
        "enforcement_date": "Active & Enforced",
        "legal_basis": "Explosives Act, 1884 and Gas Cylinders Rules",
        "exemptions": ["Defence specialty high-pressure vessels governed by armed forces specifications."],
    },

    # -------------------------------------------------------------
    # 6. MINISTRY OF CHEMICALS & FERTILIZERS
    # -------------------------------------------------------------
    {
        "qco_id": "CHEMICALS_UPVC_PIPES",
        "qco_name": "Unplasticized Polyvinyl Chloride (UPVC) Pipes (Quality Control) Order",
        "ministry": "Ministry of Chemicals and Fertilizers",
        "standards": ["IS 4985:2021", "IS 4985"],
        "products": ["UPVC Pipe", "PVC Pipe", "Plumbing Pipe", "Irrigation Pipe", "Water Supply Pipe"],
        "scheme": "Scheme I (ISI Mark)",
        "is_mandatory": True,
        "enforcement_date": "Active & Enforced",
        "legal_basis": "Section 16 of the Bureau of Indian Standards Act, 2016",
        "exemptions": DEFAULT_EXEMPTIONS,
    },
    {
        "qco_id": "CHEMICALS_CEMENT_MANDATORY",
        "qco_name": "Cement (Quality Control) Order",
        "ministry": "Ministry of Commerce and Industry (DPIIT)",
        "standards": ["IS 269:2015", "IS 269", "IS 1489 (Part 1):2015", "IS 1489", "IS 8112:2013", "IS 8112"],
        "products": ["Cement", "Ordinary Portland Cement", "Portland Pozzolana Cement", "OPC", "PPC"],
        "scheme": "Scheme I (ISI Mark)",
        "is_mandatory": True,
        "enforcement_date": "Active & Enforced",
        "legal_basis": "Section 16 of the Bureau of Indian Standards Act, 2016",
        "exemptions": ["White cement or specialized oil well cement imported under specific industrial permits."],
    },

    # -------------------------------------------------------------
    # 7. VOLUNTARY STANDARDS (No Mandatory QCO Promulgated)
    # -------------------------------------------------------------
    {
        "qco_id": "VOLUNTARY_SOAPS",
        "qco_name": "Voluntary Indian Standard — No QCO Order Issued",
        "ministry": "Bureau of Indian Standards (Voluntary Scheme I)",
        "standards": ["IS 2888:2004", "IS 2888", "IS 285:1992", "IS 285", "IS 4955:2020", "IS 4955"],
        "products": ["Toilet Soap", "Soap", "Bathing Soap", "Laundry Soap", "Synthetic Detergent"],
        "scheme": "Scheme I (Voluntary / ISI available)",
        "is_mandatory": False,
        "enforcement_date": "Voluntary — No mandatory order published",
        "legal_basis": "Voluntary Conformity Assessment under Bureau of Indian Standards Act, 2016",
        "exemptions": ["Manufacturers are free to produce and market without BIS licence, or opt for voluntary ISI mark."],
    },
]


class ComplianceGraphService:
    """Service layer managing the BIS Compliance Graph & Mandatory QCO Intelligence."""

    def __init__(self):
        self._qco_records = QCO_REGISTRY
        self._master_standards = MASTER_BIS_STANDARDS

    def _normalize_code(self, code: Optional[str]) -> str:
        """Strips revision years and spaces for fuzzy matching (e.g. 'IS 2888:2004' -> 'IS 2888')."""
        if not code:
            return ""
        c = code.strip().upper()
        return re.sub(r":\d{4}$", "", c).strip()

    def get_compliance_for_standard(self, standard_number: str) -> ComplianceStatus:
        """Finds compliance node in graph for an Indian Standard code."""
        std_clean = standard_number.strip().upper()
        base_code = self._normalize_code(std_clean)

        # 1. Look in QCO Registry
        for qco in self._qco_records:
            for s in qco["standards"]:
                if s.upper() == std_clean or s.upper() == base_code or base_code == self._normalize_code(s):
                    return ComplianceStatus(
                        is_mandatory=qco["is_mandatory"],
                        status="Mandatory" if qco["is_mandatory"] else "Voluntary",
                        scheme=qco["scheme"],
                        qco_name=qco["qco_name"],
                        ministry=qco["ministry"],
                        enforcement_date=qco["enforcement_date"],
                        legal_basis=qco["legal_basis"],
                        penalties_applicable=qco["is_mandatory"],
                        exemptions=qco.get("exemptions", DEFAULT_EXEMPTIONS),
                        standard_number=standard_number,
                        product_name=qco["products"][0] if qco.get("products") else None,
                    )

        # 2. Look in MASTER_BIS_STANDARDS catalogue metadata
        for s in self._master_standards:
            s_code = s.get("standard_number", "").upper()
            if s_code == std_clean or self._normalize_code(s_code) == base_code:
                meta = s.get("metadata", {})
                is_mand = bool(meta.get("mandatory", False))
                scheme = meta.get("certification_scheme", "Scheme I (ISI Mark)")
                qco_name = meta.get("qco_order") or ("Mandatory Quality Control Order" if is_mand else "Voluntary Standard")

                # Infer ministry
                ministry = "Line Ministry / Central Government"
                if "DPIIT" in qco_name or "MED" in meta.get("division", ""):
                    ministry = "Ministry of Commerce and Industry (DPIIT)"
                elif "Steel" in qco_name or "MTD" in meta.get("division", ""):
                    ministry = "Ministry of Steel"
                elif "CRS" in scheme or "ETD" in meta.get("division", ""):
                    ministry = "Ministry of Electronics & IT (MeitY)"

                return ComplianceStatus(
                    is_mandatory=is_mand,
                    status="Mandatory" if is_mand else "Voluntary",
                    scheme=scheme,
                    qco_name=qco_name,
                    ministry=ministry,
                    enforcement_date="Active & Enforced" if is_mand else "Voluntary",
                    legal_basis="Section 16 of the Bureau of Indian Standards Act, 2016",
                    penalties_applicable=is_mand,
                    exemptions=DEFAULT_EXEMPTIONS if is_mand else ["Voluntary standard — no statutory license required."],
                    standard_number=standard_number,
                    product_name=s.get("product"),
                )

        # Default fallback for unindexed standards: voluntary under Scheme I
        return ComplianceStatus(
            is_mandatory=False,
            status="Voluntary",
            scheme="Scheme I (ISI Mark - Voluntary)",
            qco_name=None,
            ministry="Bureau of Indian Standards",
            enforcement_date="Voluntary",
            legal_basis="Conformity Assessment under BIS Act, 2016",
            penalties_applicable=False,
            exemptions=["Voluntary standard — manufacturers may apply for voluntary ISI mark."],
            standard_number=standard_number,
            product_name=None,
        )

    def get_compliance_for_product(self, product_name: str) -> Optional[ComplianceStatus]:
        """Traverses graph by product keywords to find applicable QCO and scheme."""
        p_lower = product_name.lower().strip()
        p_terms = [t for t in re.findall(r"\w+", p_lower) if len(t) > 2]

        for qco in self._qco_records:
            for p in qco["products"]:
                p_cand = p.lower()
                if p_cand in p_lower or p_lower in p_cand or any(t in p_cand for t in p_terms):
                    return ComplianceStatus(
                        is_mandatory=qco["is_mandatory"],
                        status="Mandatory" if qco["is_mandatory"] else "Voluntary",
                        scheme=qco["scheme"],
                        qco_name=qco["qco_name"],
                        ministry=qco["ministry"],
                        enforcement_date=qco["enforcement_date"],
                        legal_basis=qco["legal_basis"],
                        penalties_applicable=qco["is_mandatory"],
                        exemptions=qco.get("exemptions", DEFAULT_EXEMPTIONS),
                        standard_number=qco["standards"][0] if qco.get("standards") else None,
                        product_name=p,
                    )

        # Search in MASTER_BIS_STANDARDS
        for s in self._master_standards:
            meta = s.get("metadata", {})
            keywords = [str(k).lower() for k in meta.get("keywords", [])]
            s_prod = str(s.get("product", "")).lower()
            if any(t in s_prod or t in keywords for t in p_terms):
                return self.get_compliance_for_standard(s["standard_number"])

        return None

    def search_by_ministry(self, ministry_query: str) -> List[ComplianceStatus]:
        """Returns all QCOs and standards issued by a specific ministry."""
        m_lower = ministry_query.lower()
        results: List[ComplianceStatus] = []

        for qco in self._qco_records:
            if m_lower in qco["ministry"].lower() or any(term in qco["ministry"].lower() for term in m_lower.split()):
                results.append(
                    ComplianceStatus(
                        is_mandatory=qco["is_mandatory"],
                        status="Mandatory" if qco["is_mandatory"] else "Voluntary",
                        scheme=qco["scheme"],
                        qco_name=qco["qco_name"],
                        ministry=qco["ministry"],
                        enforcement_date=qco["enforcement_date"],
                        legal_basis=qco["legal_basis"],
                        penalties_applicable=qco["is_mandatory"],
                        exemptions=qco.get("exemptions", DEFAULT_EXEMPTIONS),
                        standard_number=qco["standards"][0] if qco.get("standards") else None,
                        product_name=qco["products"][0] if qco.get("products") else None,
                    )
                )

        return results

    def resolve_compliance(
        self,
        query: str,
        standard_number: Optional[str] = None,
        product: Optional[str] = None,
    ) -> Optional[ComplianceStatus]:
        """Master resolution method querying standard first, then product, then query terms."""
        if standard_number:
            res = self.get_compliance_for_standard(standard_number)
            if res and (res.qco_name or res.is_mandatory):
                return res

        if product:
            res = self.get_compliance_for_product(product)
            if res:
                return res

        # Check raw query
        return self.get_compliance_for_product(query)


# Global service instance
compliance_graph_service = ComplianceGraphService()
