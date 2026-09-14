import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Maximize2,
  X,
  Send,
  Sparkles,
  Square,
  ArrowRight,
  ShieldCheck,
  Tag,
  Coins,
} from 'lucide-react';
import UserMessage from '../chat/UserMessage';
import AssistantMessage from '../chat/AssistantMessage';

const QUICK_STARTER_PROMPTS = [
  {
    icon: Tag,
    label: 'IS 17803 Water Bottles',
    query: 'What BIS standard applies to stainless steel water bottles?',
  },
  {
    icon: ShieldCheck,
    label: 'Verify Gold HUID',
    query: 'How do I verify a 6-digit HUID on gold jewellery using BIS Care?',
  },
  {
    icon: Coins,
    label: '50% MSME Concession',
    query: 'What concessions do startups and MSMEs get on BIS marking fees?',
  },
];

export default function MiniChatWindow({
  isOpen = false,
  onClose,
  onMaximize,
  messages = [],
  isLoading = false,
  onSendMessage,
  onCancel,
  selectedLanguage = 'en-IN',
  onPlayAudio,
  activeAudioId,
  isAudioPlaying,
}) {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const isHindi = selectedLanguage === 'hi-IN';

  // Auto-scroll to bottom on messages or loading
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickPrompt = (query) => {
    onSendMessage(query);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="mini-chat-popover"
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 24 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        role="dialog"
        aria-label="BIS AI Assistant Mini Window"
      >
        {/* Header Bar */}
        <div className="mini-chat-header">
          <div className="mini-header-identity">
            <div className="mini-header-avatar">
              <Bot size={18} />
              <span className="mini-live-dot" title="Live Statutory Engine" />
            </div>
            <div className="mini-header-titles">
              <div className="mini-title-row">
                <span className="mini-title-text">
                  {isHindi ? 'बीआईएस एआई सहायक' : 'BIS AI Assistant'}
                </span>
                <span className="mini-gov-pill">GOV.IN</span>
              </div>
              <span className="mini-subtitle-text">
                {isHindi ? '100% बीआईएस अधिनियम आधारित' : 'Statutory Compliance Desk'}
              </span>
            </div>
          </div>

          <div className="mini-header-actions">
            <button
              type="button"
              className="mini-action-btn"
              onClick={onMaximize}
              title={isHindi ? 'पूर्ण स्क्रीन पर खोलें' : 'Expand to Full Page'}
              aria-label="Expand to full assistant tab"
            >
              <Maximize2 size={14} />
            </button>
            <button
              type="button"
              className="mini-action-btn"
              onClick={onClose}
              title={isHindi ? 'बंद करें' : 'Minimize Window'}
              aria-label="Minimize mini chatbot window"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Message Feed / Body */}
        <div className="mini-chat-body" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="mini-empty-state">
              <div className="mini-empty-icon">
                <Sparkles size={24} />
              </div>
              <h4 className="mini-empty-title">
                {isHindi
                  ? 'नमस्ते! मैं आपकी क्या सहायता कर सकता हूँ?'
                  : 'How can I help you today?'}
              </h4>
              <p className="mini-empty-desc">
                {isHindi
                  ? 'भारतीय मानकों, अनिवार्य QCO, प्रयोगशालाओं या स्टार्टअप छूट के बारे में तुरंत पूछें।'
                  : 'Ask about any Indian Standard, mandatory QCOs, testing procedures, or MSME fee relief.'}
              </p>

              <div className="mini-quick-prompts">
                {QUICK_STARTER_PROMPTS.map((p, idx) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className="mini-quick-prompt-chip"
                      onClick={() => handleQuickPrompt(p.query)}
                    >
                      <Icon size={12} className="mini-chip-icon" />
                      <span>{p.label}</span>
                      <ArrowRight size={11} className="mini-chip-arrow" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mini-stream-wrapper">
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
                    onQuickQuery={onSendMessage}
                  />
                );
              })}

              {isLoading && (
                <div className="mini-loading-indicator">
                  <div className="mini-loading-spinner" />
                  <span className="mini-loading-text">
                    {isHindi ? 'परामर्श तैयार हो रहा है...' : 'Synthesizing compliance advisory...'}
                  </span>
                  {onCancel && (
                    <button
                      type="button"
                      className="mini-cancel-btn"
                      onClick={onCancel}
                      title="Stop generation"
                    >
                      <Square size={11} />
                      <span>Stop</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="mini-chat-footer">
          <form className="mini-input-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="mini-input-field"
              placeholder={
                isHindi
                  ? 'मानक, उत्पाद या प्रश्न पूछें...'
                  : 'Ask about IS code, product, testing...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              aria-label="Ask BIS compliance query in mini window"
            />

            {isLoading ? (
              <button
                type="button"
                className="mini-send-btn stop"
                onClick={onCancel}
                title="Stop generation"
              >
                <Square size={14} />
              </button>
            ) : (
              <button
                type="submit"
                className="mini-send-btn"
                disabled={!inputText.trim()}
                title="Send query"
              >
                <Send size={14} />
              </button>
            )}
          </form>
          <div className="mini-footer-note">
            <span>🏛️ 100% Grounded in BIS Act, 2016</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
