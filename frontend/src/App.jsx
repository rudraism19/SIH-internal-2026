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
import { sendMessage, authGetCurrentUser, authSignOut } from './services/api';
import {
  getUserSessions,
  saveUserSessions,
  createNewSession,
  upsertSession,
  deleteUserSession,
  renameUserSession,
  clearAllUserSessions,
  getActiveSessionId,
  setActiveSessionId,
  generateSessionTitle,
} from './services/chatStorage';
import { generateChatConsultationPdf } from './utils/pdfGenerator';
import { WovenLanding } from './components/landing/WovenLanding';
import { AuthPage } from './components/auth/AuthPage';
import { applyTheme } from './components/ui/cinematic-theme-toggler';
import './App.css';

// Map landing action targets to actual workspace tab IDs
function mapTargetTab(tab) {
  if (!tab) return 'assistant';
  if (tab === 'chat' || tab === 'ai' || tab === 'home') return 'assistant';
  if (tab === 'labs') return 'laboratories';
  if (tab === 'spec' || tab === 'verify') return 'standards';
  if (tab === 'sit' || tab === 'tests') return 'testing';
  if (tab === 'deadlines' || tab === 'schedule') return 'calendar';
  if (tab === 'docs' || tab === 'circulars') return 'documents';
  const validTabs = [
    'assistant',
    'standards',
    'qco',
    'testing',
    'laboratories',
    'calculator',
    'calendar',
    'audit',
    'dossier',
    'documents',
    'settings',
  ];
  return validTabs.includes(tab) ? tab : 'assistant';
}

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('view') === 'app') return 'app';
      if (urlParams.get('view') === 'auth' || urlParams.get('view') === 'login') return 'auth';
      localStorage.removeItem('bis_current_view');
    } catch {}
    return 'landing';
  });
  const [pendingTab, setPendingTab] = useState('assistant');
  const [landingLang, setLandingLang] = useState('en');
  const [userEmail, setUserEmail] = useState(() => {
    try {
      const token = localStorage.getItem('bis_user_token');
      const stored = localStorage.getItem('bis_user_email');
      if (stored && (stored.toLowerCase().includes('guest') || stored.toLowerCase() === 'officer@bis.gov.in')) {
        localStorage.removeItem('bis_user_email');
        localStorage.removeItem('bis_user_profile');
        return null;
      }
      return stored || null;
    } catch {
      return null;
    }
  });
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const token = localStorage.getItem('bis_user_token');
      const storedEmail = localStorage.getItem('bis_user_email');
      if (!storedEmail || storedEmail === 'officer@bis.gov.in') return null;
      const stored = localStorage.getItem('bis_user_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  // Multi-session State Scoped to Authenticated User Account
  const [sessions, setSessions] = useState(() => {
    const existing = getUserSessions(userEmail);
    if (existing && existing.length > 0) return existing;
    const initial = createNewSession(userEmail);
    return [initial];
  });

  const [activeSessionId, setActiveSessionIdState] = useState(() => {
    const stored = getActiveSessionId(userEmail);
    const existing = getUserSessions(userEmail);
    if (stored && existing.some((s) => s.id === stored)) return stored;
    return existing[0]?.id || 'bis-session-' + Date.now();
  });

  const [messages, setMessages] = useState(() => {
    const existing = getUserSessions(userEmail);
    const storedActive = getActiveSessionId(userEmail);
    const cur = (storedActive && existing.find((s) => s.id === storedActive)) || existing[0];
    return cur?.messages || [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(() => activeSessionId || ('bis-conv-' + Date.now()));
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceSpeaker, setVoiceSpeaker] = useState('priya');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('assistant');
  const [initialPendingQuery, setInitialPendingQuery] = useState(null);

  // Audio Playback & Cancellation State and Refs
  const [activeAudioId, setActiveAudioId] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioInstanceRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Keep conversationId in sync with activeSessionId
  useEffect(() => {
    if (activeSessionId) {
      setConversationId(activeSessionId);
    }
  }, [activeSessionId]);

  // Synchronize sessions whenever userEmail changes (user switches accounts or logs in)
  useEffect(() => {
    const userSess = getUserSessions(userEmail);
    if (userSess.length > 0) {
      const storedActive = getActiveSessionId(userEmail);
      const active = (storedActive && userSess.find((s) => s.id === storedActive)) || userSess[0];
      setSessions(userSess);
      setActiveSessionIdState(active.id);
      setActiveSessionId(userEmail, active.id);
      setMessages(active.messages || []);
      setConversationId(active.id);
    } else {
      const fresh = createNewSession(userEmail);
      upsertSession(userEmail, fresh);
      setSessions([fresh]);
      setActiveSessionIdState(fresh.id);
      setActiveSessionId(userEmail, fresh.id);
      setMessages([]);
      setConversationId(fresh.id);
    }
  }, [userEmail]);

  const handleSelectSession = useCallback((sessionId) => {
    const userSess = getUserSessions(userEmail);
    const found = userSess.find((s) => s.id === sessionId);
    if (found) {
      setActiveSessionIdState(sessionId);
      setActiveSessionId(userEmail, sessionId);
      setMessages(found.messages || []);
      setConversationId(found.id);
    }
  }, [userEmail]);

  const handleNewSession = useCallback(() => {
    const fresh = createNewSession(userEmail);
    const updated = upsertSession(userEmail, fresh);
    setSessions(updated);
    setActiveSessionIdState(fresh.id);
    setActiveSessionId(userEmail, fresh.id);
    setMessages([]);
    setConversationId(fresh.id);
  }, [userEmail]);

  const handleDeleteSession = useCallback((sessionId) => {
    const updated = deleteUserSession(userEmail, sessionId);
    setSessions(updated);
    if (sessionId === activeSessionId) {
      if (updated.length > 0) {
        setActiveSessionIdState(updated[0].id);
        setActiveSessionId(userEmail, updated[0].id);
        setMessages(updated[0].messages || []);
        setConversationId(updated[0].id);
      } else {
        const fresh = createNewSession(userEmail);
        upsertSession(userEmail, fresh);
        setSessions([fresh]);
        setActiveSessionIdState(fresh.id);
        setActiveSessionId(userEmail, fresh.id);
        setMessages([]);
        setConversationId(fresh.id);
      }
    }
  }, [activeSessionId, userEmail]);

  const handleRenameSession = useCallback((sessionId, newTitle) => {
    const updated = renameUserSession(userEmail, sessionId, newTitle);
    setSessions(updated);
  }, [userEmail]);

  const handleClearAllSessions = useCallback(() => {
    clearAllUserSessions(userEmail);
    const fresh = createNewSession(userEmail);
    upsertSession(userEmail, fresh);
    setSessions([fresh]);
    setActiveSessionIdState(fresh.id);
    setActiveSessionId(userEmail, fresh.id);
    setMessages([]);
    setConversationId(fresh.id);
  }, [userEmail]);

  // Chat History Drawer State & Navigation
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(true);

  const handleOpenChatHistory = useCallback(() => {
    setActiveNav('assistant');
    setIsChatHistoryOpen(true);
  }, []);

  const handleToggleChatHistory = useCallback(() => {
    if (activeNav !== 'assistant') {
      setActiveNav('assistant');
      setIsChatHistoryOpen(true);
    } else {
      setIsChatHistoryOpen((prev) => !prev);
    }
  }, [activeNav]);

  // Reset Consultation Session
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
    setMessages([]);
    if (activeSessionId) {
      const userSess = getUserSessions(userEmail);
      const cur = userSess.find((s) => s.id === activeSessionId);
      if (cur) {
        const resetSess = { ...cur, messages: [] };
        const saved = upsertSession(userEmail, resetSess);
        setSessions(saved);
      }
    }
  }, [activeSessionId, userEmail]);


  // Visual Theme State (Light / Dark)
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('bis_theme') || localStorage.getItem('theme');
      if (saved) return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // fallback
    }
    return 'light';
  });

  // Sync theme attribute and class to HTML root and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('bis_theme', theme);
      localStorage.setItem('theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next === 'dark');
      return next;
    });
  }, []);

  // Language synchronization between Landing/Auth ('en' | 'hi') and Workspace ('en-IN' | 'hi-IN')
  const handleSetLandingLang = useCallback((lang) => {
    setLandingLang(lang);
    setSelectedLanguage(lang === 'hi' ? 'hi-IN' : 'en-IN');
  }, []);

  useEffect(() => {
    if (selectedLanguage.startsWith('hi')) {
      setLandingLang('hi');
    } else {
      setLandingLang('en');
    }
  }, [selectedLanguage]);

  // Verify Supabase authenticated session on application mount & process email verification links
  useEffect(() => {
    // 1. Check if user arrived via Supabase email verification link redirect (URL hash contains access_token)
    try {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token=')) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
          localStorage.setItem('bis_user_token', accessToken);
          if (refreshToken) {
            localStorage.setItem('bis_user_refresh_token', refreshToken);
          }

          // Clean URL hash for clean address bar
          window.history.replaceState(null, '', window.location.pathname);

          authGetCurrentUser(accessToken)
            .then((res) => {
              if (res && res.success && res.user) {
                setUserEmail(res.user.email);
                setUserProfile(res.user);
                localStorage.setItem('bis_user_email', res.user.email);
                localStorage.setItem('bis_user_profile', JSON.stringify(res.user));
                setCurrentView('app');
                setActiveNav(pendingTab || 'assistant');
                alert(
                  selectedLanguage.startsWith('hi')
                    ? 'ईमेल सफलतापूर्वक सत्यापित हो गया! बीआईएस सारथी में आपका स्वागत है।'
                    : 'Email verified successfully! Welcome to BIS Saarthi.'
                );
              }
            })
            .catch((err) => {
              console.error('Failed to verify session after link redirect:', err);
            });
          return;
        }
      }
    } catch (e) {
      console.debug('Error checking email verification redirect:', e);
    }

    // 2. Otherwise verify existing stored session token
    const token = localStorage.getItem('bis_user_token');
    if (token) {
      authGetCurrentUser(token)
        .then((res) => {
          if (res && res.success && res.user) {
            setUserEmail(res.user.email);
            setUserProfile(res.user);
            try {
              localStorage.setItem('bis_user_email', res.user.email);
              localStorage.setItem('bis_user_profile', JSON.stringify(res.user));
            } catch {}
          } else {
            console.debug('Saved auth session expired or invalid:', res?.error);
          }
        })
        .catch((e) => {
          console.debug('Session check error:', e);
        });
    }
  }, [pendingTab, selectedLanguage]);

  // Navigation handlers between Landing, Auth, and Compliance Workspace
  const handleGetStarted = useCallback((targetTab) => {
    if (targetTab) {
      setPendingTab(mapTargetTab(targetTab));
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setCurrentView('auth');
  }, []);

  const handleEnterApp = useCallback((email, targetTab) => {
    const activeEmail = email || userEmail;
    if (activeEmail && activeEmail !== 'officer@bis.gov.in') {
      setUserEmail(activeEmail);
      try {
        localStorage.setItem('bis_user_email', activeEmail);
      } catch {}
      if (targetTab) {
        setActiveNav(mapTargetTab(targetTab));
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      setCurrentView('app');
    } else {
      handleGetStarted(targetTab);
    }
  }, [userEmail, handleGetStarted]);

  const handleAuthSuccess = useCallback((email, profile) => {
    const assignedEmail = email || profile?.email || 'user@standards.nic.in';
    setUserEmail(assignedEmail);
    if (profile) {
      setUserProfile(profile);
      try {
        localStorage.setItem('bis_user_profile', JSON.stringify(profile));
      } catch {}
    }
    try {
      localStorage.setItem('bis_user_email', assignedEmail);
    } catch {}
    if (pendingTab) {
      setActiveNav(pendingTab);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setCurrentView('app');
  }, [pendingTab]);

  const handleBackToLanding = useCallback(() => {
    try {
      localStorage.removeItem('bis_current_view');
    } catch {}
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setCurrentView('landing');
  }, []);

  const handleGoAuth = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setCurrentView('auth');
  }, []);

  const handleSignOut = useCallback(async () => {
    handleResetSession();
    const token = localStorage.getItem('bis_user_token');
    if (token) {
      try {
        await authSignOut(token);
      } catch (e) {
        console.debug('Sign out notice:', e);
      }
    }
    setUserEmail(null);
    setUserProfile(null);
    try {
      localStorage.removeItem('bis_user_token');
      localStorage.removeItem('bis_user_email');
      localStorage.removeItem('bis_user_profile');
      localStorage.removeItem('bis_current_view');
    } catch {}
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setCurrentView('landing');
  }, [handleResetSession]);

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

  // Handle Send Message to Backend (Supports text and multimodal image)
  const handleSendMessage = useCallback(async (queryText, imageData = null) => {
    const trimmed = (queryText || '').trim();
    if ((!trimmed && !imageData) || isLoading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMsgId = `user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: trimmed || (selectedLanguage?.startsWith('hi') ? 'संलग्न छवि का निरीक्षण करें' : 'Inspect attached image'),
      imageData: imageData || null,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => {
      const next = [...prev, userMsg];
      const userSess = getUserSessions(userEmail);
      const cur = userSess.find((s) => s.id === activeSessionId) || createNewSession(userEmail);
      const isFirst = (cur.messages || []).length === 0;
      const title = isFirst ? generateSessionTitle(trimmed, Boolean(imageData)) : cur.title;
      const updated = { ...cur, title, messages: next };
      const saved = upsertSession(userEmail, updated);
      setSessions(saved);
      return next;
    });

    setIsLoading(true);

    try {
      const resp = await sendMessage(
        trimmed || 'Please inspect this attached product or mark image for BIS compliance and standard identification.',
        selectedLanguage,
        voiceEnabled,
        voiceSpeaker,
        conversationId,
        controller.signal,
        imageData || null
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

      setMessages((prev) => {
        const next = [...prev, assistantMsg];
        const userSess = getUserSessions(userEmail);
        const cur = userSess.find((s) => s.id === activeSessionId) || createNewSession(userEmail);
        const updated = { ...cur, messages: next };
        const saved = upsertSession(userEmail, updated);
        setSessions(saved);
        return next;
      });

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
      setMessages((prev) => {
        const next = [...prev, errorMsg];
        const userSess = getUserSessions(userEmail);
        const cur = userSess.find((s) => s.id === activeSessionId) || createNewSession(userEmail);
        const updated = { ...cur, messages: next };
        const saved = upsertSession(userEmail, updated);
        setSessions(saved);
        return next;
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    isLoading,
    userEmail,
    activeSessionId,
    selectedLanguage,
    voiceEnabled,
    voiceSpeaker,
    conversationId,
    handlePlayAudio,
  ]);

  // Handler for inquiries originating from directory tabs
  const handleInquireFromTab = useCallback((query) => {
    setActiveNav('assistant');
    handleSendMessage(query);
  }, [handleSendMessage]);

  // Handler for queries originating directly from the Landing Page Hero search bar
  const handleStartQueryFromLanding = useCallback((query) => {
    if (!query) return;
    setInitialPendingQuery(query);
    if (userEmail && userEmail !== 'officer@bis.gov.in') {
      handleEnterApp(userEmail, 'assistant');
    } else {
      handleGetStarted('assistant');
    }
  }, [handleEnterApp, handleGetStarted, userEmail]);

  // When entering the workspace with a pre-filled landing query, trigger query streaming
  useEffect(() => {
    if (currentView === 'app' && initialPendingQuery) {
      const q = initialPendingQuery;
      setInitialPendingQuery(null);
      const timer = setTimeout(() => {
        handleSendMessage(q);
      }, 380);
      return () => clearTimeout(timer);
    }
  }, [currentView, initialPendingQuery, handleSendMessage]);

  // Export Full Chat Consultation Session to Official PDF Report
  const handleExportChatPdf = useCallback(() => {
    if (messages.length === 0) return;
    generateChatConsultationPdf({
      messages,
      conversationId,
      selectedLanguage,
    });
  }, [messages, conversationId, selectedLanguage]);

  // When in Landing or Authentication view, render BIS Saarthi heritage experience
  if (currentView === 'landing' || currentView === 'auth') {
    return (
      <div className={`relative min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
        {/* ─── PERSISTENT ROOT BACKGROUND VIDEO CANVAS ─── */}
        <div className="heritage-bg-media" aria-hidden="true">
          <video
            className="heritage-bg-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/4f690bd1-881a-4192-82f2-d714d34c8fb9.png"
          >
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260901_122529_931c22c8-8d2d-47c0-ad51-b97f56a91e42.mp4"
              type="video/mp4"
            />
          </video>
          <div className="heritage-bg-overlay" />
        </div>

        {/* Dynamic View with seamless crossfade transition */}
        <div key={currentView} className="view-fade-enter relative z-10 w-full min-h-screen">
          <ErrorBoundary>
            {currentView === 'landing' ? (
              <WovenLanding
                onGetStarted={handleGetStarted}
                onStartQuery={handleStartQueryFromLanding}
                language={landingLang}
                setLanguage={handleSetLandingLang}
                isDark={theme === 'dark'}
                onToggleTheme={handleToggleTheme}
              />
            ) : (
              <AuthPage
                onSuccess={handleAuthSuccess}
                onBackToLanding={handleBackToLanding}
                isDark={theme === 'dark'}
                onToggleTheme={handleToggleTheme}
                language={landingLang}
                setLanguage={handleSetLandingLang}
              />
            )}
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  return (
    <div className="bis-app-root" data-theme={theme}>
      {/* Navigation Sidebar */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedLanguage={selectedLanguage}
        sessionCount={sessions.length}
        onOpenChatHistory={handleOpenChatHistory}
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
          userEmail={userEmail}
          userProfile={userProfile}
          onGoAuth={handleGoAuth}
          onGoLanding={handleBackToLanding}
          onSignOut={handleSignOut}
          onOpenChatHistory={handleToggleChatHistory}
          sessionCount={sessions.length}
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
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  onSelectSession={handleSelectSession}
                  onNewSession={handleNewSession}
                  onDeleteSession={handleDeleteSession}
                  onRenameSession={handleRenameSession}
                  onClearAllSessions={handleClearAllSessions}
                  userEmail={userEmail}
                  isHistoryOpen={isChatHistoryOpen}
                  onToggleHistory={setIsChatHistoryOpen}
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
