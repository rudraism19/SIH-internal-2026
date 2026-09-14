import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Volume2, ShieldCheck, RotateCcw, Check, Sun, Moon } from 'lucide-react';
import { SUPPORTED_LANGUAGES, findLanguage } from '../../constants/languages';
import { getTranslations } from '../../constants/translations';

export default function SettingsTab({
  selectedLanguage,
  onSelectLanguage,
  voiceEnabled,
  onToggleVoice,
  voiceSpeaker,
  onChangeSpeaker,
  onResetSession,
  theme = 'light',
  onToggleTheme,
}) {
  const currentLang = findLanguage(selectedLanguage);
  const t = getTranslations(selectedLanguage);

  return (
    <div className="tab-container">
      {/* Header Bar */}
      <div className="tab-header">
        <div>
          <h1 className="tab-title">{t.settings?.title || 'Portal Settings & Compliance Preferences'}</h1>
          <p className="tab-subtitle">
            {t.settings?.subtitle || 'Configure linguistic preferences, acoustic speech synthesis, and conformity knowledge scopes.'}
          </p>
        </div>
      </div>

      <div className="tab-card-container">
        <div className="settings-sections-stack">
          {/* Section 1: Language & Localization */}
          <motion.div
            className="settings-section-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="settings-card-header">
              <div className="settings-header-left">
                <Globe size={18} className="settings-icon text-navy" />
                <div>
                  <h3 className="settings-title">{t.settings?.langSectionTitle || 'Linguistic & Indic Script Preferences'}</h3>
                  <p className="settings-desc">{t.settings?.langSectionDesc || 'Select primary language for querying and structured answer presentation.'}</p>
                </div>
              </div>
            </div>

            <div className="settings-card-body">
              <div className="language-grid-picker">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = lang.code === currentLang.code;
                  return (
                    <motion.button
                      key={lang.code}
                      type="button"
                      className={`lang-picker-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => onSelectLanguage(lang.code)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                    >
                      <div className="lang-picker-text">
                        <span className="lang-picker-native">{lang.native}</span>
                        <span className="lang-picker-sub">{lang.label}</span>
                      </div>
                      {isSelected && <Check size={14} className="text-navy" />}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Section 2: Voice & Acoustic Synthesis */}
          <motion.div
            className="settings-section-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.2 }}
          >
            <div className="settings-card-header">
              <div className="settings-header-left">
                <Volume2 size={18} className="settings-icon text-navy" />
                <div>
                  <h3 className="settings-title">{t.settings?.voiceSectionTitle || 'Acoustic Speech Synthesis (Sarvam AI)'}</h3>
                  <p className="settings-desc">{t.settings?.voiceSectionDesc || 'Enable spoken audio responses and choose your preferred speaker voice profile.'}</p>
                </div>
              </div>
              <div className="settings-toggle-wrap">
                <motion.button
                  type="button"
                  className={`settings-toggle-btn ${voiceEnabled ? 'active' : ''}`}
                  onClick={onToggleVoice}
                  whileTap={{ scale: 0.96 }}
                >
                  {voiceEnabled ? (t.settings?.voiceActive || 'Voice Active') : (t.settings?.voiceDisabled || 'Voice Disabled')}
                </motion.button>
              </div>
            </div>

            {voiceEnabled && (
              <div className="settings-card-body">
                <div className="speaker-picker-row">
                  <span className="speaker-label">Preferred Voice Profile:</span>
                  <div className="speaker-options-chips">
                    {[
                      { id: 'priya', label: 'Priya (Female)' },
                      { id: 'aditya', label: 'Aditya (Male)' },
                      { id: 'ritu', label: 'Ritu (Female)' },
                      { id: 'rahul', label: 'Rahul (Male)' },
                    ].map((spk) => (
                      <motion.button
                        key={spk.id}
                        type="button"
                        className={`speaker-chip ${voiceSpeaker === spk.id ? 'active' : ''}`}
                        onClick={() => onChangeSpeaker(spk.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {spk.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Section 3: Visual Appearance & Theme */}
          <motion.div
            className="settings-section-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.2 }}
          >
            <div className="settings-card-header">
              <div className="settings-header-left">
                {theme === 'dark' ? <Moon size={18} className="settings-icon text-navy" /> : <Sun size={18} className="settings-icon text-navy" />}
                <div>
                  <h3 className="settings-title">Visual Appearance & Display Theme</h3>
                  <p className="settings-desc">Switch between standard Light Mode and high-contrast Midnight Dark Mode.</p>
                </div>
              </div>
              <div className="settings-toggle-wrap">
                <motion.button
                  type="button"
                  className={`settings-toggle-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={onToggleTheme}
                  whileTap={{ scale: 0.96 }}
                >
                  {theme === 'dark' ? '🌙 Dark Mode Active' : '☀️ Light Mode Active'}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Section 4: Compliance Knowledge Scope */}
          <motion.div
            className="settings-section-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.2 }}
          >
            <div className="settings-card-header">
              <div className="settings-header-left">
                <ShieldCheck size={18} className="settings-icon text-navy" />
                <div>
                  <h3 className="settings-title">Conformity Assessment Statutory Framework</h3>
                  <p className="settings-desc">Knowledge bases and official gazettes indexed in the compliance engine.</p>
                </div>
              </div>
            </div>

            <div className="settings-card-body">
              <div className="compliance-scope-list">
                <div className="scope-item">
                  <Check size={14} className="text-green" />
                  <span>Bureau of Indian Standards Act, 2016 (Statutory Foundation)</span>
                </div>
                <div className="scope-item">
                  <Check size={14} className="text-green" />
                  <span>Central Government Quality Control Orders (QCOs) under Section 16</span>
                </div>
                <div className="scope-item">
                  <Check size={14} className="text-green" />
                  <span>Indian Customs ICEGATE Tariff & HSN Code Compliance Links</span>
                </div>
                <div className="scope-item">
                  <Check size={14} className="text-green" />
                  <span>Central & Regional Laboratories (CL, WRL, SRL, ERL, NRL) Directory</span>
                </div>
                <div className="scope-item">
                  <Check size={14} className="text-green" />
                  <span>Mandatory Gold & Silver Hallmarking Regulations & 6-Digit HUID Protocol</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section 4: Session Control */}
          <motion.div
            className="settings-section-card danger-zone"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.2 }}
          >
            <div className="settings-card-header">
              <div className="settings-header-left">
                <RotateCcw size={18} className="settings-icon text-red" />
                <div>
                  <h3 className="settings-title">{t.settings?.resetSectionTitle || 'Reset Compliance Inquiry Session'}</h3>
                  <p className="settings-desc">{t.settings?.resetSectionDesc || 'Clear current conversational context and restore empty dashboard state.'}</p>
                </div>
              </div>
              <motion.button
                type="button"
                className="reset-session-action-btn"
                onClick={onResetSession}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                {t.settings?.resetSessionBtn || 'Reset Current Session'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
