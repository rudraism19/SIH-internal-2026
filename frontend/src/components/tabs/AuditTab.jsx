import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck,
  ShieldCheck,
  AlertTriangle,
  FileDown,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Loader2,
  RotateCcw,
  Wrench,
  Layers,
  Users,
  Trash2,
  FileText
} from 'lucide-react';
import { fetchAuditChecklist, evaluateAuditResponses } from '../../services/api';
import { generateAuditReportPdf } from '../../utils/pdfGenerator';

const STANDARDS_OPTIONS = [
  { key: 'IS 2347', label: 'IS 2347:2017 — Domestic Pressure Cookers' },
  { key: 'IS 4151', label: 'IS 4151:2020 — Protective Helmets (Two-Wheelers)' },
  { key: 'UNIVERSAL', label: 'Universal BIS Scheme-I Quality Assurance (All Products)' },
];

const PILLAR_ICONS = {
  testing_infrastructure: Wrench,
  raw_materials: Layers,
  sit_compliance: ShieldCheck,
  technical_personnel: Users,
  non_conformance: Trash2,
  statutory_records: FileText,
};

export default function AuditTab({ onAskAssistant }) {
  const [selectedStandard, setSelectedStandard] = useState('IS 2347');
  const [factoryName, setFactoryName] = useState('Apex Quality Manufacturing Plant');
  const [factoryLocation, setFactoryLocation] = useState('Bangalore Industrial Area, Karnataka');
  const [checklist, setChecklist] = useState(null);
  const [responses, setResponses] = useState({});
  const [evaluation, setEvaluation] = useState(null);
  const [activePillarFilter, setActivePillarFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // 1. Fetch checklist on standard change
  useEffect(() => {
    let isMounted = true;
    const loadChecklist = async () => {
      setIsLoading(true);
      try {
        const res = await fetchAuditChecklist(selectedStandard);
        if (isMounted && res && res.success) {
          setChecklist(res);
          // Pre-populate with default "yes" on critical items and empty on others
          const initial = {};
          res.items.forEach((item, idx) => {
            // Default 70% yes, some partial to make it instantly interactive
            initial[item.id] = idx % 4 === 1 ? 'partial' : idx % 5 === 0 ? 'no' : 'yes';
          });
          setResponses(initial);
        }
      } catch (err) {
        console.error('Failed to load audit checklist:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadChecklist();
    return () => {
      isMounted = false;
    };
  }, [selectedStandard]);

  // 2. Evaluate responses whenever responses or factory details change
  useEffect(() => {
    let isMounted = true;
    const runEvaluation = async () => {
      if (!checklist || Object.keys(responses).length === 0) return;
      try {
        const res = await evaluateAuditResponses({
          standard: selectedStandard,
          responses,
          factory_name: factoryName,
          factory_location: factoryLocation,
        });
        if (isMounted && res && res.success) {
          setEvaluation(res);
        }
      } catch (err) {
        console.error('Evaluation error:', err);
      }
    };
    const timer = setTimeout(runEvaluation, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [responses, selectedStandard, factoryName, factoryLocation, checklist]);

  const handleResponseChange = (itemId, value) => {
    setResponses((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const handleResetAll = (value = 'yes') => {
    if (!checklist) return;
    const updated = {};
    checklist.items.forEach((item) => {
      updated[item.id] = value;
    });
    setResponses(updated);
  };

  const handleExportPdf = () => {
    if (!evaluation) return;
    setIsExporting(true);
    try {
      generateAuditReportPdf({
        standardNumber: evaluation.standard_number,
        productName: evaluation.product_name,
        factoryName: evaluation.factory_name,
        factoryLocation: evaluation.factory_location,
        overallScore: evaluation.overall_score,
        rating: evaluation.rating,
        ratingDescription: evaluation.rating_description,
        pillarsBreakdown: evaluation.pillars_breakdown,
        correctiveActionPlan: evaluation.corrective_action_plan,
      });
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  const filteredItems = useMemo(() => {
    if (!checklist) return [];
    if (activePillarFilter === 'all') return checklist.items;
    return checklist.items.filter((i) => i.pillar === activePillarFilter);
  }, [checklist, activePillarFilter]);

  const score = evaluation?.overall_score ?? 0;
  const rating = evaluation?.rating ?? 'EVALUATING';
  const ratingColor = evaluation?.rating_color ?? '#16a34a';

  return (
    <div className="tab-container">
      {/* Header Bar */}
      <div className="tab-header">
        <div>
          <h1 className="tab-title">Factory Inspection & Audit Readiness Simulator</h1>
          <p className="tab-subtitle">
            Self-assessment inspection simulator, dynamic readiness scoring, and statutory Corrective & Preventive Action (CAPA) engine under the BIS Act, 2016.
          </p>
        </div>
        <div className="tab-stat-pill primary">
          <ClipboardCheck size={16} className="inline-icon" />
          <span className="stat-label">Conformity Assessment 2018</span>
        </div>
      </div>

      {/* Standard & Plant Configuration Bar */}
      <div className="tab-card-container" style={{ marginBottom: 16 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px',
          background: 'var(--surface, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '8px',
          padding: '16px',
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--secondary-text)', marginBottom: 4 }}>
              Target Indian Standard / Regulated Category:
              {isLoading && <Loader2 size={12} className="animate-spin inline-icon" style={{ marginLeft: 6, color: 'var(--action-blue)' }} />}
            </label>
            <select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              className="tab-search-input"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}
            >
              {STANDARDS_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
              Manufacturing Plant Name:
            </label>
            <input
              type="text"
              value={factoryName}
              onChange={(e) => setFactoryName(e.target.value)}
              placeholder="e.g. Precision Pressure Cooker Plant"
              className="tab-search-input"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
              Plant City / Location:
            </label>
            <input
              type="text"
              value={factoryLocation}
              onChange={(e) => setFactoryLocation(e.target.value)}
              placeholder="e.g. Sahibabad, Uttar Pradesh"
              className="tab-search-input"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* REAL-TIME AUDIT READINESS SCORECARD */}
      <div className="tab-card-container" style={{ marginBottom: 18 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(15, 41, 66, 0.04) 0%, rgba(2, 132, 199, 0.08) 100%)',
          border: '1px solid rgba(2, 132, 199, 0.25)',
          borderRadius: '10px',
          padding: '20px 24px',
        }}>
          {/* Score Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: ratingColor,
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.6rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
              flexShrink: 0,
            }}>
              <span>{score}%</span>
              <span style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase' }}>Score</span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 4 }}>
                <span style={{
                  background: ratingColor,
                  color: '#ffffff',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}>
                  {rating}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>
                  ({evaluation?.critical_deficiencies_count || 0} Critical Gaps)
                </span>
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-text)', margin: 0 }}>
                {evaluation?.product_name || 'BIS Product Audit Assessment'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--secondary-text)', margin: '4px 0 0 0' }}>
                {evaluation?.rating_description || 'Evaluating statutory factory requirements...'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <motion.button
              type="button"
              className="tab-action-btn primary"
              onClick={handleExportPdf}
              disabled={isExporting}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                background: 'var(--action-blue)',
                color: '#ffffff',
                border: 'none',
              }}
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
              <span>Download Audit Report (PDF)</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* 6-PILLAR COMPLIANCE BREAKDOWN */}
      <div className="tab-card-container" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary-text)', marginBottom: 10 }}>
          Statutory Quality Dimensions Breakdown
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
        }}>
          {evaluation?.pillars_breakdown?.map((p) => {
            const IconComp = PILLAR_ICONS[p.id] || ShieldCheck;
            const pScore = p.score_percent || 0;
            const barColor = pScore >= 80 ? '#16a34a' : pScore >= 50 ? '#ea580c' : '#dc2626';

            return (
              <div
                key={p.id}
                style={{
                  background: 'var(--surface, #ffffff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '6px',
                  padding: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 6 }}>
                  <IconComp size={14} style={{ color: '#0284c7' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>
                    {p.name}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                  <span style={{ color: '#64748b' }}>Weight: {p.weight}%</span>
                  <strong style={{ color: barColor }}>{pScore}%</strong>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${pScore}%`,
                      height: '100%',
                      background: barColor,
                      transition: 'width 300ms ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTER TABS & BULK ACTIONS */}
      <div className="tab-toolbar">
        <div className="tab-filter-chips">
          <motion.button
            type="button"
            className={`filter-chip ${activePillarFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActivePillarFilter('all')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            All Questions ({checklist?.total_items || 0})
          </motion.button>
          {checklist?.pillars?.map((pil) => (
            <motion.button
              key={pil.id}
              type="button"
              className={`filter-chip ${activePillarFilter === pil.id ? 'active' : ''}`}
              onClick={() => setActivePillarFilter(pil.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {pil.name}
            </motion.button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={() => handleResetAll('yes')}
            className="tab-action-btn"
            title="Set all answers to Conforming"
            style={{ fontSize: '0.75rem' }}
          >
            <CheckCircle2 size={12} style={{ color: '#16a34a' }} />
            <span>Mark All Yes</span>
          </button>
          <button
            type="button"
            onClick={() => handleResetAll('no')}
            className="tab-action-btn"
            title="Reset all to Non-Conforming"
            style={{ fontSize: '0.75rem' }}
          >
            <RotateCcw size={12} />
            <span>Reset All</span>
          </button>
        </div>
      </div>

      {/* AUDIT CHECKLIST QUESTIONS */}
      <div className="tab-card-container" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredItems.map((item, idx) => {
            const currentResp = responses[item.id] || 'no';
            const isCrit = item.criticality === 'Critical';

            return (
              <motion.div
                key={item.id}
                style={{
                  background: 'var(--surface, #ffffff)',
                  border: `1px solid ${currentResp === 'no' ? '#fecaca' : currentResp === 'partial' ? '#fed7aa' : '#e2e8f0'}`,
                  borderLeft: `4px solid ${currentResp === 'no' ? '#dc2626' : currentResp === 'partial' ? '#ea580c' : '#16a34a'}`,
                  borderRadius: '6px',
                  padding: '14px 16px',
                  transition: 'border-color 150ms ease',
                }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.02, 0.2) }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 4 }}>
                      <span style={{
                        background: isCrit ? 'rgba(220, 38, 38, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                        color: isCrit ? '#dc2626' : '#0284c7',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}>
                        {item.criticality}
                      </span>
                      <code style={{ fontSize: '0.72rem', background: 'var(--hover-subtle-bg)', padding: '2px 5px', borderRadius: '3px', color: 'var(--primary-text)' }}>
                        {item.clause_ref}
                      </code>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--primary-text)' }}>{item.title}</strong>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                  </div>

                  {/* Yes / Partial / No Radio Buttons */}
                  <div style={{ display: 'inline-flex', gap: '6px', background: 'var(--card-subtle-bg)', padding: '4px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <button
                      type="button"
                      onClick={() => handleResponseChange(item.id, 'yes')}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        background: currentResp === 'yes' ? '#16a34a' : 'transparent',
                        color: currentResp === 'yes' ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCircle2 size={12} />
                      <span>Yes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResponseChange(item.id, 'partial')}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        background: currentResp === 'partial' ? '#ea580c' : 'transparent',
                        color: currentResp === 'partial' ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <HelpCircle size={12} />
                      <span>Partial</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResponseChange(item.id, 'no')}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        background: currentResp === 'no' ? '#dc2626' : 'transparent',
                        color: currentResp === 'no' ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <XCircle size={12} />
                      <span>No</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Box: Corrective Action Guidance if Not Yes */}
                <AnimatePresence>
                  {currentResp !== 'yes' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        marginTop: '10px',
                        padding: '8px 12px',
                        background: currentResp === 'no' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        borderRadius: '6px',
                        borderLeft: `3px solid ${currentResp === 'no' ? 'var(--status-mandatory)' : '#f59e0b'}`,
                        fontSize: '0.76rem',
                        color: currentResp === 'no' ? 'var(--status-mandatory)' : 'var(--status-voluntary)',
                      }}
                    >
                      <strong>Remedial Action Required: </strong>
                      {item.capa_recommendation}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CORRECTIVE ACTION PLAN (CAPA) SUMMARY TABLE */}
      {evaluation?.corrective_action_plan && evaluation.corrective_action_plan.length > 0 && (
        <div className="tab-card-container" style={{ marginBottom: 20 }}>
          <div style={{
            background: 'var(--surface, #ffffff)',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} style={{ color: '#dc2626' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#991b1b', margin: 0 }}>
                  Statutory Corrective Action Plan (CAPA) — {evaluation.corrective_action_plan.length} Deficiencies Identified
                </h3>
              </div>
              <motion.button
                type="button"
                className="tab-action-btn primary"
                onClick={() => {
                  const capaSummary = evaluation.corrective_action_plan
                    .slice(0, 3)
                    .map((c) => `${c.title} (${c.clause_ref})`)
                    .join(', ');
                  if (onAskAssistant) {
                    onAskAssistant(`How do I resolve the following BIS inspection deficiencies for ${evaluation.standard_number}: ${capaSummary}?`);
                  }
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{ fontSize: '0.8rem', padding: '6px 12px', cursor: 'pointer' }}
              >
                <span>Ask Assistant to Solve Gaps</span>
                <ArrowRight size={12} />
              </motion.button>
            </div>

            <div className="compliance-table-wrap">
              <table className="compliance-table">
                <thead>
                  <tr>
                    <th>Item & Clause Ref</th>
                    <th>Quality Dimension</th>
                    <th>Severity</th>
                    <th>Recommended Corrective Action</th>
                    <th>Remediation Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluation.corrective_action_plan.map((capa, cIdx) => (
                    <tr key={cIdx}>
                      <td>
                        <strong>{capa.title}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{capa.clause_ref}</div>
                      </td>
                      <td>{capa.pillar}</td>
                      <td>
                        <span className={`criticality-badge ${capa.criticality === 'Critical' ? 'danger' : 'neutral'}`}>
                          {capa.criticality}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem' }}>{capa.recommendation}</td>
                      <td>
                        <strong style={{ color: 'var(--primary-text)' }}>{capa.timeline_days} Days</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
