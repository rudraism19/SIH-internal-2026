import React, { useRef, useEffect, useState } from 'react';
import { FileDown, Bot, ChevronDown, ChevronUp, MessageSquareText } from 'lucide-react';
import HeroWorkflow from './HeroWorkflow';
import UserMessage from './UserMessage';
import AssistantMessage from './AssistantMessage';
import LoadingState from './LoadingState';
import ChatInput from './ChatInput';
import SuggestedMessages from './SuggestedMessages';

export default function ChatWindow({
  messages = [],
  isLoading = false,
  onSendMessage,
  onCancelQuery,
  selectedLanguage,
  onPlayAudio,
  activeAudioId,
  isAudioPlaying,
  onQuickQuery,
  onExportPdf,
}) {
  const scrollEndRef = useRef(null);
  const [isPortalExpanded, setIsPortalExpanded] = useState(false);
  const hasMessages = messages.length > 0;
  const isHindi = selectedLanguage === 'hi-IN';

  // Auto-scroll to bottom on new messages or loading state
  useEffect(() => {
    if (scrollEndRef.current && hasMessages) {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, hasMessages]);

  const assistantCount = messages.filter((m) => m.sender === 'assistant').length;

  return (
    <main className="bis-chat-window">
      <div className="chat-messages-container">
        <div className="chat-content-constrained">
          {/* 1. MAIN SCREEN: NATIONAL CONFORMITY PORTAL HUB */}
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

          {/* 2. DEDICATED AI CHATBOT CONSOLE SECTION */}
          <section
            className="bis-chatbot-console-card"
            aria-label="AI Compliance Consultation Desk"
          >
            {/* Console Header Bar */}
            <div className="chatbot-console-header">
              <div className="console-identity">
                <div className="console-avatar-box">
                  <Bot size={19} />
                  <span className="console-live-aura" title="Live Statutory RAG Engine" />
                </div>
                <div className="console-titles">
                  <div className="console-title-row">
                    <span className="console-main-title">
                      {isHindi
                        ? 'एआई अनुपालन परामर्श डेस्क'
                        : 'AI Compliance Consultation Desk'}
                    </span>
                    <span className="console-grounding-pill">
                      {isHindi ? '100% बीआईएस अधिनियम आधारित' : '100% Grounded • BIS Act, 2016'}
                    </span>
                  </div>
                  <span className="console-sub-text">
                    {isHindi
                      ? 'भारतीय मानकों, अनिवार्य QCO, प्रयोगशालाओं और लाइसेंस प्रक्रियाओं पर आधिकारिक परामर्श'
                      : 'Authoritative statutory inquiry for Indian Standards, QCOs, laboratories & licensing'}
                  </span>
                </div>
              </div>

              <div className="console-actions">
                {hasMessages && (
                  <span className="console-msg-count-pill">
                    {assistantCount}{' '}
                    {assistantCount === 1 ? 'Advisory' : 'Advisories'}
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
                      : 'Ready for Statutory Consultation'}
                  </h3>
                  <p className="welcome-chat-desc">
                    {isHindi
                      ? 'ऊपर दी गई किसी भी भूमिका का प्रश्न चुनें, या नीचे अपना उत्पाद, मानक कोड या अनुपालन प्रश्न लिखें।'
                      : 'Select any tailored persona prompt above to begin, or type any product name, Indian Standard (IS Code), or licensing question below.'}
                  </p>
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
  );
}
