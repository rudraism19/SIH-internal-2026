import React from 'react';
import { ArrowRight } from 'lucide-react';

const DEFAULT_CERTIFICATION_STEPS = [
  { step: '01', title: 'Identify Indian Standard', desc: 'Determine the applicable Indian Standard (IS code) corresponding to product specifications.' },
  { step: '02', title: 'Verify QCO / Mandatory Status', desc: 'Check if the product is notified under a Quality Control Order issued by the line ministry.' },
  { step: '03', title: 'Select Certification Scheme', desc: 'Identify statutory route: Scheme I (ISI Mark), Scheme II (CRS), or Scheme IV/X.' },
  { step: '04', title: 'Sample Testing in In-House/NABL Lab', desc: 'Conduct conformity testing in conformity with the relevant Scheme of Inspection & Testing (SIT).' },
  { step: '05', title: 'Submit Form-V / Manakonline Application', desc: 'File application, test reports, manufacturing infrastructure details, and statutory fees.' },
  { step: '06', title: 'Factory Audit & Verification', desc: 'Host BIS technical audit assessing manufacturing quality controls and testing capability.' },
  { step: '07', title: 'Grant of BIS Licence & CML Number', desc: 'Receive official BIS licence number to apply the Standard Mark with initial 1-year validity.' },
];

export default function WorkflowSteps({ title = 'BIS CERTIFICATION PROCESS', steps = DEFAULT_CERTIFICATION_STEPS }) {
  return (
    <div className="bis-workflow-card">
      <div className="workflow-header-row">
        <span className="workflow-kicker">{title}</span>
        <span className="workflow-steps-count">{steps.length} Statutory Stages</span>
      </div>

      <div className="workflow-steps-list">
        {steps.map((item, idx) => (
          <div key={idx} className="workflow-step-item">
            <div className="workflow-step-number">{item.step || `0${idx + 1}`}</div>
            <div className="workflow-step-content">
              <div className="workflow-step-title">{item.title}</div>
              {item.desc && <div className="workflow-step-desc">{item.desc}</div>}
            </div>
            {idx < steps.length - 1 && (
              <div className="workflow-connector">
                <ArrowRight size={14} className="connector-icon" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
