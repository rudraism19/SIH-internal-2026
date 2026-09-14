import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  ShieldAlert,
  FileCheck,
  CalendarDays,
} from 'lucide-react';

const SCHEMES = [
  {
    id: 'cooker',
    standard: 'IS 2347:2017',
    name: 'Domestic Pressure Cookers',
    scheme: 'Scheme-I (ISI Mark)',
    validityYears: 1,
    minMarkingFee: '₹73,000 / year',
    unitRate: '₹0.75 per unit marked (whichever higher)',
    statutoryForm: 'Form-VI (Regulation 7, BIS Conformity Assessment Regs 2018)',
    windowText: '90 to 30 days prior to licence expiry via e-BIS Manakonline',
    gracePeriodDays: 90,
    lateFee: '₹5,000 + 18% GST',
    stopMarkingRisk:
      'CRITICAL: Non-renewal triggers immediate Stop-Marking Notice under Regulation 7. Selling cookers during stop-marking violates mandatory DPIIT QCO and attracts criminal prosecution and product seizure under Section 29.',
    checklist: [
      'Submit Form-VI online on Manakonline e-BIS at least 30 days before expiry date.',
      'Furnish audited Form-VII statement of preceding production certified by a Chartered Accountant.',
      'Submit calibration certificates for hydraulic proof testing pumps and pressure gauges.',
      'Pay annual minimum marking fee (₹73,000) + renewal application fee (₹1,000 + GST).',
      'Verify zero pending non-conformities from previous BIS supervisory factory visits.',
    ],
  },
  {
    id: 'helmet',
    standard: 'IS 4151:2020',
    name: 'Two-Wheeler Protective Helmets',
    scheme: 'Scheme-I (ISI Mark)',
    validityYears: 1,
    minMarkingFee: '₹62,000 / year',
    unitRate: '₹1.50 per unit marked',
    statutoryForm: 'Form-VI under Regulation 7',
    windowText: '90 to 30 days prior to expiry via Manakonline',
    gracePeriodDays: 90,
    lateFee: '₹5,000 + 18% GST',
    stopMarkingRisk:
      'MANDATORY VEHICLE SAFETY STOP-MARKING: Under the Two-Wheeler Helmets QCO & Central Motor Vehicles Rules (CMVR), manufacturing or retailing helmets without an active licence is a cognizable offence.',
    checklist: [
      'File Form-VI online on e-BIS portal prior to 30-day cutoff.',
      'Upload internal routine testing records for dynamic retention and impact absorption.',
      'Provide annual calibration certificates for impact test drop rigs and headforms.',
      'Pay statutory marking fees and reconcile unit marking differences.',
    ],
  },
  {
    id: 'crs',
    standard: 'IS 13252 (Part 1):2010',
    name: 'Smartphones, Tablets & IT Equipment',
    scheme: 'Scheme-II (Compulsory Registration Scheme - CRS)',
    validityYears: 2,
    minMarkingFee: '₹35,000 per model series',
    unitRate: 'No recurring unit production marking fee',
    statutoryForm: 'Form-C (CRS Portal crsbis.in)',
    windowText: '90 days before 2-year validity expiration',
    gracePeriodDays: 90,
    lateFee: '₹5,000 + 18% GST per month of delay post-expiry',
    stopMarkingRisk:
      'CUSTOMS ICEGATE PORT BLOCK: Expired CRS registration triggers automatic ICEGATE customs stop at Indian ports for all imported models.',
    checklist: [
      'Submit online renewal application on crsbis.in within 90 days before expiration.',
      'Submit undertaking confirming zero hardware, enclosure, or critical component modifications.',
      'Remit renewal fee ₹35,000 per model series + 18% GST.',
      'Ensure factory manufacturing address remains unchanged on legal lease/ownership deed.',
    ],
  },
  {
    id: 'water',
    standard: 'IS 14543:2016',
    name: 'Packaged Drinking Water',
    scheme: 'Scheme-I (ISI Mark)',
    validityYears: 1,
    minMarkingFee: '₹1,60,000 / year',
    unitRate: '₹0.15 per 1-litre bottle marked',
    statutoryForm: 'Form-VI under Regulation 7',
    windowText: '90 to 30 days prior to expiry date',
    gracePeriodDays: 90,
    lateFee: '₹5,000 + 18% GST',
    stopMarkingRisk:
      'FSSAI & PUBLIC HEALTH SHUTDOWN: Packaged drinking water is under mandatory dual-licensing with FSSAI. Stop-marking halts factory operations immediately.',
    checklist: [
      'File Form-VI on e-BIS portal at least 30 days prior to expiry.',
      'Submit daily microbiological test registers (E. Coli, Coliforms) for preceding 12 months.',
      'Provide annual NABL lab test report for pesticide residues and heavy metals.',
      'Remit marking fees based on CA-certified production return.',
    ],
  },
];

export default function CalendarTab({ onAskAssistant }) {
  const [selectedSchemeId, setSelectedSchemeId] = useState('cooker');
  const activeScheme = SCHEMES.find((s) => s.id === selectedSchemeId) || SCHEMES[0];

  // Simulated Expiry Date (Default: 60 days from now)
  const [expiryMonthsAhead, setExpiryMonthsAhead] = useState(2);

  const calculateMilestoneDates = () => {
    const today = new Date();
    const expiryDate = new Date(today.getTime() + expiryMonthsAhead * 30 * 24 * 60 * 60 * 1000);
    const windowStart = new Date(expiryDate.getTime() - 90 * 24 * 60 * 60 * 1000);
    const cutoffDate = new Date(expiryDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const graceEnd = new Date(expiryDate.getTime() + 90 * 24 * 60 * 60 * 1000);

    const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    return {
      windowStart: fmt(windowStart),
      cutoffDate: fmt(cutoffDate),
      expiryDate: fmt(expiryDate),
      graceEnd: fmt(graceEnd),
    };
  };

  const milestones = calculateMilestoneDates();

  const handleSendToAI = () => {
    if (onAskAssistant) {
      onAskAssistant(
        `What are the Form-VI renewal window, marking fee rules, and stop-marking consequences for ${activeScheme.name} (${activeScheme.standard})?`
      );
    }
  };

  return (
    <div className="tab-container">
      {/* Header Bar */}
      <div className="tab-header">
        <div>
          <h1 className="tab-title">Licence Lifecycle & Compliance Renewal Calendar</h1>
          <p className="tab-subtitle">
            Track statutory Form-VI renewal deadlines, marking fee fee schedules, 90-day grace periods, and Regulation 7 stop-marking mitigation dates.
          </p>
        </div>
        <div className="tab-actions">
          <motion.button
            type="button"
            className="filter-pill-btn active"
            onClick={handleSendToAI}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span>Inquire Renewal with AI</span>
            <ArrowRight size={14} />
          </motion.button>
        </div>
      </div>

      <div className="tab-card-container">
        {/* Scheme Selector & Lifecycle Timeline Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
          {/* Scheme / Product Picker */}
          <div className="domain-card" style={{ padding: 18, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <div className="domain-card-header" style={{ marginBottom: 12 }}>
              <div className="domain-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RefreshCw size={18} className="text-navy" />
                <span className="domain-title" style={{ fontWeight: 600, color: 'var(--primary-text)' }}>Select Regulated Product</span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--secondary-text)', marginBottom: 12 }}>
              Choose a product category to inspect statutory renewal timelines and fee schedules:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SCHEMES.map((scheme) => (
                <motion.button
                  key={scheme.id}
                  type="button"
                  onClick={() => setSelectedSchemeId(scheme.id)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: selectedSchemeId === scheme.id ? '2px solid var(--action-blue)' : '1px solid var(--border)',
                    background: selectedSchemeId === scheme.id ? 'var(--action-blue-light)' : 'var(--card-subtle-bg)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--primary-text)' }}>{scheme.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--action-blue)', fontWeight: 600, fontFamily: 'monospace' }}>
                      {scheme.standard} • {scheme.scheme}
                    </div>
                  </div>
                  {selectedSchemeId === scheme.id && <CheckCircle2 size={16} className="text-navy" />}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Timeline Simulation Controls */}
          <div className="domain-card" style={{ padding: 18, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="domain-card-header" style={{ marginBottom: 12 }}>
                <div className="domain-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CalendarDays size={18} className="text-navy" />
                  <span className="domain-title" style={{ fontWeight: 600, color: 'var(--primary-text)' }}>Licence Expiry Horizon Simulator</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--secondary-text)', marginBottom: 14 }}>
                Simulate how close your factory licence is to its expiry date to visualize active statutory windows:
              </p>

              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--secondary-text)' }}>Simulated Expiry Timeline:</span>
                  <strong style={{ color: 'var(--action-blue)' }}>
                    {expiryMonthsAhead === 1 ? '1 Month (Critical Window)' : `${expiryMonthsAhead} Months Ahead`}
                  </strong>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={expiryMonthsAhead}
                  onChange={(e) => setExpiryMonthsAhead(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--action-blue)', cursor: 'pointer' }}
                />
              </div>

              {/* Statutory Fee Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                <div style={{ background: 'var(--card-subtle-bg)', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--secondary-text)', fontWeight: 600, textTransform: 'uppercase' }}>Annual Minimum Fee</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-text)', marginTop: 4 }}>{activeScheme.minMarkingFee}</div>
                </div>

                <div style={{ background: 'var(--bis-red-light)', padding: 10, borderRadius: 8, border: '1px solid var(--bis-red-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--bis-red)', fontWeight: 600, textTransform: 'uppercase' }}>Late Fee Surcharge</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--bis-red)', marginTop: 4 }}>{activeScheme.lateFee}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14, padding: 10, background: 'var(--card-subtle-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--primary-text)' }}>
              <strong>Statutory Form:</strong> {activeScheme.statutoryForm}
            </div>
          </div>
        </div>

        {/* Visual Lifecycle Timeline Stages */}
        <div className="domain-card" style={{ padding: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 20 }}>
          <div className="domain-card-header" style={{ marginBottom: 16 }}>
            <div className="domain-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} className="text-navy" />
              <span className="domain-title" style={{ fontWeight: 600, color: 'var(--primary-text)' }}>
                Licence Lifecycle & Statutory Renewal Stages ({activeScheme.standard})
              </span>
            </div>
          </div>

          {/* Horizontal / Responsive Stepped Timeline */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {/* Stage 1: Renewal Window Opens */}
            <div style={{ padding: 14, background: 'var(--action-blue-light)', border: '1px solid var(--action-blue-border)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--action-blue)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--action-blue)', textTransform: 'uppercase' }}>Window Opens</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--action-blue)' }}>{milestones.windowStart}</div>
              <div style={{ fontSize: 12, color: 'var(--primary-text)', marginTop: 4 }}>
                <strong>90 Days Prior:</strong> Form-VI filing portal opens on e-BIS. Standard marking fee payment.
              </div>
            </div>

            {/* Stage 2: Mandatory Cutoff */}
            <div style={{ padding: 14, background: 'var(--saffron-light)', border: '1px solid var(--saffron-border)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--saffron)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--saffron)', textTransform: 'uppercase' }}>Statutory Cutoff</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--saffron)' }}>{milestones.cutoffDate}</div>
              <div style={{ fontSize: 12, color: 'var(--primary-text)', marginTop: 4 }}>
                <strong>30 Days Prior:</strong> Final deadline to file Form-VI without late penalties or scrutiny delays.
              </div>
            </div>

            {/* Stage 3: Licence Expiration */}
            <div style={{ padding: 14, background: 'var(--bis-red-light)', border: '1px solid var(--bis-red-border)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bis-red)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--bis-red)', textTransform: 'uppercase' }}>Licence Expiry</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--bis-red)' }}>{milestones.expiryDate}</div>
              <div style={{ fontSize: 12, color: 'var(--primary-text)', marginTop: 4 }}>
                <strong>Day 0:</strong> Standard validity ends. If unrenewed, grace window starts with mandatory late surcharge.
              </div>
            </div>

            {/* Stage 4: Grace Window & Stop-Marking */}
            <div style={{ padding: 14, background: '#450A0A', border: '1px solid #7F1D1D', borderRadius: 10, color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <AlertOctagon size={14} style={{ color: '#F87171' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#FCA5A5', textTransform: 'uppercase' }}>Stop-Marking Trigger</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FECACA' }}>{milestones.graceEnd}</div>
              <div style={{ fontSize: 12, color: '#FCA5A5', marginTop: 4 }}>
                <strong>+90 Days Post-Expiry:</strong> Licence revoked under Regulation 7. Marking without licence triggers Section 29 prosecution.
              </div>
            </div>
          </div>

          {/* Statutory Stop-Marking Notice Warning */}
          <div style={{ marginTop: 16, padding: 14, background: 'var(--bis-red-light)', border: '1px solid var(--bis-red-border)', borderRadius: 8, display: 'flex', gap: 10 }}>
            <ShieldAlert size={20} style={{ color: 'var(--bis-red)', flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12, color: 'var(--bis-red)' }}>
              {activeScheme.stopMarkingRisk}
            </div>
          </div>
        </div>

        {/* Statutory Renewal Checklist */}
        <div className="domain-card" style={{ padding: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div className="domain-card-header" style={{ marginBottom: 14 }}>
            <div className="domain-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileCheck size={18} className="text-navy" />
              <span className="domain-title" style={{ fontWeight: 600, color: 'var(--primary-text)' }}>
                Mandatory Form-VI Statutory Renewal Checklist ({activeScheme.standard})
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 10 }}>
            {activeScheme.checklist.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: 12,
                  background: 'var(--card-subtle-bg)',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  color: 'var(--primary-text)',
                }}
              >
                <CheckCircle2 size={16} style={{ color: 'var(--action-blue)', flexShrink: 0, marginTop: 2 }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
