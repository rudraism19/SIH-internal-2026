"""BIS License Lifecycle, Form-VI Renewal, Marking Fee, and Stop-Marking Service.

Provides authoritative intelligence on:
- Initial licence validity (1 or 2 years) under Scheme I (ISI Mark) vs Scheme II (CRS)
- Statutory Form-VI submission timelines (30-90 days prior to expiry via e-BIS)
- Annual minimum marking fee vs unit production rates
- 90-day grace period rules and late renewal penalty surcharges
- Statutory Stop-Marking triggers under Regulation 7 of BIS Conformity Assessment Regs 2018
- Legal enforcement consequences under Section 17 & Section 29 of the BIS Act, 2016
"""

import re
import logging
from typing import Dict, Any, List, Optional
from app.schemas.chat import LicenseRenewalInfo

logger = logging.getLogger(__name__)

LICENSE_RENEWAL_REGISTRY: List[Dict[str, Any]] = [
    # 1. DOMESTIC PRESSURE COOKERS
    {
        "standards": ["IS 2347:2017", "IS 2347"],
        "product_name": "Domestic Pressure Cookers",
        "scheme": "Scheme-I (ISI Mark)",
        "initial_validity_years": 1,
        "renewal_duration_options": [
            "1 Year (Standard Renewal)",
            "2 Years (Bi-Annual)",
            "5 Years (Long-Term Renewal with 10% fee concession)",
        ],
        "renewal_window": "Submit Form-VI online via Manakonline e-BIS 90 to 30 days prior to licence expiry date.",
        "statutory_form": "Form-VI (Application for Renewal of Licence) under Regulation 7 of BIS (Conformity Assessment) Regulations, 2018",
        "minimum_marking_fee_inr": "₹73,000 / year (or unit production rate of ₹0.75 per cooker marked, whichever is higher)",
        "production_return_requirement": "Audited Form-VII production return certified by a Chartered Accountant showing total units manufactured and ISI-marked during the preceding operative year.",
        "grace_period": "Up to 90 days post-expiry with mandatory late fee surcharge.",
        "late_fee_penalty": "₹5,000 + 18% GST late renewal surcharge for filing during the 90-day grace window.",
        "stop_marking_notice": (
            "STATUTORY STOP-MARKING WARNING: If Form-VI and marking fees are not submitted prior to expiry "
            "(or within the 90-day grace window), BIS issues an immediate Stop-Marking Notice under Regulation 7. "
            "Goods manufactured during stop-marking cannot legally bear the ISI Standard Mark. Selling uncertified "
            "pressure cookers violates the mandatory DPIIT QCO & attracts criminal prosecution, fines, and product "
            "seizure under Section 29 of the BIS Act, 2016."
        ),
        "renewal_checklist": [
            "Submit Form-VI online on Manakonline e-BIS at least 30 days before expiration.",
            "Furnish audited Form-VII statement of preceding production and CML marking quantity.",
            "Submit calibration certificates for hydraulic proof testing pumps and pressure gauges.",
            "Remit minimum marking fee (₹73,000/yr) + renewal application fee (₹1,000 + 18% GST).",
            "Verify that no pending corrective actions from previous BIS supervisory factory visits remain open.",
        ],
        "keywords": ["pressure cooker", "cooker", "cookware", "2347"],
    },

    # 2. TWO-WHEELER PROTECTIVE HELMETS
    {
        "standards": ["IS 4151:2020", "IS 4151"],
        "product_name": "Two-Wheeler Protective Helmets",
        "scheme": "Scheme-I (ISI Mark)",
        "initial_validity_years": 1,
        "renewal_duration_options": [
            "1 Year (Standard Renewal)",
            "2 Years (Bi-Annual)",
            "5 Years (Long-Term Renewal)",
        ],
        "renewal_window": "Submit Form-VI online on Manakonline 90 to 30 days prior to licence expiry.",
        "statutory_form": "Form-VI under Regulation 7 of BIS (Conformity Assessment) Regulations, 2018",
        "minimum_marking_fee_inr": "₹62,000 / year (or unit rate of ₹1.50 per helmet marked, whichever is higher)",
        "production_return_requirement": "Production return Form-VII certified by CA detailing shell sizes and batches produced with CML markings.",
        "grace_period": "90 days post-expiry with late penalty fee.",
        "late_fee_penalty": "₹5,000 + 18% GST late renewal surcharge.",
        "stop_marking_notice": (
            "MANDATORY VEHICLE SAFETY STOP-MARKING: Non-renewal automatically revokes ISI mark authorization. "
            "Under the Two-Wheeler Helmets (Quality Control) Order and Central Motor Vehicles Rules (CMVR), "
            "manufacturing, stocking, or retailing helmets without an active BIS licence is a cognizable offence."
        ),
        "renewal_checklist": [
            "File Form-VI online on e-BIS portal prior to 30-day cutoff.",
            "Upload internal routine testing records for dynamic retention and impact absorption.",
            "Provide annual calibration certificates for impact test drop rigs and headforms.",
            "Pay statutory marking fees and reconcile unit marking differences.",
        ],
        "keywords": ["helmet", "helmets", "two-wheeler helmet", "protective helmet", "4151"],
    },

    # 3. SMARTPHONES & IT ELECTRONICS
    {
        "standards": ["IS 13252 (Part 1):2010", "IS 13252", "IS 16046"],
        "product_name": "Smartphones, Laptops & IT Equipment",
        "scheme": "Scheme-II (Compulsory Registration Scheme - CRS)",
        "initial_validity_years": 2,
        "renewal_duration_options": [
            "2 Years (Standard CRS Renewal)",
            "5 Years (Long-Term CRS Renewal)",
        ],
        "renewal_window": "Submit renewal application on BIS CRS portal (crsbis.in) within 90 days before 2-year validity expiration.",
        "statutory_form": "Form-C (Application for Renewal of Registration) via BIS CRS portal (crsbis.in)",
        "minimum_marking_fee_inr": "Renewal fee ₹35,000 per model series + 18% GST (No recurring unit production marking fee under CRS)",
        "production_return_requirement": "Self-declaration undertaking and affidavit confirming zero modification in product hardware, critical safety components, enclosure, PCB layout, or manufacturing address.",
        "grace_period": "Up to 90 days after registration expiry with late penalty fee.",
        "late_fee_penalty": "₹5,000 + 18% GST per month of delay post-expiry.",
        "stop_marking_notice": (
            "CUSTOMS & EDI REGISTRATION SUSPENSION: Upon registration expiration, the R-Number (R-XXXXXXXX) "
            "is automatically flagged as 'Expired' in the ICEGATE customs EDI system. Consignments cannot clear "
            "Indian air/sea ports. Local sales violate the MeitY Electronics and IT Goods (CRO) Order, 2021."
        ),
        "renewal_checklist": [
            "Submit online renewal application on crsbis.in at least 30 days before expiration.",
            "Furnish 'No Change in Technical Specification' affidavit signed by authorized factory signatory.",
            "For foreign manufacturers, provide valid Authorised Indian Representative (AIR) agreement and ID.",
            "Remit renewal fee of ₹35,000 per model series.",
        ],
        "keywords": ["phone", "mobile", "smartphone", "laptop", "tablet", "electronics", "13252", "crs"],
    },

    # 4. TOILET SOAP
    {
        "standards": ["IS 2888:2004", "IS 2888"],
        "product_name": "Toilet Soap (Cakes)",
        "scheme": "Scheme-I (ISI Mark) — Voluntary Standard",
        "initial_validity_years": 1,
        "renewal_duration_options": [
            "1 Year (Standard)",
            "2 Years",
            "5 Years (Long-Term)",
        ],
        "renewal_window": "Submit Form-VI via Manakonline 60 to 30 days prior to licence expiry.",
        "statutory_form": "Form-VI via Manakonline e-BIS",
        "minimum_marking_fee_inr": "₹45,000 / year (or unit rate of ₹0.15 per kg Total Fatty Matter marked, whichever is higher)",
        "production_return_requirement": "Statement of actual production Form-VII certified by CA detailing metric tonnes manufactured under ISI marking.",
        "grace_period": "90 days post-expiry with late penalty fee.",
        "late_fee_penalty": "₹5,000 + 18% GST late surcharge.",
        "stop_marking_notice": (
            "VOLUNTARY LICENCE EXPIRY: If the licence is not renewed, the manufacturer must immediately cease "
            "printing the ISI mark on wrappers and retail cartons. However, because IS 2888 is voluntary (not under QCO), "
            "unmarked soap can continue to be manufactured and sold provided no false standard mark claims are made."
        ),
        "renewal_checklist": [
            "Submit Form-VI on Manakonline e-BIS portal.",
            "Submit preceding year's TFM production numbers and marking fee payment.",
            "Provide internal laboratory routine testing ledger for moisture and caustic alkali.",
        ],
        "keywords": ["soap", "toilet soap", "bathing bar", "2888"],
    },

    # 5. AUTOMOTIVE DIESEL
    {
        "standards": ["IS 1460:2017", "IS 1460"],
        "product_name": "Automotive Diesel Fuel (BS-VI)",
        "scheme": "Scheme-I (ISI Mark)",
        "initial_validity_years": 1,
        "renewal_duration_options": ["1 Year (Annual Industrial Licence)", "2 Years"],
        "renewal_window": "Submit Form-VI 90 to 30 days before licence expiry via Manakonline.",
        "statutory_form": "Form-VI under Regulation 7 of BIS Conformity Assessment Regulations, 2018",
        "minimum_marking_fee_inr": "₹1,25,000 / year + volume-based refinery throughput levy",
        "production_return_requirement": "Refinery certified monthly dispatch return and certificate of quality (CoQ) logs.",
        "grace_period": "90 days with late penalty fee.",
        "late_fee_penalty": "₹10,000 + 18% GST late fee for petroleum sector licences.",
        "stop_marking_notice": (
            "CRITICAL FUEL DISPATCH STOPPAGE: Non-renewal prevents issuance of certified fuel dispatch batches "
            "for retail and institutional distribution under Ministry of Petroleum mandates."
        ),
        "renewal_checklist": [
            "Form-VI submission with refinery dispatch reconciliation.",
            "Comprehensive test certificate verifying BS-VI sulfur compliance (≤ 10 ppm) and Cetane Index.",
            "Annual calibration reports for refinery automated testing analyzers.",
        ],
        "keywords": ["diesel", "fuel", "gasoil", "hsd", "1460"],
    },

    # 6. PACKAGED DRINKING WATER
    {
        "standards": ["IS 14543:2016", "IS 14543", "IS 13428:2005", "IS 13428"],
        "product_name": "Packaged Drinking Water",
        "scheme": "Scheme-I (ISI Mark) — Mandatory QCO & FSSAI",
        "initial_validity_years": 1,
        "renewal_duration_options": ["1 Year (Annual)", "2 Years"],
        "renewal_window": "Submit Form-VI online on Manakonline 90 to 30 days prior to expiry.",
        "statutory_form": "Form-VI via Manakonline e-BIS",
        "minimum_marking_fee_inr": "₹82,000 / year (or unit production fee per thousand bottles marked)",
        "production_return_requirement": "Monthly production returns Form-VII and water extraction volume records.",
        "grace_period": "90 days with late surcharge.",
        "late_fee_penalty": "₹5,000 + 18% GST late fee.",
        "stop_marking_notice": (
            "PUBLIC HEALTH IMMEDIATE STOP-MARKING: Water packaging without an active BIS licence is strictly "
            "prohibited under FSSAI regulations and BIS Act Section 17. Stop-marking results in factory sealing "
            "and prosecution under Section 29."
        ),
        "renewal_checklist": [
            "File Form-VI online on Manakonline.",
            "Furnish in-house microbiological laboratory test logs for coliforms, E.coli, and TVC.",
            "Provide independent NABL test report for pesticide residues and heavy metals (lead, arsenic).",
            "Proof of CGWA (Central Ground Water Authority) NOC renewal for borewell extraction.",
        ],
        "keywords": ["water", "drinking water", "packaged water", "mineral water", "14543", "13428"],
    },

    # 7. TMT STEEL REBARS
    {
        "standards": ["IS 1786:2008", "IS 1786", "IS 2062:2011", "IS 2062"],
        "product_name": "High Strength Deformed Steel Bars (TMT Rebars)",
        "scheme": "Scheme-I (ISI Mark) — Mandatory Steel QCO",
        "initial_validity_years": 1,
        "renewal_duration_options": ["1 Year", "2 Years", "5 Years (Long-Term)"],
        "renewal_window": "Submit Form-VI on Manakonline 90 to 30 days prior to annual licence expiry.",
        "statutory_form": "Form-VI via Manakonline e-BIS",
        "minimum_marking_fee_inr": "₹1,10,000 / year base fee + ₹4.50 per metric tonne of steel produced beyond threshold",
        "production_return_requirement": "CA-certified annual tonnage production return Form-VII reconciling melt/heat quantities with Mill Test Certificates (MTC).",
        "grace_period": "90 days with late penalty fee.",
        "late_fee_penalty": "₹5,000 + 18% GST late fee.",
        "stop_marking_notice": (
            "INFRASTRUCTURE COMPLIANCE HALT: Non-renewal immediately halts steel mill dispatch. Steel cannot "
            "be supplied to government, CPWD, NHAI, or private construction projects without active ISI marking."
        ),
        "renewal_checklist": [
            "Form-VI e-BIS submission with preceding tonnage returns.",
            "Calibration records for Universal Testing Machine (UTM) and extensometers.",
            "Chemical spectroscopy spectrometer calibration records (Carbon, Sulfur, Phosphorus limits).",
            "Payment of marking fee reconciled against actual mill production tonnage.",
        ],
        "keywords": ["steel", "tmt", "rebar", "deformed bar", "1786", "2062"],
    },
]


class LicenseLifecycleService:
    """Service to resolve BIS licence lifecycle, renewal windows, marking fees, and stop-marking conditions."""

    def __init__(self):
        self._registry = LICENSE_RENEWAL_REGISTRY

    def get_renewal_for_standard(self, standard_number: str) -> Optional[LicenseRenewalInfo]:
        """Look up licence renewal lifecycle info by Indian Standard code."""
        if not standard_number:
            return None
        norm_std = standard_number.strip().upper()
        for entry in self._registry:
            for std in entry["standards"]:
                if std.upper() in norm_std or norm_std in std.upper():
                    return self._to_model(entry)
        return None

    def get_renewal_for_product(self, product: str) -> Optional[LicenseRenewalInfo]:
        """Look up licence renewal lifecycle info by product keyword."""
        if not product:
            return None
        p_lower = product.lower()
        for entry in self._registry:
            if any(kw in p_lower for kw in entry["keywords"]):
                return self._to_model(entry)
        return None

    def resolve_renewal_info(
        self,
        query: str = "",
        standard_number: Optional[str] = None,
        product: Optional[str] = None,
    ) -> Optional[LicenseRenewalInfo]:
        """Resolves licence renewal info using standard number, product, or free text query."""
        if standard_number:
            info = self.get_renewal_for_standard(standard_number)
            if info:
                return info

        if product:
            info = self.get_renewal_for_product(product)
            if info:
                return info

        if query:
            q_lower = query.lower()
            std_match = re.search(r"IS\s*(\d+)", query, re.IGNORECASE)
            if std_match:
                info = self.get_renewal_for_standard(f"IS {std_match.group(1)}")
                if info:
                    return info

            for entry in self._registry:
                if any(kw in q_lower for kw in entry["keywords"]):
                    return self._to_model(entry)

        return None

    def _to_model(self, entry: Dict[str, Any]) -> LicenseRenewalInfo:
        return LicenseRenewalInfo(
            standard_number=entry["standards"][0],
            product_name=entry["product_name"],
            scheme=entry["scheme"],
            initial_validity_years=entry["initial_validity_years"],
            renewal_duration_options=entry["renewal_duration_options"],
            renewal_window=entry["renewal_window"],
            statutory_form=entry["statutory_form"],
            minimum_marking_fee_inr=entry["minimum_marking_fee_inr"],
            production_return_requirement=entry["production_return_requirement"],
            grace_period=entry["grace_period"],
            late_fee_penalty=entry["late_fee_penalty"],
            stop_marking_notice=entry["stop_marking_notice"],
            renewal_checklist=entry["renewal_checklist"],
        )


# Global service singleton
license_lifecycle_service = LicenseLifecycleService()
