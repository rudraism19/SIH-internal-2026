import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, ArrowRight, Loader2, Square, Image as ImageIcon, X, Upload } from 'lucide-react';
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
  const isHindi = selectedLanguage.startsWith('hi');
  const activePlaceholder =
    placeholder ||
    t.input?.placeholder ||
    (isHindi
      ? 'उत्पाद, भारतीय मानक (IS कोड), ISI मार्क, प्रमाणन या QCO के बारे में पूछें...'
      : 'Ask about a product, IS code, ISI mark, certification, testing, or QCO requirements...');

  const [inputText, setInputText] = useState(initialText || '');
  const [attachedImage, setAttachedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState(null);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
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

  // Process selected image file
  const processImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setTranscribeError(isHindi ? 'कृपया एक वैध छवि (PNG, JPG, WebP) अपलोड करें।' : 'Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setTranscribeError(isHindi ? 'छवि का आकार 10MB से कम होना चाहिए।' : 'Image size must be under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setAttachedImage({
        dataUrl: e.target.result,
        name: file.name,
        size: `${(file.size / 1024).toFixed(0)} KB`,
      });
      setTranscribeError(null);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    };
    reader.onerror = () => {
      setTranscribeError(isHindi ? 'छवि लोड करने में विफल।' : 'Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if ((!trimmed && !attachedImage) || isLoading || isRecording || isTranscribing) return;

    // Send query and attached image to parent handler
    onSendMessage(
      trimmed || (isHindi ? 'कृपया इस संलग्न छवि का बीआईएस मानकों व आईएसआई मार्क के लिए निरीक्षण करें।' : 'Please inspect this attached product or mark image for BIS Indian Standards, ISI mark authenticity, and compliance.'),
      attachedImage?.dataUrl || null
    );

    setInputText('');
    setAttachedImage(null);
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

  // Voice Recording via Web Audio MediaRecorder
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
            setInputText((prev) => (prev ? `${prev} ${result.transcript}` : result.transcript));
            if (textareaRef.current) {
              textareaRef.current.focus();
            }
          }
        } catch {
          setTranscribeError(isHindi ? 'वॉइस ट्रांसक्रिप्शन विफल रहा।' : 'Voice transcription failed. Please try again or type your query.');
        } finally {
          setIsTranscribing(false);
          setIsRecording(false);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
    } catch {
      setTranscribeError(isHindi ? 'माइक्रोफ़ोन अनुमति अस्वीकृत या उपलब्ध नहीं है।' : 'Microphone permission denied or hardware unavailable.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const canSubmit = Boolean(inputText.trim() || attachedImage) && !isLoading && !isRecording && !isTranscribing;

  return (
    <div
      className={`bis-search-box-wrapper ${isDragging ? 'dragging-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/jpg,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* Drag overlay notice */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="chat-drag-drop-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Upload size={28} className="animate-bounce" />
            <span>{isHindi ? 'बीआईएस एआई निरीक्षण के लिए छवि यहाँ छोड़ें' : 'Drop image here for BIS AI Multimodal Inspection'}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
            <button type="button" onClick={() => setTranscribeError(null)} aria-label="Dismiss error">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attached Image Preview Bar */}
      <AnimatePresence>
        {attachedImage && (
          <motion.div
            className="chat-attached-image-bar"
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <div className="attached-image-thumb-box">
              <img src={attachedImage.dataUrl} alt="Preview" className="attached-image-thumb" />
              <div className="attached-image-meta">
                <span className="attached-image-badge">
                  📷 {isHindi ? 'बीआईएस विज़न निरीक्षण तैयार' : 'Visual Inspection Ready'}
                </span>
                <span className="attached-image-name" title={attachedImage.name}>
                  {attachedImage.name} ({attachedImage.size})
                </span>
              </div>
            </div>
            <button
              type="button"
              className="remove-attached-image-btn"
              onClick={() => setAttachedImage(null)}
              title={isHindi ? 'छवि हटाएं' : 'Remove attached image'}
              aria-label="Remove attached image"
            >
              <X size={14} />
            </button>
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
            placeholder={
              isRecording
                ? (t.input?.listening || 'Listening...')
                : attachedImage
                ? (isHindi ? 'इस छवि के बारे में प्रश्न लिखें या सीधे भेजें...' : 'Ask about this image (e.g. verify ISI mark / standard)... or press Send')
                : activePlaceholder
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={isLoading || isRecording || isTranscribing}
            rows={1}
            aria-label="Ask BIS compliance search query"
          />

          {/* Action Buttons: Image Upload & Voice Mic */}
          <div className="search-trailing-actions">
            {/* Image Upload Trigger */}
            <motion.button
              type="button"
              className={`image-upload-btn ${attachedImage ? 'active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isRecording || isTranscribing}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              title={
                attachedImage
                  ? (isHindi ? 'संलग्न छवि बदलें' : 'Replace attached image')
                  : (isHindi ? 'छवि अपलोड करें (ISI मार्क, उत्पाद लेबल, हॉलमार्क)' : 'Upload image (ISI mark, product label, hallmark, certificate)')
              }
              aria-label="Upload image for BIS inspection"
            >
              <ImageIcon size={17} />
              {attachedImage && <span className="image-attached-dot" />}
            </motion.button>

            {/* Voice Mic Trigger */}
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
            <span className="hint-pill">Paste / Drop image 📷</span>
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
              disabled={!canSubmit}
              whileHover={canSubmit ? { scale: 1.03 } : {}}
              whileTap={canSubmit ? { scale: 0.97 } : {}}
              aria-label="Submit query to BIS Saarthi"
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

