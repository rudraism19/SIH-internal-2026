"""Predefined BIS domain responses for non-RAG generic and foundational queries.

Provides authoritative, structured answers, executive breakdowns, and actionable next steps for:
- certification_process (Step-by-step Scheme-I ISI application via Manakonline)
- schemes_difference (Scheme-I ISI vs Scheme-II CRS vs FMCS vs Hallmarking)
- fee_structure (Application, inspection, testing, marking fees, MSME concessions)
- fmcs_certification (Foreign Manufacturers Certification Scheme & AIR)
- crs_registration (Compulsory Registration Scheme for Electronics / MeitY)
- hallmarking_general (Gold & silver hallmarking, 6-digit HUID, BIS Care verification)
- renewal_lifecycle (Form-VI renewal, grace period, Regulation 7 stop-marking)
- customs_import (HSN tariff mapping, DGFT import policy, ICEGATE holds)
- consumer_rights (BIS Care App features, fake mark complaints, Section 19 redressal)
- laboratory (Central Lab Sahibabad, Regional Labs, NABL LRS recognition)
- qco_requirement (Statutory QCO mandate, Line Ministries, Section 29 penalties)
- general_bis (BIS mandate, BIS Act 2016, 15 Division Councils)
- greeting & unsupported
"""
from typing import Dict, Any
from app.schemas.chat import ResponseMode


SCHEMES_DIFFERENCE_RESPONSE = {
    "answer": (
        "### Comparison of Major BIS Conformity Assessment Schemes\n\n"
        "The Bureau of Indian Standards (BIS) operates several distinct certification schemes tailored to product categories, manufacturing location, and regulatory mandates:\n\n"
        "| Parameter | **Scheme I: ISI Mark** | **Scheme II: CRS (Electronics)** | **FMCS (Foreign Scheme)** | **Hallmarking Scheme** |\n"
        "|---|---|---|---|---|\n"
        "| **Marking Type** | ISI Standard Mark with CM/L number | Standard Mark with R-number (`crsbis.in`) | ISI Mark with foreign CM/L | 3 Marks: BIS Logo, Karatage, 6-digit HUID |\n"
        "| **Product Scope** | Industrial, consumer goods, food, steel, cement, chemicals, appliances | Electronics, IT hardware, solar PV, mobile batteries, LED lighting | All non-Indian manufacturers exporting to India | Gold jewellery (IS 1417) & Silver articles (IS 2112) |\n"
        "| **Governing Portal** | `manakonline.in` (e-BIS) | `crsbis.in` (CRS Portal) | `manakonline.in` (FMCD) | `manakonline.in` (Hallmarking) |\n"
        "| **Factory Audit** | **Mandatory** on-site physical audit by BIS technical officers | **Not Required** (Desk assessment of test reports) | **Mandatory** on-site audit of overseas factory | Not applicable to jewellers (Assaying centres audited) |\n"
        "| **Testing Regime** | In-house factory lab + independent lab sample testing | Sample testing strictly at BIS-recognized Indian labs (report valid 90 days) | In-house factory lab + independent Indian lab testing | XRF testing + Fire Assay at recognized AHC centres |\n"
        "| **Local Representative** | Domestic manufacturer's authorized signatory | Authorized Indian Representative (AIR) required for foreign brands | Mandatory Authorized Indian Representative (AIR) | Registered retail/wholesale jeweller |\n"
        "| **Licence Validity** | 1 to 2 years initially (renewable up to 5 years via Form-VI) | 2 years initially (renewable up to 5 years) | 1 to 2 years (renewable via FMCD) | **Lifetime** registration validity (zero annual renewal) |\n"
        "| **Government Fees** | ₹1,000 application + inspection + annual marking fee | ₹1,000 application + processing + renewal fee | $1,000 USD application + audit travel costs + $10,000 PBG | **₹0 (Zero government fee)** for jeweller registration |\n\n"
        "**Key Distinction**: Scheme-I guarantees end-to-end quality via factory inspection and continuous surveillance, whereas Scheme-II (CRS) is a self-declaration of conformity based purely on laboratory type testing."
    ),
    "next_steps": [
        "Determine your product's category to identify whether Scheme I (ISI) or Scheme II (CRS) applies.",
        "For electronics and IT hardware, register on the CRS portal (crsbis.in).",
        "For domestic manufacturing of industrial and consumer goods, apply via Manakonline (manakonline.in).",
        "For overseas manufacturing facilities, appoint an Authorized Indian Representative (AIR) under FMCS.",
    ],
    "next_question": "Which scheme or product category would you like to explore in detail?",
    "actions": [
        {"label": "Scheme I (ISI Mark)", "query": "How do I apply for Scheme I ISI Mark certification?", "type": "scheme"},
        {"label": "Scheme II (CRS)", "query": "What is Compulsory Registration Scheme (CRS) for electronics?", "type": "scheme"},
        {"label": "Foreign Scheme (FMCS)", "query": "What are the requirements for Foreign Manufacturers Certification Scheme (FMCS)?", "type": "scheme"},
        {"label": "Hallmarking", "query": "How does gold hallmarking work and how do I check HUID?", "type": "hallmark"},
    ],
}


FEE_STRUCTURE_RESPONSE = {
    "answer": (
        "### Official BIS Certification Fee Structure & Government Charges\n\n"
        "The fee structure for obtaining and maintaining a BIS licence (Scheme-I ISI Mark and Scheme-II CRS) consists of the following statutory heads:\n\n"
        "#### 1. Application & Processing Fees\n"
        "• **Application Fee (Form-V)**: ₹1,000 (Non-refundable, paid at the time of online submission on Manakonline).\n"
        "• **Processing Fee**: ₹5,000 (Payable prior to technical evaluation and file processing).\n\n"
        "#### 2. Factory Audit & Inspection Charges (Scheme-I & FMCS)\n"
        "• **Domestic Factory Inspection Fee**: ₹7,000 per auditor per day (manday charge), plus actual travel and boarding expenses.\n"
        "• **Foreign Factory Inspection Fee (FMCS)**: Actual travel expenses, per diem allowances, visa charges, and hotel accommodation for two BIS auditors.\n\n"
        "#### 3. Independent Laboratory Testing Charges\n"
        "• Testing charges vary significantly depending on the product standard (e.g., ₹5,000–₹15,000 for pressure cookers; ₹30,000–₹80,000 for electrical cables/helmets; ₹1,00,000+ for complex BS-VI fuels or solar panels).\n"
        "• Testing charges are paid directly to the BIS Central/Regional Lab or BIS-recognized (LRS) testing facility.\n\n"
        "#### 4. Annual Minimum Marking Fee (Scheme-I)\n"
        "• Upon grant of licence, the licensee must pay an annual minimum marking fee, which is adjusted against unit production returns (Form-VII).\n"
        "• Typical minimum marking fee ranges from **₹1,000 to ₹50,000+ per annum**, depending on the product classification and production volume.\n\n"
        "#### 5. Statutory MSME & Women Entrepreneur Concessions\n"
        "• **Micro Enterprises**: Eligible for a **50% concession** on minimum marking fee for select product categories.\n"
        "• **Small Enterprises (MSME)**: Eligible for a **20% concession** on minimum marking fee.\n"
        "• **Women Entrepreneurs & Startups**: Eligible for special fee concessions upon providing valid Udyam Registration.\n\n"
        "#### 6. Special Schemes\n"
        "• **Hallmarking Jeweller Registration**: **₹0 Government Fee** (Completely free with lifetime validity under Manakonline).\n"
        "• **FMCS Performance Bank Guarantee**: Overseas applicants must furnish a **USD 10,000** Performance Bank Guarantee (PBG) issued by an RBI-approved bank."
    ),
    "next_steps": [
        "Ensure your enterprise has a valid Udyam Registration certificate to claim 20%–50% MSME marking fee concessions.",
        "Check the exact product manual on manakonline.in for the specific minimum marking fee rate for your standard.",
        "Budget for factory testing bench equipment calibration and third-party laboratory testing fees.",
    ],
    "next_question": "Would you like to calculate estimated laboratory testing charges or factory inspection fees for your product?",
    "actions": [
        {"label": "Certification Process", "query": "How does BIS certification work?", "type": "certification"},
        {"label": "Packaged Water", "query": "I want to start a packaged drinking water business", "type": "product"},
        {"label": "Toilet Soap", "query": "BIS standard for soap", "type": "product"},
        {"label": "Helmets", "query": "What are the requirements for helmets?", "type": "product"},
    ],
}


FMCS_CERTIFICATION_RESPONSE = {
    "answer": (
        "### Foreign Manufacturers Certification Scheme (FMCS)\n\n"
        "Under the **Foreign Manufacturers Certification Scheme (FMCS)**, the Bureau of Indian Standards grants licences to foreign manufacturing units to use the standard ISI Mark on products exported to India.\n\n"
        "#### Key Requirements for Foreign Manufacturers:\n"
        "1. **Authorized Indian Representative (AIR)**:\n"
        "   - The overseas manufacturer must appoint an Authorized Indian Representative who is a resident Indian citizen or a registered legal entity in India.\n"
        "   - The AIR serves as the legal liaison responsible for compliance, summons, and statutory obligations under the BIS Act, 2016.\n"
        "2. **Online Application Submission**:\n"
        "   - Submit Form-V on the BIS Manakonline portal (FMCD section) accompanied by manufacturing flow charts, machinery lists, quality control staff qualifications, and testing equipment calibration certificates.\n"
        "   - Statutory application fee: **USD 1,000**.\n"
        "3. **Physical Overseas Factory Audit**:\n"
        "   - A team of two BIS technical officers conducts an on-site physical inspection of the overseas manufacturing premises.\n"
        "   - The applicant bears all auditor travel expenses, business class/economy airfare as per rules, per diem allowances, and hotel arrangements.\n"
        "4. **Sample Drawing & Independent Testing**:\n"
        "   - Product samples are sealed during the factory audit and dispatched to accredited BIS laboratories in India for complete specification testing.\n"
        "5. **Performance Bank Guarantee (PBG)**:\n"
        "   - The licensee must furnish a **USD 10,000 Performance Bank Guarantee** from a scheduled bank in India having RBI approval.\n"
        "6. **Grant of Licence & Port Customs Clearance**:\n"
        "   - Once granted, a unique CM/L (Certification Marks Licence) number is issued. The foreign unit must mark every export shipment with the ISI logo, standard number, and CM/L number to clear Indian Customs (ICEGATE)."
    ),
    "next_steps": [
        "Appoint and execute an agreement with an Authorized Indian Representative (AIR) residing in India.",
        "Submit Form-V along with in-house laboratory calibration certificates on manakonline.in (FMCD portal).",
        "Coordinate with your Indian customs broker to ensure the CM/L number is declared on import Bills of Entry.",
    ],
}


CRS_REGISTRATION_RESPONSE = {
    "answer": (
        "### Compulsory Registration Scheme (CRS) for Electronics & IT Goods\n\n"
        "The **Compulsory Registration Scheme (CRS)** is governed under Scheme-II of the BIS (Conformity Assessment) Regulations, 2018, primarily covering electronic and information technology products notified by the Ministry of Electronics and Information Technology (MeitY) and Ministry of New and Renewable Energy (MNRE).\n\n"
        "#### How CRS Differs from Scheme-I (ISI Mark):\n"
        "• **Self-Declaration of Conformity (SDoC)**: Unlike Scheme-I, CRS **does not require an on-site factory audit** by BIS officers prior to registration.\n"
        "• **Laboratory Testing Driven**: Registration is granted solely on the basis of a passing test report issued by a BIS-recognized testing laboratory in India.\n"
        "• **Strict 90-Day Test Report Validity**: The online application on `crsbis.in` must be filed within **90 days** of the date of test report issuance.\n\n"
        "#### Key Products Covered under CRS:\n"
        "• Laptops, tablets, smartphones, and power adapters (IS 13252 Part 1)\n"
        "• Secondary lithium-ion cells and battery packs (IS 16046 Part 2)\n"
        "• Self-ballasted LED lamps and LED controlgear (IS 16102 Part 1 / IS 15885 Part 2/Sec 13)\n"
        "• Uninterruptible Power Systems (UPS) and solar inverters (IS 16242 Part 1)\n"
        "• Smart watches, point-of-sale (POS) terminals, and television sets\n\n"
        "#### CRS Labeling & Standard Mark Requirements:\n"
        "All registered goods must clearly display the CRS Standard Mark:\n"
        "```\n"
        "       IS [Standard Number]\n"
        "           [BIS Logo]\n"
        "         R-XXXXXXXX\n"
        "       www.crsbis.in\n"
        "```\n"
        "The 8-digit registration number (`R-XXXXXXXX`) and official portal URL (`www.crsbis.in`) are legally mandatory on both the product label and retail packaging."
    ),
    "next_steps": [
        "Send product sample units to an accredited BIS-recognized laboratory in India for safety testing.",
        "File the registration application on crsbis.in within 90 days of receiving the test report.",
        "Ensure the label artwork includes the R-number and portal URL before commercial production or import.",
    ],
}


HALLMARKING_GENERAL_RESPONSE = {
    "answer": (
        "### Bureau of Indian Standards (BIS) Gold & Silver Hallmarking Intelligence\n\n"
        "Hallmarking is the accurate determination and official recording of the proportionate content of precious metal in gold and silver articles. In India, hallmarking is governed by the **Bureau of Indian Standards (Hallmarking) Regulations** under the BIS Act, 2016.\n\n"
        "#### 1. The 3 Mandatory Marks on Gold Jewellery\n"
        "Since 1st July 2021, every hallmarked gold article must bear exactly **3 marks** applied by an Assaying and Hallmarking Centre (AHC):\n"
        "1. **BIS Standard Mark**: The triangular BIS Logo confirming official certification.\n"
        "2. **Purity in Karat & Fineness**: For example:\n"
        "   • **24K999** (99.9% pure gold)\n"
        "   • **22K916** (91.6% pure gold — most common for traditional jewellery)\n"
        "   • **20K833** (83.3% pure gold)\n"
        "   • **18K750** (75.0% pure gold — common for diamond-studded jewellery)\n"
        "   • **14K585** (58.5% pure gold)\n"
        "   • **9K375** (37.5% pure gold)\n"
        "3. **6-Digit Alphanumeric HUID**: A unique Hallmark Unique Identification code laser-engraved on each individual jewellery piece.\n\n"
        "#### 2. Mandatory Hallmarking Rollout & Coverage\n"
        "• Hallmarking is legally mandatory across **343+ notified districts** across India.\n"
        "• Selling non-hallmarked gold jewellery in these notified districts is a punishable offense under Section 29 of the BIS Act.\n\n"
        "#### 3. Statutory Exemptions from Mandatory Hallmarking:\n"
        "• Jewellers with an annual turnover up to **₹40 Lakh**.\n"
        "• Gold articles weighing **less than 2.0 grams**.\n"
        "• Jewellery manufactured strictly for export purposes.\n"
        "• Gold thread (Jari) and gold bullion/bars meant for industrial use.\n\n"
        "#### 4. Jeweller Registration on Manakonline:\n"
        "• **₹0 Government Fee**: Jeweller registration is completely free of cost.\n"
        "• **Lifetime Validity**: No periodic renewal or re-registration fees are required.\n\n"
        "#### 5. Consumer Verification & Legal Redressal (Section 19):\n"
        "• Consumers can verify any 6-digit HUID code using the official **BIS Care App** under the 'Verify HUID' tab.\n"
        "• **Statutory Compensation**: Under Section 19 of the BIS Act, 2016, if the purity of a hallmarked piece is found to be lower than stated, the jeweller is legally obligated to refund the customer **two times (2x)** the value of the shortfall."
    ),
    "next_steps": [
        "Download the official BIS Care App (iOS/Android) and use 'Verify HUID' to check the authenticity of any gold jewellery.",
        "Ensure your purchase invoice explicitly states the 6-digit HUID code, gross weight, net precious metal weight, and purity grade.",
        "If you are a jeweller, obtain free lifetime registration on manakonline.in under the Hallmarking module.",
    ],
}


RENEWAL_LIFECYCLE_RESPONSE = {
    "answer": (
        "### BIS Licence Renewal, Form-VI Filing & Stop-Marking Rules\n\n"
        "A BIS Licence to use the Standard Mark (Scheme-I ISI Mark) is initially granted for a period of **1 or 2 years** and must be periodically renewed to maintain legal manufacturing and distribution rights.\n\n"
        "#### 1. Statutory Renewal Window (Form-VI)\n"
        "• **Filing Window**: Licensees must submit the renewal application (**Form-VI**) online via e-BIS on `manakonline.in` **not later than 30 days before the date of licence expiry** (the filing window opens 90 days before expiry).\n"
        "• **Renewal Duration**: Licences can be renewed for a duration of **1 to 5 years**, depending on the applicant's preference and track record.\n\n"
        "#### 2. Mandatory Submissions with Form-VI\n"
        "1. **Form-VII Production Return**: Detailed statement of total units manufactured, units marked with the ISI logo, and dispatch quantities during the operative period.\n"
        "2. **Marking Fee Reconciliation**: Payment of the annual minimum marking fee or unit-rate fee (whichever is higher), minus any MSME concessions.\n"
        "3. **Factory SIT Quality Audit Records**: Verification that test benches have been calibrated by NABL-accredited facilities and routine in-line testing logs are maintained.\n"
        "4. **Declaration of Non-Conformity**: Confirmation that zero uncorrected test failures occurred during the surveillance period.\n\n"
        "#### 3. 90-Day Grace Period & Late Surcharges\n"
        "• If a licensee fails to apply 30 days prior to expiry, the application may be submitted during the **90-day statutory grace period** after expiry, subject to payment of a late fee surcharge (typically **10% of the marking fee or ₹5,000**, whichever is higher).\n\n"
        "#### 4. Automatic Stop-Marking Notice (Regulation 7)\n"
        "• **Warning**: If the licence is not renewed prior to its expiry date, the licensee is placed under an **automatic Stop-Marking Notice** under Regulation 7 of the BIS (Conformity Assessment) Regulations, 2018.\n"
        "• Applying the ISI Mark or distributing goods with the Standard Mark while under stop-marking is a **criminal violation under Section 29 of the BIS Act, 2016**, attracting fines and imprisonment."
    ),
    "next_steps": [
        "Check your current licence expiry date on the e-BIS dashboard (manakonline.in).",
        "Compile your Form-VII production figures and calibration certificates 90 days in advance.",
        "Submit Form-VI at least 30 days before expiry to avoid statutory late fee surcharges and stop-marking notices.",
    ],
}


CUSTOMS_IMPORT_RESPONSE = {
    "answer": (
        "### Customs Port Clearance & ICEGATE Compliance for BIS Regulated Items\n\n"
        "Import of goods into India that fall under mandatory Quality Control Orders (QCOs) is strictly governed by the Directorate General of Foreign Trade (DGFT) and the Central Board of Indirect Taxes and Customs (CBIC).\n\n"
        "#### 1. Automated ICEGATE Customs Clearance Holds\n"
        "• The Indian Customs Electronic Commerce/Electronic Data Interchange Gateway (**ICEGATE**) maintains automated risk management system (RMS) validation for HSN tariff codes covered under mandatory BIS standards.\n"
        "• If a Bill of Entry is filed for a regulated HSN code without a verified Foreign Manufacturers Certification Scheme (FMCS) licence number or CRS Registration number, ICEGATE places an **automated regulatory hold** on the consignment.\n\n"
        "#### 2. Mandatory Declarations on Bill of Entry\n"
        "Importers must provide the following documentation at Indian ports of entry (Air Cargo, Sea Ports, ICDs):\n"
        "1. **Valid BIS Licence Number (CM/L or R-Number)**: Must belong to the exact foreign manufacturing factory location stated on the shipping documents.\n"
        "2. **Physical Marking on Goods**: The ISI Mark or CRS Standard Mark must be legibly and indelibly embossed or labeled on the product and primary retail carton before port arrival.\n"
        "3. **Pre-Shipment Factory Test Certificate (TC)**: Confirming batch compliance against the relevant Indian Standard.\n"
        "4. **Country of Origin Certificate & Commercial Invoice**: Referencing the applicable IS standard code.\n\n"
        "#### 3. Statutory Import Exemptions\n"
        "• **100% Export Oriented Units (EOU) / SEZ Units**: Raw materials and components imported strictly for processing and 100% re-export are exempt from domestic QCO enforcement.\n"
        "• **Advance Authorization**: Imports under valid DGFT Advance Authorization for export production.\n"
        "• **Prototype R&D Imports**: Limited sample quantities (typically up to 5–10 units) imported exclusively for research, development, or type testing, subject to non-commercial disposal undertakings.\n\n"
        "#### 4. Consequences of Non-Compliance\n"
        "Goods arriving without valid BIS certification cannot be cleared for home consumption. Customs authorities will issue a show-cause notice requiring either **mandatory re-export** to the foreign origin at the importer's cost or **confiscation and destruction** under the Customs Act, 1962."
    ),
    "next_steps": [
        "Verify that your overseas manufacturing plant holds a valid BIS FMCS licence before placing purchase orders.",
        "Ensure the product packaging bears the registered BIS Standard Mark prior to shipment dispatch.",
        "Declare the exact CM/L or CRS number in the Single Window Interface for Facilitating Trade (SWIFT) on ICEGATE.",
    ],
}


CONSUMER_RIGHTS_RESPONSE = {
    "answer": (
        "### Consumer Rights, Product Verification & BIS Care App\n\n"
        "The Bureau of Indian Standards provides robust digital mechanisms enabling Indian citizens and consumers to verify product quality, detect counterfeit marks, and enforce statutory compensation remedies.\n\n"
        "#### 1. The Official BIS Care App\n"
        "Available on both Google Play Store and Apple App Store, the **BIS Care App** provides 5 core consumer features:\n"
        "1. **Verify Licence (ISI Mark)**: Enter the 7 or 8-digit CM/L number marked below the ISI logo to instantly view the manufacturer's name, factory address, standard number, and licence validity status.\n"
        "2. **Verify CRS Registration**: Enter the 8-digit R-number (e.g., `R-41000000`) on electronics, chargers, and mobile phones to verify registered brand and model numbers.\n"
        "3. **Verify HUID (Hallmarking)**: Enter the 6-character alphanumeric code marked on gold jewellery to view the hallmarking date, jeweller registration, assaying centre (AHC), and confirmed purity grade.\n"
        "4. **Know Your Standards**: Search technical specifications and Indian Standards across all consumer product categories.\n"
        "5. **Lodge Complaints**: Directly report misuse of the ISI mark, substandard goods, non-functional hallmarking, or misleading quality claims.\n\n"
        "#### 2. Statutory Remedies Under the BIS Act, 2016\n"
        "• **Section 19 (Consumer Compensation)**: If a hallmarked precious metal article does not conform to the declared purity, the consumer is entitled to compensation amounting to **two times (2x) the value of the purity deficiency**, calculated at prevailing market rates.\n"
        "• **Section 29 (Criminal Penalties)**: Counterfeiting or unauthorized use of the ISI Mark or BIS Standard Mark attracts imprisonment up to 2 years and minimum fines of ₹2,00,000 (up to 10 times the value of the manufactured or sold goods)."
    ),
    "next_steps": [
        "Download the BIS Care App on your mobile device to verify products before purchasing.",
        "Always demand an invoice mentioning the BIS CM/L number or 6-digit HUID code for legal protection.",
        "Lodge formal quality grievances through the BIS Care App or via the national consumer helpline (1915).",
    ],
}


LABORATORY_RESPONSE = {
    "answer": (
        "### BIS Laboratory Testing Infrastructure & Recognition Scheme\n\n"
        "The Bureau of Indian Standards operates an extensive nationwide testing network to evaluate product conformity against Indian Standards (IS codes):\n\n"
        "#### 1. BIS Central Laboratory (CL)\n"
        "• Located in **Sahibabad (Ghaziabad, NCR)**, the Central Laboratory is the apex testing facility in India, equipped with state-of-the-art analytical instrumentation across chemical, mechanical, electrical, microbiological, and civil engineering disciplines.\n\n"
        "#### 2. BIS Regional Laboratories\n"
        "Five full-scale regional laboratories support regional compliance testing:\n"
        "• **Southern Regional Laboratory (SRL)**: Chennai\n"
        "• **Eastern Regional Laboratory (ERL)**: Kolkata\n"
        "• **Northern Regional Laboratory (NRL)**: Chandigarh\n"
        "• **Western Regional Laboratory (WRL)**: Mumbai\n"
        "• **North Eastern Regional Laboratory (NERL)**: Guwahati\n\n"
        "#### 3. BIS Branch Laboratories\n"
        "Specialized branch testing facilities operate in key industrial hubs, including **Patna, Bangalore, Hyderabad, Ahmedabad, and Durgapur**.\n\n"
        "#### 4. Laboratory Recognition Scheme (LRS)\n"
        "• Under **Section 32 of the Bureau of Indian Standards Act, 2016**, BIS audits and recognizes competent third-party testing laboratories.\n"
        "• Recognized labs must hold valid **NABL accreditation (ISO/IEC 17025)** for the specific parameters and test methods covered under the relevant Indian Standard.\n"
        "• Samples drawn during initial factory audits or ongoing surveillance audits are tested at these LRS-recognized facilities with legally binding test reports."
    ),
    "next_steps": [
        "Search the complete directory of BIS-recognized laboratories on manakonline.in under the LRS portal.",
        "Verify whether your product's mandatory test parameters must be evaluated at internal or recognized LRS facilities.",
        "Ask me: 'What laboratory tests are required for [your product]?' to inspect specific test parameters.",
    ],
}


QCO_REQUIREMENT_RESPONSE = {
    "answer": (
        "### Quality Control Orders (QCOs) & Mandatory BIS Certification\n\n"
        "A **Quality Control Order (QCO)** is a statutory order issued by Central Government Line Ministries in exercise of powers conferred by **Section 16, Section 17, and Section 25 of the Bureau of Indian Standards Act, 2016**.\n\n"
        "#### 1. Legal Mandate & Zero-Tolerance Enforcement\n"
        "• Once a QCO comes into force, **no person can manufacture, import, store, sell, or distribute** the notified goods in India without a valid BIS Licence (ISI Mark under Scheme-I) or CRS Registration under Scheme-II.\n"
        "• The product must mandatorily bear the BIS Standard Mark along with the unique licence number (CM/L or R-number).\n\n"
        "#### 2. Key Line Ministries Issuing QCOs\n"
        "• **DPIIT (Ministry of Commerce & Industry)**: Domestic pressure cookers, helmets, toys, footwear, wooden furniture, insulated flasks, cement, and gas stoves.\n"
        "• **Ministry of Steel**: Steel rebars (TMT), structural steel, tinplate, carbon steel pipes, and wire rods.\n"
        "• **MeitY**: Laptops, mobile phones, power adapters, LED bulbs, smart watches, and secondary batteries.\n"
        "• **Ministry of Chemicals & Petrochemicals**: Acetic acid, caustic soda, methanol, polymers, and industrial chemicals.\n"
        "• **Ministry of Mines**: Copper rods, aluminium alloys, and zinc ingots.\n\n"
        "#### 3. Penalties for Non-Compliance (Section 29 of BIS Act)\n"
        "Manufacturing or selling products covered under a mandatory QCO without certification is a criminal offense attracting:\n"
        "• **Imprisonment up to two (2) years**.\n"
        "• **Substantial monetary fines**: Minimum ₹2,00,000 for the first contravention, extending up to **10 times the value** of the manufactured or sold goods.\n"
        "• **Confiscation & destruction** of all non-compliant inventory by authorized BIS enforcement officers."
    ),
    "next_steps": [
        "Check published QCOs on bis.gov.in under 'Conformity Assessment' -> 'Quality Control Orders'.",
        "Ask me: 'Is BIS mandatory for [your product]?' to check whether a QCO currently applies.",
        "Initiate your BIS Scheme-I or CRS application well before the QCO implementation deadline.",
    ],
}


CERTIFICATION_PROCESS_RESPONSE = {
    "answer": (
        "Yes. BIS certification generally involves identifying the applicable Indian Standard, "
        "checking whether certification is mandatory under a Quality Control Order (QCO), "
        "determining the applicable conformity-assessment scheme (such as Scheme I for ISI Mark or Scheme II for CRS), "
        "completing required testing in an accredited laboratory, and following the applicable BIS application and factory audit process.\n\n"
        "Here is the standard 5-step roadmap:\n"
        "1. **Identify the Standard**: Determine the relevant Indian Standard (IS code) and review its product manual.\n"
        "2. **Prepare Factory Infrastructure**: Set up an in-house testing laboratory with calibrated instruments.\n"
        "3. **File Application**: Register on **`manakonline.in`** (e-BIS) and submit Form-V with plant layouts and documentation.\n"
        "4. **Factory Audit & Sample Testing**: A BIS technical officer inspects the manufacturing premises and draws samples for testing.\n"
        "5. **Grant of Licence**: Once factory inspection and lab test results satisfy the standard, BIS issues your CM/L licence.\n\n"
        "If you tell me your specific product, I can identify the relevant standard, check if certification is mandatory, and guide you through the exact requirements."
    ),
    "next_question": "What product are you planning to manufacture or certify?",
    "actions": [
        {"label": "Packaged Water", "query": "I want to start a packaged drinking water business", "type": "product"},
        {"label": "Toilet Soap", "query": "BIS standard for soap", "type": "product"},
        {"label": "Helmets", "query": "What are the requirements for helmets?", "type": "product"},
        {"label": "Fee Structure", "query": "What is the fee structure for BIS certification?", "type": "fees"},
        {"label": "Compare Schemes", "query": "What is the difference between Scheme I and Scheme II?", "type": "scheme"},
    ],
    "next_steps": [
        "Tell me your product name to identify the exact IS standard and QCO status.",
        "Visit manakonline.in to register your manufacturing facility under e-BIS.",
        "Check fee schedules and required testing infrastructure.",
    ],
}


GENERAL_BIS_RESPONSE = {
    "answer": (
        "### Overview of the Bureau of Indian Standards (BIS)\n\n"
        "The **Bureau of Indian Standards (BIS)** is the National Standards Body of India, established under the **Bureau of Indian Standards Act, 2016** under the aegis of the Ministry of Consumer Affairs, Food & Public Distribution, Government of India.\n\n"
        "**Core Mandates & Functions:**\n"
        "• **Standards Formulation**: Formulates national Indian Standards (IS codes) harmonized with international ISO/IEC benchmarks across 15 Division Councils.\n"
        "• **Product Certification (ISI Mark & CRS)**: Grants licences to domestic and foreign manufacturers to use the iconic Standard Mark ensuring safety and quality.\n"
        "• **Mandatory Quality Control Orders (QCO)**: Enforces statutory conformity assessment orders notified by Central Line Ministries.\n"
        "• **Precious Metals Hallmarking**: Regulates mandatory purity certification of gold (IS 1417) and silver (IS 2112) with laser-engraved 6-digit HUID.\n"
        "• **National Testing Laboratory Network**: Operates apex testing facilities and audits NABL-accredited commercial labs under the Laboratory Recognition Scheme (LRS).\n\n"
        "To check requirements for a specific product, simply tell me the product name or IS standard code."
    ),
    "next_steps": [
        "Tell me your product name to check applicable Indian Standards and mandatory status.",
        "Verify standard marks and licences on the official BIS Care mobile application or manakonline.in."
    ],
    "next_question": "What product or industrial sector would you like to explore?",
    "actions": [
        {"label": "Certification Process", "query": "How does BIS certification work?", "type": "certification"},
        {"label": "Compare Schemes", "query": "What is the difference between Scheme I and Scheme II?", "type": "scheme"},
        {"label": "Fee Schedule", "query": "What is the fee structure for BIS certification?", "type": "fees"},
    ],
    "response_mode": ResponseMode.GENERAL_CONVERSATION,
}


GREETING_RESPONSE = {
    "answer": (
        "Hello! I am **BIS Saarthi**, your AI assistant for the Bureau of Indian Standards.\n\n"
        "I can help you with:\n"
        "• **Indian Standards**: Finding the applicable IS code and product specifications for your product.\n"
        "• **Certification**: Step-by-step guidance for Scheme-I (ISI Mark), Scheme-II (CRS), and FMCS for foreign manufacturers.\n"
        "• **Mandatory QCOs**: Checking whether BIS certification is legally compulsory before manufacture or import.\n"
        "• **Testing & Hallmarking**: Laboratory test parameters, accredited testing facilities, and gold/silver HUID verification.\n\n"
        "Which product or standard would you like to explore today?"
    ),
    "next_steps": [],
    "next_question": "What product or standard would you like assistance with?",
    "actions": [
        {"label": "How Certification Works", "query": "How does BIS certification work?", "type": "certification"},
        {"label": "Search Product Standard", "query": "What Indian Standards apply to packaged drinking water?", "type": "standard"},
        {"label": "Gold Hallmarking & HUID", "query": "How does gold hallmarking work and how do I check HUID?", "type": "hallmark"},
        {"label": "Fee Structure", "query": "What is the fee structure for BIS certification?", "type": "fees"},
    ],
    "response_mode": ResponseMode.GENERAL_CONVERSATION,
}


UNSUPPORTED_RESPONSE = {
    "answer": (
        "### Bureau of Indian Standards (BIS) Assistant\n\n"
        "I specialize strictly in Indian Standards (IS), product certification schemes (ISI Mark, CRS, FMCS), Quality Control Orders (QCOs), testing parameters, and gold/silver hallmarking.\n\n"
        "I can help you with:\n"
        "• **Finding Indian Standards**: Ask about standards for any industrial or consumer product.\n"
        "• **Certification Procedures**: Step-by-step guidance to apply for an ISI Mark or CRS Registration on Manakonline.\n"
        "• **Testing Specifications**: Clause-level testing benchmarks, chemical limits, and recognized laboratories.\n"
        "• **Regulatory Compliance**: Determining whether a product is mandatory under an active Quality Control Order.\n"
        "• **Fee Structures & Renewals**: Official government charges, MSME concessions, and Form-VI timelines."
    ),
    "next_steps": [
        "Ask a product-specific question (e.g., 'What standard applies to cement?' or 'What are the requirements for helmets?').",
        "Ask about certification: 'How do I get an ISI mark for my product?'",
        "Compare schemes: 'What is the difference between Scheme I and Scheme II?'",
        "Search a specific standard number directly (e.g., 'IS 2347' or 'IS 1460').",
    ],
    "next_question": "Which product would you like to check compliance for?",
    "actions": [
        {"label": "Certification Process", "query": "How does BIS certification work?", "type": "certification"},
        {"label": "Packaged Water", "query": "I want to start a packaged drinking water business", "type": "product"},
        {"label": "Helmets", "query": "What are the requirements for helmets?", "type": "product"},
        {"label": "Gold Hallmarking", "query": "What is gold hallmarking and how do I check HUID?", "type": "hallmark"},
    ],
}


STANDARDS_CLUBS_RESPONSE = {
    "answer": (
        "### BIS Standards Clubs in Schools and Higher Educational Institutions\n\n"
        "To foster quality consciousness, scientific temper, and an understanding of Indian Standards among the youth, the **Bureau of Indian Standards (BIS)** has established **Standards Clubs** across thousands of schools, polytechnics, and engineering institutions nationwide.\n\n"
        "#### 1. Core Objectives & Activities\n"
        "• **Learning Science via Standards (LSVS)**: Teachers utilize Indian Standards (e.g. testing of packaged drinking water, cement compressive strength, helmet shock absorption, electrical switches) to demonstrate physical and chemical principles practically in classrooms.\n"
        "• **Student Competitions & Campaigns**: Inter-school debates, technical quizzes, essay competitions, poster-making, and standard-writing competitions on quality, safety, and consumer protection.\n"
        "• **Educational Exposure Visits**: BIS sponsors all-expenses-paid field visits for club members to BIS Central/Regional testing laboratories, NABL-accredited facilities, and automated industrial plants.\n\n"
        "#### 2. Financial Grants & Infrastructure Aid\n"
        "• **Annual Activity Grant**: BIS provides a financial grant of **₹10,000 per year** to each recognized Standards Club to conduct 3+ student quality activities.\n"
        "• **Science Lab Upgradation Aid**: For government and aided schools, BIS provides a one-time grant of **up to ₹1,00,000** to upgrade school science laboratories into modern *'Learning Science via Standards'* facilities.\n"
        "• **Club Mentor Honorarium**: Designated teacher-mentors receive two days of specialized residential training by BIS and an annual honorarium of **₹3,000** for steering club operations.\n\n"
        "#### 3. Eligibility & Formation Guidelines\n"
        "• **Institutions Eligible**: High schools & higher secondary schools (classes 9 to 12), ITIs, polytechnics, and engineering/management universities.\n"
        "• **Club Composition**: Minimum 15 to 20 student members guided by 1 nominated science teacher or professor as 'Club Mentor'.\n"
        "• **Student Recognition**: Official certificate of participation, student badges as *'BIS Quality Ambassadors'*, and national cash awards for winners of standards competitions.\n\n"
        "#### 4. How to Register a Standards Club\n"
        "The head of the institution (Principal/Director) can apply through the local **BIS Branch Office (BO)** or register directly on the BIS portal at `bis.gov.in` under the *Standards Clubs* portal."
    ),
    "next_steps": [
        "Contact the nearest BIS Branch Office or State Education Department to initiate Standards Club registration.",
        "Nominate a science teacher or faculty member as the institutional Club Mentor.",
        "Enroll a minimum of 15 to 20 students from grades 9–12 or undergraduate engineering/science programs.",
        "Apply for the ₹10,000 annual activity grant and ₹1,00,000 science laboratory upgradation fund on the BIS portal.",
    ],
    "next_question": "Would you like to know how to connect with your nearest BIS Branch Office or the guidelines for the ₹1 Lakh science lab grant?",
    "actions": [
        {"label": "Science Lab Grant", "query": "What are the guidelines for BIS ₹1 Lakh science lab upgradation grant?", "type": "standards_club"},
        {"label": "NITS Training", "query": "What training programs does BIS conduct through NITS?", "type": "training"},
        {"label": "Consumer Rights", "query": "How can students report fake ISI marks or verify products on BIS Care?", "type": "consumer"},
    ],
}


NITS_TRAINING_RESPONSE = {
    "answer": (
        "### National Institute of Training for Standardization (NITS) — BIS Training Services\n\n"
        "Established in 1995 and headquartered in Sector 62, NOIDA (National Capital Region), the **National Institute of Training for Standardization (NITS)** is the apex capacity-building and professional development arm of the Bureau of Indian Standards.\n\n"
        "#### 1. Flagship Training Programs & Certified Courses\n"
        "• **Management Systems Lead Auditor & Internal Auditor Courses**:\n"
        "  - ISO 9001: Quality Management Systems (QMS)\n"
        "  - ISO 14001: Environmental Management Systems (EMS)\n"
        "  - ISO 45001: Occupational Health & Safety Management Systems (OHSMS)\n"
        "  - ISO 22000 / FSSC 22000: Food Safety Management Systems (FSMS)\n"
        "  - ISO/IEC 27001: Information Security Management Systems (ISMS)\n"
        "  - ISO 50001: Energy Management Systems (EnMS)\n"
        "• **Laboratory Quality & Accreditation (ISO/IEC 17025)**:\n"
        "  - General requirements for the competence of testing & calibration laboratories.\n"
        "  - Measurement uncertainty, test method validation, and NABL/BIS laboratory internal audit.\n"
        "• **Industry & Factory Personnel Training**:\n"
        "  - Practical implementation of the **Scheme of Inspection and Testing (SIT)** under Scheme-I.\n"
        "  - Statistical quality control, sample sizing, in-house testing methods, and calibration ledgers for technical personnel.\n"
        "• **Academic & Student Engagement**:\n"
        "  - Orientation to Indian Standards for engineering and management students.\n"
        "  - Summer internship and research dissertations for university students.\n"
        "• **International Training (ITEC / SCAAP)**:\n"
        "  - Specialized standardization, conformity assessment, and metrology programs for international participants sponsored by the Ministry of External Affairs.\n\n"
        "#### 2. Training Modes & Venues\n"
        "• **Residential Training**: At the NITS NOIDA campus equipped with smart classrooms, technical library, and hostel facilities.\n"
        "• **Regional Programs**: Conducted regularly across BIS Regional Offices (Chennai, Mumbai, Kolkata, Chandigarh, and Branch Offices).\n"
        "• **Virtual e-NITS Programs**: Live interactive online training modules for industry professionals and students.\n\n"
        "#### 3. How to Enroll / Course Calendar\n"
        "Institutions, industrial enterprises, and individual professionals can view the annual training calendar and register online through the official BIS training portal (`bis.gov.in` ➔ *Training / NITS*)."
    ),
    "next_steps": [
        "Browse the annual NITS Training Calendar on the official BIS portal (bis.gov.in).",
        "Select the relevant course: Lead Auditor, Laboratory ISO/IEC 17025, or Factory SIT compliance.",
        "Submit applicant/corporate nominations via the e-NITS online registration portal.",
    ],
    "next_question": "Would you like details on ISO/IEC 17025 laboratory quality training, or factory SIT training for manufacturing personnel?",
    "actions": [
        {"label": "Lab Accreditation (17025)", "query": "What are NITS training requirements for ISO/IEC 17025 laboratory accreditation?", "type": "training"},
        {"label": "Standards Clubs", "query": "How can schools and colleges establish a BIS Standards Club?", "type": "standards_club"},
        {"label": "Find Laboratory", "query": "Which BIS recognized laboratories can test my product?", "type": "laboratory"},
    ],
}


STARTUP_MSME_BENEFITS_RESPONSE = {
    "answer": (
        "### BIS Concessions & Fast-Track Benefits for Startups and MSMEs\n\n"
        "The Bureau of Indian Standards (BIS) provides dedicated financial fee concessions, simplified conformity assessment, and priority file processing to foster innovation and reduce regulatory compliance costs for **Micro, Small & Medium Enterprises (MSMEs)** and **DPIIT-recognized Startups**:\n\n"
        "#### 1. Statutory Fee Concessions (Under BIS Conformity Regulations)\n"
        "• **Micro Enterprises (50% Concession)**: All enterprises holding a valid Udyam Registration Certificate under the 'Micro' category receive an immediate **50% concession** on the statutory minimum marking fee and application fees.\n"
        "• **Small Enterprises (20% Concession)**: Small enterprises with valid Udyam registration receive a **20% concession** on the statutory minimum marking fee.\n"
        "• **Startups (DPIIT Recognized)**: Eligible for the 50% concession on application and marking fees at par with micro-enterprises under the Startup India initiative.\n"
        "• **Special Concessions (Women & SC/ST Entrepreneurs)**: Additional relief of up to 50% on preliminary inspection and verification fees under affirmative government schemes.\n\n"
        "#### 2. Fast-Track Simplified Licence Processing\n"
        "• **Option-1 Testing**: MSMEs and startups can get samples tested in advance at any BIS-recognized laboratory and submit satisfactory test reports along with Form-V on Manakonline.\n"
        "• **Reduced Processing Window**: Under the simplified procedure, preliminary verification audits are scheduled within 15 days, and licences are granted in as few as **30 days** (compared to 60–90 days for conventional schemes).\n\n"
        "#### 3. Financial Subsidies under Ministry of MSME Schemes\n"
        "• Under the **MSME Champions Scheme (ZED Certification & Reimbursement)**, the Ministry of MSME reimburses up to **75% to 85%** of the expenses incurred for testing and obtaining BIS licences (maximum cap of ₹1.5 Lakh to ₹2 Lakh per enterprise).\n\n"
        "#### 4. How to Claim Concessions on Manakonline\n"
        "1. Enter your 19-digit **Udyam Registration Number (URN)** or DPIIT Startup Recognition Certificate number when creating your account on `manakonline.in`.\n"
        "2. The portal automatically verifies your enterprise category with the Ministry of MSME API and applies fee concessions instantly at payment checkout."
    ),
    "next_steps": [
        "Obtain or verify your Udyam Registration Certificate (Micro/Small) or DPIIT Startup Certificate.",
        "Select 'MSME / Startup' during applicant profiling on the Manakonline portal.",
        "Utilize Option-1 simplified testing to fast-track licence grant to within 30 days.",
        "Apply for reimbursement under the MSME Champions (ZED) scheme after licence grant.",
    ],
    "next_question": "Would you like to calculate your specific marking fees with MSME concessions applied in our Batch Calculator?",
    "actions": [
        {"label": "Calculate MSME Fee", "query": "How do I calculate marking fees with 50% MSME concession?", "type": "calculator"},
        {"label": "Manakonline Form-V", "query": "How do I apply for ISI Mark certification on Manakonline?", "type": "dossier"},
        {"label": "Required Documents", "query": "What documents are required for MSME BIS certification?", "type": "document"},
    ],
}


def get_predefined_response(intent: str, query: str = "", language: str = "en") -> Dict[str, Any]:
    """Retrieve curated, authoritative domain response with intelligent keyword and intent matching."""
    q_clean = query.lower().strip().rstrip("!?.,")

    # 1. Greetings & System Assistance
    if (
        intent == "greeting"
        or q_clean in {"hi", "hello", "hey", "namaste", "namaskar", "good morning", "good afternoon", "good evening", "greetings", "start", "help", "who are you", "who r u", "what is bis saarthi"}
        or any(q_clean.startswith(g) for g in ["hi ", "hello ", "hey ", "namaste ", "good morning ", "namaskar "])
    ):
        return GREETING_RESPONSE

    # 1b. Standards Clubs (Schools & Colleges)
    if any(w in q_clean for w in ["standards club", "standards clubs", "standard club", "school club", "college club", "students club", "learning science via standards", "club mentor", "science lab grant"]):
        return STANDARDS_CLUBS_RESPONSE

    # 1c. NITS Training Services
    if any(w in q_clean for w in ["nits", "training", "training institute", "training services", "national institute of training", "lead auditor", "iso 17025 training", "student training", "bis training"]):
        return NITS_TRAINING_RESPONSE

    # 1d. MSME & Startup Concessions & Benefits
    if any(w in q_clean for w in ["startup", "startups", "msme concession", "msme benefit", "udyam concession", "micro enterprise fee", "startup india bis", "concession for startup", "concession for msme", "zed scheme"]):
        return STARTUP_MSME_BENEFITS_RESPONSE

    # 2. Scheme Comparisons (Scheme I vs Scheme II vs FMCS vs Hallmarking)
    if any(w in q_clean for w in ["difference between scheme", "scheme 1 and scheme 2", "scheme i and scheme ii", "scheme 1 vs", "scheme i vs", "compare schemes", "which scheme", "what is scheme 1", "what is scheme 2", "what is scheme i", "what is scheme ii", "crs vs isi", "isi vs crs"]):
        return SCHEMES_DIFFERENCE_RESPONSE

    # 3. Fee Structure & Government Charges
    if any(w in q_clean for w in ["fee", "fees", "cost", "charge", "charges", "pricing", "expense", "expenses", "marking fee", "concession", "how much does it cost"]):
        return FEE_STRUCTURE_RESPONSE

    # 4. Foreign Manufacturers Certification Scheme (FMCS)
    if any(w in q_clean for w in ["fmcs", "foreign manufacturer", "overseas manufacturer", "authorized indian representative", "air requirement", "foreign factory"]):
        return FMCS_CERTIFICATION_RESPONSE

    # 5. Compulsory Registration Scheme (CRS)
    if any(w in q_clean for w in ["what is crs", "compulsory registration", "crsbis", "crs registration", "electronics registration", "meity order", "r-number"]):
        return CRS_REGISTRATION_RESPONSE

    # 6. Gold & Silver Hallmarking & HUID
    if any(w in q_clean for w in ["hallmark", "huid", "gold purity", "silver hallmark", "jeweller registration", "22k916", "916 gold", "bis care app hallmark", "verify huid"]):
        return HALLMARKING_GENERAL_RESPONSE

    # 7. Licence Lifecycle, Renewal & Stop-Marking
    if any(w in q_clean for w in ["renew", "renewal", "expiry", "expire", "validity", "form-vi", "form 6", "form-vii", "form 7", "grace period", "stop-marking", "stop marking"]):
        return RENEWAL_LIFECYCLE_RESPONSE

    # 8. Customs, Imports & ICEGATE Clearance
    if any(w in q_clean for w in ["customs", "import policy", "icegate", "bill of entry", "port clearance", "customs broker", "customs hold"]):
        return CUSTOMS_IMPORT_RESPONSE

    # 9. Consumer Rights, BIS Care App & Complaints
    if any(w in q_clean for w in ["bis care app", "bis care", "verify licence", "verify license", "consumer rights", "fake isi", "complaint", "redressal", "section 19"]):
        return CONSUMER_RIGHTS_RESPONSE

    # 10. Laboratories & Testing Schemes
    if any(w in q_clean for w in ["laboratory", "laboratories", "central lab", "sahibabad", "regional lab", "lrs", "lab recognition", "testing facility", "where to test"]):
        return LABORATORY_RESPONSE

    # 11. Quality Control Orders (QCO)
    if any(w in q_clean for w in ["qco", "quality control order", "mandatory certification", "is it mandatory", "mandatory list", "compulsory certification"]):
        return QCO_REQUIREMENT_RESPONSE

    # 12. Certification Procedure & Application Steps
    if any(w in q_clean for w in ["how to apply", "how to get cert", "how do i get cert", "certification process", "procedure for isi", "get bis cert", "application process", "steps for bis", "steps for isi", "how does bis certification work", "how does certification work", "how does bis work"]):
        return CERTIFICATION_PROCESS_RESPONSE

    # 13. Intent-based fallback routing
    if intent == "greeting":
        return GREETING_RESPONSE
    elif intent == "certification_process":
        return CERTIFICATION_PROCESS_RESPONSE
    elif intent == "general_bis":
        return GENERAL_BIS_RESPONSE
    elif intent == "laboratory":
        return LABORATORY_RESPONSE
    elif intent == "qco_requirement":
        return QCO_REQUIREMENT_RESPONSE
    elif intent == "hallmarking":
        return HALLMARKING_GENERAL_RESPONSE
    elif intent == "certification_requirement" and not any(w in q_clean for w in ["product", "is ", "code"]):
        return SCHEMES_DIFFERENCE_RESPONSE
    else:
        return UNSUPPORTED_RESPONSE
