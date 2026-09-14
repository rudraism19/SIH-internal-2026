"""BIS Gold & Silver Hallmarking and HUID Intelligence Service.

Authoritative domain intelligence for:
- Gold jewellery & artefacts under IS 1417:2016 (24K, 23K, 22K, 20K, 18K, 14K)
- Silver artefacts under IS 2112:2014 (999, 990, 925 Sterling, 900, 800)
- The 3 mandatory marks (BIS Logo, Purity Grade, 6-digit HUID)
- Consumer HUID verification steps on BIS Care App
- Mandatory Hallmarking Districts (343+ districts notified across India)
- Statutory exemptions (turnover <= 40L, weight < 2g, export)
- Jeweller registration rules (zero fee, lifetime validity via Manakonline)
- Consumer compensation and redressal rules under Section 19 of the BIS Act, 2016
"""

import re
import logging
from typing import Dict, Any, List, Optional
from app.schemas.chat import HallmarkingInfo, PurityGrade

logger = logging.getLogger(__name__)

GOLD_PURITY_GRADES = [
    PurityGrade(
        karat="24K",
        fineness="999",
        percentage="99.9% pure gold",
        description="24 Karat pure gold (999 parts per thousand)",
        common_use="Gold bullion, coins, investment bars, and specialized sovereign medals",
    ),
    PurityGrade(
        karat="23K",
        fineness="958",
        percentage="95.8% pure gold",
        description="23 Karat gold (958 parts per thousand)",
        common_use="Traditional high-purity temple jewellery and specialized ornaments",
    ),
    PurityGrade(
        karat="22K",
        fineness="916",
        percentage="91.6% pure gold",
        description="22 Karat gold (916 parts per thousand) - National Standard Benchmark",
        common_use="Most widely purchased traditional Indian bridal jewellery, bangles, and chains",
    ),
    PurityGrade(
        karat="20K",
        fineness="833",
        percentage="83.3% pure gold",
        description="20 Karat gold (833 parts per thousand)",
        common_use="Intricate carved ornaments requiring higher hardness and structural stiffness",
    ),
    PurityGrade(
        karat="18K",
        fineness="750",
        percentage="75.0% pure gold",
        description="18 Karat gold (750 parts per thousand)",
        common_use="Diamond-studded, gemstone, and modern contemporary designer jewellery",
    ),
    PurityGrade(
        karat="14K",
        fineness="585",
        percentage="58.5% pure gold",
        description="14 Karat gold (585 parts per thousand)",
        common_use="Modern everyday-wear, lightweight gemstone jewellery, and office-wear collections",
    ),
    PurityGrade(
        karat="9K",
        fineness="375",
        percentage="37.5% pure gold",
        description="9 Karat gold (375 parts per thousand)",
        common_use="Lightweight fashion articles and export-oriented jewellery items",
    ),
]

SILVER_PURITY_GRADES = [
    PurityGrade(
        karat="Silver",
        fineness="999",
        percentage="99.9% pure silver",
        description="Fine Silver (999 parts per thousand)",
        common_use="Silver investment bars, commemorative coins, and pure idols",
    ),
    PurityGrade(
        karat="Silver",
        fineness="990",
        percentage="99.0% pure silver",
        description="Silver 990 (990 parts per thousand)",
        common_use="Religious utensils and puja items",
    ),
    PurityGrade(
        karat="Silver",
        fineness="925",
        percentage="92.5% pure silver",
        description="Sterling Silver (925 parts per thousand) - Global Jewellery Standard",
        common_use="Fine silver jewellery, luxury tableware, and diamond-set silver ornaments",
    ),
    PurityGrade(
        karat="Silver",
        fineness="900",
        percentage="90.0% pure silver",
        description="Silver 900 (900 parts per thousand)",
        common_use="Decorative artefacts and traditional silverware",
    ),
    PurityGrade(
        karat="Silver",
        fineness="800",
        percentage="80.0% pure silver",
        description="Silver 800 (800 parts per thousand)",
        common_use="Heavy utilitarian silver utensils, cutlery, and decorative items",
    ),
]

MANDATORY_MARKS_GOLD = [
    "1. BIS Standard Mark (The triangular BIS emblem certifying national conformity).",
    "2. Purity / Fineness Grade (Karat and millesimal fineness, e.g., 22K916, 18K750, or 14K585).",
    "3. 6-Digit Alphanumeric HUID (Hallmark Unique Identification laser-etched code, e.g., AB1234, unique to each individual piece).",
]

MANDATORY_MARKS_SILVER = [
    "1. BIS Standard Mark (Triangular BIS emblem certifying national conformity).",
    "2. Fineness Grade for Silver (e.g., 999, 990, 925 Sterling, 900, 800).",
    "3. Assaying and Hallmarking Centre (AHC) Identification Mark.",
    "4. Jeweller's Identification Mark or Year Letter.",
]

HUID_VERIFICATION_STEPS = [
    "1. Install the official 'BIS Care App' (available free on Google Play Store and Apple App Store).",
    "2. Open the app and tap on the 'Verify HUID' feature on the dashboard.",
    "3. Enter the 6-digit alphanumeric HUID code etched on the jewellery article (e.g., 'AB1234').",
    "4. The app displays: (a) Jeweller's Registration Number & Name, (b) Assaying Centre (AHC) details, (c) Date of hallmarking, (d) Article type (Ring, Bangle, Necklace, etc.), and (e) Certified purity grade.",
    "5. Cross-verify that the purity and article type in the app exactly match your physical jewellery and invoice.",
]

MANDATORY_EXEMPTIONS = [
    "Jewellers with an annual turnover of up to ₹40 Lakhs (aligned with the GST threshold).",
    "Gold jewellery articles weighing less than 2.0 grams (e.g., small nose pins or light earrings).",
    "Export and re-import of gold jewellery under Foreign Trade Policy (FTP).",
    "Articles intended for international exhibitions approved by the government.",
    "Special articles: Gold bullion and coins certified under IS 1418, watches, fountain pens, and medical devices.",
]


class HallmarkingService:
    """Service providing authoritative intelligence on BIS Gold and Silver Hallmarking schemes,
    HUID verification, purity grades, and statutory consumer protection rules.
    """

    def __init__(self):
        self.gold_standard = "IS 1417:2016"
        self.silver_standard = "IS 2112:2014"
        self.ahc_standard = "IS 15820:2009"

    def validate_huid_format(self, huid: str) -> bool:
        """Validates whether a string conforms to the 6-digit alphanumeric HUID format (e.g. AB1234)."""
        if not huid:
            return False
        clean = huid.strip().upper()
        return bool(re.fullmatch(r"^[A-Z0-9]{6}$", clean))

    def extract_huid(self, text: str) -> Optional[str]:
        """Extracts a 6-digit HUID code from text if present."""
        if not text:
            return None
        # Match standalone 6-character alphanumeric pattern with at least one letter and one digit
        matches = re.findall(r"\b([A-Z0-9]{6})\b", text.upper())
        for m in matches:
            # Must have at least one alphabet and one digit to distinguish from 6-digit pin codes
            if any(c.isalpha() for c in m) and any(c.isdigit() for c in m):
                return m
        return None

    def get_purity_grades(self, metal: str = "gold") -> List[PurityGrade]:
        """Returns recognized statutory purity grades for Gold or Silver."""
        if "silver" in metal.lower():
            return SILVER_PURITY_GRADES
        return GOLD_PURITY_GRADES

    def resolve_hallmarking_info(
        self,
        query: str = "",
        product: Optional[str] = None,
        standard_number: Optional[str] = None,
    ) -> Optional[HallmarkingInfo]:
        """Resolves HallmarkingInfo for queries related to gold, silver, jewellery, HUID, or IS 1417/2112."""
        combined = f"{query} {product or ''} {standard_number or ''}".lower()

        is_silver = "silver" in combined or "2112" in combined
        is_gold = any(
            w in combined for w in [
                "gold", "hallmark", "huid", "1417", "22k", "916", "18k", "750", "14k", "585",
                "jewellery", "jewelry", "karat", "carat", "purity", "ornament", "bangle", "necklace"
            ]
        )

        if not is_gold and not is_silver:
            return None

        metal = "Silver" if (is_silver and "gold" not in combined) else "Gold"
        std_code = self.silver_standard if metal == "Silver" else self.gold_standard
        marks_desc = MANDATORY_MARKS_SILVER if metal == "Silver" else MANDATORY_MARKS_GOLD
        marks_count = 4 if metal == "Silver" else 3
        grades = SILVER_PURITY_GRADES if metal == "Silver" else GOLD_PURITY_GRADES

        return HallmarkingInfo(
            metal=metal,
            standard_number=std_code,
            mandatory_marks_count=marks_count,
            mandatory_marks_description=marks_desc,
            huid_format=(
                "6-digit unique alphanumeric code (e.g., 'AB1234') laser-marked on every individual "
                "article at an accredited Assaying and Hallmarking Centre (AHC)."
            ),
            huid_verification_steps=HUID_VERIFICATION_STEPS,
            recognized_purity_grades=grades,
            mandatory_status=(
                "Mandatory across 343+ notified districts in India under the Hallmarking Quality Control Orders "
                "issued by the Ministry of Consumer Affairs, Food and Public Distribution. In notified districts, "
                "selling unhallmarked gold jewellery is an offense under the BIS Act, 2016."
            ),
            mandatory_districts_count=343,
            exemptions=MANDATORY_EXEMPTIONS,
            jeweller_registration=(
                "Zero Government Fees: Registration fees for jewellers have been completely waived. "
                "Lifetime Validity: Jeweller registration under Manakonline e-BIS is issued once with lifetime validity (no renewal required)."
            ),
            assaying_centres_standard=self.ahc_standard,
            consumer_remedy=(
                "Statutory Customer Compensation under Section 19 of BIS Act: If hallmarked jewellery is tested and found "
                "to be of lower purity than marked, the customer is entitled to reimbursement of testing charges plus "
                "compensation amounting to TWO TIMES (2x) the cost of the shortage in purity. Non-compliant jewellers face "
                "cancellation of registration and criminal penalties under Section 29."
            ),
        )


# Global service instance
hallmarking_service = HallmarkingService()
