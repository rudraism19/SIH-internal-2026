import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, Search, ArrowRight, Clock, FileDown, Loader2 } from 'lucide-react';
import { fetchDirectoryTesting } from '../../services/api';
import { generateComplianceDossierPdf } from '../../utils/pdfGenerator';

const INITIAL_FALLBACK_TESTING = [
  {
    standard: 'IS 2347:2017',
    product: 'Domestic Pressure Cookers',
    sampleSize: '3 complete cookers with operating valves and gaskets',
    tat: '7 to 10 working days',
    parameters: [
      { name: 'Hydraulic Proof Pressure Test', clause: 'Clause 13.1', limit: 'Withstand 2x operating pressure without leakage or permanent distortion', critical: true },
      { name: 'Bursting Pressure Test', clause: 'Clause 13.2', limit: 'Minimum 3x maximum operating working pressure without violent rupture', critical: true },
      { name: 'Operating Pressure Benchmark', clause: 'Clause 7.2', limit: 'Maintain regulated cooking pressure within 0.9 bar to 1.1 bar range', critical: true },
      { name: 'Thermal Efficiency Determination', clause: 'Clause 14.1', limit: 'Minimum 50.0% thermal efficiency under standardized gas burner test', critical: false },
      { name: 'Handle Assembly Resistance & Rigidity', clause: 'Clause 9.3', limit: 'Withstand 100 N downward static load without fracture or detachment', critical: false },
    ],
  },
  {
    standard: 'IS 4151:2020',
    product: 'Protective Helmets for Two-Wheeler Riders',
    sampleSize: '6 complete helmets per shell size and retention configuration',
    tat: '10 to 14 working days',
    parameters: [
      { name: 'Impact Attenuation Test', clause: 'Clause 9.1', limit: 'Peak headform acceleration shall not exceed 300g under flat and kerbstone anvils', critical: true },
      { name: 'Retention System Dynamic Extension', clause: 'Clause 9.2', limit: 'Dynamic elongation max 35mm; residual displacement max 25mm under drop mass', critical: true },
      { name: 'Penetration Resistance Test', clause: 'Clause 9.3', limit: '3kg metal conical striker dropped from 1.0m shall not touch headform', critical: true },
      { name: 'Peripheral Field of Vision', clause: 'Clause 7.2', limit: 'Horizontal angle ≥ 105° on each side; upward vertical field ≥ 7°', critical: false },
    ],
  },
  {
    standard: 'IS 1460:2017',
    product: 'Automotive Diesel Fuel (BS-VI)',
    sampleSize: '2.0 litres in hermetically sealed amber container',
    tat: '3 to 5 working days',
    parameters: [
      { name: 'Total Sulfur Content', clause: 'Table 1, Item 4', limit: 'Maximum 10.0 mg/kg (ppm) under BS-VI national emissions mandate', critical: true },
      { name: 'Cetane Number / Index', clause: 'Table 1, Item 2', limit: 'Minimum 51.0 cetane number for clean diesel compression ignition', critical: true },
      { name: 'Flash Point (Abel)', clause: 'Table 1, Item 6', limit: 'Minimum 35.0 °C for transportation and storage fire safety', critical: true },
      { name: 'Density at 15°C', clause: 'Table 1, Item 1', limit: '820.0 to 845.0 kg/m³', critical: false },
      { name: 'Kinematic Viscosity at 40°C', clause: 'Table 1, Item 3', limit: '2.0 to 4.5 mm²/s (cSt)', critical: false },
    ],
  },
  {
    standard: 'IS 2888:2004',
    product: 'Toilet Soap',
    sampleSize: '6 cakes in original commercial packaging',
    tat: '4 to 6 working days',
    parameters: [
      { name: 'Total Fatty Matter (TFM)', clause: 'Table 1, Item 1', limit: 'Minimum 76.0% for Grade 1 Premium Toilet Soap', critical: true },
      { name: 'Matter Insoluble in Alcohol', clause: 'Table 1, Item 2', limit: 'Maximum 2.5% by mass', critical: false },
      { name: 'Free Caustic Alkali (as NaOH)', clause: 'Table 1, Item 3', limit: 'Maximum 0.05% by mass', critical: true },
      { name: 'Moisture and Volatile Matter', clause: 'Table 1, Item 4', limit: 'Maximum 22.0% at 105°C', critical: false },
    ],
  },
  {
    standard: 'IS 14543:2016',
    product: 'Packaged Drinking Water',
    sampleSize: '10 sealed 1.0-litre commercial containers',
    tat: '7 to 10 working days',
    parameters: [
      { name: 'Microbiological Safety', clause: 'Clause 6.1', limit: 'Total coliforms, E. coli, fecal streptococci Absent in 250 ml', critical: true },
      { name: 'Lead (as Pb)', clause: 'Table 2, Item 1', limit: 'Maximum 0.01 mg/L', critical: true },
      { name: 'Arsenic (as As)', clause: 'Table 2, Item 2', limit: 'Maximum 0.01 mg/L', critical: true },
      { name: 'Total Dissolved Solids (TDS)', clause: 'Table 1, Item 2', limit: '75.0 to 500.0 mg/L', critical: false },
      { name: 'Pesticide Residue Screen', clause: 'Clause 6.3', limit: 'Individual pesticides max 0.0001 mg/L; total max 0.0005 mg/L', critical: true },
    ],
  },
];

export default function TestingTab({ onAskAssistant }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [regimes, setRegimes] = useState(INITIAL_FALLBACK_TESTING);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingStd, setDownloadingStd] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetchDirectoryTesting(searchQuery);

        if (isMounted && res && res.success && res.regimes && res.regimes.length > 0) {
          const mapped = res.regimes.map((r) => ({
            standard: r.standard_number,
            product: r.product_name,
            sampleSize: r.sample_requirements,
            tat: r.turnaround_time,
            parameters: (r.parameters || []).map((p) => ({
              name: p.parameter_name,
              clause: p.test_method || 'Prescribed Clause',
              limit: p.specification_limit,
              critical: p.criticality?.toLowerCase().includes('critical') || p.criticality?.toLowerCase().includes('mandatory'),
            })),
          }));
          setRegimes(mapped);
        } else if (isMounted) {
          const filtered = INITIAL_FALLBACK_TESTING.filter((reg) =>
            !searchQuery ||
            reg.standard.toLowerCase().includes(searchQuery.toLowerCase()) ||
            reg.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
            reg.parameters.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
          );
          setRegimes(filtered);
        }
      } catch (err) {
        console.error('Error fetching testing directory:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleDownloadDossier = (reg) => {
    try {
      setDownloadingStd(reg.standard);
      generateComplianceDossierPdf({
        standardNumber: reg.standard,
        productName: reg.product,
        title: `${reg.product} — Testing Regime & Quality Benchmarks`,
        isMandatory: true,
        sampleRequirements: reg.sampleSize,
        turnaroundTime: reg.tat,
        parameters: reg.parameters.map((p) => ({
          parameter_name: p.name,
          test_method: p.clause,
          specification_limit: p.limit,
          criticality: p.critical ? 'Safety Critical' : 'Key Quality',
        })),
      });
    } catch (err) {
      console.error('Failed to generate testing dossier:', err);
    } finally {
      setTimeout(() => setDownloadingStd(null), 1000);
    }
  };

  return (
    <div className="tab-container">
      {/* Header Bar */}
      <div className="tab-header">
        <div>
          <h1 className="tab-title">Mandatory Laboratory Testing Regimes</h1>
          <p className="tab-subtitle">
            Live database of critical test parameters, statutory specification limits, sample requirements, and turnaround times.
          </p>
        </div>
        <div className="tab-stat-pill">
          {isLoading ? (
            <Loader2 size={16} className="animate-spin text-primary" />
          ) : (
            <span className="stat-number">{regimes.length}</span>
          )}
          <span className="stat-label">Active Regimes</span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="tab-toolbar">
        <div className="tab-search-input-wrap">
          <Search size={16} className="tab-search-icon" />
          <input
            type="text"
            className="tab-search-input"
            placeholder="Search testing parameters by standard code or product name (e.g. IS 2347, cooker, water)..."
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

      {/* Regimes Stack */}
      <div className="tab-card-container">
        <div className="testing-regimes-stack">
          {regimes.map((reg, rIdx) => (
            <motion.div
              key={`${reg.standard}-${rIdx}`}
              className="testing-regime-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(rIdx * 0.05, 0.3), duration: 0.22 }}
              whileHover={{ boxShadow: '0 6px 18px rgba(11, 31, 51, 0.07)' }}
            >
              <div className="regime-header-row">
                <div className="regime-title-col">
                  <div className="regime-code-badge">
                    <FlaskConical size={14} className="regime-icon text-navy" />
                    <strong className="mono">{reg.standard}</strong>
                  </div>
                  <h3 className="regime-product-title">{reg.product}</h3>
                </div>

                <div className="regime-meta-col">
                  <div className="meta-pill">
                    <span className="meta-kicker">Sample:</span>
                    <span>{reg.sampleSize}</span>
                  </div>
                  <div className="meta-pill">
                    <Clock size={12} className="inline-icon" />
                    <span>TAT: {reg.tat}</span>
                  </div>
                </div>
              </div>

              {/* Parameters Table */}
              <div className="compliance-table-wrap">
                <table className="compliance-table">
                  <thead>
                    <tr>
                      <th>Test Parameter Name</th>
                      <th>Clause / Test Method</th>
                      <th>Prescribed Statutory Benchmark</th>
                      <th>Criticality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reg.parameters.map((param, idx) => (
                      <tr key={idx}>
                        <td><strong>{param.name}</strong></td>
                        <td><code className="table-code">{param.clause}</code></td>
                        <td>{param.limit}</td>
                        <td>
                          {param.critical ? (
                            <span className="criticality-badge danger">Safety - Critical</span>
                          ) : (
                            <span className="criticality-badge neutral">Quality Grade</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="regime-footer" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <motion.button
                  type="button"
                  className="tab-action-btn secondary"
                  onClick={() => handleDownloadDossier(reg)}
                  disabled={downloadingStd === reg.standard}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  title="Download Official PDF Testing Dossier & SIT Audit Checklist"
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
                  {downloadingStd === reg.standard ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <FileDown size={12} style={{ color: '#0284c7' }} />
                  )}
                  <span>PDF Dossier</span>
                </motion.button>

                <motion.button
                  type="button"
                  className="tab-action-btn primary"
                  onClick={() => onAskAssistant && onAskAssistant(`What are the laboratory testing procedures and parameters for ${reg.product} under ${reg.standard}?`)}
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
                  <span>Inquire about Testing</span>
                  <ArrowRight size={12} />
                </motion.button>
              </div>
            </motion.div>
          ))}
          {regimes.length === 0 && !isLoading && (
            <div className="no-results-box">
              No testing regimes matching "{searchQuery}" found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

