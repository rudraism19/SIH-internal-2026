import React from 'react';
import { motion } from 'framer-motion';
import { Menu, RotateCcw, Sun, Moon, FileDown } from 'lucide-react';
import LanguageSelector from '../common/LanguageSelector';
import VoiceButton from '../common/VoiceButton';
import { getTranslations } from '../../constants/translations';

export default function Header({
  onOpenSidebar,
  selectedLanguage,
  onSelectLanguage,
  voiceEnabled,
  onToggleVoice,
  voiceSpeaker,
  onChangeSpeaker,
  onResetSession,
  onExportSession,
  hasMessages = false,
  theme = 'light',
  onToggleTheme,
}) {
  const t = getTranslations(selectedLanguage);

  return (
    <header className="bis-header">
      <div className="header-left">
        <motion.button
          type="button"
          className="header-menu-btn"
          onClick={onOpenSidebar}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </motion.button>

        <div className="header-identity">
          <div className="header-title-row">
            <span className="header-main-title">{t.brandTitle}</span>
            <span className="header-badge-gov">{t.govBadge}</span>
          </div>
          <div className="header-sub-row">
            <span className="header-sub-title">{t.brandSubtitle}</span>
            <span className="header-dot-separator">•</span>
            <span className="header-pillars">{t.brandPillars}</span>
          </div>
          <div className="header-evidence-note">
            {t.evidenceNote}
          </div>
        </div>
      </div>

      <div className="header-controls">
        <LanguageSelector
          selectedLanguage={selectedLanguage}
          onSelectLanguage={onSelectLanguage}
        />

        <VoiceButton
          voiceEnabled={voiceEnabled}
          onToggleVoice={onToggleVoice}
          voiceSpeaker={voiceSpeaker}
          onChangeSpeaker={onChangeSpeaker}
        />

        <motion.button
          type="button"
          className="header-theme-btn"
          onClick={onToggleTheme}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label="Toggle visual theme"
        >
          {theme === 'dark' ? (
            <Sun size={15} className="theme-btn-icon" />
          ) : (
            <Moon size={15} className="theme-btn-icon" />
          )}
        </motion.button>

        {hasMessages && onExportSession && (
          <motion.button
            type="button"
            className="header-export-btn"
            onClick={onExportSession}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            title="Export full chat consultation transcript as official BIS PDF report"
            aria-label="Export consultation transcript to PDF"
          >
            <FileDown size={14} className="export-icon" />
            <span className="export-label">Export PDF</span>
          </motion.button>
        )}

        <motion.button
          type="button"
          className="header-reset-btn"
          onClick={onResetSession}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          title={t.resetTitle}
          aria-label="Reset conversation"
        >
          <RotateCcw size={14} className="reset-icon" />
          <span className="reset-label">{t.resetBtn}</span>
        </motion.button>
      </div>
    </header>
  );
}
