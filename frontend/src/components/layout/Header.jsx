import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, RotateCcw, Sun, Moon, FileDown, User, LogIn, LogOut, ChevronDown, ShieldCheck, Home, History } from 'lucide-react';
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
  userEmail,
  userProfile,
  onGoAuth,
  onGoLanding,
  onSignOut,
  onOpenChatHistory,
  sessionCount = 0,
}) {
  const t = getTranslations(selectedLanguage);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const displayName = userProfile?.full_name || (userEmail ? userEmail.split('@')[0] : 'Sign In');
  const initials = (userProfile?.full_name ? userProfile.full_name.charAt(0) : (userEmail ? userEmail.charAt(0) : 'U')).toUpperCase();
  const roleLabel = userProfile?.org_name
    ? `${userProfile.org_name} • ${userProfile.role ? userProfile.role.toUpperCase() : 'INDUSTRY'}`
    : (userEmail?.includes('auditor') ? 'Lab Auditor' : userEmail?.includes('citizen') ? 'Citizen / Consumer' : 'Industry / Manufacturer');

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

        {onOpenChatHistory && (
          <motion.button
            type="button"
            className="header-history-btn"
            onClick={onOpenChatHistory}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            title={selectedLanguage?.startsWith('hi') ? 'सहेजा गया चैट इतिहास देखें' : 'View Saved Chat History'}
            aria-label="View Saved Chat History"
          >
            <History size={14} className="history-icon" />
            <span className="history-label hidden sm:inline">
              {selectedLanguage?.startsWith('hi') ? 'चैट इतिहास' : 'Chat History'}
            </span>
            {sessionCount > 0 && (
              <span className="header-history-badge">{sessionCount}</span>
            )}
          </motion.button>
        )}

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

        {/* User Profile / Auth Action */}
        <div className="header-user-wrapper" ref={userMenuRef}>
          <motion.button
            type="button"
            className="header-user-btn"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            title={userEmail ? `Signed in as ${userEmail}` : 'Account & Authentication'}
            aria-label="User profile and login menu"
          >
            <div className="user-avatar-badge">
              <span className="user-avatar-initials">
                {userEmail ? initials : <User size={13} />}
              </span>
              <span className="user-status-dot" />
            </div>
            <span className="user-email-label hidden md:inline">
              {userEmail ? (displayName.length > 16 ? `${displayName.slice(0, 14)}...` : displayName) : 'Sign In'}
            </span>
            <ChevronDown size={11} className={`user-chevron ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </motion.button>

          {isUserMenuOpen && (
            <div className="header-user-popover">
              <div className="user-popover-header">
                <div className="user-popover-avatar">
                  {userEmail ? initials : 'U'}
                </div>
                <div className="user-popover-info">
                  <span className="user-popover-name font-semibold text-xs text-[var(--ink)] dark:text-slate-100">
                    {userProfile?.full_name || (userEmail ? userEmail.split('@')[0] : 'Compliance Officer')}
                  </span>
                  <span className="user-popover-email text-[11px] text-[var(--ink-soft)] dark:text-slate-400 truncate max-w-[200px] block">
                    {userEmail || 'user@bissaarthi.bis.gov.in'}
                  </span>
                  <span className="user-popover-role text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                    <ShieldCheck size={11} className="inline shrink-0" />
                    <span className="truncate max-w-[190px]">{roleLabel}</span>
                  </span>
                </div>
              </div>

              <div className="user-popover-divider" />

              <div className="user-popover-actions">
                <button
                  type="button"
                  className="user-popover-item"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    if (onGoAuth) onGoAuth();
                  }}
                >
                  <LogIn size={14} className="popover-item-icon" />
                  <span>{userEmail ? 'Switch Account / Login' : 'Sign In / Register'}</span>
                </button>

                {onGoLanding && (
                  <button
                    type="button"
                    className="user-popover-item"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onGoLanding();
                    }}
                  >
                    <Home size={14} className="popover-item-icon" />
                    <span>Return to Landing Page</span>
                  </button>
                )}

                {onSignOut && (
                  <button
                    type="button"
                    className="user-popover-item user-popover-item-danger"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onSignOut();
                    }}
                  >
                    <LogOut size={14} className="popover-item-icon" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
