import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, ArrowRight, Loader2, Square } from 'lucide-react';
import { transcribeAudio } from '../../services/api';
import { getTranslations } from '../../constants/translations';

export default function ChatInput({
  onSendMessage,
  isLoading,
  onCancel,
  selectedLanguage = 'en-IN',
  placeholder,
  initialText = '',
}) {
  const t = getTranslations(selectedLanguage);
  const activePlaceholder = placeholder || t.input?.placeholder || 'Ask about a product, IS code, certification, testing, or QCO requirements...';

  const [inputText, setInputText] = useState(initialText || '');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState(null);

  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 44), 160)}px`;
    }
  }, [inputText]);

  // Handle Recording Timer
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading || isRecording || isTranscribing) return;
    onSendMessage(inputText.trim());
    setInputText('');
    setTranscribeError(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Start Voice Recording via Web Audio MediaRecorder
  const startRecording = async () => {
    setTranscribeError(null);
    setRecordingSeconds(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg')
        ? 'audio/ogg'
        : 'audio/wav';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size < 1000) {
          setIsRecording(false);
          return;
        }

        setIsTranscribing(true);
        try {
          const result = await transcribeAudio(audioBlob, selectedLanguage);
          if (result && result.transcript) {
            setInputText(result.transcript);
            if (textareaRef.current) {
              textareaRef.current.focus();
            }
          }
        } catch {
          setTranscribeError('Voice transcription failed. Please try again or type your query.');
        } finally {
          setIsTranscribing(false);
          setIsRecording(false);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
    } catch {
      setTranscribeError('Microphone permission denied or hardware unavailable.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="bis-search-box-wrapper">
      <AnimatePresence>
        {transcribeError && (
          <motion.div
            className="transcribe-error-banner"
            role="alert"
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span>{transcribeError}</span>
            <button type="button" onClick={() => setTranscribeError(null)}>×</button>
          </motion.div>
        )}
      </AnimatePresence>

      <form className="bis-search-container" onSubmit={handleSubmit}>
        {/* Top Search Input Row */}
        <div className="search-input-row">
          <Search size={18} className="search-leading-icon" />

          <textarea
            id="bis-chat-textarea"
            ref={textareaRef}
            className="search-textarea"
            placeholder={isRecording ? (t.input?.listening || 'Listening...') : activePlaceholder}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isRecording || isTranscribing}
            rows={1}
            aria-label="Ask BIS compliance search query"
          />

          {/* Voice Mic Trigger */}
          <div className="search-trailing-actions">
            {isRecording ? (
              <motion.button
                type="button"
                className="mic-action-btn recording"
                onClick={stopRecording}
                title="Stop recording"
                aria-label="Stop recording audio"
                whileTap={{ scale: 0.95 }}
                animate={{ boxShadow: ['0 0 0 0 rgba(180, 35, 24, 0.4)', '0 0 0 8px rgba(180, 35, 24, 0)', '0 0 0 0 rgba(180, 35, 24, 0.4)'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              >
                <span className="rec-live-dot" />
                <span className="rec-timer-text">{(t.input?.listening || 'Listening...')} {formatTimer(recordingSeconds)}</span>
                <Square size={13} className="stop-rec-icon" />
              </motion.button>
            ) : isTranscribing ? (
              <div className="transcribing-spinner" title="Transcribing voice with Sarvam AI...">
                <Loader2 size={16} className="animate-spin text-navy" />
                <span className="transcribing-label">{t.input?.transcribing || 'Transcribing...'}</span>
              </div>
            ) : (
              <motion.button
                type="button"
                className="mic-action-btn idle"
                onClick={startRecording}
                disabled={isLoading}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                title={t.input?.micTitle || 'Speak your question (Sarvam Saaras STT)'}
                aria-label="Record voice question"
              >
                <Mic size={17} />
              </motion.button>
            )}
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="search-actions-footer">
          <div className="search-hints">
            <span className="hint-pill">Press Enter ↵ to search</span>
            <span className="hint-pill">Shift + Enter for new line</span>
          </div>

          {isLoading ? (
            <motion.button
              type="button"
              className="ask-bis-btn cancel-btn"
              onClick={onCancel}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              aria-label="Stop query generation"
              style={{
                backgroundColor: 'var(--bis-red)',
                borderColor: 'var(--bis-red)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Stop query generation"
            >
              <Square size={13} fill="currentColor" />
              <span>Stop</span>
            </motion.button>
          ) : (
            <motion.button
              type="submit"
              className="ask-bis-btn"
              disabled={!inputText.trim() || isRecording || isTranscribing}
              whileHover={inputText.trim() ? { scale: 1.03 } : {}}
              whileTap={inputText.trim() ? { scale: 0.97 } : {}}
              aria-label="Submit query to BIS Assistant"
            >
              <span>{t.input?.send || 'Send'}</span>
              <ArrowRight size={15} />
            </motion.button>
          )}
        </div>
      </form>
    </div>
  );
}
