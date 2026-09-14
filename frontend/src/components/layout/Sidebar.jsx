import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  History,
  FileText,
  ShieldCheck,
  FlaskConical,
  Building2,
  BookOpen,
  Calculator,
  Calendar,
  ClipboardCheck,
  FileSpreadsheet,
  Settings,
  X,
  ExternalLink,
} from 'lucide-react';
import { getTranslations } from '../../constants/translations';

const NAV_ITEMS = [
  { id: 'assistant', label: 'AI Chatbot (Saarthi)', icon: MessageSquare },
  { id: 'chat_history', label: 'Chat History (सहेजे गए सत्र)', icon: History, isHistory: true },
  { id: 'standards', label: 'Standards', icon: FileText },
  { id: 'qco', label: 'QCO & Mandatory', icon: ShieldCheck },
  { id: 'testing', label: 'Testing', icon: FlaskConical },
  { id: 'laboratories', label: 'Laboratories', icon: Building2 },
  { id: 'calculator', label: 'Batch Calculator', icon: Calculator },
  { id: 'calendar', label: 'Compliance Calendar', icon: Calendar },
  { id: 'audit', label: 'Audit Simulator', icon: ClipboardCheck },
  { id: 'dossier', label: 'Application Dossier', icon: FileSpreadsheet },
  { id: 'documents', label: 'Documents', icon: BookOpen },
];

export default function Sidebar({
  activeNav = 'assistant',
  onSelectNav,
  isOpen = false,
  onClose,
  selectedLanguage = 'en-IN',
  sessionCount = 0,
  onOpenChatHistory,
}) {
  const t = getTranslations(selectedLanguage);

  const handleNavClick = (id) => {
    if (id === 'chat_history') {
      if (onOpenChatHistory) {
        onOpenChatHistory();
      } else if (onSelectNav) {
        onSelectNav('assistant');
      }
      if (onClose) onClose();
      return;
    }
    if (onSelectNav) onSelectNav(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sidebar-mobile-backdrop"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside className={`bis-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-seal">
            <div className="heritage-brand-crest-wrapper shrink-0" style={{ width: '34px', height: '34px' }}>
              <svg
                className="heritage-nav-brand-mark shrink-0"
                width="18"
                height="22"
                viewBox="0 0 96 120"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <ellipse cx="48" cy="60" rx="45" ry="57" />
                <path d="M48 88V46" strokeLinecap="round" />
                <path d="M48 58c-8-2-14-8-16-16 9 0 15 5 16 16Zm0 0c8-2 14-8 16-16-9 0-15 5-16 16Z" />
                <path d="M48 74c-9-2-15-8-17-17 10 0 16 6 17 17Zm0 0c9-2 15-8 17-17-10 0-16 6-17 17Z" />
                <path d="M48 46c-6-3-9-9-8-16 6 3 9 9 8 16Zm0 0c6-3 9-9 8-16-6 3-9 9-8 16Z" />
                <path d="M30 44c-5 1-9-1-12-5 5-2 9-1 12 5Zm36 0c5 1 9-1 12-5-5-2-9-1-12 5Z" />
              </svg>
            </div>
            <div className="brand-text-col">
              <span className="brand-sub" style={{ color: 'var(--action-blue)', letterSpacing: '0.08em', fontWeight: 700 }}>
                {selectedLanguage.startsWith('hi') ? 'बीआईएस सारथी' : 'BIS SAARTHI'}
              </span>
              <span className="brand-title" style={{ fontFamily: 'var(--font-heritage), Georgia, serif', fontSize: '15px' }}>
                {t.brandTitle}
              </span>
            </div>
          </div>

          {onClose && (
            <motion.button
              type="button"
              className="sidebar-close-btn"
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Close navigation sidebar"
            >
              <X size={18} />
            </motion.button>
          )}
        </div>

        <div className="sidebar-gov-badge">
          <span>{t.brandSubtitle}</span>
          <span className="sub-dept">{t.ministryBadge}</span>
        </div>

        {/* Main Navigation */}
        <nav className="sidebar-nav" aria-label="Primary Navigation">
          <div className="nav-group-label">{t.portalTitle}</div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isChatHistory = item.id === 'chat_history';
            const isActive = isChatHistory ? false : activeNav === item.id;
            const itemLabel = isChatHistory
              ? (selectedLanguage.startsWith('hi') ? 'चैट इतिहास (सत्र)' : 'Chat History')
              : (t.nav?.[item.id] || item.label);
            return (
              <motion.button
                key={item.id}
                type="button"
                className={`nav-link ${isActive ? 'active' : ''} ${isChatHistory ? 'nav-link-history' : ''}`}
                onClick={() => handleNavClick(item.id)}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.12 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActiveBg"
                    className="nav-active-bg"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon size={18} className="nav-icon" />
                <span className="nav-label">{itemLabel}</span>
                {isChatHistory && sessionCount > 0 && (
                  <span className="sidebar-history-count-badge">{sessionCount}</span>
                )}
                {isActive && (
                  <motion.span
                    layoutId="sidebarActivePill"
                    className="active-indicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </motion.button>
            );
          })}

          <div className="nav-divider" />

          {(() => {
            const isSettingsActive = activeNav === 'settings';
            return (
              <motion.button
                type="button"
                className={`nav-link ${isSettingsActive ? 'active' : ''}`}
                onClick={() => handleNavClick('settings')}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.12 }}
              >
                {isSettingsActive && (
                  <motion.div
                    layoutId="sidebarActiveBg"
                    className="nav-active-bg"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Settings size={18} className="nav-icon" />
                <span className="nav-label">{t.nav?.settings || 'Settings'}</span>
                {isSettingsActive && (
                  <motion.span
                    layoutId="sidebarActivePill"
                    className="active-indicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </motion.button>
            );
          })()}
        </nav>

        {/* Footer info */}
        <div className="sidebar-footer">
          <div className="portal-meta">
            <span className="portal-version">BIS Conformity Portal v2.4</span>
            <a
              href="https://www.services.bis.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="portal-link"
            >
              <span>bis.gov.in</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
