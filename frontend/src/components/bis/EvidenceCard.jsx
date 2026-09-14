import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

export default function EvidenceCard({ citations = [], primaryStandard }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (!citations || citations.length === 0) return null;

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="bis-evidence-section">
      <div className="evidence-header-row">
        <span className="evidence-section-kicker">EVIDENCE</span>
        <span className="evidence-count-badge">{citations.length} Verified Citation{citations.length > 1 ? 's' : ''}</span>
      </div>

      <div className="evidence-citations-table">
        {citations.map((cite, idx) => {
          const isExpanded = expandedIndex === idx;
          const clauseText = cite.clause ? `Clause ${cite.clause}` : cite.title || 'General Clause';
          const pageText = cite.page ? `Page ${cite.page}` : null;

          return (
            <div key={idx} className="citation-row-wrapper">
              <div className="citation-row" onClick={() => cite.content && toggleExpand(idx)}>
                <div className="citation-clause-col">
                  <span className="check-bullet">
                    <Check size={13} />
                  </span>
                  <span className="citation-clause-name">{clauseText}</span>
                  {cite.standard_number && (
                    <span className="citation-std-pill">{cite.standard_number}</span>
                  )}
                </div>

                <div className="citation-right-col">
                  {pageText && <span className="citation-page-num">{pageText}</span>}
                  {cite.content && (
                    <button
                      type="button"
                      className="citation-expand-btn"
                      aria-expanded={isExpanded}
                      aria-label="View clause quote"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && cite.content && (
                <div className="citation-snippet-box">
                  <div className="snippet-quote">"{cite.content}"</div>
                  {cite.source && (
                    <div className="snippet-source">
                      <span>Source: {cite.source}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SOURCE ROW */}
      <div className="bis-source-row">
        <span className="source-label">SOURCE</span>
        <span className="source-text">
          BIS • {primaryStandard || citations[0]?.standard_number || 'Official Indian Standard Gazette'}
        </span>
      </div>
    </div>
  );
}
