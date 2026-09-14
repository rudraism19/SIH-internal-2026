import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Search, ArrowRight, AlertOctagon, FileDown, Loader2 } from 'lucide-react';
import { fetchDirectoryQco } from '../../services/api';
import { generateComplianceDossierPdf } from '../../utils/pdfGenerator';

const INITIAL_FALLBACK_QCO = [
  {
    id: 'DPIIT_PRESSURE_COOKER',
    name: 'Domestic Pressure Cookers (Quality Control) Order',
    ministry: 'Ministry of Commerce & Industry (DPIIT)',
    standard: 'IS 2347:2017',
    standardsList: ['IS 2347:2017'],
    products: 'Domestic Pressure Cookers (Aluminium & Stainless Steel)',
    enforcement: 'Active & Enforced Nationwide',
    legalBasis: 'Section 16, 17 & 25 of BIS Act 2016',
    penalties: 'Section 29: Imprisonment up to 2 years and/or fine up to ₹5 Lakhs',
  },
  {
    id: 'DPIIT_HELMET',
    name: 'Two Wheeler Helmets (Quality Control) Order',
    ministry: 'Ministry of Road Transport & Highways / DPIIT',
    standard: 'IS 4151:2020',
    standardsList: ['IS 4151:2020'],
    products: 'Protective Helmets for Two-Wheeler Motorcyclists',
    enforcement: 'Active & Enforced Nationwide',
    legalBasis: 'Section 16 of BIS Act 2016 and CMVR Rules',
    penalties: 'Seizure of non-ISI helmets and criminal liability under Section 29',
  },
  {
    id: 'DPIIT_FLASKS',
    name: 'Insulated Flasks, Bottles and Containers (Quality Control) Order',
    ministry: 'Ministry of Commerce & Industry (DPIIT)',
    standard: 'IS 17803:2022',
    standardsList: ['IS 17803:2022'],
    products: 'Stainless Steel Vacuum Flasks, Domestic Insulated Bottles',
    enforcement: 'Active & Enforced Nationwide',
    legalBasis: 'Section 16 of BIS Act 2016',
    penalties: 'Mandatory standard mark required before release into commercial stream',
  },
  {
    id: 'DPIIT_GAS_STOVE',
    name: 'Domestic Gas Stoves for use with LPG (Quality Control) Order',
    ministry: 'Ministry of Commerce & Industry (DPIIT)',
    standard: 'IS 4246:2002',
    standardsList: ['IS 4246:2002'],
    products: 'Domestic LPG Gas Stoves, Cooktops, and Chulhas',
    enforcement: 'Active & Enforced Nationwide',
    legalBasis: 'Section 16 of BIS Act 2016',
    penalties: 'Mandatory ISI mark with zero tolerance for carbon monoxide leakage',
  },
  {
    id: 'DPIIT_TOYS',
    name: 'Toys (Quality Control) Order',
    ministry: 'Ministry of Commerce & Industry (DPIIT)',
    standard: 'IS 9873:2019 / IS 15644:2006',
    standardsList: ['IS 9873:2019', 'IS 15644:2006'],
    products: 'All Electric & Non-Electric Toys for Children under 14 Years',
    enforcement: 'Active & Enforced Nationwide',
    legalBasis: 'Section 16 of BIS Act 2016',
    penalties: 'Mandatory BIS Scheme I certification for domestic and foreign makers',
  },
  {
    id: 'DPIIT_WIRES',
    name: 'Electrical Wires, Cables and Appliances (Quality Control) Order',
    ministry: 'Ministry of Commerce & Industry (DPIIT)',
    standard: 'IS 694:2010',
    standardsList: ['IS 694:2010'],
    products: 'PVC Insulated Copper and Aluminium Cables for Working Voltages up to 1100V',
    enforcement: 'Active & Enforced Nationwide',
    legalBasis: 'Section 16 of BIS Act 2016',
    penalties: 'Fire safety hazard prevention; criminal liability for non-certified cable sales',
  },
  {
    id: 'STEEL_MINISTRY',
    name: 'Steel and Steel Products (Quality Control) Order',
    ministry: 'Ministry of Steel',
    standard: 'IS 1786:2008 / IS 2062:2011',
    standardsList: ['IS 1786:2008', 'IS 2062:2011'],
    products: 'TMT Rebars, Structural Steel Plates, Hot Rolled Carbon Steel',
    enforcement: 'Active & Enforced Nationwide',
    legalBasis: 'Section 16 of BIS Act 2016',
    penalties: 'SIMS registration and BIS FMCS mandatory before customs clearance',
  },
  {
    id: 'GOLD_HALLMARKING',
    name: 'Hallmarking of Gold Jewellery and Gold Artefacts Order',
    ministry: 'Ministry of Consumer Affairs',
    standard: 'IS 1417:2016',
    standardsList: ['IS 1417:2016'],
    products: 'Gold Jewellery of 14K, 18K, 20K, 22K, 23K, and 24K',
    enforcement: 'Active in 343+ Notified Districts',
    legalBasis: 'Section 14 & 16 of BIS Act 2016',
    penalties: 'Section 19: 2x compensation of purity deficit plus testing refund to consumer',
  },
  {
    id: 'MEITY_CRO',
    name: 'Electronics and Information Technology Goods (Requirement for Compulsory Registration) Order',
    ministry: 'Ministry of Electronics and Information Technology (MeitY)',
    standard: 'IS 13252 / IS 16046',
    standardsList: ['IS 13252', 'IS 16046'],
    products: 'Mobile phones, laptops, smart cards, LED lights, power adapters',
    enforcement: 'Scheme II (CRS) Active & Enforced',
    legalBasis: 'Electronics & IT Goods CRO 2012 / 2021',
    penalties: 'No import or sale permitted without valid BIS R-Number registration',
  },
];

export default function QcoTab({ onAskAssistant }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMinistry, setSelectedMinistry] = useState('all');
  const [qcos, setQcos] = useState(INITIAL_FALLBACK_QCO);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const minParam = selectedMinistry === 'all' ? '' : selectedMinistry;
        const res = await fetchDirectoryQco(searchQuery, minParam);

        if (isMounted && res && res.success && res.qco_orders && res.qco_orders.length > 0) {
          const mapped = res.qco_orders.map((q) => ({
            id: q.qco_id || q.qco_name,
            name: q.qco_name,
            ministry: q.ministry,
            standard: q.standards?.join(' / ') || 'Mandatory Standard',
            standardsList: q.standards || [],
            products: q.products?.join(', ') || 'Covered Products',
            enforcement: q.enforcement_date || 'Active & Enforced Nationwide',
            legalBasis: q.legal_basis || 'Section 16 of BIS Act 2016',
            penalties: 'Section 29: Imprisonment up to 2 years and/or monetary penalty',
          }));
          setQcos(mapped);
        } else if (isMounted) {
          const filtered = INITIAL_FALLBACK_QCO.filter((qco) => {
            const matchesSearch =
              !searchQuery ||
              qco.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              qco.standard.toLowerCase().includes(searchQuery.toLowerCase()) ||
              qco.products.toLowerCase().includes(searchQuery.toLowerCase()) ||
              qco.ministry.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;
            if (selectedMinistry === 'dpiit') return qco.ministry.includes('DPIIT') || qco.ministry.includes('Commerce');
            if (selectedMinistry === 'steel') return qco.ministry.includes('Steel');
            if (selectedMinistry === 'meity') return qco.ministry.includes('Electronics') || qco.ministry.includes('MeitY');
            if (selectedMinistry === 'consumer') return qco.ministry.includes('Consumer Affairs');
            return true;
          });
          setQcos(filtered);
        }
      } catch (err) {
        console.error('Error fetching QCO directory:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedMinistry]);

  const handleDownloadDossier = (qco) => {
    try {
      setDownloadingId(qco.id);
      const primaryStd = qco.standardsList?.[0] || qco.standard.split('/')[0].trim();
      generateComplianceDossierPdf({
        standardNumber: primaryStd,
        productName: qco.products,
        title: qco.name,
        scheme: qco.name.includes('CRS') || qco.name.includes('Electronics') ? 'Scheme II (CRS)' : 'Scheme I (ISI Mark)',
        isMandatory: true,
        qcoName: qco.name,
        ministry: qco.ministry,
        enforcementDate: qco.enforcement,
        sampleRequirements: 'Statutory sealed sample lot for government lab conformity test.',
        turnaroundTime: '7 to 14 working days.',
      });
    } catch (err) {
      console.error('Failed to generate QCO dossier:', err);
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  return (
    <div className="tab-container">
      {/* Header Bar */}
      <div className="tab-header">
        <div>
          <h1 className="tab-title">Quality Control Orders (QCO Directory)</h1>
          <p className="tab-subtitle">
            Live directory of mandatory orders notified by the Central Government under Section 16 of the BIS Act, 2016.
          </p>
        </div>
        <div className="tab-stat-pill danger">
          {isLoading ? (
            <Loader2 size={16} className="animate-spin text-red" />
          ) : (
            <span className="stat-number">{qcos.length}</span>
          )}
          <span className="stat-label">Active Mandatory QCOs</span>
        </div>
      </div>

      {/* Statutory Notice Banner */}
      <div className="statutory-notice-box red-tint" style={{ marginBottom: 16 }}>
        <AlertOctagon size={18} className="notice-icon text-red" />
        <div className="notice-text">
          <strong>Statutory Enforcement Warning: </strong>
          Goods notified under a Quality Control Order cannot be manufactured, imported, distributed, or sold in India without bearing the official Standard Mark (ISI / CRS mark). Violation constitutes a cognizable offense under Section 29 of the Bureau of Indian Standards Act, 2016.
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="tab-toolbar">
        <div className="tab-search-input-wrap">
          <Search size={16} className="tab-search-icon" />
          <input
            type="text"
            className="tab-search-input"
            placeholder="Search QCO by order name, standard, or product..."
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

        <div className="tab-filter-chips">
          <motion.button
            type="button"
            className={`filter-chip ${selectedMinistry === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedMinistry('all')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            All QCOs ({qcos.length})
          </motion.button>
          <motion.button
            type="button"
            className={`filter-chip ${selectedMinistry === 'dpiit' ? 'active' : ''}`}
            onClick={() => setSelectedMinistry('dpiit')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            DPIIT (Commerce)
          </motion.button>
          <motion.button
            type="button"
            className={`filter-chip ${selectedMinistry === 'steel' ? 'active' : ''}`}
            onClick={() => setSelectedMinistry('steel')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Ministry of Steel
          </motion.button>
          <motion.button
            type="button"
            className={`filter-chip ${selectedMinistry === 'meity' ? 'active' : ''}`}
            onClick={() => setSelectedMinistry('meity')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            MeitY (Electronics)
          </motion.button>
          <motion.button
            type="button"
            className={`filter-chip ${selectedMinistry === 'consumer' ? 'active' : ''}`}
            onClick={() => setSelectedMinistry('consumer')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Consumer Affairs
          </motion.button>
        </div>
      </div>

      {/* QCO Cards Grid */}
      <div className="tab-card-container">
        <div className="qco-cards-grid">
          {qcos.map((qco, idx) => (
            <motion.div
              key={`${qco.id}-${idx}`}
              className="qco-item-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.04, 0.3), duration: 0.22 }}
              whileHover={{ y: -3, boxShadow: '0 8px 20px rgba(11, 31, 51, 0.08)' }}
            >
              <div className="qco-card-top">
                <div className="qco-title-row">
                  <ShieldAlert size={16} className="text-red" />
                  <span className="qco-title">{qco.name}</span>
                </div>
                <span className="badge-pill badge-danger">Mandatory</span>
              </div>

              <div className="qco-card-body">
                <div className="qco-field">
                  <span className="qco-field-label">Linked Standard:</span>
                  <strong className="mono text-navy">{qco.standard}</strong>
                </div>

                <div className="qco-field">
                  <span className="qco-field-label">Covered Products:</span>
                  <span className="qco-field-val">{qco.products}</span>
                </div>

                <div className="qco-field">
                  <span className="qco-field-label">Line Ministry:</span>
                  <span className="qco-field-val">{qco.ministry}</span>
                </div>

                <div className="qco-field">
                  <span className="qco-field-label">Enforcement Status:</span>
                  <span className="qco-field-val status-active">{qco.enforcement}</span>
                </div>
              </div>

              <div className="qco-card-footer" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <motion.button
                  type="button"
                  className="tab-action-btn secondary"
                  onClick={() => handleDownloadDossier(qco)}
                  disabled={downloadingId === qco.id}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  title="Download Official Compliance Dossier PDF"
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
                  {downloadingId === qco.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <FileDown size={12} style={{ color: '#0284c7' }} />
                  )}
                  <span>PDF Dossier</span>
                </motion.button>

                <motion.button
                  type="button"
                  className="tab-action-btn primary"
                  onClick={() => onAskAssistant && onAskAssistant(`Is certification mandatory for ${qco.products} under ${qco.standard}? What are the QCO requirements?`)}
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
          {qcos.length === 0 && !isLoading && (
            <div className="no-results-box">
              No Quality Control Orders matching "{searchQuery}" found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

