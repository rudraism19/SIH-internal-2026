import React from 'react';
import { motion } from 'framer-motion';
import VerificationBadge from './VerificationBadge';
import StandardCard from './StandardCard';
import EvidenceCard from './EvidenceCard';
import NoEvidenceCard from './NoEvidenceCard';
import WorkflowSteps from './WorkflowSteps';
import HallmarkingCard from './HallmarkingCard';
import ComplianceCard from './ComplianceCard';
import CustomsCard from './CustomsCard';
import RenewalCard from './RenewalCard';
import TestingCard from './TestingCard';
import BatchCalculatorCard from './BatchCalculatorCard';
import { Play, Pause, ArrowRight, FileDown } from 'lucide-react';
import { generateComplianceDossierPdf } from '../../utils/pdfGenerator';

/** Inline Markdown parser for **bold**, `code`, and statutory badges */
function parseInlineMarkdown(text) {
  if (!text) return '';
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      const inner = token.slice(2, -2);
      const innerUpper = inner.trim().toUpperCase();
      if (innerUpper === 'MANDATORY') {
        parts.push(<span key={match.index} className="bis-status-pill mandatory">MANDATORY</span>);
      } else if (innerUpper === 'VOLUNTARY') {
        parts.push(<span key={match.index} className="bis-status-pill voluntary">VOLUNTARY</span>);
      } else if (innerUpper.includes('SCHEME I') || innerUpper.includes('SCHEME II') || innerUpper.includes('FMCS') || innerUpper.includes('CRS')) {
        parts.push(<span key={match.index} className="bis-status-pill scheme">{inner}</span>);
      } else {
        parts.push(<strong key={match.index}>{inner}</strong>);
      }
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(<code key={match.index} className="inline-code">{token.slice(1, -1)}</code>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/** Formats structured text: headings, tables, paragraphs, bullet lists, numbered lists */
function renderStructuredText(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let currentList = [];
  let listType = null;
  let inTable = false;
  let tableRows = [];

  const flushList = (key) => {
    if (currentList.length > 0) {
      if (listType === 'ol') {
        elements.push(
          <ol key={`ol-${key}`} className="bis-answer-ol">
            {currentList.map((item, idx) => (
              <li key={idx}>{parseInlineMarkdown(item)}</li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${key}`} className="bis-answer-ul">
            {currentList.map((item, idx) => (
              <li key={idx}>{parseInlineMarkdown(item)}</li>
            ))}
          </ul>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  const flushTable = (key) => {
    if (tableRows.length > 0) {
      const headerRow = tableRows[0];
      const bodyRows = tableRows.slice(1).filter((r) => !r.every((cell) => cell.match(/^:?-+:?$/)));
      elements.push(
        <div key={`tbl-${key}`} className="bis-table-container">
          <table className="bis-compliance-table">
            <thead>
              <tr>
                {headerRow.map((cell, cIdx) => (
                  <th key={cIdx}>{parseInlineMarkdown(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx}>{parseInlineMarkdown(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Table line check: starts and ends with '|'
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList(idx);
      inTable = true;
      const cells = trimmed.slice(1, -1).split('|').map((c) => c.trim());
      tableRows.push(cells);
      return;
    } else if (inTable) {
      flushTable(idx);
    }

    if (!trimmed) {
      flushList(idx);
      return;
    }

    // Horizontal Dividers
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList(idx);
      elements.push(<hr key={`hr-${idx}`} className="bis-answer-divider" />);
      return;
    }

    // Section Headings (Level 3 - Main compliance sections)
    if (trimmed.startsWith('### ')) {
      flushList(idx);
      const headingContent = trimmed.slice(4).trim();
      const cleanHeading = headingContent.replace(/^\*+|\*+$/g, '').trim();
      const secMatch = cleanHeading.match(/^(\d+[.)]?)\s+(.*)$/);
      if (secMatch) {
        elements.push(
          <div key={`h3-${idx}`} className="bis-answer-section-header">
            <div className="bis-section-pill">{secMatch[1].replace(/[.)]/, '')}</div>
            <h3 className="bis-answer-h3">{parseInlineMarkdown(secMatch[2].replace(/^\*+|\*+$/g, '').trim())}</h3>
          </div>
        );
      } else {
        elements.push(
          <div key={`h3-${idx}`} className="bis-answer-section-header">
            <div className="bis-section-pill">§</div>
            <h3 className="bis-answer-h3">{parseInlineMarkdown(cleanHeading)}</h3>
          </div>
        );
      }
      return;
    }

    if (trimmed.startsWith('## ')) {
      flushList(idx);
      elements.push(
        <h2 key={`h2-${idx}`} className="bis-answer-h2">
          {parseInlineMarkdown(trimmed.slice(3).trim())}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith('# ')) {
      flushList(idx);
      elements.push(
        <h1 key={`h1-${idx}`} className="bis-answer-h1">
          {parseInlineMarkdown(trimmed.slice(2).trim())}
        </h1>
      );
      return;
    }

    if (trimmed.startsWith('#### ')) {
      flushList(idx);
      elements.push(
        <h4 key={`h4-${idx}`} className="bis-answer-h4">
          {parseInlineMarkdown(trimmed.slice(5).trim())}
        </h4>
      );
      return;
    }

    // Bullet list: •, -, *
    const bulletMatch = line.match(/^(\s*)(?:•|-|\*)\s+(.*)$/);
    if (bulletMatch) {
      if (listType && listType !== 'ul') flushList(idx);
      listType = 'ul';
      currentList.push(bulletMatch[2]);
      return;
    }

    // Numbered list
    const numMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numMatch) {
      if (listType && listType !== 'ol') flushList(idx);
      listType = 'ol';
      currentList.push(numMatch[1]);
      return;
    }

    flushList(idx);
    elements.push(
      <p key={`p-${idx}`} className="bis-answer-p">
        {parseInlineMarkdown(trimmed)}
      </p>
    );
  });

  flushList('end');
  flushTable('end');
  return elements;
}

export default function BISAnswerCard({
  msg,
  onPlayAudio,
  isAudioPlaying = false,
  onQuickQuery,
}) {
  if (!msg) return null;

  const {
    id,
    text = '',
    verified = false,
    grounded = false,
    response_mode: _response_mode,
    product: _product,
    standards: _standards = [],
    sections: _sections = [],
    next_question,
    actions = [],
    identified_standards = [],
    citations = [],
    compliance_info,
    testing_info,
    customs_info,
    renewal_info,
    batch_info,
    hallmarking_info,
    next_steps = [],
    audio_base64,
    detected_language,
  } = msg;

  const hasCitations = citations && citations.length > 0;
  const hasStandards = identified_standards && identified_standards.length > 0;
  const primaryStandard = hasStandards ? identified_standards[0]?.standard_number : citations[0]?.standard_number;
  const isNoEvidence = !grounded && !hasCitations && !hasStandards && !compliance_info && !hallmarking_info;

  // Detect if query was about general certification process
  const isGeneralCertificationQuery =
    text.toLowerCase().includes('certification process') ||
    text.toLowerCase().includes('how do i get bis certification') ||
    text.toLowerCase().includes('procedure for grant of licence');

  const stdForDossier = primaryStandard || compliance_info?.standard_number || testing_info?.standard_number || renewal_info?.standard_number;
  const handleExportDossier = () => {
    generateComplianceDossierPdf({
      standardNumber: stdForDossier || 'IS STANDARD',
      productName: compliance_info?.product_name || identified_standards?.[0]?.title || 'Regulated Product',
      title: identified_standards?.[0]?.title,
      scheme: compliance_info?.scheme || (hallmarking_info ? 'Hallmarking' : 'Scheme I (ISI Mark)'),
      isMandatory: compliance_info?.is_mandatory ?? (Boolean(hallmarking_info) || Boolean(stdForDossier)),
      qcoName: compliance_info?.qco_name,
      ministry: compliance_info?.ministry,
      enforcementDate: compliance_info?.enforcement_date,
      sampleRequirements: testing_info?.sample_requirements,
      turnaroundTime: testing_info?.estimated_turnaround,
      parameters: testing_info?.critical_parameters,
      laboratories: testing_info?.recognized_laboratories,
      renewalInfo: renewal_info,
      batchInfo: batch_info,
    });
  };

  return (
    <motion.div
      className="bis-answer-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* 1. Header Bar: BIS ASSISTANT + Verification Badge */}
      <div className="bis-card-header">
        <div className="header-brand-row">
          <span className="bis-seal-icon">🏛</span>
          <span className="bis-brand-name">BIS ASSISTANT</span>
          {detected_language && detected_language !== 'en' && (
            <span className="lang-detected-tag">
              🌐 {detected_language.toUpperCase()}
            </span>
          )}
        </div>

        <VerificationBadge
          verified={verified}
          grounded={grounded}
          citationsCount={citations.length}
        />
      </div>

      {/* 2. Audio Voice Player Widget (if TTS audio returned) */}
      {audio_base64 && (
        <motion.div
          className="bis-audio-player-bar"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            type="button"
            className={`audio-play-btn ${isAudioPlaying ? 'playing' : ''}`}
            onClick={() => onPlayAudio(id, audio_base64)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            aria-label={isAudioPlaying ? 'Pause spoken response' : 'Play spoken response'}
          >
            {isAudioPlaying ? <Pause size={15} /> : <Play size={15} />}
          </motion.button>
          <div className="audio-info">
            <span className="audio-title">Spoken BIS Response</span>
            <span className="audio-sub">Official Indic acoustic synthesis</span>
          </div>
          {isAudioPlaying && (
            <div className="audio-eq-mini">
              <motion.span
                className="eq-bar"
                animate={{ height: [4, 16, 8, 14, 4] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
              />
              <motion.span
                className="eq-bar"
                animate={{ height: [12, 4, 18, 6, 12] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut', delay: 0.2 }}
              />
              <motion.span
                className="eq-bar"
                animate={{ height: [6, 18, 4, 16, 6] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut', delay: 0.4 }}
              />
            </div>
          )}
        </motion.div>
      )}

      {/* 3. Main Answer Body */}
      <div className="bis-answer-body">
        {renderStructuredText(text)}
      </div>

      {/* 4. Structured Certification Process Workflow (if applicable) */}
      {isGeneralCertificationQuery && (
        <WorkflowSteps title="BIS CERTIFICATION PROCESS (SCHEME I)" />
      )}

      {/* 5. Identified Standards Section */}
      {hasStandards && (
        <div className="bis-standards-section">
          <div className="section-label-row">
            <span className="section-kicker">IDENTIFIED STANDARD</span>
            <span className="section-count">{identified_standards.length} Document{identified_standards.length > 1 ? 's' : ''}</span>
          </div>

          <div className="standards-cards-list">
            {identified_standards.map((std, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.25 }}
              >
                <StandardCard
                  standardNumber={std.standard_number}
                  title={std.title}
                  confidence={std.confidence}
                  pages={std.pages}
                  onAskAbout={onQuickQuery}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Evidence Section (Clauses & Pages) */}
      {hasCitations && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <EvidenceCard
            citations={citations}
            primaryStandard={primaryStandard}
          />
        </motion.div>
      )}

      {/* 7. Domain Specific Intelligence Cards (Guarded: No empty cards) */}
      {hallmarking_info && hallmarking_info.standard_number && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <HallmarkingCard hallmarkingInfo={hallmarking_info} />
        </motion.div>
      )}
      {compliance_info && (compliance_info.qco_name || compliance_info.is_mandatory || compliance_info.scheme) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <ComplianceCard complianceInfo={compliance_info} />
        </motion.div>
      )}
      {customs_info && customs_info.hsn_code && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <CustomsCard customsInfo={customs_info} />
        </motion.div>
      )}
      {renewal_info && renewal_info.standard_number && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <RenewalCard renewalInfo={renewal_info} />
        </motion.div>
      )}
      {testing_info && ((testing_info.critical_parameters && testing_info.critical_parameters.length > 0) || (testing_info.recognized_laboratories && testing_info.recognized_laboratories.length > 0)) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <TestingCard testingInfo={testing_info} />
        </motion.div>
      )}
      {batch_info && (batch_info.routine_tests && batch_info.routine_tests.length > 0) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <BatchCalculatorCard batchInfo={batch_info} />
        </motion.div>
      )}

      {/* 7b. Official Statutory Compliance Dossier & Audit Checklist PDF Export Banner */}
      {stdForDossier && (
        <motion.div
          className="bis-dossier-download-banner"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--action-blue-light)',
            border: '1px solid var(--action-blue-border)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginTop: '12px',
            marginBottom: '8px',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--action-blue)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <FileDown size={18} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--primary-text)' }}>
                Statutory Compliance Dossier & SIT Checklist (PDF)
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>
                Printable official BIS audit file for {stdForDossier} with SIT parameters & factory logbook checklist
              </div>
            </div>
          </div>
          <motion.button
            type="button"
            className="tab-action-btn primary"
            onClick={handleExportDossier}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '0.82rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              marginLeft: 'auto',
            }}
          >
            <FileDown size={14} />
            <span>Download PDF</span>
          </motion.button>
        </motion.div>
      )}

      {/* 8. Graceful No Evidence Card (if no grounding and no evidence) */}
      {isNoEvidence && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <NoEvidenceCard onSearchStandards={onQuickQuery} />
        </motion.div>
      )}

      {/* 9. Intelligent Next Question Prompt Card */}
      {next_question && (
        <motion.div
          className="bis-next-question-card"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="next-q-badge-row">
            <span className="next-q-tag">NEXT LOGICAL STEP</span>
          </div>
          <div className="next-q-text">{next_question}</div>
        </motion.div>
      )}

      {/* 10. Contextual Action Chips (Buttons that submit query on click) */}
      {actions && actions.length > 0 && (
        <div className="bis-contextual-actions">
          <span className="actions-kicker">Recommended Actions:</span>
          <div className="actions-chip-grid">
            {actions.map((act, idx) => (
              <motion.button
                key={idx}
                type="button"
                className="bis-action-btn"
                onClick={() => onQuickQuery && onQuickQuery(act.query)}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                title={act.query}
              >
                <span className="bis-action-label">{act.label}</span>
                <ArrowRight size={13} className="bis-action-icon" />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* 11. Next Steps / Related Actions */}
      {next_steps && next_steps.length > 0 && (
        <div className="bis-next-steps-row">
          <span className="next-steps-kicker">Suggested Next Steps:</span>
          <div className="next-steps-chips">
            {next_steps.map((step, idx) => (
              <motion.button
                key={idx}
                type="button"
                className="step-chip"
                onClick={() => onQuickQuery && onQuickQuery(step)}
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <span>{step}</span>
                <ArrowRight size={12} />
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
