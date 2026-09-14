import React from 'react';
import { ShieldAlert, CheckCircle2, AlertOctagon, Scale } from 'lucide-react';

export default function ComplianceCard({ complianceInfo }) {
  if (!complianceInfo) return null;

  const {
    is_mandatory,
    status,
    scheme = 'Scheme I (ISI Mark)',
    qco_name,
    ministry,
    enforcement_date,
    legal_basis,
    exemptions = [],
  } = complianceInfo;

  return (
    <div className="domain-card domain-compliance">
      <div className="domain-card-header">
        <div className="domain-title-wrap">
          <Scale size={16} className="domain-icon text-navy" />
          <span className="domain-title">Statutory Compliance & QCO Status</span>
        </div>
        <div className="domain-badge-group">
          {is_mandatory ? (
            <span className="badge-pill badge-danger">
              <ShieldAlert size={12} className="inline-icon" /> Mandatory QCO
            </span>
          ) : (
            <span className="badge-pill badge-primary">
              <CheckCircle2 size={12} className="inline-icon" /> Voluntary Scheme
            </span>
          )}
          <span className="badge-pill badge-neutral">{scheme}</span>
        </div>
      </div>

      <div className="compliance-meta-grid">
        <div className="meta-tile">
          <div className="meta-tile-label">Line Ministry</div>
          <div className="meta-tile-value">{ministry || 'Ministry of Consumer Affairs'}</div>
        </div>

        <div className="meta-tile">
          <div className="meta-tile-label">Enforcement Status</div>
          <div className="meta-tile-value">{status || (is_mandatory ? 'Enforced under Gazette QCO' : 'Voluntary')}</div>
        </div>

        {enforcement_date && (
          <div className="meta-tile">
            <div className="meta-tile-label">Enforcement Date</div>
            <div className="meta-tile-value mono">{enforcement_date}</div>
          </div>
        )}

        {qco_name && (
          <div className="meta-tile full-width">
            <div className="meta-tile-label">Quality Control Order</div>
            <div className="meta-tile-value">{qco_name}</div>
          </div>
        )}
      </div>

      {legal_basis && (
        <div className="statutory-notice-box red-tint">
          <AlertOctagon size={16} className="notice-icon text-red" />
          <div className="notice-text">
            <strong>Statutory Legal Basis & Penalties: </strong>
            {legal_basis}. Manufacturing, importing, or selling without the Standard Mark constitutes an offense under Section 29 of the BIS Act, 2016.
          </div>
        </div>
      )}

      {exemptions && exemptions.length > 0 && (
        <div className="domain-sub-section">
          <div className="sub-section-title">Applicable Statutory Exemptions</div>
          <ul className="compliance-bullet-list">
            {exemptions.map((ex, idx) => (
              <li key={idx}>{ex}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
