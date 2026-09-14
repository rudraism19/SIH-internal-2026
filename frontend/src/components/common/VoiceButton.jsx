import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

export default function VoiceButton({
  voiceEnabled = false,
  onToggleVoice,
  voiceSpeaker = 'priya',
  onChangeSpeaker,
}) {
  return (
    <div className="voice-control-group">
      <motion.button
        type="button"
        className={`voice-header-toggle ${voiceEnabled ? 'active' : ''}`}
        onClick={onToggleVoice}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-pressed={voiceEnabled}
        title={voiceEnabled ? 'Voice output active (Click to disable)' : 'Enable spoken voice response'}
      >
        {voiceEnabled ? (
          <>
            <Volume2 size={15} className="voice-icon active" />
            <span className="voice-btn-label">Voice ON</span>
          </>
        ) : (
          <>
            <VolumeX size={15} className="voice-icon" />
            <span className="voice-btn-label">Voice</span>
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {voiceEnabled && onChangeSpeaker && (
          <motion.select
            key="voice-speaker-select"
            initial={{ opacity: 0, scale: 0.9, width: 0 }}
            animate={{ opacity: 1, scale: 1, width: 'auto' }}
            exit={{ opacity: 0, scale: 0.9, width: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            value={voiceSpeaker}
            onChange={(e) => onChangeSpeaker(e.target.value)}
            className="voice-speaker-select"
            aria-label="Voice Speaker Voice Profile"
          >
            <option value="priya">Priya (Female)</option>
            <option value="aditya">Aditya (Male)</option>
            <option value="ritu">Ritu (Female)</option>
            <option value="rahul">Rahul (Male)</option>
          </motion.select>
        )}
      </AnimatePresence>
    </div>
  );
}
