import React from 'react';
import { Bookmark, CheckCircle2, ArrowRight } from 'lucide-react';

export default function StandardCard({
  standardNumber,
  title,
  pages,
  onAskAbout,
}) {
  return (
    <div className="bis-standard-card">
      <div className="standard-card-header">
        <div className="standard-code-wrap">
          <Bookmark size={15} className="standard-icon" />
          <span className="standard-code">{standardNumber}</span>
        </div>
        <div className="standard-badges">
          <span className="badge-pill badge-primary">Indian Standard</span>
          <span className="badge-pill badge-success">
            <CheckCircle2 size={11} className="inline-icon" /> Indexed
          </span>
        </div>
      </div>

      <div className="standard-card-title">{title || 'Indian Standard Specification'}</div>

      {pages && pages.length > 0 && (
        <div className="standard-card-meta">
          <span className="meta-label">Indexed Scope:</span> Pages {pages.join(', ')}
        </div>
      )}

      <div className="standard-card-actions">
        {onAskAbout && (
          <button
            type="button"
            className="std-btn-ask"
            onClick={() => onAskAbout(`What are the testing and compliance requirements under ${standardNumber}?`)}
          >
            <span>Ask about this</span>
            <ArrowRight size={13} />
          </button>
        )}
        <a
          href={`https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails/${standardNumber.replace(/\s+/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="std-btn-view"
        >
          View Standard
        </a>
      </div>
    </div>
  );
}
