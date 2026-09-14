import React from 'react';
import { FlaskConical, Building2, Clock } from 'lucide-react';

export default function TestingCard({ testingInfo }) {
  if (!testingInfo) return null;

  const {
    standard_number,
    sample_requirements,
    estimated_turnaround,
    critical_parameters = [],
    recognized_laboratories = [],
  } = testingInfo;

  return (
    <div className="domain-card domain-testing">
      <div className="domain-card-header">
        <div className="domain-title-wrap">
          <FlaskConical size={16} className="domain-icon text-navy" />
          <span className="domain-title">Mandatory Laboratory Testing & Accredited Facilities</span>
        </div>
        <div className="domain-badge-group">
          <span className="badge-pill badge-neutral mono">{standard_number}</span>
          {estimated_turnaround && (
            <span className="badge-pill badge-primary">
              <Clock size={11} className="inline-icon" /> TAT: {estimated_turnaround}
            </span>
          )}
        </div>
      </div>

      {sample_requirements && (
        <div className="domain-highlight-strip">
          <span className="strip-label">Sample Batch Requirements:</span>
          <span className="strip-val">{sample_requirements}</span>
        </div>
      )}

      {/* Critical Parameters Table */}
      {critical_parameters && critical_parameters.length > 0 && (
        <div className="domain-sub-section">
          <div className="sub-section-title">Critical Test Parameters & Benchmark Limits</div>
          <div className="compliance-table-wrap">
            <table className="compliance-table">
              <thead>
                <tr>
                  <th>Parameter Name</th>
                  <th>Test Method / Clause</th>
                  <th>Prescribed Limit (Indian Standard)</th>
                  <th>Criticality</th>
                </tr>
              </thead>
              <tbody>
                {critical_parameters.map((param, idx) => (
                  <tr key={idx}>
                    <td><strong>{param.parameter_name}</strong></td>
                    <td><code className="table-code">{param.test_method || 'Standard Test Clause'}</code></td>
                    <td>{param.specification_limit}</td>
                    <td>
                      <span className={`criticality-badge ${param.criticality?.toLowerCase().includes('critical') || param.criticality?.toLowerCase().includes('safety') ? 'danger' : 'neutral'}`}>
                        {param.criticality || 'Mandatory'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recognized Laboratories */}
      {recognized_laboratories && recognized_laboratories.length > 0 && (
        <div className="domain-sub-section">
          <div className="sub-section-title">Recognized & In-House BIS Laboratories</div>
          <div className="labs-grid">
            {recognized_laboratories.map((lab, idx) => (
              <div key={idx} className="lab-item-card">
                <div className="lab-card-top">
                  <Building2 size={15} className="lab-icon text-navy" />
                  <span className="lab-name">{lab.lab_name}</span>
                </div>
                <div className="lab-location">📍 {lab.location}</div>
                <div className="lab-meta-row">
                  <span className="lab-type-tag">{lab.lab_type}</span>
                  {lab.accreditation && (
                    <span className="lab-accred-tag">{lab.accreditation}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
