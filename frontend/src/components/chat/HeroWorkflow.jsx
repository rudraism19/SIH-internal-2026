import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  FileText,
  Award,
  FlaskConical,
  Building2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { getTranslations } from '../../constants/translations';
import { PERSONAS } from '../../constants/personas';

const WORKFLOW_NODE_KEYS = [
  { key: 'product', fallback: 'PRODUCT', icon: Package },
  { key: 'standard', fallback: 'STANDARD', icon: FileText },
  { key: 'certification', fallback: 'CERTIFICATION', icon: Award },
  { key: 'testing', fallback: 'TESTING', icon: FlaskConical },
  { key: 'laboratory', fallback: 'LABORATORY', icon: Building2 },
  { key: 'compliance', fallback: 'COMPLIANCE', icon: CheckCircle2 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function HeroWorkflow({ onSelectPrompt, selectedLanguage = 'en-IN' }) {
  const [activePersonaId, setActivePersonaId] = useState('manufacturer');
  const t = getTranslations(selectedLanguage);
  const isHindi = selectedLanguage === 'hi-IN';

  const currentPersona =
    PERSONAS.find((p) => p.id === activePersonaId) || PERSONAS[0];

  return (
    <motion.div
      className="bis-hero-section"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Live Statutory Gazette Marquee */}
      <motion.div className="hero-gazette-ticker" variants={itemVariants}>
        <div className="gazette-badge">
          <span className="gazette-pulse-dot" />
          <span>{isHindi ? 'लाइव राजपत्र' : 'LIVE GAZETTE'}</span>
        </div>
        <div className="gazette-marquee-track">
          <div className="gazette-marquee-content">
            <span>• <strong>Footwear QCO Phase II</strong> in force</span>
            <span className="gazette-sep">|</span>
            <span>• <strong>Mandatory Gold HUID</strong> active in 343 districts</span>
            <span className="gazette-sep">|</span>
            <span>• <strong>50% Marking Fee Concession</strong> for DPIIT Startups</span>
            <span className="gazette-sep">|</span>
            <span>• <strong>Standards Clubs</strong>: ₹1,00,000 science lab grants</span>
            <span className="gazette-sep">|</span>
            <span>• <strong>NITS NOIDA</strong>: ISO 9001/17025 Lead Auditor batches open</span>
          </div>
        </div>
      </motion.div>

      {/* Title & Subtitle */}
      <motion.div className="hero-header-block" variants={itemVariants}>
        <div className="hero-badge">{t.hero?.badge || 'OFFICIAL CONFORMITY PLATFORM'}</div>
        <h1 className="hero-title">{t.hero?.title || 'Find the right BIS requirement'}</h1>
        <p className="hero-subtitle">
          {t.hero?.subtitle ||
            'Identify standards, certification requirements, testing procedures, laboratories and compliance information.'}
        </p>
      </motion.div>

      {/* Compact Workflow Visual */}
      <motion.div className="hero-workflow-wrapper" variants={itemVariants}>
        <div className="workflow-pipeline">
          {WORKFLOW_NODE_KEYS.map((node, idx) => {
            const Icon = node.icon;
            const isLast = idx === WORKFLOW_NODE_KEYS.length - 1;
            const nodeLabel = t.hero?.nodes?.[node.key] || node.fallback;
            return (
              <React.Fragment key={node.key}>
                <motion.div
                  className="pipeline-step"
                  whileHover={{ y: -3, scale: 1.04 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <div className={`step-icon-box ${isLast ? 'success-step' : ''}`}>
                    <Icon size={16} />
                  </div>
                  <span className="step-label">{nodeLabel}</span>
                </motion.div>

                {!isLast && (
                  <div className="pipeline-arrow" aria-hidden="true">
                    <ArrowRight size={14} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </motion.div>

      {/* 4-Pill Segmented Persona Switcher */}
      <motion.div className="hero-persona-section" variants={itemVariants}>
        <div className="persona-header-row">
          <div className="persona-kicker">
            <Sparkles size={13} color="var(--saffron, #D97706)" />
            <span>{isHindi ? 'अनुपालन भूमिका चुनें' : 'SELECT COMPLIANCE PERSONA'}</span>
          </div>
          <span className="persona-kicker-hint">
            {isHindi
              ? 'भूमिका अनुसार अनुकूलित मानक और त्वरित प्रक्रिया'
              : 'Tailors standards, procedures & statutory fast-tracks'}
          </span>
        </div>

        <div className="persona-pills-track" role="tablist" aria-label="Compliance Personas">
          {PERSONAS.map((persona) => {
            const Icon = persona.icon;
            const isActive = persona.id === activePersonaId;
            const label = isHindi ? persona.labelHi : persona.label;
            const badge = isHindi ? persona.badgeHi : persona.badge;

            return (
              <button
                key={persona.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`persona-pill-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActivePersonaId(persona.id)}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-persona-pill"
                    className="persona-pill-active-bg"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <div className="persona-pill-main">
                  <Icon size={16} className="persona-pill-icon" />
                  <span className="persona-pill-label">{label}</span>
                </div>
                <span className={`persona-pill-badge tone-${persona.badgeTone}`}>
                  {badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Persona Description Banner */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPersona.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="persona-summary-card"
          >
            <span className="persona-live-dot" />
            <span>
              <strong>
                {isHindi ? currentPersona.labelHi : currentPersona.label}:
              </strong>{' '}
              {isHindi ? currentPersona.descriptionHi : currentPersona.description}
            </span>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Categorized Quick Prompts Grid */}
      <motion.div className="hero-quick-prompts-block" variants={itemVariants}>
        <div className="prompts-kicker">
          {isHindi
            ? `${currentPersona.labelHi} के लिए त्वरित अनुपालन प्रश्न`
            : `QUICK COMPLIANCE ACTIONS FOR ${currentPersona.label.toUpperCase()}`}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentPersona.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="quick-prompts-grid"
          >
            {currentPersona.prompts.map((promptCfg) => {
              const Icon = promptCfg.icon;
              const label = isHindi && promptCfg.labelHi ? promptCfg.labelHi : promptCfg.label;
              const query = promptCfg.query;

              return (
                <motion.button
                  key={promptCfg.id}
                  type="button"
                  className="quick-prompt-btn"
                  onClick={() => onSelectPrompt && onSelectPrompt(query)}
                  title={query}
                  whileHover={{
                    y: -3,
                    boxShadow: '0 8px 20px rgba(11, 31, 51, 0.08)',
                    borderColor: 'var(--action-blue)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <div className="btn-top-row">
                    <Icon size={15} className="prompt-icon" />
                    <span className="prompt-category-name">{label}</span>
                  </div>
                  <div className="prompt-query-sample">{query}</div>
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
