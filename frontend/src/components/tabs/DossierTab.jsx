import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileSpreadsheet,
  AlertTriangle,
  FileDown,
  ArrowRight,
  Loader2,
  Building2,
  Wrench,
  FlaskConical,
  Paperclip,
  Plus,
  Trash2,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { fetchDossierTemplate, validateDossierApplication } from '../../services/api';
import { generateFormVDossierPdf } from '../../utils/pdfGenerator';

const STANDARDS_OPTIONS = [
  { key: 'IS 2347', label: 'IS 2347:2017 — Domestic Pressure Cookers' },
  { key: 'IS 4151', label: 'IS 4151:2020 — Protective Helmets (Two-Wheelers)' },
  { key: 'IS 269', label: 'IS 269:2015 — Ordinary Portland Cement' },
  { key: 'UNIVERSAL', label: 'Universal Scheme-I Industrial Product (General)' },
];

export default function DossierTab({ onAskAssistant }) {
  const [selectedStandard, setSelectedStandard] = useState('IS 2347');
  const [activeSection, setActiveSection] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Form State
  const [factoryProfile, setFactoryProfile] = useState({});
  const [machinery, setMachinery] = useState([]);
  const [testingEquipment, setTestingEquipment] = useState([]);
  const [enclosures, setEnclosures] = useState({});
  const [enclosuresMaster, setEnclosuresMaster] = useState([]);
  const [standardDetails, setStandardDetails] = useState(null);
  const [validation, setValidation] = useState(null);

  // 1. Load standard template and populate state
  useEffect(() => {
    let isMounted = true;
    const loadTemplate = async () => {
      setIsLoading(true);
      try {
        const res = await fetchDossierTemplate(selectedStandard);
        if (isMounted && res && res.success) {
          setStandardDetails(res);
          setFactoryProfile(res.default_factory_profile || {});
          setMachinery(res.mandatory_machinery || []);
          setTestingEquipment(res.inhouse_testing_equipment || []);
          setEnclosuresMaster(res.statutory_enclosures || []);

          // Pre-check mandatory enclosures (first 5 checked by default)
          const initialEnc = {};
          (res.statutory_enclosures || []).forEach((e, idx) => {
            initialEnc[e.id] = idx < 6;
          });
          setEnclosures(initialEnc);
        }
      } catch (err) {
        console.error('Failed to load dossier template:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadTemplate();
    return () => {
      isMounted = false;
    };
  }, [selectedStandard]);

  // 2. Validate in real time whenever particulars change
  useEffect(() => {
    let isMounted = true;
    const runValidation = async () => {
      if (!factoryProfile.applicant_name) return;
      try {
        const res = await validateDossierApplication({
          standard: selectedStandard,
          factory_profile: factoryProfile,
          machinery,
          testing_equipment: testingEquipment,
          enclosures,
        });
        if (isMounted && res && res.success) {
          setValidation(res);
        }
      } catch (err) {
        console.error('Validation error:', err);
      }
    };
    const timer = setTimeout(runValidation, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [factoryProfile, machinery, testingEquipment, enclosures, selectedStandard]);

  // Field change handlers
  const handleProfileChange = (field, val) => {
    setFactoryProfile((prev) => ({ ...prev, [field]: val }));
  };

  const handleEnclosureToggle = (id) => {
    setEnclosures((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddMachinery = () => {
    setMachinery((prev) => [
      ...prev,
      {
        operation: 'New Production Process',
        machinery_name: 'Industrial Machine Specs',
        installed_capacity: '1,000 units/day',
        power_hp: '10 HP',
      },
    ]);
  };

  const handleRemoveMachinery = (index) => {
    setMachinery((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddTestingEquipment = () => {
    setTestingEquipment((prev) => [
      ...prev,
      {
        parameter: 'Routine Test Parameter',
        equipment_name: 'Calibrated Digital Testing Rig',
        range_capacity: '0 - 100 Units',
        calibration_frequency: 'Every 6 Months',
        least_count: '0.01',
      },
    ]);
  };

  const handleRemoveTestingEquipment = (index) => {
    setTestingEquipment((prev) => prev.filter((_, i) => i !== index));
  };

  // PDF Export
  const handleExportPdf = () => {
    setIsExporting(true);
    try {
      const enclosuresList = enclosuresMaster.map((e) => ({
        ...e,
        attached: !!enclosures[e.id],
      }));

      generateFormVDossierPdf({
        standardNumber: standardDetails?.standard_number || selectedStandard,
        productName: standardDetails?.product_name || 'Regulated Product',
        factoryProfile,
        machinery,
        testingEquipment,
        enclosuresList,
        dossierReference: validation?.dossier_reference || `BIS-DOS-${Date.now()}`,
        completenessScore: validation?.completeness_score ?? 85,
        readinessStatus: validation?.readiness_status || 'READY FOR SUBMISSION',
      });
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const data = {
      standard: standardDetails?.standard_number,
      product: standardDetails?.product_name,
      dossier_reference: validation?.dossier_reference,
      completeness_score: validation?.completeness_score,
      factory_profile: factoryProfile,
      machinery_schedule: machinery,
      testing_equipment_schedule: testingEquipment,
      enclosures_verification: enclosures,
      exported_at: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const score = validation?.completeness_score ?? 0;
  const status = validation?.readiness_status ?? 'EVALUATING...';
  const statusColor = validation?.status_color ?? '#16a34a';

  return (
    <div className="tab-container">
      {/* Header Bar */}
      <div className="tab-header">
        <div>
          <h1 className="tab-title">Manakonline e-BIS Form-V Pre-Filler & Application Dossier Builder</h1>
          <p className="tab-subtitle">
            Statutory application generator for Bureau of Indian Standards Scheme-I (ISI Mark) licences under Regulation 4 of the BIS (Conformity Assessment) Regulations, 2018.
          </p>
        </div>
        <div className="tab-stat-pill primary">
          <FileSpreadsheet size={16} className="inline-icon" />
          <span className="stat-label">Form-V Builder (Scheme-I)</span>
        </div>
      </div>

      {/* Target Standard Selector Bar */}
      <div className="tab-card-container" style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--surface, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '8px',
          padding: '16px',
        }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
              Target Indian Standard / Regulated Category:
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-end' }}>
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" style={{ color: '#16a34a' }} />
              ) : (
                <Sparkles size={14} style={{ color: '#16a34a' }} />
              )}
              <span>{isLoading ? 'Loading Statutory Standards...' : 'Auto-Populated with Statutory Machinery & SIT Test Rig Matrix'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* REAL-TIME DOSSIER COMPLETENESS METER & ACTION BANNER */}
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
              background: statusColor,
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
              <span style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase' }}>Ready</span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 4 }}>
                <span style={{
                  background: statusColor,
                  color: '#ffffff',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}>
                  {status}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  ({validation?.dossier_reference || 'BIS-DOS-2026'})
                </span>
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-text)', margin: 0 }}>
                {standardDetails?.product_name || 'BIS Product Scheme-I Application'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--secondary-text)', margin: '4px 0 0 0' }}>
                {validation?.status_description || 'Verifying statutory application disclosures...'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <motion.button
              type="button"
              className="tab-action-btn"
              onClick={handleExportJson}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                background: 'var(--card-subtle-bg)',
                border: '1px solid var(--border)',
                color: 'var(--primary-text)',
              }}
            >
              {copiedJson ? <Check size={16} style={{ color: '#16a34a' }} /> : <Copy size={16} />}
              <span>{copiedJson ? 'JSON Copied!' : 'Export JSON'}</span>
            </motion.button>

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
              <span>Download Form-V Dossier (PDF)</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* SECTION TABS NAVIGATION */}
      <div className="tab-toolbar">
        <div className="tab-filter-chips">
          <motion.button
            type="button"
            className={`filter-chip ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Building2 size={13} className="inline-icon" />
            <span>1. Plant & Applicant</span>
          </motion.button>

          <motion.button
            type="button"
            className={`filter-chip ${activeSection === 'machinery' ? 'active' : ''}`}
            onClick={() => setActiveSection('machinery')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Wrench size={13} className="inline-icon" />
            <span>2. Machinery Schedule ({machinery.length})</span>
          </motion.button>

          <motion.button
            type="button"
            className={`filter-chip ${activeSection === 'testing' ? 'active' : ''}`}
            onClick={() => setActiveSection('testing')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <FlaskConical size={13} className="inline-icon" />
            <span>3. Lab Test Rigs ({testingEquipment.length})</span>
          </motion.button>

          <motion.button
            type="button"
            className={`filter-chip ${activeSection === 'enclosures' ? 'active' : ''}`}
            onClick={() => setActiveSection('enclosures')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Paperclip size={13} className="inline-icon" />
            <span>4. Enclosures ({Object.values(enclosures).filter(Boolean).length}/{enclosuresMaster.length})</span>
          </motion.button>
        </div>
      </div>

      {/* SECTION 1: APPLICANT & PLANT PROFILE */}
      {activeSection === 'profile' && (
        <motion.div
          className="tab-card-container"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 20 }}
        >
          <div style={{
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '8px',
            padding: '20px',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-text)', marginBottom: 16 }}>
              Section 1: Applicant Legal Entity & Manufacturing Plant Particulars
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '14px',
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Applicant Legal Entity Name:
                </label>
                <input
                  type="text"
                  value={factoryProfile.applicant_name || ''}
                  onChange={(e) => handleProfileChange('applicant_name', e.target.value)}
                  className="tab-search-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Physical Factory Address (Where ISI Mark is Applied):
                </label>
                <input
                  type="text"
                  value={factoryProfile.factory_address || ''}
                  onChange={(e) => handleProfileChange('factory_address', e.target.value)}
                  className="tab-search-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  GSTIN Registration Number:
                </label>
                <input
                  type="text"
                  value={factoryProfile.gstin || ''}
                  onChange={(e) => handleProfileChange('gstin', e.target.value)}
                  className="tab-search-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  MSME Udyam Registration (50% Fee Concession):
                </label>
                <input
                  type="text"
                  value={factoryProfile.msme_udyam || ''}
                  onChange={(e) => handleProfileChange('msme_udyam', e.target.value)}
                  className="tab-search-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Connected Industrial Power Load:
                </label>
                <input
                  type="text"
                  value={factoryProfile.connected_load || ''}
                  onChange={(e) => handleProfileChange('connected_load', e.target.value)}
                  className="tab-search-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Authorized Signatory Name & Designation:
                </label>
                <input
                  type="text"
                  value={factoryProfile.authorized_signatory || ''}
                  onChange={(e) => handleProfileChange('authorized_signatory', e.target.value)}
                  className="tab-search-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Brand Name / Trademark (Marked on Product):
                </label>
                <input
                  type="text"
                  value={factoryProfile.brand_names || ''}
                  onChange={(e) => handleProfileChange('brand_names', e.target.value)}
                  className="tab-search-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Product Varieties & Sizes to be Covered:
                </label>
                <input
                  type="text"
                  value={factoryProfile.varieties_covered || ''}
                  onChange={(e) => handleProfileChange('varieties_covered', e.target.value)}
                  className="tab-search-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Quality Control Incharge Full Name:
                </label>
                <input
                  type="text"
                  value={factoryProfile.qc_incharge_name || ''}
                  onChange={(e) => handleProfileChange('qc_incharge_name', e.target.value)}
                  className="tab-search-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  QC Incharge Technical Qualifications & Experience:
                </label>
                <input
                  type="text"
                  value={factoryProfile.qc_incharge_qualification || ''}
                  onChange={(e) => handleProfileChange('qc_incharge_qualification', e.target.value)}
                  className="tab-search-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* SECTION 2: MANUFACTURING MACHINERY SCHEDULE */}
      {activeSection === 'machinery' && (
        <motion.div
          className="tab-card-container"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 20 }}
        >
          <div style={{
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '8px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-text)', margin: 0 }}>
                  Section 2: Manufacturing Machinery & Production Facilities
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>
                  Statutory schedule of all production equipment installed at the manufacturing plant premises.
                </p>
              </div>
              <button
                type="button"
                className="tab-action-btn primary"
                onClick={handleAddMachinery}
                style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} />
                <span>Add Machine</span>
              </button>
            </div>

            <div className="compliance-table-wrap">
              <table className="compliance-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Process / Operation</th>
                    <th>Machinery Description & Specs</th>
                    <th>Installed Daily Capacity</th>
                    <th>Power Rating</th>
                    <th style={{ width: '60px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {machinery.map((m, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>
                        <input
                          type="text"
                          value={m.operation}
                          onChange={(e) => {
                            const updated = [...machinery];
                            updated[idx].operation = e.target.value;
                            setMachinery(updated);
                          }}
                          style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={m.machinery_name}
                          onChange={(e) => {
                            const updated = [...machinery];
                            updated[idx].machinery_name = e.target.value;
                            setMachinery(updated);
                          }}
                          style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={m.installed_capacity}
                          onChange={(e) => {
                            const updated = [...machinery];
                            updated[idx].installed_capacity = e.target.value;
                            setMachinery(updated);
                          }}
                          style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={m.power_hp}
                          onChange={(e) => {
                            const updated = [...machinery];
                            updated[idx].power_hp = e.target.value;
                            setMachinery(updated);
                          }}
                          style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveMachinery(idx)}
                          style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* SECTION 3: IN-HOUSE LABORATORY TESTING EQUIPMENT */}
      {activeSection === 'testing' && (
        <motion.div
          className="tab-card-container"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 20 }}
        >
          <div style={{
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '8px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-text)', margin: 0 }}>
                  Section 3: In-House Laboratory Testing Instruments Matrix
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>
                  Statutory testing apparatus required to execute the Scheme of Inspection and Testing (SIT).
                </p>
              </div>
              <button
                type="button"
                className="tab-action-btn primary"
                onClick={handleAddTestingEquipment}
                style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} />
                <span>Add Test Rig</span>
              </button>
            </div>

            <div className="compliance-table-wrap">
              <table className="compliance-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Test Parameter & SIT Clause</th>
                    <th>Testing Instrument / Rig</th>
                    <th>Working Range / Capacity</th>
                    <th>Calibration Frequency</th>
                    <th style={{ width: '60px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {testingEquipment.map((t, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>
                        <input
                          type="text"
                          value={t.parameter}
                          onChange={(e) => {
                            const updated = [...testingEquipment];
                            updated[idx].parameter = e.target.value;
                            setTestingEquipment(updated);
                          }}
                          style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={t.equipment_name}
                          onChange={(e) => {
                            const updated = [...testingEquipment];
                            updated[idx].equipment_name = e.target.value;
                            setTestingEquipment(updated);
                          }}
                          style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={t.range_capacity}
                          onChange={(e) => {
                            const updated = [...testingEquipment];
                            updated[idx].range_capacity = e.target.value;
                            setTestingEquipment(updated);
                          }}
                          style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={t.calibration_frequency}
                          onChange={(e) => {
                            const updated = [...testingEquipment];
                            updated[idx].calibration_frequency = e.target.value;
                            setTestingEquipment(updated);
                          }}
                          style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveTestingEquipment(idx)}
                          style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* SECTION 4: STATUTORY ENCLOSURES CHECKLIST */}
      {activeSection === 'enclosures' && (
        <motion.div
          className="tab-card-container"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 20 }}
        >
          <div style={{
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '8px',
            padding: '20px',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-text)', marginBottom: 14 }}>
              Section 4: Mandatory Statutory Attachments & Verification Checklist
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {enclosuresMaster.map((enc) => {
                const isChecked = !!enclosures[enc.id];
                return (
                  <div
                    key={enc.id}
                    onClick={() => handleEnclosureToggle(enc.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      background: isChecked ? 'var(--success-green-light)' : 'var(--card-subtle-bg)',
                      border: `1px solid ${isChecked ? 'var(--success-green-border)' : 'var(--border)'}`,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <div style={{ marginTop: '2px' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 3 }}>
                        <span style={{
                          background: 'var(--hover-subtle-bg)',
                          color: 'var(--primary-text)',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}>
                          {enc.code}
                        </span>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--primary-text)' }}>{enc.title}</strong>
                        {enc.mandatory && (
                          <span style={{ fontSize: '0.68rem', background: 'var(--bis-red-light)', color: 'var(--bis-red)', border: '1px solid var(--bis-red-border)', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                            Mandatory
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--secondary-text)', margin: 0, lineHeight: 1.4 }}>
                        {enc.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* MISSING ITEMS ALERT BANNER (IF ANY) */}
      {validation?.missing_items && validation.missing_items.length > 0 && (
        <div className="tab-card-container" style={{ marginBottom: 20 }}>
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} style={{ color: '#dc2626' }} />
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#991b1b', margin: 0 }}>
                  Pre-Submission Audit Disclosures — {validation.missing_items.length} Action Items Pending
                </h4>
              </div>
              <button
                type="button"
                className="tab-action-btn primary"
                onClick={() => {
                  const pendingSummary = validation.missing_items
                    .slice(0, 3)
                    .map((m) => `${m.item} (${m.section})`)
                    .join(', ');
                  if (onAskAssistant) {
                    onAskAssistant(`How do I prepare the missing Form-V application attachments for ${standardDetails?.standard_number}: ${pendingSummary}?`);
                  }
                }}
                style={{ fontSize: '0.78rem', padding: '5px 10px' }}
              >
                <span>Ask AI to Fix Gaps</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
              {validation.missing_items.map((m, idx) => (
                <div key={idx} style={{ background: 'var(--card-subtle-bg)', border: '1px solid var(--bis-red-border)', borderRadius: '4px', padding: '8px 10px', fontSize: '0.75rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--bis-red)', marginBottom: 2 }}>{m.item} ({m.section})</div>
                  <div style={{ color: 'var(--secondary-text)' }}>{m.remedy}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
