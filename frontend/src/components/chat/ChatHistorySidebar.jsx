import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  User,
  Shield,
  PanelLeftClose,
  Archive,
} from 'lucide-react';
import { groupSessionsByDate } from '../../services/chatStorage';

export default function ChatHistorySidebar({
  sessions = [],
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onClearAllSessions,
  isOpen = true,
  onToggleOpen,
  userEmail,
  selectedLanguage = 'en-IN',
}) {
  const isHindi = selectedLanguage.startsWith('hi');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Filter sessions by search term
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase().trim();
    return sessions.filter((s) =>
      (s.title || '').toLowerCase().includes(q) ||
      (s.lastPreview || '').toLowerCase().includes(q)
    );
  }, [sessions, searchQuery]);

  // Group filtered sessions chronologically
  const groupedSessions = useMemo(() => {
    return groupSessionsByDate(filteredSessions);
  }, [filteredSessions]);

  const handleStartRename = (e, session) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (e, sessionId) => {
    e.stopPropagation();
    if (onRenameSession && editTitle.trim()) {
      onRenameSession(sessionId, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  const handleDelete = (e, sessionId) => {
    e.stopPropagation();
    if (window.confirm(isHindi ? 'क्या आप इस बातचीत को हटाना चाहते हैं?' : 'Delete this consultation session?')) {
      if (onDeleteSession) onDeleteSession(sessionId);
    }
  };

  const handleClearAll = () => {
    if (window.confirm(isHindi ? 'क्या आप सभी सहेजे गए चैट सत्र साफ़ करना चाहते हैं?' : 'Clear all saved consultation sessions for this account?')) {
      if (onClearAllSessions) onClearAllSessions();
    }
  };

  const formatSessionTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="chat-history-backdrop-mobile"
        onClick={onToggleOpen}
        aria-hidden="true"
      />
      <aside className="chat-history-sidebar">
      {/* Top Header: New Chat & Close */}
      <div className="history-sidebar-header">
        <motion.button
          type="button"
          className="history-new-chat-btn"
          onClick={onNewSession}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title={isHindi ? 'नया परामर्श शुरू करें' : 'Start new consultation'}
        >
          <Plus size={16} />
          <span>{isHindi ? 'नया परामर्श' : 'New Chat'}</span>
        </motion.button>

        {onToggleOpen && (
          <button
            type="button"
            className="history-collapse-btn"
            onClick={onToggleOpen}
            title={isHindi ? 'इतिहास छुपाएं' : 'Collapse session history'}
            aria-label="Collapse session history"
          >
            <PanelLeftClose size={17} />
          </button>
        )}
      </div>

      {/* User Account Capsule */}
      <div className="history-user-card">
        <div className="history-user-avatar">
          <User size={15} />
        </div>
        <div className="history-user-info">
          <span className="history-user-email" title={userEmail || 'officer@bis.gov.in'}>
            {userEmail || 'officer@bis.gov.in'}
          </span>
          <span className="history-vault-tag">
            <Shield size={10} />
            <span>{isHindi ? 'निजी संग्रहीत चैट' : 'User Private Vault'}</span>
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="history-search-box">
        <Search size={14} className="history-search-icon" />
        <input
          type="text"
          className="history-search-input"
          placeholder={isHindi ? 'परामर्श खोजें...' : 'Search consultations...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search consultation sessions"
        />
        {searchQuery && (
          <button
            type="button"
            className="history-search-clear"
            onClick={() => setSearchQuery('')}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Saved Sessions Chronological Stream */}
      <div className="history-sessions-list">
        {groupedSessions.length === 0 ? (
          <div className="history-empty-state">
            <Archive size={24} className="history-empty-icon" />
            <span className="history-empty-title">
              {searchQuery
                ? (isHindi ? 'कोई सत्र नहीं मिला' : 'No matching sessions')
                : (isHindi ? 'कोई सहेजा गया चैट नहीं' : 'No saved consultations')}
            </span>
            <span className="history-empty-desc">
              {isHindi
                ? 'नया प्रश्न पूछकर या छवि अपलोड करके परामर्श शुरू करें।'
                : 'Start an inquiry or upload an image to create your first session.'}
            </span>
          </div>
        ) : (
          groupedSessions.map((group) => (
            <div key={group.label} className="history-group">
              <div className="history-group-label">
                {group.label === 'Today'
                  ? (isHindi ? 'आज' : 'Today')
                  : group.label === 'Yesterday'
                  ? (isHindi ? 'कल' : 'Yesterday')
                  : group.label === 'Previous 7 Days'
                  ? (isHindi ? 'पिछले 7 दिन' : 'Previous 7 Days')
                  : (isHindi ? 'पुराने सत्र' : 'Older')}
              </div>

              <div className="history-group-items">
                {group.sessions.map((sess) => {
                  const isActive = sess.id === activeSessionId;
                  const isEditing = sess.id === editingSessionId;
                  const msgCount = sess.messages?.length || 0;

                  return (
                    <motion.div
                      key={sess.id}
                      className={`history-session-item ${isActive ? 'active' : ''}`}
                      onClick={() => !isEditing && onSelectSession(sess.id)}
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.12 }}
                    >
                      <MessageSquare size={15} className="session-item-icon shrink-0" />

                      <div className="session-item-content">
                        {isEditing ? (
                          <div className="session-inline-edit" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              className="session-edit-input"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(e, sess.id);
                                if (e.key === 'Escape') handleCancelRename(e);
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              className="edit-action-btn save"
                              onClick={(e) => handleSaveRename(e, sess.id)}
                              title="Save"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              type="button"
                              className="edit-action-btn cancel"
                              onClick={handleCancelRename}
                              title="Cancel"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="session-item-title" title={sess.title}>
                              {sess.title}
                            </span>
                            <div className="session-item-sub">
                              <span className="session-msg-badge">
                                {msgCount} {msgCount === 1 ? (isHindi ? 'संदेश' : 'msg') : (isHindi ? 'संदेश' : 'msgs')}
                              </span>
                              {(sess.updatedAt || sess.createdAt) && (
                                <span className="session-time-badge">
                                  {formatSessionTime(sess.updatedAt || sess.createdAt)}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Item Hover Actions */}
                      {!isEditing && (
                        <div className="session-hover-actions">
                          <button
                            type="button"
                            className="session-action-btn"
                            onClick={(e) => handleStartRename(e, sess)}
                            title={isHindi ? 'शीर्षक बदलें' : 'Rename consultation'}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            className="session-action-btn delete"
                            onClick={(e) => handleDelete(e, sess.id)}
                            title={isHindi ? 'हटाएं' : 'Delete consultation'}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Status & Clear */}
      <div className="history-sidebar-footer">
        <span className="history-count-text">
          {sessions.length} {sessions.length === 1 ? (isHindi ? 'सत्र' : 'consultation') : (isHindi ? 'सत्र' : 'consultations')}
        </span>
        {sessions.length > 0 && (
          <button
            type="button"
            className="history-clear-all-btn"
            onClick={handleClearAll}
            title={isHindi ? 'सभी सत्र हटाएं' : 'Clear all consultation sessions'}
          >
            <Trash2 size={12} />
            <span>{isHindi ? 'सभी साफ़ करें' : 'Clear All'}</span>
          </button>
        )}
      </div>
    </aside>
    </>
  );
}
