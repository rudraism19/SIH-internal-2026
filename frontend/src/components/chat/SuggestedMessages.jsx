import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Lightbulb,
  Search,
  FlaskConical,
  Award,
  ShieldCheck,
  Building2,
  Tag,
  FileText,
  Calculator,
  RotateCw,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  GraduationCap,
  Briefcase,
} from 'lucide-react';

export default function SuggestedMessages({
  messages = [],
  onSelectSuggestion,
  isLoading = false,
  selectedLanguage = 'en-IN',
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determine if there is active conversation context
  const hasMessages = messages.length > 0;
  const lastAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'assistant') {
        return messages[i];
      }
    }
    return null;
  }, [messages]);

  // Generate dynamic contextual or starter suggestions
  const allSuggestions = useMemo(() => {
    const list = [];
    const isHindi = selectedLanguage === 'hi-IN';

    if (lastAssistant) {
      // 1. Prioritize LLM's tailored next_question if present
      if (lastAssistant.next_question && typeof lastAssistant.next_question === 'string') {
        list.push({
          id: 'ctx-next-q',
          icon: Sparkles,
          category: isHindi ? 'सुझाया गया प्रश्न' : 'Recommended Follow-up',
          text: lastAssistant.next_question.trim(),
          highlight: true,
        });
      }

      // 2. Add direct action queries from assistant response
      if (Array.isArray(lastAssistant.actions) && lastAssistant.actions.length > 0) {
        lastAssistant.actions.forEach((act, idx) => {
          if (act && act.query) {
            list.push({
              id: `ctx-act-${idx}`,
              icon: act.type === 'laboratory' ? Building2 : act.type === 'testing' ? FlaskConical : ShieldCheck,
              category: act.label || (isHindi ? 'कार्रवाई' : 'Next Action'),
              text: act.query,
            });
          }
        });
      }

      // 3. Contextual queries from identified standards
      const stds = lastAssistant.identified_standards || lastAssistant.standards || [];
      if (stds.length > 0) {
        const topStd = stds[0];
        const code = topStd.standard_number || topStd.standard || topStd.code;
        if (code) {
          list.push({
            id: 'ctx-std-test',
            icon: FlaskConical,
            category: isHindi ? 'अनिवार्य परीक्षण' : 'Mandatory Tests',
            text: isHindi
              ? `${code} के लिए कौन से अनिवार्य प्रयोगशाला परीक्षण आवश्यक हैं?`
              : `What mandatory laboratory tests are required for ${code}?`,
          });
          list.push({
            id: 'ctx-std-labs',
            icon: Building2,
            category: isHindi ? 'मान्यता प्राप्त लैब्स' : 'Accredited Labs',
            text: isHindi
              ? `${code} के परीक्षण के लिए कौन सी बीआईएस लैब्स अधिकृत हैं?`
              : `Which BIS recognized laboratories can test products under ${code}?`,
          });
          list.push({
            id: 'ctx-std-qco',
            icon: ShieldCheck,
            category: isHindi ? 'QCO आदेश' : 'Statutory QCO',
            text: isHindi
              ? `क्या ${code} के तहत बीआईएस प्रमाणन अनिवार्य है?`
              : `Is BIS certification mandatory under QCO for ${code}?`,
          });
          list.push({
            id: 'ctx-std-apply',
            icon: Award,
            category: isHindi ? 'आवेदन प्रक्रिया' : 'Application Process',
            text: isHindi
              ? `${code} के लिए मानकऑनलाइन पोर्टल पर कैसे आवेदन करें?`
              : `How do I apply for a BIS licence for ${code} on Manakonline?`,
          });
        }
      }

      // 4. Product-specific follow-ups if identified
      if (lastAssistant.product) {
        list.push({
          id: 'ctx-prod-fee',
          icon: Calculator,
          category: isHindi ? 'शुल्क संरचना' : 'Fee Structure',
          text: isHindi
            ? `${lastAssistant.product} के लिए बीआईएस लाइसेंस शुल्क और परीक्षण लागत क्या है?`
            : `What is the BIS licence fee and testing cost for ${lastAssistant.product}?`,
        });
      }
    }

    // If no contextual suggestions found or starting fresh:
    if (list.length === 0) {
      if (isHindi) {
        return [
          {
            id: 'def-1',
            icon: FileText,
            category: 'मानक पहचान',
            text: 'स्टेनलेस स्टील पानी की बोतल (IS 17803) के लिए क्या आवश्यकताएं हैं?',
          },
          {
            id: 'def-2',
            icon: FlaskConical,
            category: 'लैब परीक्षण',
            text: 'पैकेज्ड ड्रिंकिंग वॉटर (IS 14543) के लिए अनिवार्य परीक्षण क्या हैं?',
          },
          {
            id: 'def-3',
            icon: Award,
            category: 'ISI मार्क',
            text: 'मानकऑनलाइन पर स्कीम-I (ISI मार्क) के लिए आवेदन कैसे करें?',
          },
          {
            id: 'def-4',
            icon: ShieldCheck,
            category: 'QCO आदेश',
            text: 'क्या फुटवियर और चमड़े के उत्पादों पर बीआईएस प्रमाणन अनिवार्य है?',
          },
          {
            id: 'def-5',
            icon: Tag,
            category: 'हॉलमार्किंग',
            text: 'BIS Care ऐप पर सोने का 6-अंकीय HUID कैसे सत्यापित करें?',
          },
          {
            id: 'def-6',
            icon: Building2,
            category: 'प्रयोगशाला',
            text: 'उत्तर भारत में बीआईएस मान्यता प्राप्त प्रमुख परीक्षण प्रयोगशालाएं कहां हैं?',
          },
          {
            id: 'def-7',
            icon: Calculator,
            category: 'MSME छूट',
            text: 'सूक्ष्म और लघु उद्योगों (MSME) के लिए बीआईएस फीस में क्या छूट है?',
          },
          {
            id: 'def-8',
            icon: Search,
            category: 'योजना तुलना',
            text: 'स्कीम I (ISI मार्क) और स्कीम II (CRS) में क्या अंतर है?',
          },
          {
            id: 'def-9',
            icon: GraduationCap,
            category: 'मानक क्लब (छात्र)',
            text: 'स्कूलों और कॉलेजों में BIS मानक क्लब (Standards Club) कैसे शुरू करें?',
          },
          {
            id: 'def-10',
            icon: Award,
            category: 'NITS प्रशिक्षण',
            text: 'BIS राष्ट्रीय प्रशिक्षण संस्थान (NITS) द्वारा कौन से कोर्स कराए जाते हैं?',
          },
          {
            id: 'def-11',
            icon: Briefcase,
            category: 'स्टार्टअप लाभ',
            text: 'BIS के तहत स्टार्टअप्स और सूक्ष्म उद्योगों को क्या 50% छूट मिलती है?',
          },
        ];
      }

      return [
        {
          id: 'def-1',
          icon: FileText,
          category: 'Standard Search',
          text: 'What BIS standard applies to stainless steel water bottles?',
        },
        {
          id: 'def-2',
          icon: FlaskConical,
          category: 'Mandatory Tests',
          text: 'What are the mandatory laboratory test parameters for packaged drinking water?',
        },
        {
          id: 'def-3',
          icon: Award,
          category: 'Scheme I (ISI)',
          text: 'How do I apply for ISI Mark certification on Manakonline?',
        },
        {
          id: 'def-4',
          icon: ShieldCheck,
          category: 'QCO Order',
          text: 'Is BIS certification mandatory for footwear and leather products under QCO?',
        },
        {
          id: 'def-5',
          icon: Tag,
          category: 'Gold Hallmarking',
          text: 'How can I verify a 6-digit gold HUID number on BIS Care?',
        },
        {
          id: 'def-6',
          icon: Building2,
          category: 'Accredited Labs',
          text: 'Which recognized BIS laboratories can test my product in India?',
        },
        {
          id: 'def-7',
          icon: Calculator,
          category: 'MSME Concessions',
          text: 'What are the application fee concessions and testing rebates for MSMEs?',
        },
        {
          id: 'def-8',
          icon: Search,
          category: 'Scheme Comparison',
          text: 'What is the difference between Scheme I (ISI Mark) and Scheme II (CRS)?',
        },
        {
          id: 'def-9',
          icon: GraduationCap,
          category: 'Standards Clubs',
          text: 'How can schools and colleges establish a BIS Standards Club for students?',
        },
        {
          id: 'def-10',
          icon: Award,
          category: 'NITS Training',
          text: 'What certified training programs are conducted by BIS NITS?',
        },
        {
          id: 'def-11',
          icon: Briefcase,
          category: 'Startup Benefits',
          text: 'What fast-track concessions do startups and MSMEs get under BIS?',
        },
      ];
    }

    return list;
  }, [lastAssistant, selectedLanguage]);

  // Page through suggestions 3-4 at a time
  const pageSize = 3;
  const totalPages = Math.ceil(allSuggestions.length / pageSize);
  const visibleSuggestions = useMemo(() => {
    const start = (pageIndex % totalPages) * pageSize;
    return allSuggestions.slice(start, start + pageSize);
  }, [allSuggestions, pageIndex, totalPages]);

  const handleNextPage = () => {
    setPageIndex((prev) => (prev + 1) % totalPages);
  };

  const handleSelect = (queryText) => {
    if (isLoading || !queryText) return;
    if (onSelectSuggestion) {
      onSelectSuggestion(queryText);
    }
  };

  const isHindi = selectedLanguage === 'hi-IN';
  const sectionTitle = hasMessages
    ? isHindi
      ? 'सुझाए गए अनुवर्ती प्रश्न'
      : 'Suggested Follow-ups'
    : isHindi
    ? 'सुझाए गए प्रश्न'
    : 'Suggested Questions';

  if (allSuggestions.length === 0) return null;

  return (
    <div className="suggested-messages-wrapper" aria-label="Suggested chat messages">
      <div className="suggested-messages-header">
        <div className="suggested-title-group">
          {hasMessages ? (
            <Lightbulb size={13} className="suggested-header-icon text-saffron" />
          ) : (
            <Sparkles size={13} className="suggested-header-icon text-action" />
          )}
          <span className="suggested-header-title">{sectionTitle}</span>
          <span className="suggested-count-pill">{allSuggestions.length}</span>
        </div>

        <div className="suggested-controls-group">
          {totalPages > 1 && (
            <button
              type="button"
              className="suggested-tool-btn"
              onClick={handleNextPage}
              disabled={isLoading}
              title={isHindi ? 'अन्य सुझाव देखें' : 'Shuffle more suggestions'}
              aria-label="Shuffle suggestions"
            >
              <RotateCw size={11} className="shuffle-icon" />
              <span>{isHindi ? 'बदलें' : 'More'}</span>
            </button>
          )}

          <button
            type="button"
            className="suggested-tool-btn toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Show suggestions' : 'Hide suggestions'}
            aria-label={isCollapsed ? 'Expand suggestions' : 'Collapse suggestions'}
          >
            {isCollapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            className="suggested-chips-track"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {visibleSuggestions.map((item, idx) => {
              const IconComponent = item.icon || Sparkles;
              return (
                <motion.button
                  key={item.id || idx}
                  type="button"
                  className={`suggested-message-chip ${item.highlight ? 'highlight' : ''}`}
                  onClick={() => handleSelect(item.text)}
                  disabled={isLoading}
                  title={item.text}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: idx * 0.04 }}
                  whileHover={!isLoading ? { y: -2, scale: 1.01 } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
                >
                  <div className="suggested-chip-category">
                    <IconComponent size={12} className="chip-cat-icon" />
                    <span>{item.category}</span>
                  </div>
                  <div className="suggested-chip-text">
                    <span>{item.text}</span>
                    <ArrowRight size={11} className="chip-arrow-icon" />
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
