import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, XCircle } from 'lucide-react';

const ANALYSIS_STEPS = [
  { id: 1, label: 'Understanding query & statutory scope' },
  { id: 2, label: 'Searching BIS standards & QCO database' },
  { id: 3, label: 'Validating mandatory clauses & test methods' },
  { id: 4, label: 'Preparing grounded compliance advisory' },
];

const STEP_4_MICRO_STATUSES = [
  'Synthesizing statutory requirements & clause details...',
  'Verifying IS specifications & QCO gazette notifications...',
  'Checking recognized laboratory infrastructure & test methods...',
  'Finalizing official compliance advisory & next steps...',
];

export default function LoadingState({ onCancel }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStep(2), 1000);
    const timer2 = setTimeout(() => setCurrentStep(3), 2600);
    const timer3 = setTimeout(() => setCurrentStep(4), 4500);

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearInterval(interval);
    };
  }, []);

  // Continuous crawling progress so the bar never freezes at a static percentage
  const progressPercent = currentStep < 4
    ? (currentStep / ANALYSIS_STEPS.length) * 75
    : Math.min(98, 75 + Math.min(23, (elapsedSeconds - 4) * 2.2));

  const activeMicroStatus = STEP_4_MICRO_STATUSES[
    Math.floor(Math.max(0, elapsedSeconds - 4) / 2.2) % STEP_4_MICRO_STATUSES.length
  ];

  return (
    <motion.div
      className="assistant-message-row loading-row"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="assistant-avatar-col">
        <motion.div
          className="bis-avatar-circle pulsing"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          title="Bureau of Indian Standards Assistant"
        >
          <span>🏛</span>
        </motion.div>
      </div>

      <div className="assistant-content-col">
        <div className="bis-loading-card">
          <div className="loading-header-row">
            <div className="loading-title-group">
              <span className="loading-assistant-label">BIS Saarthi</span>
              <span className="loading-status-text">
                Analyzing compliance query ({elapsedSeconds}s)...
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="filter-pill-btn"
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.74rem',
                    color: 'var(--bis-red)',
                    borderColor: 'var(--bis-red-border)',
                    background: 'var(--bis-red-light)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  title="Cancel this query"
                >
                  <XCircle size={12} />
                  <span>Cancel</span>
                </button>
              )}
              <Loader2 size={16} className="spinner-icon animate-spin text-navy" />
            </div>
          </div>

          {/* Animated Compliance Progress Bar with continuous shimmer */}
          <div className="loading-progress-track" style={{ height: 4, background: 'var(--border-light)', borderRadius: 2, overflow: 'hidden', margin: '8px 0 12px 0' }}>
            <motion.div
              className="loading-progress-fill shimmer-active"
              style={{ height: '100%', borderRadius: 2 }}
              initial={{ width: '20%' }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </div>

          <div className="loading-steps-list">
            {ANALYSIS_STEPS.map((step) => {
              const isDone = step.id < currentStep;
              const isCurrent = step.id === currentStep;

              return (
                <div
                  key={step.id}
                  className={`loading-step-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
                >
                  <div className="step-bullet">
                    {isDone ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      >
                        <Check size={11} className="step-check-icon" />
                      </motion.div>
                    ) : isCurrent ? (
                      <motion.span
                        className="step-pulse-dot"
                        animate={{ scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                      />
                    ) : (
                      <span className="step-pending-dot" />
                    )}
                  </div>
                  <span className="step-text">{step.label}</span>
                </div>
              );
            })}
          </div>

          {currentStep === 4 && (
            <motion.div
              key={Math.floor(Math.max(0, elapsedSeconds - 4) / 2.2)}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                marginTop: '10px',
                padding: '7px 11px',
                backgroundColor: 'var(--navy-light-bg)',
                borderRadius: '6px',
                borderLeft: '3px solid var(--action-blue)',
                fontSize: '0.74rem',
                color: 'var(--primary-navy)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <motion.span
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: 'var(--action-blue)',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 500 }}>
                {activeMicroStatus}
              </span>
            </motion.div>
          )}

          {elapsedSeconds > 10 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                marginTop: '6px',
                paddingTop: '6px',
                borderTop: '1px dashed var(--border-light)',
                fontSize: '0.72rem',
                color: 'var(--secondary-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Checking technical gazettes & accredited lab databases...</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
