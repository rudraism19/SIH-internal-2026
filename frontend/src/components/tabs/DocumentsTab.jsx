import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowRight, FileText, FileDown } from 'lucide-react';
import { generateComplianceDossierPdf } from '../../utils/pdfGenerator';

const DOCUMENTS_LIST = [
  {
    code: 'Form-V',
    title: 'Application for Grant of Licence to use or apply a Standard Mark',
    regulation: 'Regulation 4, BIS (Conformity Assessment) Regulations, 2018',
    purpose: 'Initial application filed by manufacturers on Manakonline portal for obtaining BIS Scheme I (ISI) licence.',
    keyRequirements: 'Factory layout, machinery list, test equipment list, in-house lab calibration certificates, raw material test certs.',
    scheme: 'Scheme I (ISI Mark)',
  },
  {
    code: 'Form-VI',
    title: 'Application for Renewal of Licence to use or apply a Standard Mark',
    regulation: 'Regulation 7, BIS (Conformity Assessment) Regulations, 2018',
    purpose: 'Statutory renewal application filed 90 to 30 days prior to licence expiry date on Manakonline e-BIS.',
    keyRequirements: 'Production and marking details (Form-VII), audited marking fee calculation, non-conformance closure reports.',
    scheme: 'Scheme I (ISI Mark)',
  },
  {
    code: 'Form-VII',
    title: 'Statement of Annual Production & Marking Fee Declaration',
    regulation: 'Regulation 7(2), Schedule II Fee Rules',
    purpose: 'Chartered Accountant audited statement quantifying actual units marked with ISI logo over the operating year.',
    keyRequirements: 'Audited unit count, invoice reconciliation, unit marking fee computation against minimum statutory fee.',
    scheme: 'Scheme I (ISI Mark)',
  },
  {
    code: 'SIT Template',
    title: 'Scheme of Inspection and Testing (SIT) — Operational Guidelines',
    regulation: 'Conformity Assessment Standard Quality Control Framework',
    purpose: 'Defines factory quality control unit sizes, in-line 100% testing routines, sampling frequency, and QA logbooks.',
    keyRequirements: 'Acceptance/rejection AQL criteria, gauge calibration register, non-conforming product scrap segregation.',
    scheme: 'Mandatory Factory QA',
  },
  {
    code: 'FMCS Manual',
    title: 'Foreign Manufacturers Certification Scheme (FMCS) Manual',
    regulation: 'Scheme I for Overseas Manufacturing Facilities',
    purpose: 'Standard operating procedure for non-Indian manufacturing plants to apply for and hold a BIS licence.',
    keyRequirements: 'Authorized Indian Representative (AIR) nomination, factory physical inspection, bilateral performance bank guarantee.',
    scheme: 'Scheme I (Foreign)',
  },
  {
    code: 'Hallmarking Rules',
    title: 'BIS (Hallmarking) Regulations, 2018 & Gazette Orders',
    regulation: 'Section 14 & 16 of the Bureau of Indian Standards Act, 2016',
    purpose: 'Rules governing mandatory 6-digit HUID registration for jewellers, assaying centre protocols, and consumer compensation.',
    keyRequirements: 'GST registration, AHC assaying ledger, laser etching compliance, BIS Care consumer verification API.',
    scheme: 'Hallmarking Scheme',
  },
];

export default function DocumentsTab({ onAskAssistant }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = DOCUMENTS_LIST.filter((doc) =>
    doc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="tab-container">
      {/* Header Bar */}
      <div className="tab-header">
        <div>
          <h1 className="tab-title">Statutory Documents & Conformity Forms</h1>
          <p className="tab-subtitle">
            Official forms, regulatory schedules, and Scheme of Inspection & Testing (SIT) guidelines under the BIS Act, 2016.
          </p>
        </div>
        <div className="tab-stat-pill">
          <span className="stat-number">{DOCUMENTS_LIST.length}</span>
          <span className="stat-label">Statutory Forms</span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="tab-toolbar">
        <div className="tab-search-input-wrap">
          <Search size={16} className="tab-search-icon" />
          <input
            type="text"
            className="tab-search-input"
            placeholder="Search documents by form code (e.g. Form-VI) or regulatory keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="tab-search-clear"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="tab-card-container">
        <div className="docs-directory-grid">
          {filteredDocs.map((doc, idx) => (
            <motion.div
              key={doc.code}
              className="doc-item-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.04, 0.3), duration: 0.22 }}
              whileHover={{ y: -3, boxShadow: '0 8px 20px rgba(11, 31, 51, 0.08)' }}
            >
              <div className="doc-card-header">
                <div className="doc-code-pill">
                  <FileText size={15} className="doc-icon text-navy" />
                  <strong className="mono">{doc.code}</strong>
                </div>
                <span className="badge-pill badge-primary">{doc.scheme}</span>
              </div>

              <div className="doc-card-body">
                <h3 className="doc-card-title">{doc.title}</h3>
                <div className="doc-reg-sub">{doc.regulation}</div>

                <div className="doc-field">
                  <span className="doc-field-label">Purpose:</span>
                  <p className="doc-field-text">{doc.purpose}</p>
                </div>

                <div className="doc-field">
                  <span className="doc-field-label">Mandatory Submissions:</span>
                  <p className="doc-field-text">{doc.keyRequirements}</p>
                </div>
              </div>

              <div className="doc-card-footer" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <motion.button
                  type="button"
                  className="tab-action-btn secondary"
                  onClick={() => {
                    generateComplianceDossierPdf({
                      standardNumber: doc.code,
                      productName: doc.title,
                      title: `${doc.title} — ${doc.regulation}`,
                      scheme: doc.scheme,
                      isMandatory: true,
                      sampleRequirements: doc.keyRequirements,
                      turnaroundTime: 'Statutory compliance schedule as per BIS (Conformity Assessment) Regulations 2018.',
                    });
                  }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  title="Download Statutory Checklist & Compliance Dossier PDF"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    border: '1px solid var(--border)',
                    background: 'var(--card-subtle-bg)',
                    color: 'var(--primary-text)',
                    cursor: 'pointer',
                  }}
                >
                  <FileDown size={12} style={{ color: '#0284c7' }} />
                  <span>PDF Dossier</span>
                </motion.button>

                <motion.button
                  type="button"
                  className="tab-action-btn primary"
                  onClick={() => onAskAssistant && onAskAssistant(`What is ${doc.code} and what are the detailed requirements and filing deadlines under ${doc.regulation}?`)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  <span>Inquire</span>
                  <ArrowRight size={12} />
                </motion.button>
              </div>
            </motion.div>
          ))}
          {filteredDocs.length === 0 && (
            <div className="no-results-box">
              No documents matching "{searchQuery}" found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
