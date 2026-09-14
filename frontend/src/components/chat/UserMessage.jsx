import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, X } from 'lucide-react';

export default function UserMessage({ message }) {
  const [showLightbox, setShowLightbox] = useState(false);

  if (!message) return null;

  return (
    <>
      <motion.div
        className="user-message-row"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="user-message-bubble">
          {/* Uploaded Verification Image Attachment */}
          {message.imageData && (
            <div className="user-message-image-wrapper">
              <div
                className="user-message-image-thumb-container"
                onClick={() => setShowLightbox(true)}
                title="Click to zoom image"
              >
                <img
                  src={message.imageData}
                  alt="Uploaded verification document"
                  className="user-message-image-thumb"
                />
                <div className="user-image-zoom-overlay">
                  <Eye size={16} />
                  <span>Zoom</span>
                </div>
              </div>
              <span className="user-image-meta-tag">📷 Visual Inspection Asset</span>
            </div>
          )}

          {message.text && (
            <div className="user-message-text">{message.text}</div>
          )}
        </div>
      </motion.div>

      {/* Lightbox Modal for Full-Size Image Inspection */}
      <AnimatePresence>
        {showLightbox && message.imageData && (
          <motion.div
            className="image-lightbox-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLightbox(false)}
          >
            <div className="image-lightbox-modal" onClick={(e) => e.stopPropagation()}>
              <div className="image-lightbox-header">
                <span className="lightbox-title">Visual Verification Asset</span>
                <button
                  type="button"
                  className="lightbox-close-btn"
                  onClick={() => setShowLightbox(false)}
                  aria-label="Close image preview"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="image-lightbox-body">
                <img
                  src={message.imageData}
                  alt="Full size verification asset"
                  className="image-lightbox-img"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

