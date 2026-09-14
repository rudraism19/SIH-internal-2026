import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Search, MapPin, ArrowRight, Phone, ShieldCheck, Loader2 } from 'lucide-react';
import { fetchDirectoryLaboratories } from '../../services/api';

const INITIAL_FALLBACK_LABS = [
  {
    name: 'BIS Central Laboratory (CL Sahibabad)',
    location: 'Sahibabad Industrial Area, Ghaziabad, Uttar Pradesh',
    type: 'BIS National Apex Laboratory',
    capabilities: 'Domestic pressure cookers, electrical appliances, chemical products, soaps, metallurgy, gold assaying, packaged water.',
    contact: 'cl@bis.gov.in / 0120-2776030',
    isApex: true,
  },
  {
    name: 'BIS Western Regional Laboratory (WRL Mumbai)',
    location: 'MIDC, Andheri East, Mumbai, Maharashtra',
    type: 'BIS Regional Laboratory',
    capabilities: 'Chemical analysis, food products, domestic appliances, plastics and polymers, structural steel testing.',
    contact: 'wrl@bis.gov.in / 022-28329295',
    isApex: false,
  },
  {
    name: 'BIS Southern Regional Laboratory (SRL Chennai)',
    location: 'CIT Campus, Taramani, Chennai, Tamil Nadu',
    type: 'BIS Regional Laboratory',
    capabilities: 'Electrical cables, electronics safety, mechanical hardware, chemical formulations, water quality.',
    contact: 'srl@bis.gov.in / 044-22541442',
    isApex: false,
  },
  {
    name: 'BIS Eastern Regional Laboratory (ERL Kolkata)',
    location: 'Salt Lake City, Sector V, Kolkata, West Bengal',
    type: 'BIS Regional Laboratory',
    capabilities: 'Metallurgical testing, TMT steel rebars, civil materials, chemicals, consumer goods.',
    contact: 'erl@bis.gov.in / 033-23573752',
    isApex: false,
  },
  {
    name: 'BIS Northern Regional Laboratory (NRL Mohali)',
    location: 'Phase VII, Industrial Area, Mohali, Punjab',
    type: 'BIS Regional Laboratory',
    capabilities: 'Agricultural equipment, automotive components, mechanical testing, food grains and fertilizers.',
    contact: 'nrl@bis.gov.in / 0172-2224705',
    isApex: false,
  },
  {
    name: 'National Test House (NTH Ghaziabad & Kolkata)',
    location: 'Kamla Nehru Nagar, Ghaziabad / Alipore, Kolkata',
    type: 'Central Government Apex Lab (NABL Accredited)',
    capabilities: 'Hydrostatic burst testing for pressure cookers, structural steel verification, mechanical stress tests.',
    contact: 'nth-ghaziabad@nic.in',
    isApex: false,
  },
  {
    name: 'ARAI — Automotive Research Association of India',
    location: 'Kothrud, Pune, Maharashtra',
    type: 'MoRTH Recognized / BIS LRS Lab',
    capabilities: 'Protective helmets (IS 4151), automotive diesel fuel emissions (IS 1460), vehicular safety hardware.',
    contact: 'director@araiindia.com / 020-30231111',
    isApex: false,
  },
  {
    name: 'ICAT — International Centre for Automotive Technology',
    location: 'IMT Manesar, Gurugram, Haryana',
    type: 'MoRTH Recognized / BIS LRS Lab',
    capabilities: 'Two-wheeler helmet impact attenuation, chin strap elongation tests, automotive components.',
    contact: 'info@icat.in / 0124-4586111',
    isApex: false,
  },
  {
    name: 'ERTL (North) — Electronics Regional Test Laboratory',
    location: 'Okhla Industrial Area, Phase II, New Delhi',
    type: 'MeitY / STQC Recognized (Scheme II CRS)',
    capabilities: 'Smartphones, laptops, power adapters, dielectric voltage withstand, IS 13252 safety standards.',
    contact: 'ertlnorth@stqc.nic.in',
    isApex: false,
  },
];

export default function LaboratoriesTab({ onAskAssistant }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [labs, setLabs] = useState(INITIAL_FALLBACK_LABS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const prodParam = ['helmet', 'cooker', 'cement', 'water', 'electronics'].includes(selectedType)
          ? selectedType
          : '';
        const res = await fetchDirectoryLaboratories(searchQuery, prodParam);

        if (isMounted && res && res.success && res.laboratories && res.laboratories.length > 0) {
          const mapped = res.laboratories.map((l) => ({
            name: l.lab_name,
            location: l.location,
            type: l.lab_type,
            accreditation: l.accreditation,
            capabilities: Array.isArray(l.capabilities) ? l.capabilities.join(', ') : (l.capabilities || 'Comprehensive BIS Testing Scope'),
            contact: l.contact_info,
            isApex: l.lab_type.includes('Central') || (l.accreditation && l.accreditation.includes('Apex')),
          }));

          const filtered = selectedType === 'bis'
            ? mapped.filter((item) => item.type.includes('BIS'))
            : mapped;

          setLabs(filtered);
        } else if (isMounted) {
          const filtered = INITIAL_FALLBACK_LABS.filter((lab) => {
            const matchesSearch =
              !searchQuery ||
              lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              lab.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
              lab.capabilities.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;
            if (selectedType === 'bis') return lab.type.includes('BIS');
            if (selectedType === 'auto') return lab.capabilities.includes('helmet') || lab.capabilities.includes('diesel') || lab.capabilities.includes('automotive');
            if (selectedType === 'electronics') return lab.capabilities.includes('electronics') || lab.capabilities.includes('Smartphones');
            return true;
          });
          setLabs(filtered);
        }
      } catch (err) {
        console.error('Error fetching laboratories directory:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedType]);

  return (
    <div className="tab-container">
      {/* Header Bar */}
      <div className="tab-header">
        <div>
          <h1 className="tab-title">BIS Accredited Laboratory Network</h1>
          <p className="tab-subtitle">
            Live directory of BIS In-House National Apex & Regional Labs and NABL-accredited Laboratory Recognition Scheme (LRS) institutions.
          </p>
        </div>
        <div className="tab-stat-pill">
          {isLoading ? (
            <Loader2 size={16} className="animate-spin text-primary" />
          ) : (
            <span className="stat-number">{labs.length}</span>
          )}
          <span className="stat-label">Recognized Facilities</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="tab-toolbar">
        <div className="tab-search-input-wrap">
          <Search size={16} className="tab-search-icon" />
          <input
            type="text"
            className="tab-search-input"
            placeholder="Search laboratory by name, city (Sahibabad, Mumbai, Delhi...), or product..."
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
            className={`filter-chip ${selectedType === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedType('all')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            All Laboratories ({labs.length})
          </motion.button>
          <motion.button
            type="button"
            className={`filter-chip ${selectedType === 'bis' ? 'active' : ''}`}
            onClick={() => setSelectedType('bis')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            BIS In-House Labs
          </motion.button>
          <motion.button
            type="button"
            className={`filter-chip ${selectedType === 'cooker' ? 'active' : ''}`}
            onClick={() => setSelectedType('cooker')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Pressure Cooker Labs
          </motion.button>
          <motion.button
            type="button"
            className={`filter-chip ${selectedType === 'auto' ? 'active' : ''}`}
            onClick={() => setSelectedType('auto')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Automotive / Helmet Labs
          </motion.button>
          <motion.button
            type="button"
            className={`filter-chip ${selectedType === 'electronics' ? 'active' : ''}`}
            onClick={() => setSelectedType('electronics')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Electronics / IT (CRS)
          </motion.button>
        </div>
      </div>

      {/* Labs Cards Grid */}
      <div className="tab-card-container">
        <div className="labs-directory-grid">
          {labs.map((lab, idx) => (
            <motion.div
              key={`${lab.name}-${idx}`}
              className="lab-item-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.04, 0.3), duration: 0.22 }}
              whileHover={{ y: -3, boxShadow: '0 8px 20px rgba(11, 31, 51, 0.08)' }}
            >
              <div className="lab-card-top">
                <div className="lab-title-row">
                  <Building2 size={18} className="lab-card-icon text-navy" />
                  <div>
                    <h3 className="lab-card-name">{lab.name}</h3>
                    <div className="lab-location-sub">
                      <MapPin size={12} className="inline-icon" />
                      <span>{lab.location}</span>
                    </div>
                  </div>
                </div>
                <span className={`badge-pill ${lab.isApex ? 'badge-danger' : 'badge-primary'}`}>
                  {lab.isApex ? 'Apex Facility' : lab.type}
                </span>
              </div>

              <div className="lab-card-body">
                <div className="lab-field">
                  <span className="lab-field-label">Testing Capabilities:</span>
                  <p className="lab-capabilities-text">{lab.capabilities}</p>
                </div>

                {lab.accreditation && (
                  <div className="lab-field">
                    <span className="lab-field-label">Accreditation:</span>
                    <span className="lab-contact-text" style={{ color: '#0284c7', fontWeight: 600 }}>
                      <ShieldCheck size={12} className="inline-icon" /> {lab.accreditation}
                    </span>
                  </div>
                )}

                {lab.contact && (
                  <div className="lab-field contact-field">
                    <Phone size={12} className="inline-icon" />
                    <span className="lab-contact-text">{lab.contact}</span>
                  </div>
                )}
              </div>

              <div className="lab-card-footer">
                <motion.button
                  type="button"
                  className="tab-action-btn primary"
                  onClick={() => onAskAssistant && onAskAssistant(`Which tests can be conducted at ${lab.name} and what is the submission procedure?`)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <span>Inquire about Testing</span>
                  <ArrowRight size={12} />
                </motion.button>
              </div>
            </motion.div>
          ))}
          {labs.length === 0 && !isLoading && (
            <div className="no-results-box">
              No laboratories matching "{searchQuery}" found in directory.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

