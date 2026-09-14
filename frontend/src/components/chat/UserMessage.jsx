import React from 'react';
import { motion } from 'framer-motion';

export default function UserMessage({ message }) {
  if (!message) return null;

  return (
    <motion.div
      className="user-message-row"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="user-message-bubble">
        <div className="user-message-text">{message.text}</div>
      </div>
    </motion.div>
  );
}
