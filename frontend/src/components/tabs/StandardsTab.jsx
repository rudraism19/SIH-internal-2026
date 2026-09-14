import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Bookmark, ShieldCheck, CheckCircle2, ArrowRight, FileDown, Loader2 } from 'lucide-react';
import { fetchDirectoryStandards } from '../../services/api';
import { generateComplianceDossierPdf } from '../../utils/pdfGenerator';

const INITIAL_FALLBACK_STANDARDS = [
  {
    code: 'IS 2347:2017',
    title: 'Domestic Pressure Cookers — Specification',
    category: 'Mechanical Engineering (MED)',
    division: 'MED',
    ministry: 'Ministry of Commerce & Industry (DPIIT)',
    isMandatory: true,
    scheme: 'Scheme I (ISI Mark)',
    scope: 'Pressure cookers made from aluminium alloy or stainless steel with internal operating volume 1L to 22L.',
    clausesCount: 14,
  },
  {
    code: 'IS 1460:2017',
    title: 'Automotive Diesel Fuel — Specification',
    category: 'Petroleum & Fuels (PCD)',
    division: 'PCD',
    ministry: 'Ministry of Petroleum & Natural Gas',
    isMandatory: true,
    scheme: 'Scheme I (ISI Mark)',
    scope: 'BS-VI ultra-low sulfur diesel fuel (max 10 ppm sulfur) for high-speed compression-ignition automotive engines.',
    clausesCount: 18,
  },
  {
    code: 'IS 4151:2020',
    title: 'Protective Helmets for Two-Wheeler Riders — Specification',
    category: 'Transport & Safety (TED)',
    division: 'TED',
    ministry: 'Ministry of Road Transport & Highways',
    isMandatory: true,
    scheme: 'Scheme I (ISI Mark)',
    scope: 'Non-metallic protective helmets for riders of two-wheeled motor vehicles, including impact attenuation and retention.',
    clausesCount: 16,
  },
  {
    code: 'IS 1417:2016',
    title: 'Gold and Gold Alloys, Jewellery/Artefacts — Fineness and Marking',
    category: 'Hallmarking & Bullion (MTD)',
    division: 'MTD',
    ministry: 'Ministry of Consumer Affairs',
    isMandatory: true,
    scheme: 'Hallmarking (HUID)',
    scope: 'Purity grades (24K, 23K, 22K 916, 18K 750, 14K 585) and statutory 3 mandatory marks including 6-digit HUID.',
    clausesCount: 12,
  },
  {
    code: 'IS 2888:2004',
    title: 'Toilet Soap — Specification',
    category: 'Chemicals & Cosmetics (CHD)',
    division: 'CHD',
    ministry: 'Voluntary Standard',
    isMandatory: false,
    scheme: 'Scheme I (Voluntary ISI)',
    scope: 'Formulation, total fatty matter (TFM), matter insoluble in alcohol, and chemical purity benchmarks for toilet soaps.',
    clausesCount: 10,
  },
  {
    code: 'IS 13252 (Part 1):2010',
    title: 'Information Technology Equipment — Safety (General Requirements)',
    category: 'Electronics & IT (LITD)',
    division: 'LITD',
    ministry: 'Ministry of Electronics & IT (MeitY)',
    isMandatory: true,
    scheme: 'Scheme II (CRS)',
    scope: 'Mains-powered or battery-powered IT equipment including mobile phones, laptops, and power adapters.',
    clausesCount: 24,
  },
  {
    code: 'IS 14543:2016',
    title: 'Packaged Drinking Water (Other than Packaged Natural Mineral Water)',
    category: 'Food & Agriculture (FAD)',
    division: 'FAD',
    ministry: 'Ministry of Health & FSSAI',
    isMandatory: true,
    scheme: 'Scheme I (ISI Mark)',
    scope: 'Microbiological safety, toxic heavy metal limits, and pesticide residue ceilings for sealed packaged drinking water.',
    clausesCount: 22,
  },
  {
    code: 'IS 1786:2008',
    title: 'High Strength Deformed Steel Bars and Wires for Concrete Reinforcement',
    category: 'Civil & Construction (CED)',
    division: 'CED',
    ministry: 'Ministry of Steel',
    isMandatory: true,
    scheme: 'Scheme I (ISI Mark)',
    scope: 'TMT thermo-mechanically treated rebars, proof stress limits, TS/YS ratios for earthquake resistance.',
    clausesCount: 20,
  },
  {
    code: 'IS 17803:2022',
    title: 'Insulated Flasks, Bottles and Containers for Domestic Use',
    category: 'Mechanical Engineering (MED)',
    division: 'MED',
    ministry: 'Ministry of Commerce & Industry (DPIIT)',
    isMandatory: true,
    scheme: 'Scheme I (ISI Mark)',
    scope: 'Thermal insulation retention, leak tightness, and food-grade stainless steel benchmarks for vacuum bottles.',
    clausesCount: 11,
  },
  {
    code: 'IS 4246:2002',
    title: 'Domestic Gas Stoves for Use with Liquefied Petroleum Gases',
    category: 'Mechanical Engineering (MED)',
    division: 'MED',
    ministry: 'Ministry of Commerce & Industry (DPIIT)',
    isMandatory: true,
    scheme: 'Scheme I (ISI Mark)',
    scope: 'Thermal efficiency, gas sound leakage, carbon monoxide emission limits, and burner combustion safety.',
    clausesCount: 15,
  },
  {
    code: 'IS 9873 (Part 1):2019',
    title: 'Safety of Toys — Safety Aspects Related to Mechanical and Physical Properties',
    category: 'Consumer Products (PCD)',
    division: 'PCD',
    ministry: 'Ministry of Commerce & Industry (DPIIT)',
    isMandatory: true,
    scheme: 'Scheme I (ISI Mark)',
    scope: 'Sharp edges, small parts choke hazards, kinetic energy of projectile toys, and structural integrity.',
    clausesCount: 19,
  },
];

export default function StandardsTab({ onAskAssistant }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [standards, setStandards] = useState(INITIAL_FALLBACK_STANDARDS);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(INITIAL_FALLBACK_STANDARDS.length);
  const [downloadingCode, setDownloadingCode] = useState(null);

  // Live Query from Backend Directory
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const divisionParam = ['MED', 'CHD', 'CED', 'LITD', 'FAD'].includes(selectedFilter)
          ? selectedFilter
          : '';
        const mandatoryOnly = selectedFilter === 'mandatory';

        const res = await fetchDirectoryStandards(searchQuery, divisionParam, mandatoryOnly, 50, 0);

        if (isMounted && res && res.success && res.standards && res.standards.length > 0) {
          const mapped = res.standards.map((s) => ({
            code: s.standard_number,
            title: s.title || s.product || 'Standard',
            product: s.product,
            category: s.division ? `${s.division} Council` : (s.category || 'General'),
            division: s.division || 'General',
            ministry: s.qco_order || (s.mandatory ? 'Mandatory QCO Enforced' : 'Voluntary Standard'),
            isMandatory: s.mandatory ?? false,
            scheme: s.certification_scheme || 'Scheme I (ISI Mark)',
            scope: s.category ? `Standard coverage for ${s.product || s.title}.` : 'Prescribed statutory quality specification and compliance guidelines.',
            qcoOrder: s.qco_order,
            source: s.source,
          }));

          // Filter voluntary client-side if selected
          const finalItems = selectedFilter === 'voluntary'
            ? mapped.filter((item) => !item.isMandatory)
            : mapped;

          setStandards(finalItems);
          setTotalCount(res.total || finalItems.length);
        } else if (isMounted) {
          // Client-side fallback filtering
          const filtered = INITIAL_FALLBACK_STANDARDS.filter((std) => {
            const matchesSearch =
              !searchQuery ||
              std.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
              std.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              std.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
              std.scope.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;
            if (selectedFilter === 'mandatory') return std.isMandatory;
            if (selectedFilter === 'voluntary') return !std.isMandatory;
            if (['MED', 'CHD', 'CED', 'LITD', 'FAD'].includes(selectedFilter)) {
              return std.division === selectedFilter;
            }
            return true;
          });
          setStandards(filtered);
          setTotalCount(filtered.length);
        }
      } catch (err) {
        console.error('Error fetching standards:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedFilter]);

  const handleDownloadDossier = (std) => {
    try {
      setDownloadingCode(std.code);
      generateComplianceDossierPdf({
        standardNumber: std.code,
        productName: std.product || std.title,
        title: std.title,
        division: std.division || std.category,
        scheme: std.scheme,
        isMandatory: std.isMandatory,
        qcoName: std.qcoOrder || (std.isMandatory ? `${std.title} QCO` : null),
        ministry: std.ministry,
        sampleRequirements: '3 to 6 complete representative units in sealed commercial packaging.',
        turnaroundTime: '7 to 14 working days from receipt at accredited lab.',
      });
    } catch (err) {
      console.error('Failed to generate PDF dossier:', err);
    } finally {
      setTimeout(() => setDownloadingCode(null), 1000);
    }
  };

  return (
    <div className="tab-container">
      {/* Header Bar */}
      <div className="tab-header">
        <div>
          <h1 className="tab-title">Indian Standards Directory (IS Repository)</h1>
          <p className="tab-subtitle">
            Live query over active Indian Standards, statutory certification schemes, and technical specifications under the BIS Act 2016.
          </p>
        </div>
        <div className="tab-stat-pill">
          {isLoading ? (
            <Loader2 size={16} className="animate-spin text-primary" />
          ) : (
            <span className="stat-number">{totalCount}</span>
          )}
          <span className="stat-label">Active Records</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="tab-toolbar">
        <div className="tab-search-input-wrap">
          <Search size={16} className="tab-search-icon" />
          <input
            type="text"
            className="tab-search-input"
            placeholder="Search IS code (e.g. IS 2347) or keyword (cooker, cement, water)..."
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
            className={`filter-chip ${selectedFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('all')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            All ({totalCount})
          </motion.button>
          <motion.button
            type="button"
            className={`filter-chip ${selectedFilter === 'mandatory' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('mandatory')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Mandatory QCO
          </motion.button>
          <motion.button
            type="button"
            className={`filter-chip ${selectedFilter === 'voluntary' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('voluntary')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Voluntary
          </motion.button>
          <motion.button
            type="button"
            className={`filter-chip ${selectedFilter === 'MED' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('MED')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            title="Mechanical Engineering Division"
          >
            MED (Mechanical)
          </motion.button>
          <motion.button
            type="button"
            className={`filter-chip ${selectedFilter === 'CHD' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('CHD')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            title="Chemical Division"
          >
            CHD (Chemical)
          </motion.button>
          <motion.button
            type="button"
            className={`filter-chip ${selectedFilter === 'CED' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('CED')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            title="Civil Engineering Division"
          >
            CED (Civil)
          </motion.button>
          <motion.button
            type="button"
            className={`filter-chip ${selectedFilter === 'LITD' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('LITD')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            title="Electronics & IT Division"
          >
            LITD (Electronics)
          </motion.button>
          <motion.button
            type="button"
            className={`filter-chip ${selectedFilter === 'FAD' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('FAD')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            title="Food & Agriculture Division"
          >
            FAD (Food)
          </motion.button>
        </div>
      </div>

      {/* Standards List Table */}
      <div className="tab-card-container">
        <div className="standards-table-wrap">
          <table className="standards-directory-table">
            <thead>
              <tr>
                <th>Standard Code</th>
                <th>Standard Title & Scope</th>
                <th>Division / Line Ministry</th>
                <th>Compliance Status</th>
                <th style={{ textAlign: 'right', minWidth: '180px' }}>Statutory Actions</th>
              </tr>
            </thead>
            <tbody>
              {standards.map((std, idx) => (
                <motion.tr
                  key={`${std.code}-${idx}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.2), duration: 0.2 }}
                >
                  <td className="code-cell">
                    <div className="standard-code-box">
                      <Bookmark size={14} className="code-icon" />
                      <strong className="mono">{std.code}</strong>
                    </div>
                    <span className="scheme-tag">{std.scheme}</span>
                  </td>
                  <td className="title-cell">
                    <div className="std-table-title">{std.title}</div>
                    <div className="std-table-scope">{std.scope}</div>
                  </td>
                  <td className="meta-cell">
                    <div className="std-ministry">{std.ministry}</div>
                    <div className="std-cat-pill">{std.category}</div>
                  </td>
                  <td className="status-cell">
                    {std.isMandatory ? (
                      <span className="badge-pill badge-danger">
                        <ShieldCheck size={11} className="inline-icon" /> Mandatory QCO
                      </span>
                    ) : (
                      <span className="badge-pill badge-primary">
                        <CheckCircle2 size={11} className="inline-icon" /> Voluntary
                      </span>
                    )}
                  </td>
                  <td className="action-cell" style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <motion.button
                        type="button"
                        className="tab-action-btn secondary"
                        onClick={() => handleDownloadDossier(std)}
                        disabled={downloadingCode === std.code}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        title="Download official PDF Compliance Dossier & SIT Audit Checklist"
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
                        {downloadingCode === std.code ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <FileDown size={12} style={{ color: '#0284c7' }} />
                        )}
                        <span>PDF Dossier</span>
                      </motion.button>

                      <motion.button
                        type="button"
                        className="tab-action-btn primary"
                        onClick={() => onAskAssistant && onAskAssistant(`What are the testing and compliance requirements for ${std.code} (${std.title})?`)}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        title="Ask the BIS Assistant about this standard"
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
                  </td>
                </motion.tr>
              ))}
              {standards.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="no-results-cell">
                    No standards matching "{searchQuery}" found in live BIS registry.
                  </td>
                </tr>
              )}
              {isLoading && standards.length === 0 && (
                <tr>
                  <td colSpan={5} className="no-results-cell" style={{ textAlign: 'center', padding: '30px' }}>
                    <Loader2 size={24} className="animate-spin text-primary" style={{ margin: '0 auto 10px' }} />
                    Searching Bureau of Indian Standards database...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

