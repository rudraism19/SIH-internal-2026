import React from 'react';
import { Search, ArrowRight } from 'lucide-react';

export default function NoEvidenceCard({ onSearchStandards }) {
  return (
    <div className="no-evidence-box">
      <div className="no-evidence-header">
        <span className="no-evidence-icon">×</span>
        <span className="no-evidence-title">No verified BIS evidence</span>
      </div>

      <p className="no-evidence-text">
        I don't currently have a verified BIS source for this query in the indexed knowledge base.
      </p>

      <div className="no-evidence-suggestions">
        <div className="suggestions-title">Try:</div>
        <ul className="suggestions-list">
          <li>Specify the formal product name (e.g. <em>"domestic pressure cookers"</em>)</li>
          <li>Provide an exact IS standard number (e.g. <em>"IS 2347"</em> or <em>"IS 1460"</em>)</li>
          <li>Search by tariff classification or BIS conformity scheme</li>
        </ul>
      </div>

      <div className="no-evidence-action">
        <button
          type="button"
          className="search-standards-btn"
          onClick={() => onSearchStandards && onSearchStandards('List active Indian Standards for consumer products')}
        >
          <Search size={14} />
          <span>Search Standards</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
