import React from 'react';
import { RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function RenewalCard({ renewalInfo }) {
  if (!renewalInfo) return null;

  const {
    standard_number,
    initial_validity_years = 1,
    renewal_window,
    statutory_form = 'Form-VI (Regulation 7)',
    minimum_marking_fee_inr,
    grace_period,
    late_fee_penalty,
    stop_marking_notice,
    renewal_checklist = [],
  } = renewalInfo;

  return (
    <div className="domain-card domain-renewal">
      <div className="domain-card-header">
        <div className="domain-title-wrap">
          <RefreshCw size={16} className="domain-icon text-navy" />
          <span className="domain-title">BIS Licence Lifecycle & Form-VI Renewal</span>
        </div>
        <div className="domain-badge-group">
          <span className="badge-pill badge-neutral mono">{standard_number}</span>
          <span className="badge-pill badge-primary">{statutory_form}</span>
        </div>
      </div>

      <div className="compliance-meta-grid">
        <div className="meta-tile">
          <div className="meta-tile-label">Initial Validity</div>
          <div className="meta-tile-value">{initial_validity_years} Year{initial_validity_years > 1 ? 's' : ''}</div>
        </div>

        <div className="meta-tile">
          <div className="meta-tile-label">Renewal Window</div>
          <div className="meta-tile-value">{renewal_window || '90 to 30 days prior to expiry'}</div>
        </div>

        <div className="meta-tile">
          <div className="meta-tile-label">Minimum Marking Fee</div>
          <div className="meta-tile-value mono">{minimum_marking_fee_inr || 'Statutory Fee Schedule'}</div>
        </div>

        <div className="meta-tile">
          <div className="meta-tile-label">Grace Period & Late Fee</div>
          <div className="meta-tile-value">{grace_period || '90 days'} ({late_fee_penalty || '₹5,000 + GST'})</div>
        </div>
      </div>

      {stop_marking_notice && (
        <div className="statutory-notice-box red-tint">
          <AlertTriangle size={16} className="notice-icon text-red" />
          <div className="notice-text">
            <strong>Statutory Stop-Marking Regulation: </strong>
            {stop_marking_notice}
          </div>
        </div>
      )}

      {renewal_checklist && renewal_checklist.length > 0 && (
        <div className="domain-sub-section">
          <div className="sub-section-title">Form-VI Submission Checklist</div>
          <ul className="compliance-checklist">
            {renewal_checklist.map((item, idx) => (
              <li key={idx} className="checklist-item">
                <CheckCircle2 size={14} className="check-icon text-navy" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
