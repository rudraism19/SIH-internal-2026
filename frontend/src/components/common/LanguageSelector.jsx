import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { SUPPORTED_LANGUAGES, findLanguage } from '../../constants/languages';

export default function LanguageSelector({ selectedLanguage = 'en-IN', onSelectLanguage }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = findLanguage(selectedLanguage);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="language-selector-wrapper" ref={dropdownRef}>
      <motion.button
        type="button"
        className="language-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select interface and query language"
      >
        <Globe size={15} className="lang-globe-icon" />
        <span className="lang-label">{currentLang.native}</span>
        <ChevronDown size={14} className={`lang-chevron ${isOpen ? 'rotate' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            key="language-dropdown-menu"
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="language-dropdown-menu"
            role="listbox"
          >
            <li className="dropdown-header">Indic Language Support</li>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLang.code;
              return (
                <motion.li
                  key={lang.code}
                  role="option"
                  aria-selected={isSelected}
                  className={`language-option ${isSelected ? 'selected' : ''}`}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onSelectLanguage(lang.code);
                    setIsOpen(false);
                  }}
                >
                  <div className="lang-option-text">
                    <span className="lang-native">{lang.native}</span>
                    <span className="lang-sub">{lang.label}</span>
                  </div>
                  {isSelected && <Check size={14} className="lang-check" />}
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
