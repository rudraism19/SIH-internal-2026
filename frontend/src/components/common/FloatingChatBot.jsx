import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, X } from 'lucide-react';
import MiniChatWindow from './MiniChatWindow';

export default function FloatingChatBot({
  activeNav,
  onOpenAssistant,
  messages = [],
  isLoading = false,
  onSendMessage,
  onCancel,
  selectedLanguage = 'en-IN',
  onPlayAudio,
  activeAudioId,
  isAudioPlaying,
}) {
  const [isMiniOpen, setIsMiniOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isHindi = selectedLanguage === 'hi-IN';
  const isCurrentlyInAssistant = activeNav === 'assistant';
  const assistantMsgCount = messages.filter((m) => m.sender === 'assistant').length;

  const handleFabClick = () => {
    setIsMiniOpen((prev) => !prev);
  };

  const handleMaximize = () => {
    setIsMiniOpen(false);
    if (onOpenAssistant) {
      onOpenAssistant('assistant');
    }
  };

  const handleClose = () => {
    setIsMiniOpen(false);
  };

  return (
    <>
      {/* Mini Chatbot Popover Window */}
      <MiniChatWindow
        isOpen={isMiniOpen}
        onClose={handleClose}
        onMaximize={handleMaximize}
        messages={messages}
        isLoading={isLoading}
        onSendMessage={onSendMessage}
        onCancel={onCancel}
        selectedLanguage={selectedLanguage}
        onPlayAudio={onPlayAudio}
        activeAudioId={activeAudioId}
        isAudioPlaying={isAudioPlaying}
      />

      {/* Floating Action Button (Bottom Right) */}
      <div className="floating-chatbot-root">
        <AnimatePresence>
          {!isMiniOpen && (isHovered || !isCurrentlyInAssistant) && (
            <motion.div
              className="floating-chatbot-tooltip"
              initial={{ opacity: 0, x: 10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.95 }}
              transition={{ duration: 0.18 }}
            >
              <Sparkles size={13} className="tooltip-sparkle-icon" />
              <span>
                {isHindi
                  ? 'बीआईएस एआई सहायक से पूछें'
                  : 'Ask BIS AI Assistant'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          className="floating-chatbot-fab"
          onClick={handleFabClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          aria-label={isMiniOpen ? 'Close mini chatbot' : 'Open BIS AI Compliance Assistant'}
          title={
            isMiniOpen
              ? 'Close mini window'
              : isHindi
              ? 'बीआईएस एआई अनुपालन सहायक'
              : 'BIS AI Compliance Assistant'
          }
        >
          {/* Live Aura & Green Status Dot */}
          {!isMiniOpen && (
            <span className="fab-status-dot">
              <span className="fab-pulse-ring" />
            </span>
          )}

          {/* Dynamic Bot / Close Icon */}
          {isMiniOpen ? (
            <X size={22} className="fab-bot-icon" />
          ) : (
            <Bot size={24} className="fab-bot-icon" />
          )}

          {/* Active Advisory Count Badge when on other tabs and window is closed */}
          {!isMiniOpen && !isCurrentlyInAssistant && assistantMsgCount > 0 && (
            <span
              className="fab-msg-badge"
              title={`${assistantMsgCount} Active Advisories`}
            >
              {assistantMsgCount}
            </span>
          )}
        </motion.button>
      </div>
    </>
  );
}
