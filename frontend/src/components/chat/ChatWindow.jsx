import React, { useRef, useEffect, useState } from 'react';
import {
  FileDown,
  Bot,
  ChevronDown,
  ChevronUp,
  MessageSquareText,
  History,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from 'lucide-react';
import HeroWorkflow from './HeroWorkflow';
import UserMessage from './UserMessage';
import AssistantMessage from './AssistantMessage';
import LoadingState from './LoadingState';
import ChatInput from './ChatInput';
import SuggestedMessages from './SuggestedMessages';
import ChatHistorySidebar from './ChatHistorySidebar';

export default function ChatWindow({
  messages = [],
  isLoading = false,
  onSendMessage,
  onCancelQuery,
  selectedLanguage = 'en-IN',
  onPlayAudio,
  activeAudioId,
  isAudioPlaying,
  onQuickQuery,
  onExportPdf,
  sessions = [],
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onClearAllSessions,
  userEmail,
  isHistoryOpen: controlledHistoryOpen,
  onToggleHistory: controlledToggleHistory,
}) {
  const scrollEndRef = useRef(null);
  const [isPortalExpanded, setIsPortalExpanded] = useState(false);
  const [localHistoryOpen, setLocalHistoryOpen] = useState(true);
  const isHistoryOpen = controlledHistoryOpen !== undefined ? controlledHistoryOpen : localHistoryOpen;
  const setIsHistoryOpen = (val) => {
    if (typeof controlledToggleHistory === 'function') {
      controlledToggleHistory(val);
    }
    setLocalHistoryOpen(val);
  };
  const hasMessages = messages.length > 0;
  const isHindi = selectedLanguage.startsWith('hi');

  // Auto-scroll to bottom on new messages or loading state
  useEffect(() => {
    if (scrollEndRef.current && hasMessages) {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, hasMessages]);

  const assistantCount = messages.filter((m) => m.sender === 'assistant').length;
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const currentSessionTitle =
    activeSession?.title ||
    (isHindi ? 'वर्तमान परामर्श सत्र' : 'Current Consultation');

  return (
    <div className="bis-chat-workspace-wrapper">
      {/* 1. Integrated Chat History Sidebar (User-Scoped Multi-Session Vault) */}
      <ChatHistorySidebar
        isOpen={isHistoryOpen}
        onToggleOpen={() => setIsHistoryOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={onSelectSession}
        onNewSession={onNewSession}
        onDeleteSession={onDeleteSession}
        onRenameSession={onRenameSession}
        onClearAllSessions={onClearAllSessions}
        userEmail={userEmail}
        selectedLanguage={selectedLanguage}
      />

      {/* 2. Main Consultation Pane */}
      <main className="bis-chat-window">
        <div className="chat-messages-container">
          <div className="chat-content-constrained">
            {/* Quick Access Top Bar to Reopen Chat History if Closed */}
            {!isHistoryOpen && (
              <div className="chat-history-top-pill-bar">
                <button
                  type="button"
                  className="history-top-pill-btn"
                  onClick={() => setIsHistoryOpen(true)}
                  title={isHindi ? 'सहेजे गए सत्र इतिहास दिखाएं' : 'Open Saved Consultation History'}
                >
                  <History size={15} />
                  <span>{isHindi ? '📂 सहेजा गया चैट इतिहास' : '📂 Saved Consultation History'}</span>
                  <span className="reopen-count-badge">{sessions.length}</span>
                </button>
              </div>
            )}

            {/* National Conformity Portal Hub Accordion */}
            {!hasMessages ? (
              <HeroWorkflow
                onSelectPrompt={onSendMessage}
                selectedLanguage={selectedLanguage}
              />
            ) : (
              <div className="portal-collapse-bar">
                <div className="portal-bar-left">
                  <span className="portal-bar-badge">
                    🏛️ {isHindi ? 'राष्ट्रीय मानक पोर्टल' : 'GOI CONFORMITY PORTAL'}
                  </span>
                  <span className="portal-bar-title">
                    {isHindi
                      ? 'भारतीय मानक ब्यूरो (BIS) अनुपालन केंद्र'
                      : 'Bureau of Indian Standards Portal Hub'}
                  </span>
                  <span className="portal-bar-hint">
                    ({isHindi ? '4 अनुपालन भूमिकाएं व कार्यप्रणाली' : '4 Personas & 6-Stage Workflow'})
                  </span>
                </div>
                <button
                  type="button"
                  className="portal-bar-toggle-btn"
                  onClick={() => setIsPortalExpanded(!isPortalExpanded)}
                  aria-expanded={isPortalExpanded}
                >
                  {isPortalExpanded ? (
                    <>
                      <ChevronUp size={15} />
                      <span>{isHindi ? 'पोर्टल संक्षिप्त करें' : 'Collapse Portal'}</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown size={15} />
                      <span>{isHindi ? 'पोर्टल देखें' : 'View Portal & Personas'}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* If during active chat, user expands the portal overview */}
            {hasMessages && isPortalExpanded && (
              <div style={{ marginBottom: 16 }}>
                <HeroWorkflow
                  onSelectPrompt={onSendMessage}
                  selectedLanguage={selectedLanguage}
                />
              </div>
            )}

            {/* Dedicated AI Chatbot Console Card */}
            <section
              className="bis-chatbot-console-card"
              aria-label="AI Compliance Consultation Desk"
            >
              {/* Console Header Bar with History Toggle & Active Session Info */}
              <div className="chatbot-console-header">
                <div className="console-identity">
                  {/* Toggle History Sidebar */}
                  <button
                    type="button"
                    className={`history-reopen-toggle-btn ${isHistoryOpen ? 'active' : ''}`}
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    title={isHistoryOpen ? (isHindi ? 'इतिहास छुपाएं' : 'Hide history') : (isHindi ? 'चैट इतिहास दिखाएं' : 'Show chat history')}
                    aria-label="Toggle session history"
                  >
                    {isHistoryOpen ? <PanelLeftClose size={15} /> : <History size={15} />}
                    <span className="reopen-btn-label">
                      {isHindi ? 'इतिहास' : 'History'}
                    </span>
                    <span className="reopen-count-badge">{sessions.length}</span>
                  </button>

                  <div className="console-avatar-box">
                    <Bot size={19} />
                    <span className="console-live-aura" title="Live Statutory RAG & Vision Engine" />
                  </div>

                  <div className="console-titles">
                    <div className="console-title-row">
                      <span className="console-main-title">
                        {currentSessionTitle}
                      </span>
                      <span className="console-grounding-pill">
                        {isHindi ? '100% बीआईएस अधिनियम आधारित' : '100% Grounded • BIS Act, 2016'}
                      </span>
                      <span className="console-vision-badge">
                        📷 {isHindi ? 'विज़न निरीक्षण सक्षम' : 'Multimodal Vision Ready'}
                      </span>
                    </div>
                    <span className="console-sub-text">
                      {isHindi
                        ? 'भारतीय मानकों, अनिवार्य QCO, प्रयोगशालाओं और ISI मार्क फोटो सत्यापन पर आधिकारिक परामर्श'
                        : 'Authoritative statutory inquiry for Indian Standards, QCOs, labs, and ISI mark visual inspection'}
                    </span>
                  </div>
                </div>

                <div className="console-actions">
                  {onNewSession && (
                    <button
                      type="button"
                      className="portal-bar-toggle-btn new-chat-quick-btn"
                      onClick={onNewSession}
                      title={isHindi ? 'नया चैट शुरू करें' : 'Start fresh consultation'}
                    >
                      <Plus size={14} />
                      <span>{isHindi ? 'नया चैट' : 'New Chat'}</span>
                    </button>
                  )}

                  {hasMessages && (
                    <span className="console-msg-count-pill">
                      {assistantCount}{' '}
                      {assistantCount === 1
                        ? (isHindi ? 'परामर्श' : 'Advisory')
                        : (isHindi ? 'परामर्श' : 'Advisories')}
                    </span>
                  )}

                  {hasMessages && onExportPdf && (
                    <button
                      type="button"
                      className="portal-bar-toggle-btn"
                      onClick={onExportPdf}
                      title="Export complete consultation dialogue to official BIS PDF report"
                    >
                      <FileDown size={13} />
                      <span>{isHindi ? 'पीडीएफ डाउनलोड' : 'Export PDF'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Console Message Chamber */}
              <div className="chatbot-console-body">
                {!hasMessages ? (
                  <div className="console-empty-welcome">
                    <div className="welcome-chat-icon">
                      <MessageSquareText size={22} />
                    </div>
                    <h3 className="welcome-chat-title">
                      {isHindi
                        ? 'कानूनी व तकनीकी परामर्श के लिए तैयार'
                        : 'Ready for Statutory Consultation & Visual Inspection'}
                    </h3>
                    <p className="welcome-chat-desc">
                      {isHindi
                        ? 'ऊपर दी गई किसी भी भूमिका का प्रश्न चुनें, अपना उत्पाद या मानक लिखें, अथवा ISI मार्क / उत्पाद लेबल की फोटो अपलोड करें।'
                        : 'Select a persona prompt above, enter any product or IS standard code, or attach a photo of an ISI mark, product label, or hallmark stamp below.'}
                    </p>
                    <div className="welcome-chat-features">
                      <span className="welcome-feature-chip">📝 Multi-Turn Dialogue</span>
                      <span className="welcome-feature-chip">📷 Photo Inspection</span>
                      <span className="welcome-feature-chip">🎙️ Voice Sarvam STT/TTS</span>
                      <span className="welcome-feature-chip">💾 Saved per User Account</span>
                    </div>
                  </div>
                ) : (
                  <div className="messages-stream">
                    {messages.map((msg) => {
                      if (msg.sender === 'user') {
                        return <UserMessage key={msg.id} message={msg} />;
                      }
                      return (
                        <AssistantMessage
                          key={msg.id}
                          message={msg}
                          onPlayAudio={onPlayAudio}
                          isAudioPlaying={activeAudioId === msg.id && isAudioPlaying}
                          onQuickQuery={onQuickQuery || onSendMessage}
                        />
                      );
                    })}

                    {isLoading && <LoadingState onCancel={onCancelQuery} />}
                  </div>
                )}

                <div ref={scrollEndRef} style={{ height: 12 }} />
              </div>

              {/* Console Integrated Input Footer */}
              <div className="chatbot-console-footer">
                <SuggestedMessages
                  messages={messages}
                  onSelectSuggestion={onSendMessage}
                  isLoading={isLoading}
                  selectedLanguage={selectedLanguage}
                />
                <ChatInput
                  onSendMessage={onSendMessage}
                  isLoading={isLoading}
                  onCancel={onCancelQuery}
                  selectedLanguage={selectedLanguage}
                />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
