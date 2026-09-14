import React from 'react';
import { Anchor, AlertCircle, FileCheck, ShieldAlert } from 'lucide-react';

export default function CustomsCard({ customsInfo }) {
  if (!customsInfo) return null;

  const {
    hsn_code,
    commodity_title,
    standard_number,
    product_name,
    import_policy,
    icegate_mandatory_check,
    required_documents = [],
    port_clearance_advisory,
  } = customsInfo;

  return (
    <div className="domain-card domain-customs">
      <div className="domain-card-header">
        <div className="domain-title-wrap">
          <Anchor size={16} className="domain-icon text-navy" />
          <span className="domain-title">Customs Port Clearance & ICEGATE Navigator</span>
        </div>
        <div className="domain-badge-group">
          <span className="badge-pill badge-neutral mono">HSN {hsn_code}</span>
          {icegate_mandatory_check ? (
            <span className="badge-pill badge-danger">
              <ShieldAlert size={12} className="inline-icon" /> ICEGATE Hold Enforced
            </span>
          ) : (
            <span className="badge-pill badge-success">
              <FileCheck size={12} className="inline-icon" /> OGL Clearance
            </span>
          )}
        </div>
      </div>

      <div className="compliance-meta-grid">
        <div className="meta-tile">
          <div className="meta-tile-label">Tariff Classification</div>
          <div className="meta-tile-value">{commodity_title || product_name}</div>
        </div>

        <div className="meta-tile">
          <div className="meta-tile-label">DGFT Import Policy</div>
          <div className="meta-tile-value">{import_policy}</div>
        </div>

        {standard_number && (
          <div className="meta-tile">
            <div className="meta-tile-label">Linked Indian Standard</div>
            <div className="meta-tile-value mono">{standard_number}</div>
          </div>
        )}

        <div className="meta-tile">
          <div className="meta-tile-label">Customs Gateway Check</div>
          <div className="meta-tile-value">
            {icegate_mandatory_check ? 'Bill of Entry blocked without valid BIS FMCS/CRS' : 'Standard EDI pass'}
          </div>
        </div>
      </div>

      {port_clearance_advisory && (
        <div className="statutory-notice-box saffron-tint">
          <AlertCircle size={16} className="notice-icon text-saffron" />
          <div className="notice-text">
            <strong>Port Advisory for Customs House Agents (CHA): </strong>
            {port_clearance_advisory}
          </div>
        </div>
      )}

      {required_documents && required_documents.length > 0 && (
        <div className="domain-sub-section">
          <div className="sub-section-title">Mandatory Bill of Entry (BoE) Documentation</div>
          <ul className="compliance-checklist">
            {required_documents.map((doc, idx) => (
              <li key={idx} className="checklist-item">
                <FileCheck size={14} className="check-icon text-green" />
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
