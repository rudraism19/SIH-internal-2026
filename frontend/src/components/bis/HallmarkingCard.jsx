import React from 'react';
import { Award, ShieldCheck } from 'lucide-react';

export default function HallmarkingCard({ hallmarkingInfo }) {
  if (!hallmarkingInfo) return null;

  const {
    metal = 'Gold',
    standard_number = 'IS 1417:2016',
    huid_format,
    recognized_purity_grades = [],
    mandatory_districts_count = 343,
    exemptions = [],
    consumer_remedy,
  } = hallmarkingInfo;

  return (
    <div className="domain-card domain-hallmarking">
      <div className="domain-card-header">
        <div className="domain-title-wrap">
          <Award size={16} className="domain-icon text-saffron" />
          <span className="domain-title">{metal} Hallmarking & HUID Intelligence</span>
        </div>
        <div className="domain-badge-group">
          <span className="badge-pill badge-saffron">{metal} ({standard_number})</span>
          <span className="badge-pill badge-primary">📍 {mandatory_districts_count}+ Districts Notified</span>
        </div>
      </div>

      {/* 3 Mandatory Marks Grid */}
      <div className="hallmarking-marks-grid">
        <div className="mark-card">
          <div className="mark-number">1</div>
          <div className="mark-body">
            <div className="mark-heading">BIS Standard Mark</div>
            <div className="mark-sub">Official triangular BIS logo verifying statutory conformity</div>
          </div>
        </div>

        <div className="mark-card">
          <div className="mark-number">2</div>
          <div className="mark-body">
            <div className="mark-heading">Purity & Fineness Grade</div>
            <div className="mark-sub">Karat & Fineness benchmark (e.g. 22K916, 18K750, 14K585)</div>
          </div>
        </div>

        <div className="mark-card highlight">
          <div className="mark-number">3</div>
          <div className="mark-body">
            <div className="mark-heading">6-Digit HUID Code</div>
            <div className="mark-sub">Laser-etched alphanumeric Hallmark Unique ID for traceability</div>
          </div>
        </div>
      </div>

      {/* HUID Info */}
      {huid_format && (
        <div className="domain-highlight-strip">
          <span className="strip-label">HUID Traceability:</span>
          <span className="strip-val">{huid_format}</span>
        </div>
      )}

      {/* Recognized Purity Grades Table */}
      {recognized_purity_grades && recognized_purity_grades.length > 0 && (
        <div className="domain-sub-section">
          <div className="sub-section-title">Recognized Purity Grades under {standard_number}</div>
          <div className="compliance-table-wrap">
            <table className="compliance-table">
              <thead>
                <tr>
                  <th>Karat</th>
                  <th>Fineness</th>
                  <th>Gold Purity %</th>
                  <th>Statutory Description</th>
                </tr>
              </thead>
              <tbody>
                {recognized_purity_grades.map((grade, idx) => (
                  <tr key={idx}>
                    <td><strong className="mono">{grade.karat}</strong></td>
                    <td><code className="table-code">{grade.fineness}</code></td>
                    <td>{grade.percentage}</td>
                    <td>{grade.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Consumer Remedy Banner */}
      {consumer_remedy && (
        <div className="statutory-notice-box">
          <ShieldCheck size={16} className="notice-icon text-green" />
          <div className="notice-text">
            <strong>Consumer Compensation Right (Section 19, BIS Act 2016): </strong>
            {consumer_remedy}
          </div>
        </div>
      )}

      {/* Exemptions */}
      {exemptions && exemptions.length > 0 && (
        <div className="domain-sub-section">
          <div className="sub-section-title">Statutory Hallmarking Exemptions</div>
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
