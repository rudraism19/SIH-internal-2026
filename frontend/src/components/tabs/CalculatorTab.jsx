import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  Factory,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  Sliders,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';

const PRODUCTS = [
  {
    id: 'cooker',
    standard: 'IS 2347:2017',
    name: 'Domestic Pressure Cookers',
    controlUnit: '1,000 cookers or 1 eight-hour shift production (whichever is less)',
    nominalBatchSize: 1000,
    defaultVolume: 50000,
    unitName: 'cookers',
    routineTests: [
      {
        name: 'Hydraulic Proof Pressure Test (2x Working Pressure)',
        clause: 'Clause 8.2',
        frequency: '100% In-Line (Every cooker body & lid)',
        stage: '100% Routine',
        calcRate: (vol, _batches) => vol,
      },
      {
        name: 'Operating Pressure & Safety Valve Relief Functionality',
        clause: 'Clause 8.3 & 8.4',
        frequency: '5 cookers per control unit (1,000 units)',
        stage: 'Per Control Unit',
        calcRate: (vol, batches) => batches * 5,
      },
      {
        name: 'Thermal Shock Resistance & Handle Rigidity',
        clause: 'Clause 8.5',
        frequency: '2 cookers per 5 control units (5,000 units)',
        stage: 'Periodic Destructive',
        calcRate: (vol, batches) => Math.ceil(batches / 5) * 2,
      },
      {
        name: 'Bursting Pressure Destructive Validation (3x)',
        clause: 'Clause 8.7',
        frequency: '1 cooker per 10 control units (10,000 units)',
        stage: 'Destructive Verification',
        calcRate: (vol, batches) => Math.ceil(batches / 10) * 1,
      },
    ],
    acceptanceCriteria: 'Zero defectives permitted for safety valve relief and hydraulic proof testing. Rejection of batch if any sample ruptures below 3x.',
    ledgers: [
      'Raw material aluminium alloy/stainless steel mill test certificates ledger',
      'Daily hydraulic proof pressure testing logbook with digital gauge calibration logs',
      'Safety relief valve batch pop-test register',
      'Finished goods batch dispatch and CML mark serial number register',
    ],
  },
  {
    id: 'helmet',
    standard: 'IS 4151:2020',
    name: 'Two-Wheeler Protective Helmets',
    controlUnit: '500 helmets of the same shell size, material formulation, and retention assembly',
    nominalBatchSize: 500,
    defaultVolume: 15000,
    unitName: 'helmets',
    routineTests: [
      {
        name: 'Visual Examination & Shell Integrity Verification',
        clause: 'Clause 7.1',
        frequency: '100% In-Line Routine (Every helmet)',
        stage: '100% Routine',
        calcRate: (vol, _batches) => vol,
      },
      {
        name: 'Dynamic Retention System Rigidity & Elongation',
        clause: 'Clause 9.2',
        frequency: '3 helmets per control unit (500 units)',
        stage: 'Per Control Unit',
        calcRate: (vol, batches) => batches * 3,
      },
      {
        name: 'Impact Attenuation & Headform Peak Acceleration',
        clause: 'Clause 9.1',
        frequency: '2 helmets per control unit (Ambient & High Temp conditioned)',
        stage: 'Per Control Unit',
        calcRate: (vol, batches) => batches * 2,
      },
      {
        name: 'Penetration Resistance Conical Striker Test',
        clause: 'Clause 9.3',
        frequency: '1 helmet per 2 control units (1,000 units)',
        stage: 'Periodic Destructive',
        calcRate: (vol, batches) => Math.ceil(batches / 2) * 1,
      },
    ],
    acceptanceCriteria: 'Peak acceleration must not exceed 300g. Retention displacement max 25mm. Zero failure permitted.',
    ledgers: [
      'Outer shell virgin polymer batch inspection ledger',
      'EPS liner density and weight monitoring register',
      'Impact test drop rig acceleration calibration ledger',
      'Chinstrap webbing tensile and buckle retention logbook',
    ],
  },
  {
    id: 'cement',
    standard: 'IS 269:2015',
    name: 'Ordinary Portland Cement (43 / 53 Grade)',
    controlUnit: '500 metric tonnes (MT) or 10,000 bags (50 kg each) from continuous clinker grinding',
    nominalBatchSize: 10000,
    defaultVolume: 80000,
    unitName: 'bags',
    routineTests: [
      {
        name: 'Standard Consistency & Setting Time (Initial & Final)',
        clause: 'Clause 6.2 & 6.3',
        frequency: '1 test per 50 MT (Every 1,000 bags produced)',
        stage: 'In-Line Grinding Routine',
        calcRate: (vol, _batches) => Math.ceil(vol / 1000),
      },
      {
        name: 'Soundness by Le-Chatelier Method & Autoclave Expansion',
        clause: 'Clause 6.4',
        frequency: '1 test per control unit (10,000 bags / 500 MT)',
        stage: 'Per Control Unit',
        calcRate: (vol, batches) => batches * 1,
      },
      {
        name: 'Compressive Strength (3-Day & 7-Day Curing Verification)',
        clause: 'Clause 6.5',
        frequency: '1 set of 3 mortar cubes per control unit',
        stage: 'Per Control Unit',
        calcRate: (vol, batches) => batches * 1,
      },
      {
        name: 'Complete Chemical Analysis (Loss on Ignition, Insoluble Residue, SO3, MgO)',
        clause: 'Table 2',
        frequency: '1 composite sample per weekly grinding run',
        stage: 'Periodic Chemical Routine',
        calcRate: (vol, batches) => Math.ceil(batches / 2),
      },
    ],
    acceptanceCriteria: '3-day strength ≥ 23 MPa, 7-day ≥ 33 MPa. Autoclave expansion ≤ 0.8%. All parameters mandatory.',
    ledgers: [
      'Clinker and gypsum chemical ratio blending logbook',
      'Silo loading and temperature monitoring ledger',
      'Automatic bagging scale calibration and weight check register',
      'Mortar cube 3-day, 7-day, and 28-day curing temperature tank logbook',
    ],
  },
  {
    id: 'water',
    standard: 'IS 14543:2016',
    name: 'Packaged Drinking Water',
    controlUnit: '5,000 sealed bottles or 1 continuous automatic filling run of 4 hours',
    nominalBatchSize: 5000,
    defaultVolume: 120000,
    unitName: 'bottles',
    routineTests: [
      {
        name: 'In-Line Visual Clarity, Cap Hermetic Seal & Leakage Check',
        clause: 'Clause 4.1',
        frequency: 'Continuous 100% In-Line optical inspection',
        stage: '100% Routine',
        calcRate: (vol, _batches) => vol,
      },
      {
        name: 'pH Value, Total Dissolved Solids (TDS) & Electrical Conductivity',
        clause: 'Table 1',
        frequency: '1 bottle sampled every hour during filling run',
        stage: 'Hourly In-Line Routine',
        calcRate: (vol, batches) => batches * 4,
      },
      {
        name: 'Microbiological Analysis (E. Coli, Coliforms, Faecal Streptococci)',
        clause: 'Table 2',
        frequency: '1 composite test per control unit (5,000 bottles)',
        stage: 'Per Control Unit',
        calcRate: (vol, batches) => batches * 1,
      },
      {
        name: 'Total Viable Colony Count (TVC at 20-22°C & 37°C)',
        clause: 'Table 2, Item 4',
        frequency: '1 test per control unit',
        stage: 'Per Control Unit',
        calcRate: (vol, batches) => batches * 1,
      },
    ],
    acceptanceCriteria: 'E. Coli and Coliforms must be completely absent in 250ml sample. Strict zero tolerance.',
    ledgers: [
      'RO membrane pressure differential and UV / Ozone sterilization monitoring log',
      'In-house microbiology incubator daily temperature ledger',
      'Chemical test reagent expiry and preparation logbook',
      'Bottle blowing preform food-grade certificate and CML marking log',
    ],
  },
];

export default function CalculatorTab({ onAskAssistant }) {
  const [selectedProductId, setSelectedProductId] = useState('cooker');
  const activeProduct = PRODUCTS.find((p) => p.id === selectedProductId) || PRODUCTS[0];
  const [productionVolume, setProductionVolume] = useState(activeProduct.defaultVolume);

  const handleProductChange = (productId) => {
    const prod = PRODUCTS.find((p) => p.id === productId);
    setSelectedProductId(productId);
    if (prod) {
      setProductionVolume(prod.defaultVolume);
    }
  };

  const calculatedBatches = Math.max(1, Math.ceil(productionVolume / activeProduct.nominalBatchSize));

  const handleSendToAI = () => {
    if (onAskAssistant) {
      onAskAssistant(
        `We produce ${productionVolume.toLocaleString()} ${activeProduct.unitName} monthly under ${activeProduct.standard}. Calculate factory batches and routine testing frequency.`
      );
    }
  };

  return (
    <div className="tab-container">
      {/* Header Bar */}
      <div className="tab-header">
        <div>
          <h1 className="tab-title">Factory Batch Sizing & SIT Routine Testing Calculator</h1>
          <p className="tab-subtitle">
            Calculate statutory Control Units, production batch counts, and mandatory Scheme of Inspection and Testing (SIT) frequencies under official Indian Standards.
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
            <span>Analyze with AI</span>
            <ArrowRight size={14} />
          </motion.button>
        </div>
      </div>

      <div className="tab-card-container">
        {/* Input & Product Configuration Grid */}
        <div className="calc-config-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
          {/* Product Standard Selector */}
          <div className="domain-card" style={{ padding: 18, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <div className="domain-card-header" style={{ marginBottom: 12 }}>
              <div className="domain-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Factory size={18} className="text-navy" />
                <span className="domain-title" style={{ fontWeight: 600, color: 'var(--primary-text)' }}>Select Product & Standard</span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--secondary-text)', marginBottom: 12 }}>
              Choose the regulated product to load official BIS Scheme of Inspection and Testing (SIT) formulas:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PRODUCTS.map((prod) => (
                <motion.button
                  key={prod.id}
                  type="button"
                  onClick={() => handleProductChange(prod.id)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: selectedProductId === prod.id ? '2px solid var(--action-blue)' : '1px solid var(--border)',
                    background: selectedProductId === prod.id ? 'var(--action-blue-light)' : 'var(--card-subtle-bg)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--primary-text)' }}>{prod.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--action-blue)', fontFamily: 'monospace', fontWeight: 600 }}>{prod.standard}</div>
                  </div>
                  {selectedProductId === prod.id && <CheckCircle2 size={16} className="text-navy" />}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Volume Calculator Slider & Workload Metrics */}
          <div className="domain-card" style={{ padding: 18, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="domain-card-header" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="domain-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sliders size={18} className="text-navy" />
                  <span className="domain-title" style={{ fontWeight: 600 }}>Monthly Production Volume</span>
                </div>
                <motion.button
                  type="button"
                  onClick={() => setProductionVolume(activeProduct.defaultVolume)}
                  title="Reset to default volume"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                  whileTap={{ rotate: -180 }}
                >
                  <RotateCcw size={15} />
                </motion.button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label htmlFor="volume-input" style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>
                    Enter Factory Monthly Units ({activeProduct.unitName}):
                  </label>
                  <input
                    id="volume-input"
                    type="number"
                    min="100"
                    max="1000000"
                    step="500"
                    value={productionVolume}
                    onChange={(e) => setProductionVolume(Math.max(1, parseInt(e.target.value) || 0))}
                    style={{
                      width: 140,
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid #CBD5E1',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      fontSize: 15,
                      textAlign: 'right',
                    }}
                  />
                </div>

                <input
                  type="range"
                  min="500"
                  max={activeProduct.defaultVolume * 4}
                  step="500"
                  value={productionVolume}
                  onChange={(e) => setProductionVolume(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#003366', cursor: 'pointer' }}
                />
              </div>

              {/* Calculated Metrics Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Nominal Control Unit</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                    {activeProduct.nominalBatchSize.toLocaleString()} {activeProduct.unitName}
                  </div>
                </div>

                <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 8, border: '1px solid #DCFCE7' }}>
                  <div style={{ fontSize: 11, color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>Calculated Workload</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#15803D', marginTop: 4 }}>
                    {calculatedBatches.toLocaleString()} SIT Batches / mo
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, padding: 10, background: '#EFF6FF', borderRadius: 8, fontSize: 12, color: '#1E40AF', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <TrendingUp size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                <strong>SIT Batch Sizing Formula:</strong> Math.ceil({productionVolume.toLocaleString()} ÷ {activeProduct.nominalBatchSize.toLocaleString()}) = <strong>{calculatedBatches} statutory control units</strong>.
              </span>
            </div>
          </div>
        </div>

        {/* Routine Tests Table */}
        <div className="domain-card" style={{ padding: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 20 }}>
          <div className="domain-card-header" style={{ marginBottom: 14 }}>
            <div className="domain-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calculator size={18} className="text-navy" />
              <span className="domain-title" style={{ fontWeight: 600, color: 'var(--primary-text)' }}>
                Mandatory SIT Routine & In-Line Testing Schedule ({activeProduct.standard})
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--secondary-text)' }}>
              Workload for <strong>{productionVolume.toLocaleString()} {activeProduct.unitName}</strong> / month
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="compliance-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--card-subtle-bg)', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '10px 12px' }}>Test Parameter</th>
                  <th style={{ padding: '10px 12px' }}>IS Clause</th>
                  <th style={{ padding: '10px 12px' }}>Prescribed SIT Frequency</th>
                  <th style={{ padding: '10px 12px' }}>Testing Stage</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Calculated Monthly Tests</th>
                </tr>
              </thead>
              <tbody>
                {activeProduct.routineTests.map((t, idx) => {
                  const monthlyTests = t.calcRate(productionVolume, calculatedBatches);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: 'var(--primary-text)' }}>{t.name}</td>
                      <td style={{ padding: '12px', color: 'var(--action-blue)', fontFamily: 'monospace', fontWeight: 600 }}>{t.clause}</td>
                      <td style={{ padding: '12px', color: 'var(--secondary-text)' }}>{t.frequency}</td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600,
                            background: t.stage.includes('100%') ? 'var(--action-blue-light)' : t.stage.includes('Destructive') ? 'var(--bis-red-light)' : 'var(--success-green-light)',
                            color: t.stage.includes('100%') ? 'var(--action-blue)' : t.stage.includes('Destructive') ? 'var(--bis-red)' : 'var(--success-green)',
                          }}
                        >
                          {t.stage}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', fontSize: 14, color: 'var(--action-blue)' }}>
                        {monthlyTests.toLocaleString()} tests
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 14, padding: 12, background: 'var(--saffron-light)', border: '1px solid var(--saffron-border)', borderRadius: 8, fontSize: 12, color: 'var(--saffron)', display: 'flex', gap: 8 }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>BIS SIT Acceptance Criteria: </strong>
              {activeProduct.acceptanceCriteria}
            </div>
          </div>
        </div>

        {/* Required Factory Ledgers and Logbooks */}
        <div className="domain-card" style={{ padding: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div className="domain-card-header" style={{ marginBottom: 12 }}>
            <div className="domain-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileSpreadsheet size={18} className="text-navy" />
              <span className="domain-title" style={{ fontWeight: 600, color: 'var(--primary-text)' }}>
                Mandatory Factory Quality Records & Logbooks (Inspected during BIS Factory Audits)
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
            {activeProduct.ledgers.map((ledger, idx) => (
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
                <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0, marginTop: 2 }} />
                <span>{ledger}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
