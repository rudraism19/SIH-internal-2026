import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ChatWindow from './components/chat/ChatWindow';
import StandardsTab from './components/tabs/StandardsTab';
import QcoTab from './components/tabs/QcoTab';
import TestingTab from './components/tabs/TestingTab';
import LaboratoriesTab from './components/tabs/LaboratoriesTab';
import DocumentsTab from './components/tabs/DocumentsTab';
import CalculatorTab from './components/tabs/CalculatorTab';
import CalendarTab from './components/tabs/CalendarTab';
import AuditTab from './components/tabs/AuditTab';
import DossierTab from './components/tabs/DossierTab';
import SettingsTab from './components/tabs/SettingsTab';
import ErrorBoundary from './components/common/ErrorBoundary';
import FloatingChatBot from './components/common/FloatingChatBot';
import { sendMessage } from './services/api';
import { generateChatConsultationPdf } from './utils/pdfGenerator';
import './App.css';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(() => 'bis-conv-' + Date.now());
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceSpeaker, setVoiceSpeaker] = useState('priya');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('assistant');

  // Visual Theme State (Light / Dark)
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('bis_theme');
      if (saved) return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // fallback
    }
    return 'light';
  });

  // Sync theme attribute to HTML root and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('bis_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Audio Playback State
  const [activeAudioId, setActiveAudioId] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioInstanceRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Play/Pause Base64 Audio
  const handlePlayAudio = useCallback((msgId, audioBase64) => {
    if (!audioBase64) return;

    if (activeAudioId === msgId && audioInstanceRef.current) {
      if (isAudioPlaying) {
        audioInstanceRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        audioInstanceRef.current.play().then(() => {
          setIsAudioPlaying(true);
        }).catch(() => setIsAudioPlaying(false));
      }
      return;
    }

    // Stop current audio if playing
    if (audioInstanceRef.current) {
      audioInstanceRef.current.pause();
      audioInstanceRef.current = null;
    }

    try {
      const audioUrl = `data:audio/wav;base64,${audioBase64}`;
      const audio = new Audio(audioUrl);
      audioInstanceRef.current = audio;
      setActiveAudioId(msgId);
      setIsAudioPlaying(true);

      audio.onended = () => {
        setIsAudioPlaying(false);
        setActiveAudioId(null);
      };

      audio.onerror = () => {
        setIsAudioPlaying(false);
        setActiveAudioId(null);
      };

      audio.play().catch(() => {
        setIsAudioPlaying(false);
      });
    } catch {
      setIsAudioPlaying(false);
      setActiveAudioId(null);
    }
  }, [activeAudioId, isAudioPlaying]);

  // Handle Cancel In-Flight Query
  const handleCancelQuery = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  // Handle Send Message to Backend
  const handleSendMessage = useCallback(async (queryText) => {
    if (!queryText || !queryText.trim() || isLoading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMsgId = `user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: queryText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const resp = await sendMessage(
        queryText.trim(),
        selectedLanguage,
        voiceEnabled,
        voiceSpeaker,
        conversationId,
        controller.signal
      );

      if (resp.conversation_id) {
        setConversationId(resp.conversation_id);
      }

      const assistantMsgId = `asst-${Date.now()}`;
      const assistantMsg = {
        id: assistantMsgId,
        sender: 'assistant',
        text: resp.answer || 'No response generated.',
        verified: resp.verified === true,
        grounded: resp.grounded === true,
        response_mode: resp.response_mode || 'GENERAL_CONVERSATION',
        product: resp.product || null,
        standards: resp.standards || [],
        sections: resp.sections || [],
        next_question: resp.next_question || null,
        actions: resp.actions || [],
        identified_standards: resp.identified_standards || [],
        citations: resp.citations || [],
        compliance_info: resp.compliance_info || null,
        testing_info: resp.testing_info || null,
        customs_info: resp.customs_info || null,
        renewal_info: resp.renewal_info || null,
        batch_info: resp.batch_info || null,
        hallmarking_info: resp.hallmarking_info || null,
        next_steps: resp.next_steps || [],
        audio_base64: resp.audio_base64 || null,
        audio_format: resp.audio_format || 'wav',
        detected_language: resp.detected_language || resp.language || selectedLanguage,
        timings: resp.timings || {},
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Autoplay spoken audio if voice output is enabled
      if (voiceEnabled && resp.audio_base64) {
        handlePlayAudio(assistantMsgId, resp.audio_base64);
      }
    } catch (err) {
      if (err.message === 'Query generation cancelled.') {
        return;
      }
      const errorMsgId = `err-${Date.now()}`;
      const errorMsg = {
        id: errorMsgId,
        sender: 'assistant',
        text: `Unable to complete compliance query: ${err.message || 'Connection error'}. Please verify backend service availability.`,
        grounded: false,
        verified: false,
        identified_standards: [],
        citations: [],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [isLoading, selectedLanguage, voiceEnabled, voiceSpeaker, conversationId, handlePlayAudio]);

  // Handler for inquiries originating from directory tabs
  const handleInquireFromTab = useCallback((query) => {
    setActiveNav('assistant');
    handleSendMessage(query);
  }, [handleSendMessage]);

  // Reset Session
  const handleResetSession = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    if (audioInstanceRef.current) {
      audioInstanceRef.current.pause();
      audioInstanceRef.current = null;
    }
    setActiveAudioId(null);
    setIsAudioPlaying(false);
    setConversationId('bis-conv-' + Date.now());
    setMessages([]);
  }, []);

  // Export Full Chat Consultation Session to Official PDF Report
  const handleExportChatPdf = useCallback(() => {
    if (messages.length === 0) return;
    generateChatConsultationPdf({
      messages,
      conversationId,
      selectedLanguage,
    });
  }, [messages, conversationId, selectedLanguage]);

  return (
    <div className="bis-app-root" data-theme={theme}>
      {/* Navigation Sidebar */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedLanguage={selectedLanguage}
      />

      {/* Main Content Area */}
      <div className="bis-main-workspace">
        <Header
          onOpenSidebar={() => setIsSidebarOpen(true)}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={setSelectedLanguage}
          voiceEnabled={voiceEnabled}
          onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
          voiceSpeaker={voiceSpeaker}
          onChangeSpeaker={setVoiceSpeaker}
          onResetSession={handleResetSession}
          onExportSession={handleExportChatPdf}
          hasMessages={messages.length > 0}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeNav}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="tab-motion-container"
          >
            <ErrorBoundary key={activeNav}>
              {activeNav === 'assistant' && (
                <ChatWindow
                  messages={messages}
                  isLoading={isLoading}
                  onSendMessage={handleSendMessage}
                  onCancelQuery={handleCancelQuery}
                  selectedLanguage={selectedLanguage}
                  onPlayAudio={handlePlayAudio}
                  activeAudioId={activeAudioId}
                  isAudioPlaying={isAudioPlaying}
                  onQuickQuery={handleSendMessage}
                  onExportPdf={handleExportChatPdf}
                />
              )}

              {activeNav === 'standards' && (
                <StandardsTab onAskAssistant={handleInquireFromTab} />
              )}

              {activeNav === 'qco' && (
                <QcoTab onAskAssistant={handleInquireFromTab} />
              )}

              {activeNav === 'testing' && (
                <TestingTab onAskAssistant={handleInquireFromTab} />
              )}

              {activeNav === 'laboratories' && (
                <LaboratoriesTab onAskAssistant={handleInquireFromTab} />
              )}

              {activeNav === 'calculator' && (
                <CalculatorTab onAskAssistant={handleInquireFromTab} />
              )}

              {activeNav === 'calendar' && (
                <CalendarTab onAskAssistant={handleInquireFromTab} />
              )}

              {activeNav === 'audit' && (
                <AuditTab onAskAssistant={handleInquireFromTab} />
              )}

              {activeNav === 'dossier' && (
                <DossierTab onAskAssistant={handleInquireFromTab} />
              )}

              {activeNav === 'documents' && (
                <DocumentsTab onAskAssistant={handleInquireFromTab} />
              )}

              {activeNav === 'settings' && (
                <SettingsTab
                  selectedLanguage={selectedLanguage}
                  onSelectLanguage={setSelectedLanguage}
                  voiceEnabled={voiceEnabled}
                  onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
                  voiceSpeaker={voiceSpeaker}
                  onChangeSpeaker={setVoiceSpeaker}
                  onResetSession={handleResetSession}
                  theme={theme}
                  onToggleTheme={handleToggleTheme}
                />
              )}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>

        {/* Floating Chatbot Launcher in Right Bottom */}
        <FloatingChatBot
          activeNav={activeNav}
          onOpenAssistant={setActiveNav}
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onCancel={handleCancelQuery}
          selectedLanguage={selectedLanguage}
          onPlayAudio={handlePlayAudio}
          activeAudioId={activeAudioId}
          isAudioPlaying={isAudioPlaying}
        />
      </div>
    </div>
  );
}
