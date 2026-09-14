import React from 'react';
import { Factory, AlertCircle, FileSpreadsheet } from 'lucide-react';

export default function BatchCalculatorCard({ batchInfo }) {
  if (!batchInfo) return null;

  const {
    standard_number,
    control_unit_definition,
    nominal_batch_size,
    input_production_volume,
    calculated_batches_count,
    routine_tests = [],
    acceptance_criteria,
    qa_record_keeping = [],
  } = batchInfo;

  return (
    <div className="domain-card domain-batch">
      <div className="domain-card-header">
        <div className="domain-title-wrap">
          <Factory size={16} className="domain-icon text-navy" />
          <span className="domain-title">Factory Batch Sizing & Scheme of Inspection and Testing (SIT)</span>
        </div>
        <div className="domain-badge-group">
          <span className="badge-pill badge-neutral mono">{standard_number}</span>
          {calculated_batches_count && (
            <span className="badge-pill badge-success">
              {calculated_batches_count} Calculated Batches
            </span>
          )}
        </div>
      </div>

      <div className="compliance-meta-grid">
        <div className="meta-tile">
          <div className="meta-tile-label">SIT Control Unit Definition</div>
          <div className="meta-tile-value">{control_unit_definition}</div>
        </div>

        <div className="meta-tile">
          <div className="meta-tile-label">Nominal Batch Size</div>
          <div className="meta-tile-value mono">{nominal_batch_size?.toLocaleString()} units</div>
        </div>

        {input_production_volume && (
          <div className="meta-tile">
            <div className="meta-tile-label">Production Input</div>
            <div className="meta-tile-value mono">{input_production_volume?.toLocaleString()} units/month</div>
          </div>
        )}

        <div className="meta-tile">
          <div className="meta-tile-label">Workload Batches</div>
          <div className="meta-tile-value mono">{calculated_batches_count || 1} SIT Batches</div>
        </div>
      </div>

      {/* Routine Tests Table */}
      {routine_tests && routine_tests.length > 0 && (
        <div className="domain-sub-section">
          <div className="sub-section-title">Mandatory SIT In-Line & Batch Routine Testing Schedule</div>
          <div className="compliance-table-wrap">
            <table className="compliance-table">
              <thead>
                <tr>
                  <th>Test Parameter</th>
                  <th>Clause</th>
                  <th>Prescribed Frequency</th>
                  <th>Testing Stage</th>
                  {input_production_volume && <th>Monthly Tests</th>}
                </tr>
              </thead>
              <tbody>
                {routine_tests.map((test, idx) => (
                  <tr key={idx}>
                    <td><strong>{test.parameter_name}</strong></td>
                    <td><code className="table-code">{test.clause || 'Standard Clause'}</code></td>
                    <td>{test.frequency}</td>
                    <td>
                      <span className="stage-pill">{test.testing_stage}</span>
                    </td>
                    {input_production_volume && (
                      <td>
                        <strong className="mono text-navy">
                          {test.tests_required_for_volume !== undefined
                            ? test.tests_required_for_volume.toLocaleString()
                            : 'As defined'}
                        </strong>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Acceptance Criteria */}
      {acceptance_criteria && (
        <div className="statutory-notice-box">
          <AlertCircle size={16} className="notice-icon text-navy" />
          <div className="notice-text">
            <strong>SIT Acceptance & Defect Criteria: </strong>
            {acceptance_criteria}
          </div>
        </div>
      )}

      {/* QA Record Keeping */}
      {qa_record_keeping && qa_record_keeping.length > 0 && (
        <div className="domain-sub-section">
          <div className="sub-section-title">Mandatory Factory Quality Logbooks & Registers</div>
          <ul className="compliance-checklist">
            {qa_record_keeping.map((book, idx) => (
              <li key={idx} className="checklist-item">
                <FileSpreadsheet size={14} className="check-icon text-navy" />
                <span>{book}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
