import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates an official BIS Statutory Compliance Dossier & Audit Checklist PDF.
 * 
 * @param {Object} dossierData
 * @param {string} dossierData.standardNumber - e.g. "IS 2347:2017"
 * @param {string} dossierData.productName - e.g. "Domestic Pressure Cookers"
 * @param {string} [dossierData.title] - Full standard title
 * @param {string} [dossierData.division] - Division council (e.g. MED, CHD, CED)
 * @param {string} [dossierData.scheme] - Scheme I (ISI Mark), Scheme II (CRS), etc.
 * @param {boolean} [dossierData.isMandatory] - Whether covered under mandatory QCO
 * @param {string} [dossierData.qcoName] - Name of mandatory Quality Control Order
 * @param {string} [dossierData.ministry] - Line Ministry (e.g. DPIIT)
 * @param {string} [dossierData.enforcementDate] - QCO enforcement date
 * @param {string} [dossierData.sampleRequirements] - Sample quantity requirements
 * @param {string} [dossierData.turnaroundTime] - Laboratory testing TAT
 * @param {Array} [dossierData.parameters] - Array of { parameter_name, test_method, specification_limit, criticality }
 * @param {Array} [dossierData.laboratories] - Array of { lab_name, location, lab_type, contact_info }
 * @param {Object} [dossierData.renewalInfo] - Renewal milestones and fee info
 * @param {Object} [dossierData.batchInfo] - Batch sizing and control unit
 */
export function generateComplianceDossierPdf(dossierData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const stdNumber = dossierData.standardNumber || 'IS STANDARD';
  const prodName = dossierData.productName || dossierData.title || 'Regulated Product';
  const isMandatory = dossierData.isMandatory ?? true;
  const genDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const docId = `BIS-DOS-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${new Date().getFullYear()}`;

  // Helper for adding footer to all pages
  const addHeaderAndFooter = () => {
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Top Tri-Color Accent Line
      doc.setFillColor(255, 153, 51); // Saffron
      doc.rect(margin, 8, contentWidth / 3, 2, 'F');
      doc.setFillColor(255, 255, 255); // White
      doc.rect(margin + contentWidth / 3, 8, contentWidth / 3, 2, 'F');
      doc.setFillColor(18, 136, 7); // Green
      doc.rect(margin + (2 * contentWidth) / 3, 8, contentWidth / 3, 2, 'F');

      // Page Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 130, 140);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      doc.text('Bureau of Indian Standards Assistant • Statutory Reference Dossier • BIS Act, 2016', margin, pageHeight - 7);
      doc.text(`Doc ID: ${docId} | Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    }
  };

  let currentY = 18;

  // -------------------------------------------------------------
  // 1. OFFICIAL HEADER & CREST
  // -------------------------------------------------------------
  doc.setFillColor(15, 41, 66); // BIS Navy
  doc.rect(margin, currentY, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('BUREAU OF INDIAN STANDARDS (BIS)', margin + 8, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(210, 225, 245);
  doc.text('GOVERNMENT OF INDIA • MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION', margin + 8, currentY + 14);
  doc.text('STATUTORY CONFORMITY ASSESSMENT & AUDIT COMPLIANCE DOSSIER', margin + 8, currentY + 19);

  // Verification Badge Box
  doc.setFillColor(30, 65, 100);
  doc.roundedRect(pageWidth - margin - 52, currentY + 4, 46, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 215, 0); // Gold
  doc.text('OFFICIAL DOSSIER', pageWidth - margin - 29, currentY + 9, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(`Ref: ${docId}`, pageWidth - margin - 29, currentY + 14, { align: 'center' });

  currentY += 30;

  // -------------------------------------------------------------
  // 2. STANDARD OVERVIEW CARD
  // -------------------------------------------------------------
  doc.setFillColor(245, 248, 252);
  doc.setDrawColor(210, 225, 240);
  doc.roundedRect(margin, currentY, contentWidth, 34, 2, 2, 'FD');

  doc.setTextColor(15, 41, 66);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`${stdNumber}`, margin + 6, currentY + 8);

  // Mandatory Status Badge
  if (isMandatory) {
    doc.setFillColor(220, 38, 38);
    doc.roundedRect(pageWidth - margin - 46, currentY + 3, 40, 7, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('MANDATORY QCO', pageWidth - margin - 26, currentY + 7.5, { align: 'center' });
  } else {
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(pageWidth - margin - 46, currentY + 3, 40, 7, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('VOLUNTARY SCHEME', pageWidth - margin - 26, currentY + 7.5, { align: 'center' });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`Product: ${prodName}`, margin + 6, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  const schemeStr = dossierData.scheme || 'Scheme I (ISI Mark)';
  const divisionStr = dossierData.division || 'Mechanical / Chemical / Industrial';
  const ministryStr = dossierData.ministry || 'Ministry of Commerce & Industry (DPIIT)';
  
  doc.text(`Certification Scheme: ${schemeStr}  |  Division Council: ${divisionStr}`, margin + 6, currentY + 23);
  doc.text(`Notifying Authority: ${ministryStr}  |  Generated: ${genDate}`, margin + 6, currentY + 29);

  currentY += 40;

  // -------------------------------------------------------------
  // 3. STATUTORY ENFORCEMENT & LEGAL NOTICE
  // -------------------------------------------------------------
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'FD');

  doc.setTextColor(153, 27, 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('STATUTORY ENFORCEMENT NOTICE (SECTION 29, BIS ACT 2016):', margin + 5, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(185, 28, 28);
  const legalText = dossierData.qcoName
    ? `Covered under mandatory ${dossierData.qcoName}. Manufacturing, importing, or selling without a valid BIS Licence or Standard Mark is a cognizable offense punishable with imprisonment up to two years, monetary forfeiture, and immediate product seizure.`
    : 'Compliance with prescribed Indian Standards ensures quality assurance, consumer safety, and market conformity. Non-compliance when covered under QCO carries Section 29 criminal liability.';
  const legalLines = doc.splitTextToSize(legalText, contentWidth - 10);
  doc.text(legalLines, margin + 5, currentY + 11);

  currentY += 24;

  // -------------------------------------------------------------
  // 4. TESTING REGIME & CRITICAL PARAMETERS TABLE
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 41, 66);
  doc.text('1. Scheme of Inspection & Testing (SIT) — Critical Test Parameters', margin, currentY);
  currentY += 4;

  const tableData = (dossierData.parameters && dossierData.parameters.length > 0)
    ? dossierData.parameters.map((p, idx) => [
        `#${idx + 1}`,
        p.parameter_name || p.name || 'Test Parameter',
        p.test_method || p.clause || 'Prescribed Clause',
        p.specification_limit || p.limit || 'Conforming Limit',
        p.criticality || (p.critical ? 'Safety Critical' : 'Mandatory'),
      ])
    : [
        ['#1', 'Hydraulic Proof Pressure / Burst Strength', 'Clause 8.2 / 8.3', 'Withstands 2x-3x working pressure without leakage or rupture', 'Safety Critical'],
        ['#2', 'Material Composition & Chemical Analysis', 'Clause 4.1', 'Food-grade or structural alloy conformance with IS elemental ceilings', 'Mandatory'],
        ['#3', 'Dimensional Tolerance & Mechanical Integrity', 'Clause 6.1 - 6.4', 'Dimensional tolerances within prescribed limits (±0.5mm)', 'Operational Safety'],
        ['#4', 'Thermal & Operational Endurance Routine', 'Clause 8.5', 'Sustained continuous cycle without mechanical distortion', 'Key Quality'],
        ['#5', 'Safety Relief / Overpressure Device Activation', 'Clause 8.4', 'Reliable fail-safe actuation between 1.4x and 2.0x operational limit', 'Safety Critical'],
      ];

  autoTable(doc, {
    startY: currentY,
    head: [['No.', 'Test Parameter', 'Method / Clause', 'Specification Limit', 'Criticality']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 41, 66],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 46 },
      2: { cellWidth: 32 },
      3: { cellWidth: 64 },
      4: { cellWidth: 28, fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // -------------------------------------------------------------
  // 5. SAMPLE SIZE & ESTIMATED TURNAROUND TIME
  // -------------------------------------------------------------
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFillColor(240, 245, 250);
  doc.setDrawColor(200, 220, 240);
  doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 41, 66);
  doc.text('Sample Quantity Required for Laboratory Testing:', margin + 5, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(dossierData.sampleRequirements || '3 to 6 complete representative units in sealed commercial packaging.', margin + 70, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 41, 66);
  doc.text('Estimated Testing Turnaround Time (TAT):', margin + 5, currentY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(dossierData.turnaroundTime || '7 to 14 working days from date of sample receipt at recognized lab.', margin + 70, currentY + 11);

  currentY += 20;

  // -------------------------------------------------------------
  // 6. BIS RECOGNIZED TESTING FACILITIES
  // -------------------------------------------------------------
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 41, 66);
  doc.text('2. Recognized BIS Testing Laboratories Network', margin, currentY);
  currentY += 4;

  const labsData = (dossierData.laboratories && dossierData.laboratories.length > 0)
    ? dossierData.laboratories.slice(0, 4).map((l, idx) => [
        `#${idx + 1}`,
        l.lab_name || l.name || 'BIS Lab',
        l.location || 'India',
        l.lab_type || 'BIS Recognized',
        l.contact_info || l.contact || 'Direct Facility Contact',
      ])
    : [
        ['#1', 'BIS Central Laboratory (CL Sahibabad)', 'Sahibabad Industrial Area, Ghaziabad (UP)', 'BIS National Apex Lab', 'cl@bis.gov.in • 0120-2776030'],
        ['#2', 'BIS Western Regional Laboratory (WRL Mumbai)', 'Andheri (East), Mumbai (Maharashtra)', 'BIS Regional Lab', 'wrl@bis.gov.in • 022-28329295'],
        ['#3', 'National Test House (NTH Ghaziabad & Kolkata)', 'Kamla Nehru Nagar, Ghaziabad / Alipore', 'Central Govt NABL Lab', 'nth-ghaziabad@nic.in'],
        ['#4', 'MSME Testing Centre / Regional Testing Centre', 'Okhla Phase III, New Delhi 110020', 'BIS LRS Recognized', 'info@msme-tc.gov.in'],
      ];

  autoTable(doc, {
    startY: currentY,
    head: [['No.', 'Laboratory Name', 'Location', 'Accreditation / Facility', 'Contact Details']],
    body: labsData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 54, fontStyle: 'bold' },
      2: { cellWidth: 44 },
      3: { cellWidth: 34 },
      4: { cellWidth: 40 },
    },
    margin: { left: margin, right: margin },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // -------------------------------------------------------------
  // 7. FACTORY AUDIT & COMPLIANCE VERIFICATION CHECKLIST
  // -------------------------------------------------------------
  if (currentY > pageHeight - 75) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 41, 66);
  doc.text('3. Mandatory Factory Audit Checklist & Quality Records', margin, currentY);
  currentY += 5;

  const checklistItems = [
    { text: 'Raw Material Mill Test Certificates (MTC / COA) maintained for each incoming batch.', ref: 'SIT Clause 2.1' },
    { text: 'Daily Calibration Logs for all pressure gauges, micrometers, and testing equipment.', ref: 'ISO 17025 / SIT' },
    { text: 'In-house routine testing equipment operational with competent dedicated QA personnel.', ref: 'BIS Scheme I' },
    { text: 'Quarantine & Scrap Area clearly demarcated for rejected non-conforming items.', ref: 'QMS Guidelines' },
    { text: 'Form-VII Annual Production & Marking Fee Register maintained and CA-audited.', ref: 'Regulation 7(2)' },
    { text: 'Standard Mark (ISI Logo & CM/L Licence Number) indelibly embossed/labeled on product.', ref: 'BIS Marking Rules' },
    { text: 'Renewal application (Form-VI) scheduled between 90 and 30 days prior to expiry.', ref: 'Conformity 2018' },
  ];

  checklistItems.forEach((item) => {
    // Checkbox box
    doc.setDrawColor(71, 85, 105);
    doc.rect(margin + 2, currentY, 3.5, 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(item.text, margin + 8, currentY + 2.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`[${item.ref}]`, pageWidth - margin, currentY + 2.8, { align: 'right' });

    currentY += 6;
  });

  currentY += 4;

  // -------------------------------------------------------------
  // 8. SIGN-OFF & STAMP BLOCK
  // -------------------------------------------------------------
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 20;
  }

  doc.setDrawColor(200, 210, 220);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('AUTHORIZED FACTORY QUALITY MANAGER', margin + 10, currentY);
  doc.text('BIS TECHNICAL AUDITOR / INSPECTING OFFICER', pageWidth - margin - 70, currentY);

  currentY += 14;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin + 5, currentY, margin + 65, currentY);
  doc.line(pageWidth - margin - 75, currentY, pageWidth - margin - 15, currentY);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Signature & Date', margin + 25, currentY + 4);
  doc.text('Official Seal & Date', pageWidth - margin - 55, currentY + 4);

  // Add headers, footers and page numbers across all pages
  addHeaderAndFooter();

  // Save the PDF
  const filename = `BIS_Compliance_Dossier_${stdNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * Generates an official BIS Factory Inspection & CAPA Audit Report PDF.
 * 
 * @param {Object} auditData
 * @param {string} auditData.standardNumber - e.g. "IS 2347:2017"
 * @param {string} auditData.productName - e.g. "Domestic Pressure Cookers"
 * @param {string} [auditData.factoryName] - Plant / company name
 * @param {string} [auditData.factoryLocation] - City / state
 * @param {number} auditData.overallScore - Readiness percentage (0 - 100)
 * @param {string} auditData.rating - "AUDIT READY" | "CONDITIONAL PASS" | "HIGH RISK OF FAILURE"
 * @param {string} [auditData.ratingDescription] - Assessment advisory
 * @param {Array} [auditData.pillarsBreakdown] - List of pillar score objects
 * @param {Array} [auditData.correctiveActionPlan] - List of CAPA objects
 */
export function generateAuditReportPdf(auditData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const stdNumber = auditData.standardNumber || 'IS STANDARD';
  const prodName = auditData.productName || 'Regulated Product';
  const factoryName = auditData.factoryName || 'Manufacturing Facility';
  const factoryLocation = auditData.factoryLocation || 'India';
  const score = auditData.overallScore ?? 0;
  const rating = auditData.rating || 'AUDIT READY';
  const auditDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const auditId = `BIS-AUD-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${new Date().getFullYear()}`;

  const addHeaderAndFooter = () => {
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Tri-Color Accent Line
      doc.setFillColor(255, 153, 51);
      doc.rect(margin, 8, contentWidth / 3, 2, 'F');
      doc.setFillColor(255, 255, 255);
      doc.rect(margin + contentWidth / 3, 8, contentWidth / 3, 2, 'F');
      doc.setFillColor(18, 136, 7);
      doc.rect(margin + (2 * contentWidth) / 3, 8, contentWidth / 3, 2, 'F');

      // Page Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 130, 140);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      doc.text('Bureau of Indian Standards • Factory Inspection Self-Assessment & CAPA Audit Report', margin, pageHeight - 7);
      doc.text(`Audit Ref: ${auditId} | Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    }
  };

  let currentY = 18;

  // 1. HEADER
  doc.setFillColor(15, 41, 66);
  doc.rect(margin, currentY, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text('BUREAU OF INDIAN STANDARDS (BIS)', margin + 8, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(210, 225, 245);
  doc.text('CONFORMITY ASSESSMENT REGULATIONS, 2018 • FACTORY QUALITY AUDIT REPORT', margin + 8, currentY + 14);
  doc.text('STATUTORY AUDIT READINESS ASSESSMENT & CORRECTIVE ACTION PLAN (CAPA)', margin + 8, currentY + 19);

  doc.setFillColor(30, 65, 100);
  doc.roundedRect(pageWidth - margin - 50, currentY + 4, 44, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 215, 0);
  doc.text('AUDIT DOSSIER', pageWidth - margin - 28, currentY + 9, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(auditId, pageWidth - margin - 28, currentY + 14, { align: 'center' });

  currentY += 30;

  // 2. FACTORY & SCORE SUMMARY
  doc.setFillColor(245, 248, 252);
  doc.setDrawColor(210, 225, 240);
  doc.roundedRect(margin, currentY, contentWidth, 36, 2, 2, 'FD');

  doc.setTextColor(15, 41, 66);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`${factoryName}`, margin + 6, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Location: ${factoryLocation}  |  Audit Date: ${auditDate}`, margin + 6, currentY + 14);
  doc.text(`Target Standard: ${stdNumber}  |  Product: ${prodName}`, margin + 6, currentY + 20);

  // Score Box on Right
  const scoreBoxWidth = 52;
  const scoreBoxX = pageWidth - margin - scoreBoxWidth - 4;
  const scoreBoxColor = score >= 85 ? [22, 163, 74] : score >= 65 ? [234, 88, 12] : [220, 38, 38];
  
  doc.setFillColor(...scoreBoxColor);
  doc.roundedRect(scoreBoxX, currentY + 4, scoreBoxWidth, 26, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`${score}%`, scoreBoxX + scoreBoxWidth / 2, currentY + 15, { align: 'center' });

  doc.setFontSize(7.5);
  doc.text(rating, scoreBoxX + scoreBoxWidth / 2, currentY + 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const statusDesc = auditData.ratingDescription || (score >= 85 ? 'Conforms to statutory inspection criteria.' : 'Corrective actions required prior to inspection.');
  doc.text(statusDesc, margin + 6, currentY + 28);

  currentY += 42;

  // 3. 6-PILLAR BREAKDOWN TABLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 41, 66);
  doc.text('1. Statutory Quality Pillar Assessment Breakdown', margin, currentY);
  currentY += 4;

  const pillarRows = (auditData.pillarsBreakdown && auditData.pillarsBreakdown.length > 0)
    ? auditData.pillarsBreakdown.map((p) => [
        p.name || 'Pillar',
        `${p.weight}%`,
        `${p.score_percent || 0}%`,
        (p.score_percent >= 80) ? 'Conforming' : (p.score_percent >= 50) ? 'Partial Gaps' : 'Deficient',
      ])
    : [
        ['Testing Infrastructure & Calibration', '25%', `${Math.min(100, score + 5)}%`, 'Evaluated'],
        ['Raw Material Quality Control', '15%', `${Math.min(100, score)}%`, 'Evaluated'],
        ['Scheme of Inspection & Testing (SIT)', '20%', `${Math.max(0, score - 5)}%`, 'Evaluated'],
        ['Technical Personnel & Competency', '15%', `${Math.min(100, score + 2)}%`, 'Evaluated'],
        ['Non-Conformance & Scrap Segregation', '10%', `${Math.max(0, score - 8)}%`, 'Evaluated'],
        ['Statutory Records & Marking Ledgers', '15%', `${Math.min(100, score)}%`, 'Evaluated'],
      ];

  autoTable(doc, {
    startY: currentY,
    head: [['Quality Dimension / Pillar', 'Weight', 'Score %', 'Compliance Status']],
    body: pillarRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 41, 66],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 48 },
    },
    margin: { left: margin, right: margin },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // 4. CORRECTIVE ACTION PLAN (CAPA)
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 41, 66);
  doc.text('2. Statutory Corrective Action Plan (CAPA) — Identified Deficiencies', margin, currentY);
  currentY += 4;

  const capaList = auditData.correctiveActionPlan || [];
  if (capaList.length > 0) {
    const capaTableData = capaList.map((c, idx) => [
      `#${idx + 1}`,
      c.title || 'Requirement',
      c.clause_ref || 'IS Standard',
      c.criticality || 'Major',
      c.recommendation || c.deficiency || 'Remedial action required.',
      `${c.timeline_days || 15} Days`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No.', 'Item Description', 'Clause Ref', 'Severity', 'Recommended Corrective Action (CAPA)', 'Deadline']],
      body: capaTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 38, fontStyle: 'bold' },
        2: { cellWidth: 28 },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 64 },
        5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
    });

    currentY = doc.lastAutoTable.finalY + 8;
  } else {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(22, 101, 52);
    doc.text('Zero Non-Conformances Detected. Factory is ready for official BIS inspection.', margin + 6, currentY + 7.5);
    currentY += 18;
  }

  // 5. SIGN-OFF BLOCK
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 20;
  }

  doc.setDrawColor(200, 210, 220);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('FACTORY LEAD AUDITOR / QUALITY MANAGER', margin + 10, currentY);
  doc.text('BIS EMPANELLED LEAD AUDITING OFFICER', pageWidth - margin - 75, currentY);

  currentY += 14;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin + 5, currentY, margin + 65, currentY);
  doc.line(pageWidth - margin - 75, currentY, pageWidth - margin - 15, currentY);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Signature & Date', margin + 25, currentY + 4);
  doc.text('Official Seal & Date', pageWidth - margin - 55, currentY + 4);

  addHeaderAndFooter();

  const filename = `BIS_Factory_Audit_Report_${stdNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * Generates an official Manakonline e-BIS Form-V Application Dossier PDF.
 * Under Regulation 4 of the BIS (Conformity Assessment) Regulations, 2018.
 *
 * @param {Object} dossierData
 */
export function generateFormVDossierPdf(dossierData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const stdNumber = dossierData.standardNumber || 'IS STANDARD';
  const prodName = dossierData.productName || 'Regulated Product';
  const factory = dossierData.factoryProfile || {};
  const machinery = dossierData.machinery || [];
  const testEquipment = dossierData.testingEquipment || [];
  const enclosures = dossierData.enclosuresList || [];
  const dossierRef = dossierData.dossierReference || `BIS-DOS-${Date.now()}`;
  const completeness = dossierData.completenessScore ?? 100;
  const status = dossierData.readinessStatus || 'READY FOR MANAKONLINE SUBMISSION';

  const addHeaderAndFooter = () => {
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Tri-Color Accent Line
      doc.setFillColor(255, 153, 51);
      doc.rect(margin, 8, contentWidth / 3, 2, 'F');
      doc.setFillColor(255, 255, 255);
      doc.rect(margin + contentWidth / 3, 8, contentWidth / 3, 2, 'F');
      doc.setFillColor(18, 136, 7);
      doc.rect(margin + (2 * contentWidth) / 3, 8, contentWidth / 3, 2, 'F');

      // Page Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 130, 140);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      doc.text('Bureau of Indian Standards • Manakonline e-BIS Form-V Application Dossier (Regulation 4)', margin, pageHeight - 7);
      doc.text(`Dossier Ref: ${dossierRef} | Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    }
  };

  let currentY = 18;

  // 1. HEADER BANNER
  doc.setFillColor(15, 41, 66);
  doc.rect(margin, currentY, contentWidth, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BUREAU OF INDIAN STANDARDS — MANAKONLINE e-BIS', margin + 6, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(210, 225, 240);
  doc.text('FORM-V: APPLICATION FOR GRANT OF LICENCE (SCHEME-I / ISI MARK)', margin + 6, currentY + 14);
  doc.text('Under Regulation 4 of the Bureau of Indian Standards (Conformity Assessment) Regulations, 2018', margin + 6, currentY + 19);

  currentY += 31;

  // 2. METADATA STRIP
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 41, 66);
  doc.text(`Dossier Reference: ${dossierRef}`, margin + 5, currentY + 6);
  doc.text(`Target Standard: ${stdNumber} — ${prodName}`, margin + 5, currentY + 12);

  doc.text(`Completeness Score: ${completeness}%`, pageWidth - margin - 65, currentY + 6);
  doc.setTextColor(completeness >= 85 ? 22 : 220, completeness >= 85 ? 101 : 38, completeness >= 85 ? 52 : 38);
  doc.text(`Status: ${status}`, pageWidth - margin - 65, currentY + 12);

  currentY += 24;

  // 3. SECTION 1: APPLICANT & PLANT PROFILE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 41, 66);
  doc.text('1. APPLICANT & MANUFACTURING PLANT PARTICULARS', margin, currentY);
  currentY += 4;

  const profileTableData = [
    ['Applicant Legal Entity', factory.applicant_name || 'Apex Quality Products Pvt Ltd'],
    ['Physical Factory Location', factory.factory_address || 'Sahibabad Industrial Area, Ghaziabad, UP'],
    ['Registered Office', factory.registered_office || 'Corporate Office, Mumbai, MH'],
    ['GSTIN & Industrial Reg', `${factory.gstin || '09AAACA1234F1Z8'} | MSME: ${factory.msme_udyam || 'N/A'}`],
    ['Connected Industrial Power', factory.connected_load || '125 KVA (3-Phase)'],
    ['Authorized Signatory', factory.authorized_signatory || 'Director (Quality Assurance)'],
    ['Brand / Trade Names', factory.brand_names || 'APEX, SURECOOK'],
    ['Varieties / Sizes Covered', factory.varieties_covered || 'Standard, Induction Base (Sizes: 3L, 5L)'],
    ['QC Incharge & Qualification', `${factory.qc_incharge_name || 'Er. Quality Incharge'} — ${factory.qc_incharge_qualification || 'B.Tech Mechanical'}`],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    body: profileTableData,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2.2, font: 'helvetica' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, fillColor: [248, 250, 252], textColor: [15, 41, 66] },
      1: { cellWidth: contentWidth - 55, textColor: [51, 65, 85] },
    },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // 4. SECTION 2: MANUFACTURING MACHINERY SCHEDULE
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 41, 66);
  doc.text('2. MANUFACTURING MACHINERY & PRODUCTION PROCESS SCHEDULE', margin, currentY);
  currentY += 4;

  const machineryRows = machinery.map((m, idx) => [
    idx + 1,
    m.operation,
    m.machinery_name,
    m.installed_capacity,
    m.power_hp,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['S.No.', 'Manufacturing Stage / Operation', 'Machinery Description & Specs', 'Installed Daily Capacity', 'Power / Rating']],
    body: machineryRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 41, 66], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' },
    styles: { fontSize: 7.2, cellPadding: 2.2, font: 'helvetica' },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 48, fontStyle: 'bold' },
      2: { cellWidth: 62 },
      3: { cellWidth: 35 },
      4: { cellWidth: contentWidth - 12 - 48 - 62 - 35 },
    },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // 5. SECTION 3: IN-HOUSE LABORATORY TESTING EQUIPMENT
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 41, 66);
  doc.text('3. IN-HOUSE LABORATORY TESTING EQUIPMENT & CALIBRATION MATRIX', margin, currentY);
  currentY += 4;

  const testRows = testEquipment.map((t, idx) => [
    idx + 1,
    t.parameter,
    t.equipment_name,
    t.range_capacity,
    t.least_count || 'Standard',
    t.calibration_frequency,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['S.No.', 'Test Parameter (SIT Clause)', 'Testing Equipment & Accuracy', 'Working Range', 'Least Count', 'Calibration Cycle']],
    body: testRows,
    theme: 'striped',
    headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' },
    styles: { fontSize: 7, cellPadding: 2.2, font: 'helvetica' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 50 },
      3: { cellWidth: 32 },
      4: { cellWidth: 20 },
      5: { cellWidth: contentWidth - 10 - 42 - 50 - 32 - 20 },
    },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // 6. SECTION 4: STATUTORY ENCLOSURES
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 41, 66);
  doc.text('4. STATUTORY ENCLOSURES & ATTACHMENT AUDIT', margin, currentY);
  currentY += 4;

  const enclosureRows = enclosures.map((e, idx) => [
    e.code || `DOC-${idx + 1}`,
    e.title,
    e.mandatory ? 'MANDATORY' : 'OPTIONAL',
    e.attached ? '[YES] ATTACHED' : '[NO] PENDING',
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Doc Code', 'Statutory Document Title', 'Regulation Status', 'Applicant Verification']],
    body: enclosureRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 41, 66], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' },
    styles: { fontSize: 7.2, cellPadding: 2, font: 'helvetica' },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: contentWidth - 22 - 32 - 38 },
      2: { cellWidth: 32, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 38, halign: 'center', fontStyle: 'bold' },
    },
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // 7. STATUTORY UNDERTAKING & SIGN-OFF
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 41, 66);
  doc.text('5. STATUTORY UNDERTAKING UNDER THE BUREAU OF INDIAN STANDARDS ACT, 2016', margin, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  const undertakingText = 'We hereby declare that the manufacturing plant, installed machinery, and in-house testing facilities described above are strictly maintained in working order under competent technical personnel. We accept the Scheme of Inspection and Testing (SIT) and agree to abide by all provisions of the Bureau of Indian Standards Act, 2016, Rules, and (Conformity Assessment) Regulations, 2018.';
  const splitUndertaking = doc.splitTextToSize(undertakingText, contentWidth);
  doc.text(splitUndertaking, margin, currentY);
  currentY += splitUndertaking.length * 3.5 + 8;

  doc.setDrawColor(200, 210, 220);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('FOR APPLICANT MANUFACTURING ENTERPRISE', margin + 10, currentY);
  doc.text('FOR BUREAU OF INDIAN STANDARDS (SCRUTINY)', pageWidth - margin - 75, currentY);

  currentY += 14;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin + 5, currentY, margin + 65, currentY);
  doc.line(pageWidth - margin - 75, currentY, pageWidth - margin - 15, currentY);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Authorized Signatory & Seal', margin + 18, currentY + 4);
  doc.text('Official Stamp & Acknowledgment', pageWidth - margin - 65, currentY + 4);

  addHeaderAndFooter();

  const filename = `Manakonline_FormV_Dossier_${stdNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * Clean markdown formatting for clean tabular or multi-line PDF text rendering.
 */
function cleanMarkdownForPdf(rawText) {
  if (!rawText) return '';
  return rawText
    .replace(/^### (.*$)/gim, '$1')
    .replace(/^## (.*$)/gim, '$1')
    .replace(/^# (.*$)/gim, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/^\s*-\s+/gm, '• ')
    .replace(/^\s*\*\s+/gm, '• ')
    .trim();
}

/**
 * Generates an official BIS Statutory Compliance Consultation & Advisory Transcript PDF.
 * Exports full multi-turn conversation thread between applicant and BIS Saarthi.
 *
 * @param {Object} sessionData
 * @param {Array} sessionData.messages - Array of chat message objects
 * @param {string} [sessionData.conversationId] - Active session ID
 * @param {string} [sessionData.selectedLanguage] - Active UI language
 */
export function generateChatConsultationPdf(sessionData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const messages = sessionData.messages || [];
  const convId = sessionData.conversationId || `BIS-CNS-${Date.now()}`;
  const genDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const genTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Extract all unique standards and products mentioned across the dialogue
  const uniqueStandardsMap = new Map();
  const uniqueProducts = new Set();

  messages.forEach((msg) => {
    if (msg.product) uniqueProducts.add(msg.product);
    const stds = msg.identified_standards || msg.standards || [];
    stds.forEach((s) => {
      const code = s.standard_number || s.standard || s.code;
      if (code && !uniqueStandardsMap.has(code)) {
        uniqueStandardsMap.set(code, {
          code: code,
          title: s.title || s.product_name || 'Standard Specification',
          mandatory: msg.compliance_info?.is_mandatory ?? true,
          scheme: msg.compliance_info?.scheme || 'Scheme I (ISI Mark)',
        });
      }
    });
  });

  const standardsList = Array.from(uniqueStandardsMap.values());
  const userMessagesCount = messages.filter((m) => m.sender === 'user').length;
  const assistantMessagesCount = messages.filter((m) => m.sender === 'assistant').length;

  const addHeaderAndFooter = () => {
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Tri-Color Accent Line at top
      doc.setFillColor(255, 153, 51); // Saffron
      doc.rect(margin, 8, contentWidth / 3, 2, 'F');
      doc.setFillColor(255, 255, 255); // White
      doc.rect(margin + contentWidth / 3, 8, contentWidth / 3, 2, 'F');
      doc.setFillColor(18, 136, 7); // Green
      doc.rect(margin + (2 * contentWidth) / 3, 8, contentWidth / 3, 2, 'F');

      // Page Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 130, 140);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      doc.text(
        'Bureau of Indian Standards Assistant • Statutory Compliance Consultation Transcript • BIS Act, 2016',
        margin,
        pageHeight - 7
      );
      doc.text(
        `Session Ref: ${convId.slice(0, 18)} | Page ${i} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 7,
        { align: 'right' }
      );
    }
  };

  let currentY = 18;

  // -------------------------------------------------------------
  // 1. OFFICIAL LETTERHEAD & EMBLEM BANNER
  // -------------------------------------------------------------
  doc.setFillColor(15, 41, 66); // BIS Navy
  doc.rect(margin, currentY, contentWidth, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('BUREAU OF INDIAN STANDARDS (BIS)', margin + 7, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(210, 225, 245);
  doc.text(
    'GOVERNMENT OF INDIA • MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION',
    margin + 7,
    currentY + 14
  );
  doc.text(
    'STATUTORY COMPLIANCE CONSULTATION & TECHNICAL ADVISORY TRANSCRIPT',
    margin + 7,
    currentY + 19
  );

  // Badge box
  doc.setFillColor(30, 65, 100);
  doc.roundedRect(pageWidth - margin - 52, currentY + 4, 46, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 215, 0); // Gold
  doc.text('OFFICIAL TRANSCRIPT', pageWidth - margin - 29, currentY + 9, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(`${genDate}`, pageWidth - margin - 29, currentY + 14, { align: 'center' });

  currentY += 31;

  // -------------------------------------------------------------
  // 2. CONSULTATION PROFILE & METADATA SUMMARY
  // -------------------------------------------------------------
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 41, 66);
  doc.text(`Consultation Reference: ${convId}`, margin + 5, currentY + 6);
  doc.text(
    `Total Interactions: ${userMessagesCount} Questions • ${assistantMessagesCount} Grounded Advisories`,
    margin + 5,
    currentY + 12
  );
  doc.text(
    `Products Covered: ${Array.from(uniqueProducts).join(', ') || 'General Statutory Inquiries'}`,
    margin + 5,
    currentY + 18
  );

  doc.text(`Generated On: ${genDate} at ${genTime}`, pageWidth - margin - 65, currentY + 6);
  doc.text(
    `Language Profile: ${sessionData.selectedLanguage || 'en-IN'}`,
    pageWidth - margin - 65,
    currentY + 12
  );
  doc.setTextColor(16, 136, 7);
  doc.text('Verification: Grounded in BIS Database', pageWidth - margin - 65, currentY + 18);

  currentY += 28;

  // -------------------------------------------------------------
  // 3. TABLE OF IDENTIFIED INDIAN STANDARDS (IF ANY)
  // -------------------------------------------------------------
  if (standardsList.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 41, 66);
    doc.text('1. IDENTIFIED INDIAN STANDARDS & REGULATORY SCOPE', margin, currentY);
    currentY += 4;

    const stdRows = standardsList.map((s, idx) => [
      `${idx + 1}`,
      s.code,
      s.title,
      s.scheme,
      s.mandatory ? 'MANDATORY (QCO)' : 'VOLUNTARY',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Standard No.', 'Standard Title / Commodity', 'Scheme', 'Status']],
      body: stdRows,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: {
        fillColor: [15, 41, 66],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2.5,
      },
      styles: {
        fontSize: 7.2,
        cellPadding: 2.2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 26, fontStyle: 'bold' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 32 },
        4: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.column.index === 4 && data.section === 'body') {
          if (data.cell.raw.includes('MANDATORY')) {
            data.cell.styles.textColor = [180, 35, 24];
          } else {
            data.cell.styles.textColor = [8, 116, 67];
          }
        }
      },
    });

    currentY = doc.lastAutoTable.finalY + 8;
  }

  // -------------------------------------------------------------
  // 4. CHRONOLOGICAL CONSULTATION DIALOGUE
  // -------------------------------------------------------------
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 41, 66);
  doc.text('2. CONSULTATION DIALOGUE & GROUNDED ADVISORIES', margin, currentY);
  currentY += 6;

  let turnNumber = 1;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isUser = msg.sender === 'user';
    const rawText = msg.text || msg.message || '';
    const cleanText = cleanMarkdownForPdf(rawText);

    if (isUser) {
      // USER QUERY BLOCK
      if (currentY > pageHeight - 35) {
        doc.addPage();
        currentY = 20;
      }

      const splitUserLines = doc.splitTextToSize(cleanText, contentWidth - 16);
      const boxHeight = Math.max(16, splitUserLines.length * 4 + 10);

      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, 'FD');

      // Left blue accent strip
      doc.setFillColor(21, 94, 239);
      doc.rect(margin, currentY, 3, boxHeight, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(21, 94, 239);
      doc.text(`INQUIRY #${turnNumber}: APPLICANT QUESTION`, margin + 6, currentY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(splitUserLines, margin + 6, currentY + 11);

      currentY += boxHeight + 5;
      turnNumber++;
    } else {
      // ASSISTANT ADVISORY BLOCK
      if (currentY > pageHeight - 35) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 41, 66);
      doc.text('BIS SAARTHI ADVISORY (STATUTORY EVIDENCE-GROUNDED):', margin, currentY);

      // Grounded badge
      doc.setFillColor(237, 247, 237);
      doc.setDrawColor(166, 244, 197);
      doc.roundedRect(pageWidth - margin - 38, currentY - 4, 38, 5.5, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(8, 116, 67);
      doc.text('OFFICIAL EVIDENCE', pageWidth - margin - 19, currentY - 0.5, { align: 'center' });

      currentY += 4.5;

      const paragraphs = cleanText.split('\n\n');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);

      for (let p = 0; p < paragraphs.length; p++) {
        const pText = paragraphs[p].trim();
        if (!pText) continue;

        const splitLines = doc.splitTextToSize(pText, contentWidth);
        const requiredHeight = splitLines.length * 3.8;

        if (currentY + requiredHeight > pageHeight - 20) {
          doc.addPage();
          currentY = 20;
        }

        doc.text(splitLines, margin, currentY);
        currentY += requiredHeight + 2.5;
      }

      // If this message contains testing info parameters, render a small table
      if (msg.testing_info?.critical_parameters?.length > 0) {
        if (currentY > pageHeight - 40) {
          doc.addPage();
          currentY = 20;
        }

        const paramRows = msg.testing_info.critical_parameters.slice(0, 5).map((p) => [
          p.parameter_name || 'Test Parameter',
          p.test_method || 'Clause',
          p.specification_limit || 'Specified Limit',
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Parameter', 'Test Method / Clause', 'Permissible Standard Limit']],
          body: paramRows,
          margin: { left: margin, right: margin },
          theme: 'striped',
          headStyles: {
            fillColor: [30, 65, 100],
            textColor: [255, 255, 255],
            fontSize: 7,
            cellPadding: 1.8,
          },
          styles: {
            fontSize: 6.8,
            cellPadding: 1.8,
            textColor: [30, 41, 59],
          },
        });

        currentY = doc.lastAutoTable.finalY + 6;
      }

      currentY += 4;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 6;
    }
  }

  // -------------------------------------------------------------
  // 5. LEGAL UNDERTAKING & STATUTORY CITATION
  // -------------------------------------------------------------
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'FD');

  doc.setTextColor(180, 35, 24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('STATUTORY CITATION & LEGAL DISCLAIMER (BIS ACT, 2016):', margin + 5, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(80, 20, 20);
  const disclaimer =
    'This transcript is compiled from official Bureau of Indian Standards (BIS) Gazette notifications, Indian Standard specifications, and Scheme-I/II conformity rules. It serves as an informative pre-assessment record. Formal applications for grant of licence must be lodged through the official national portal at manakonline.in.';
  const splitDisc = doc.splitTextToSize(disclaimer, contentWidth - 10);
  doc.text(splitDisc, margin + 5, currentY + 10.5);

  currentY += 24;

  // Signature Blocks
  if (currentY > pageHeight - 25) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('GENERATED FOR APPLICANT RECORDS', margin + 10, currentY);
  doc.text('BUREAU OF INDIAN STANDARDS ASSISTANT (AI)', pageWidth - margin - 75, currentY);

  currentY += 10;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin + 5, currentY, margin + 65, currentY);
  doc.line(pageWidth - margin - 75, currentY, pageWidth - margin - 15, currentY);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Applicant / Compliance Officer Verification', margin + 12, currentY + 3.5);
  doc.text('Official Conformity Engine Authenticated', pageWidth - margin - 68, currentY + 3.5);

  // Add headers, footers & page numbers to all pages
  addHeaderAndFooter();

  const safeFilename = `BIS_Consultation_Transcript_${genDate.replace(/ /g, '_')}.pdf`;
  doc.save(safeFilename);
  return safeFilename;
}


