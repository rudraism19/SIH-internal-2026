import React from 'react';
import { motion } from 'framer-motion';
import BISAnswerCard from '../bis/BISAnswerCard';

export default function AssistantMessage({
  message,
  onPlayAudio,
  isAudioPlaying,
  onQuickQuery,
}) {
  if (!message) return null;

  return (
    <motion.div
      className="assistant-message-row"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="assistant-avatar-col">
        <div className="bis-avatar-circle" title="Bureau of Indian Standards Assistant">
          <span>🏛</span>
        </div>
      </div>

      <div className="assistant-content-col">
        <BISAnswerCard
          msg={message}
          onPlayAudio={onPlayAudio}
          isAudioPlaying={isAudioPlaying}
          onQuickQuery={onQuickQuery}
        />
      </div>
    </motion.div>
  );
}
