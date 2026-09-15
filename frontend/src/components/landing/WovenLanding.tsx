import React, { useState } from 'react';
import { CinematicThemeToggler } from '@/components/ui/cinematic-theme-toggler';
import {
  BookOpen,
  ShieldCheck,
  Sparkles,
  Gem,
  Scale,
  Landmark,
  FlaskConical,
  Bot,
  CheckCircle2,
  Calculator,
  MapPin,
  Search,
  ArrowRight,
  User,
  Calendar,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  Building2,
  Zap,
} from 'lucide-react';

const TRENDING_QUERIES = [
  {
    icon: '💧',
    labelEn: 'IS 10500: Drinking Water',
    labelHi: 'IS 10500: पेयजल मानक',
    query: 'What are the permissible limits and testing requirements under IS 10500 for drinking water?',
  },
  {
    icon: '🔌',
    labelEn: 'IS 1293: Plugs & Sockets',
    labelHi: 'IS 1293: प्लग व सॉकेट',
    query: 'What are the mandatory certification requirements for plugs and socket-outlets under IS 1293?',
  },
  {
    icon: '💎',
    labelEn: 'Gold HUID Hallmark',
    labelHi: 'गोल्ड HUID हॉलमार्क',
    query: 'How do I verify a 6-digit gold hallmark HUID and what are the recognized purity grades under IS 1417?',
  },
  {
    icon: '🏗️',
    labelEn: 'Cement Mandatory QCO',
    labelHi: 'सीमेंट QCO आदेश',
    query: 'Which cement varieties are covered under mandatory QCO and what are the compliance deadlines?',
  },
  {
    icon: '⚡',
    labelEn: 'MSME 50% Subsidy',
    labelHi: 'MSME 50% शुल्क छूट',
    query: 'How can micro and small enterprises claim 50% concession on BIS application and marking fees?',
  },
  {
    icon: '🛡️',
    labelEn: 'IS 4151: Helmets',
    labelHi: 'IS 4151: हेलमेट सुरक्षा',
    query: 'What are the impact absorption test standards and ISI marking rules for protective helmets under IS 4151?',
  },
  {
    icon: '🧸',
    labelEn: 'IS 9873: Toy Safety',
    labelHi: 'IS 9873: खिलौना सुरक्षा',
    query: 'What are the mandatory mechanical, physical, and chemical safety testing requirements for toys under IS 9873?',
  },
];

interface WovenLandingProps {
  onGetStarted: (targetTab?: string) => void;
  onStartQuery?: (query: string) => void;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const WovenLanding: React.FC<WovenLandingProps> = ({
  onGetStarted,
  onStartQuery,
  language,
  setLanguage,
  isDark,
  onToggleTheme,
}) => {
  const isHi = language === 'hi';
  const [heroQuery, setHeroQuery] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Module navigator: routes to login / authentication page before entering module
  const handleOpenModule = (targetTab: string) => {
    onGetStarted(targetTab);
  };

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollY =
        window.scrollY ??
        window.pageYOffset ??
        document.documentElement.scrollTop ??
        document.body.scrollTop ??
        0;
      if (scrollY > 45) {
        setIsScrolled(true);
        setActiveDropdown(null);
      } else if (scrollY < 15) {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmailInput('');
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleHeroQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroQuery.trim()) {
      if (onStartQuery) {
        onStartQuery(heroQuery.trim());
      } else {
        onGetStarted('assistant');
      }
    }
  };

  const handlePillClick = (queryText: string) => {
    if (onStartQuery) {
      onStartQuery(queryText);
    } else {
      onGetStarted('assistant');
    }
  };

  return (
    <div className="heritage-landing-container">
      {/* ─── FLOATING CAPSULE HERITAGE TOP NAVIGATION BAR ───────────────────────── */}
      <header className={`heritage-navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <div className="heritage-nav-inner">
          {/* Brand Logo & Name */}
          <div className="heritage-nav-brand min-w-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="heritage-brand-crest-wrapper shrink-0">
              <svg
                className="heritage-nav-brand-mark shrink-0"
                width="22"
                height="26"
                viewBox="0 0 96 120"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <ellipse cx="48" cy="60" rx="45" ry="57" />
                <path d="M48 88V46" strokeLinecap="round" />
                <path d="M48 58c-8-2-14-8-16-16 9 0 15 5 16 16Zm0 0c8-2 14-8 16-16-9 0-15 5-16 16Z" />
                <path d="M48 74c-9-2-15-8-17-17 10 0 16 6 17 17Zm0 0c9-2 15-8 17-17-10 0-16 6-17 17Z" />
                <path d="M48 46c-6-3-9-9-8-16 6 3 9 9 8 16Zm0 0c6-3 9-9 8-16-6 3-9 9-8 16Z" />
                <path d="M30 44c-5 1-9-1-12-5 5-2 9-1 12 5Zm36 0c5 1 9-1 12-5-5-2-9-1-12 5Z" />
              </svg>
            </div>
            <div className="heritage-brand-text-block min-w-0">
              <span className="heritage-nav-brand-title truncate">{isHi ? 'बीआईएस सारथी' : 'BIS Saarthi'}</span>
            </div>
          </div>

          {/* Navigation Links with Rich Dropdowns */}
          <nav className="heritage-nav-menu nav-collapsible" aria-label="Main Navigation">
            {/* Standards & QCOs Dropdown */}
            <div
              className={`heritage-nav-item ${activeDropdown === 'standards' ? 'dropdown-open' : ''}`}
              onMouseEnter={() => setActiveDropdown('standards')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                type="button"
                className="heritage-nav-link"
                onClick={() => scrollToSection('standards-section')}
              >
                <span>{isHi ? 'मानक एवं QCO' : 'Standards & QCO'}</span>
                <svg className="nav-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {activeDropdown === 'standards' && (
                <div className="heritage-dropdown-menu">
                  <div className="dropdown-menu-header">
                    <span>{isHi ? 'भारतीय मानक एवं आदेश' : 'National Standards & Orders'}</span>
                  </div>
                  <button type="button" onClick={() => handleOpenModule('standards')} className="heritage-dropdown-item">
                    <div className="dropdown-icon-wrap">
                      <BookOpen className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    </div>
                    <div>
                      <strong>{isHi ? 'संपूर्ण मानक संग्रह' : 'Full Catalogue (22,000+)'}</strong>
                      <span>{isHi ? 'सभी भारतीय मानकों एवं परीक्षण मानकों का अन्वेषण करें' : 'Search verified IS standards, codes & clauses'}</span>
                    </div>
                  </button>
                  <button type="button" onClick={() => handleOpenModule('qco')} className="heritage-dropdown-item">
                    <div className="dropdown-icon-wrap">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <div>
                      <strong>{isHi ? 'अनिवार्य क्यूसीओ आदेश' : 'Mandatory QCO Orders'}</strong>
                      <span>{isHi ? 'राजपत्र अधिसूचित अनिवार्य अनुपालन समयसीमाएं' : 'Gazette quality control orders & deadlines'}</span>
                    </div>
                  </button>
                  <button type="button" onClick={() => handleOpenModule('testing')} className="heritage-dropdown-item">
                    <div className="dropdown-icon-wrap">
                      <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <strong>{isHi ? 'परीक्षण व निरीक्षण योजना (SIT)' : 'Scheme of Testing (SIT)'}</strong>
                      <span>{isHi ? 'फैक्ट्री इन-हाउस लैब उपकरण एवं परीक्षण आवृत्ति' : 'In-house test equipment & sampling criteria'}</span>
                    </div>
                  </button>
                  <button type="button" onClick={() => handleOpenModule('standards')} className="heritage-dropdown-item">
                    <div className="dropdown-icon-wrap">
                      <Gem className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <strong>{isHi ? 'स्वर्ण हॉलमार्किंग (HUID)' : 'Gold & Silver Hallmarking'}</strong>
                      <span>{isHi ? '6-अंकीय HUID शुद्धता सत्यापन' : 'Verify authentic 6-digit hallmark ID & purity'}</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Interactive Compliance Suite Dropdown */}
            <div
              className={`heritage-nav-item ${activeDropdown === 'suite' ? 'dropdown-open' : ''}`}
              onMouseEnter={() => setActiveDropdown('suite')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                type="button"
                className="heritage-nav-link"
                onClick={() => scrollToSection('services-section')}
              >
                <span>{isHi ? 'डिजिटल टूल्स' : 'Compliance Suite'}</span>
                <svg className="nav-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {activeDropdown === 'suite' && (
                <div className="heritage-dropdown-menu">
                  <div className="dropdown-menu-header">
                    <span>{isHi ? 'एकीकृत अनुपालन टूल्स' : 'Interactive Workspace Tools'}</span>
                  </div>
                  <button type="button" onClick={() => handleOpenModule('assistant')} className="heritage-dropdown-item">
                    <div className="dropdown-icon-wrap">
                      <Bot className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                    </div>
                    <div>
                      <strong>{isHi ? 'द्विभाषी एआई परामर्शदाता' : 'Bilingual Voice AI Assistant'}</strong>
                      <span>{isHi ? 'आवाज व टेक्स्ट संवाद एवं आधिकारिक पीडीएफ रिपोर्ट' : 'Speech query, citations & PDF export'}</span>
                    </div>
                  </button>
                  <button type="button" onClick={() => handleOpenModule('audit')} className="heritage-dropdown-item">
                    <div className="dropdown-icon-wrap">
                      <ClipboardCheck className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                    </div>
                    <div>
                      <strong>{isHi ? 'फैक्ट्री ऑडिट सिम्युलेटर' : 'Factory Audit Simulator'}</strong>
                      <span>{isHi ? 'बीआईएस निरीक्षण तैयारी व गैर-अनुरूपता जांच' : 'Mock audit scoring & checklist simulation'}</span>
                    </div>
                  </button>
                  <button type="button" onClick={() => handleOpenModule('calculator')} className="heritage-dropdown-item">
                    <div className="dropdown-icon-wrap">
                      <Calculator className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                    </div>
                    <div>
                      <strong>{isHi ? 'लाइसेंस एवं अंकन शुल्क गणक' : 'Marking Fee & MSME Calculator'}</strong>
                      <span>{isHi ? 'सूक्ष्म व लघु उद्यमों हेतु 50% छूट सहित' : 'Calculate application fees & 50% MSME rebate'}</span>
                    </div>
                  </button>
                  <button type="button" onClick={() => handleOpenModule('calendar')} className="heritage-dropdown-item">
                    <div className="dropdown-icon-wrap">
                      <Calendar className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    </div>
                    <div>
                      <strong>{isHi ? 'अनुपालन कैलेंडर' : 'Compliance Calendar'}</strong>
                      <span>{isHi ? 'क्यूसीओ प्रवर्तन तिथियां व नवीनीकरण अलर्ट' : 'QCO enforcement cutoffs & renewal alerts'}</span>
                    </div>
                  </button>
                  <button type="button" onClick={() => handleOpenModule('dossier')} className="heritage-dropdown-item">
                    <div className="dropdown-icon-wrap">
                      <FileSpreadsheet className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    </div>
                    <div>
                      <strong>{isHi ? 'आवेदन डॉसियर संकलन' : 'Application Dossier Builder'}</strong>
                      <span>{isHi ? 'प्रारूप-V तकनीकी दस्तावेज एवं फ्लोचार्ट पैक' : 'Form-V technical document packager'}</span>
                    </div>
                  </button>
                  <button type="button" onClick={() => handleOpenModule('laboratories')} className="heritage-dropdown-item">
                    <div className="dropdown-icon-wrap">
                      <MapPin className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                    </div>
                    <div>
                      <strong>{isHi ? 'मान्यता प्राप्त लैब नेटवर्क' : 'Accredited Lab Directory'}</strong>
                      <span>{isHi ? 'बीआईएस व एनएबीएल परीक्षण प्रयोगशालाएं' : 'Locate empaneled test facilities nationwide'}</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Heritage & Statutory Dropdown */}
            <div
              className={`heritage-nav-item ${activeDropdown === 'heritage' ? 'dropdown-open' : ''}`}
              onMouseEnter={() => setActiveDropdown('heritage')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                type="button"
                className="heritage-nav-link"
                onClick={() => scrollToSection('heritage-section')}
              >
                <span>{isHi ? 'वैधानिक ढांचा' : 'Statutory'}</span>
                <svg className="nav-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {activeDropdown === 'heritage' && (
                <div className="heritage-dropdown-menu">
                  <div className="dropdown-menu-header">
                    <span>{isHi ? 'संसदीय वैधानिक पृष्ठभूमि' : 'Statutory & Legal Mandate'}</span>
                  </div>
                  <button type="button" onClick={() => handleOpenModule('documents')} className="heritage-dropdown-item">
                    <div className="dropdown-icon-wrap">
                      <Scale className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                    </div>
                    <div>
                      <strong>{isHi ? 'बीआईएस अधिनियम 2016' : 'The BIS Act 2016'}</strong>
                      <span>{isHi ? 'राष्ट्रीय मानकीकरण वैधानिक रूपरेखा' : 'National standardization legislative act'}</span>
                    </div>
                  </button>
                  <button type="button" onClick={() => handleOpenModule('qco')} className="heritage-dropdown-item">
                    <div className="dropdown-icon-wrap">
                      <Landmark className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    </div>
                    <div>
                      <strong>{isHi ? 'धारा 16 एवं धारा 29' : 'Sections 16 & 29 Enforcement'}</strong>
                      <span>{isHi ? 'अनिवार्य QCO व नकली मार्क पर दंडात्मक कार्रवाई' : 'Mandatory QCOs & anti-counterfeit penalties'}</span>
                    </div>
                  </button>
                  <button type="button" onClick={() => handleOpenModule('calculator')} className="heritage-dropdown-item">
                    <div className="dropdown-icon-wrap">
                      <Zap className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    </div>
                    <div>
                      <strong>{isHi ? 'एमएसएमई 50% वैधानिक रियायत' : '50% MSME Statutory Concession'}</strong>
                      <span>{isHi ? 'स्टार्टअप व सूक्ष्म इकाइयों को शुल्क प्रोत्साहन' : 'Statutory marking fee concessions for MSMEs'}</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Direct Section Jump: Gazette */}
            <button
              type="button"
              className="heritage-nav-link-flat"
              onClick={() => scrollToSection('newsletter-section')}
            >
              <span>{isHi ? 'राजपत्र बुलेटिन' : 'The Letter'}</span>
            </button>
          </nav>

          {/* Right Action Tools: Language + Dark Mode + Sign In + Launch Portal */}
          <div className="heritage-nav-actions shrink-0 flex items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setLanguage(isHi ? 'en' : 'hi')}
              className="heritage-nav-icon-btn shrink-0 nav-collapsible"
              title={isHi ? 'Switch to English' : 'हिंदी में बदलें'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>{isHi ? 'EN' : 'हिन्दी'}</span>
            </button>

            <div className="heritage-theme-toggle-wrap shrink-0 nav-collapsible">
              <CinematicThemeToggler
                isDark={isDark}
                onToggle={onToggleTheme}
              />
            </div>

            {/* Get Started -> Login Page */}
            <button
              type="button"
              onClick={() => onGetStarted('auth')}
              className="heritage-launch-btn shrink-0 !py-2 !px-4 sm:!px-6 text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
              title={isHi ? 'शुरू करें / लॉगिन' : 'Get Started'}
            >
              <span>{isHi ? 'शुरू करें' : 'Get Started'}</span>
              <svg className="btn-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      {/* Document flow spacer for fixed floating capsule navbar */}
      <div className="h-20 sm:h-24 pointer-events-none" aria-hidden="true" />

      {/* ─── SCROLLABLE PAGE CONTENT BODY ─────────────────────────────── */}
      <main className="heritage-main-content">
        {/* HERO INTRO SECTION */}
        <section className="heritage-hero-section">
          <div className="heritage-hero-lockup">
            <svg className="brand-mark-hero" viewBox="0 0 96 120" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <ellipse cx="48" cy="60" rx="45" ry="57" />
              <path d="M48 88V46" strokeLinecap="round" />
              <path d="M48 58c-8-2-14-8-16-16 9 0 15 5 16 16Zm0 0c8-2 14-8 16-16-9 0-15 5-16 16Z" />
              <path d="M48 74c-9-2-15-8-17-17 10 0 16 6 17 17Zm0 0c9-2 15-8 17-17-10 0-16 6-17 17Z" />
              <path d="M48 46c-6-3-9-9-8-16 6 3 9 9 8 16Zm0 0c6-3 9-9 8-16-6 3-9 9-8 16Z" />
              <path d="M30 44c-5 1-9-1-12-5 5-2 9-1 12 5Zm36 0c5 1 9-1 12-5-5-2-9-1-12 5Z" />
            </svg>
            <h1 className="heritage-hero-title">
              {isHi ? 'बीआईएस सारथी' : 'BIS Saarthi'}
            </h1>
            <p className="heritage-hero-subtitle">
              {isHi
                ? 'भारतीय मानक ब्यूरो (BIS) एवं गुणवत्ता नियंत्रण आदेश (QCO) हेतु राष्ट्रीय कृत्रिम बुद्धिमत्ता सहायक'
                : 'National AI Intelligence for Bureau of Indian Standards, QCOs & Industry Certification'}
            </p>

            {/* ─── INTERACTIVE HERO QUICK KYS & QUERY SEARCH BAR ─── */}
            <div className="hero-query-container">
              <form onSubmit={handleHeroQuerySubmit} className="hero-query-box">
                <div className="hero-query-icon-wrap">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  placeholder={
                    isHi
                      ? 'भारतीय मानक या उत्पाद खोजें (उदा. IS 1293, सीमेंट परीक्षण, गोल्ड HUID)...'
                      : 'Ask anything or search IS codes (e.g. IS 1293, drinking water, cement QCO)...'
                  }
                  className="hero-query-input"
                />
                <button
                  type="submit"
                  disabled={!heroQuery.trim()}
                  className="hero-query-submit-btn"
                  title={isHi ? 'एआई से पूछें' : 'Consult AI'}
                  aria-label="Submit query"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Trending Quick Pills */}
              <div className="hero-trending-pills">
                <span className="trending-label">
                  <Sparkles className="w-3 h-3 text-amber-500 inline mr-1" />
                  {isHi ? 'लोकप्रिय:' : 'Popular:'}
                </span>
                {TRENDING_QUERIES.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePillClick(item.query)}
                    className="hero-pill-chip"
                  >
                    <span>{item.icon}</span>
                    <span>{isHi ? item.labelHi : item.labelEn}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ─── LIVE HERO METRICS STRIP ─── */}
            <div className="heritage-metrics-strip">
              <div className="metric-item">
                <span className="metric-value">22,000+</span>
                <span className="metric-label">{isHi ? 'भारतीय मानक (KYS)' : 'Indian Standards (KYS)'}</span>
              </div>
              <div className="metric-item">
                <span className="metric-value">150+</span>
                <span className="metric-label">{isHi ? 'अनिवार्य QCO आदेश' : 'Gazetted QCO Orders'}</span>
              </div>
              <div className="metric-item">
                <span className="metric-value">50%</span>
                <span className="metric-label">{isHi ? 'एमएसएमई शुल्क रियायत' : 'MSME Fee Concession'}</span>
              </div>
              <div className="metric-item">
                <span className="metric-value">10</span>
                <span className="metric-label">{isHi ? 'अनुपालन मॉड्यूल' : 'Compliance Modules'}</span>
              </div>
              <div className="metric-item">
                <span className="metric-value">100%</span>
                <span className="metric-label">{isHi ? 'वैधानिक संरेखण' : 'BIS Act 2016 Compliant'}</span>
              </div>
            </div>

            <div className="heritage-hero-buttons">
              <button
                type="button"
                onClick={() => onGetStarted('auth')}
                className="heritage-primary-btn"
              >
                <span>{isHi ? 'शुरू करें (लॉगिन) →' : 'Get Started →'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenModule('assistant')}
                className="heritage-secondary-btn"
              >
                <Bot className="w-4 h-4 mr-1.5 inline" />
                <span>{isHi ? 'एआई परामर्श प्रारंभ करें' : 'Voice AI Assistant'}</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('tools-section')}
                className="heritage-secondary-btn"
              >
                <span>{isHi ? 'सभी 10 मॉड्यूल देखें ↓' : 'Explore All 10 Modules ↓'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 1: STANDARDS & SCHEMES ECOSYSTEM */}
        <section id="standards-section" className="heritage-content-section">
          <div className="heritage-section-header">
            <span className="heritage-section-tag">{isHi ? 'अध्याय 01' : 'Chapter 01'}</span>
            <h2 className="heritage-section-title">{isHi ? 'राष्ट्रीय प्रमाणन योजनाएं' : 'Certification Schemes & Conformity'}</h2>
            <p className="heritage-section-desc">
              {isHi
                ? '22,000+ से अधिक सक्रिय भारतीय मानक, अनिवार्य गुणवत्ता नियंत्रण आदेश (QCOs) एवं तकनीकी अनुरूपता प्रक्रियाएं।'
                : 'Over 22,000 active Indian standards, gazetted QCO orders, and technical conformity assessment procedures.'}
            </p>
          </div>

          <div className="heritage-cards-grid">
            <div className="heritage-card" onClick={() => handleOpenModule('standards')}>
              <div className="heritage-card-badge">Scheme-I (ISI Mark)</div>
              <h3>{isHi ? 'उत्पाद प्रमाणन योजना' : 'Scheme I (ISI Mark)'}</h3>
              <p>{isHi ? 'घरेलू उपकरणों, सीमेंट, इस्पात, सुरक्षा हेलमेट और केबल्स के लिए अनिवार्य अनुरूपता एवं फैक्ट्री ऑडिट।' : 'Mandatory product conformity marking for appliances, helmets, steel, cables, and cement with factory surveillance.'}</p>
              <span className="heritage-card-action">{isHi ? 'मानक सूची देखें →' : 'Explore Standards →'}</span>
            </div>

            <div className="heritage-card" onClick={() => handleOpenModule('standards')}>
              <div className="heritage-card-badge">Scheme-II (CRS)</div>
              <h3>{isHi ? 'अनिवार्य पंजीकरण योजना' : 'Scheme II (Compulsory Registration)'}</h3>
              <p>{isHi ? 'आईटी हार्डवेयर, सोलर मॉड्यूल, पावर बैंक और लिथियम-आयन बैटरी हेतु स्व-अनुरूपता घोषणा (MeitY/MNRE)।' : 'Self-declaration of conformity for IT hardware, solar PV modules, and Li-ion batteries under MeitY orders.'}</p>
              <span className="heritage-card-action">{isHi ? 'सीआरएस उत्पाद देखें →' : 'Explore CRS Goods →'}</span>
            </div>

            <div className="heritage-card" onClick={() => handleOpenModule('standards')}>
              <div className="heritage-card-badge">IS 1417 (HUID)</div>
              <h3>{isHi ? 'स्वर्ण एवं रजत हॉलमार्किंग' : 'Gold & Silver Hallmarking'}</h3>
              <p>{isHi ? '6-अंकीय विशिष्ट अल्फान्यूमेरिक HUID के साथ उपभोक्ता शुद्धता सत्यापन एवं आभूषण विश्वास गारंटी।' : 'Consumer authenticity guarantee with unique 6-digit alphanumeric HUID and accredited A&H center standards.'}</p>
              <span className="heritage-card-action">{isHi ? 'हॉलमार्क नियम देखें →' : 'Hallmark Guidelines →'}</span>
            </div>

            <div className="heritage-card" onClick={() => handleOpenModule('testing')}>
              <div className="heritage-card-badge">SIT / In-House Lab</div>
              <h3>{isHi ? 'निरीक्षण एवं परीक्षण योजना' : 'Scheme of Inspection & Testing'}</h3>
              <p>{isHi ? 'फैक्ट्री इन-हाउस प्रयोगशाला चेकलिस्ट, बैच सैंपलिंग दरें और न्यूनतम परीक्षण उपकरण आवश्यकताएं।' : 'In-house QC laboratory protocols, sampling frequencies, and mandatory testing apparatus checklists.'}</p>
              <span className="heritage-card-action">{isHi ? 'एसआईटी चेकलिस्ट खोलें →' : 'Open SIT Checklists →'}</span>
            </div>
          </div>
        </section>

        {/* SECTION 2: HERITAGE & STATUTORY AUTHORITY */}
        <section id="heritage-section" className="heritage-content-section">
          <div className="heritage-section-header">
            <span className="heritage-section-tag">{isHi ? 'अध्याय 02' : 'Chapter 02'}</span>
            <h2 className="heritage-section-title">{isHi ? 'वैधानिक आधार एवं विनियामक अधिकार' : 'Statutory Roots & Regulatory Authority'}</h2>
            <p className="heritage-section-desc">
              {isHi
                ? 'भारतीय मानक ब्यूरो अधिनियम, 2016 के तहत संचालित राष्ट्रीय गुणवत्ता, अनिवार्य क्यूसीओ एवं प्रवर्तन तंत्र'
                : 'Statutory excellence grounded in the Bureau of Indian Standards Act, 2016 and The Gazette of India.'}
            </p>
          </div>

          <div className="heritage-two-col">
            <div className="heritage-story-box">
              <h3>{isHi ? 'भारतीय मानक ब्यूरो अधिनियम, 2016' : 'The BIS Act 2016 & Enforcement'}</h3>
              <p>
                {isHi
                  ? 'बीआईएस अधिनियम 2016 भारतीय मानक ब्यूरो को भारत के राष्ट्रीय मानक निकाय के रूप में स्थापित करता है। धारा 16 के तहत केंद्र सरकार सार्वजनिक स्वास्थ्य, सुरक्षा और पर्यावरण संरक्षण हेतु अनिवार्य गुणवत्ता नियंत्रण आदेश (QCO) जारी करती है।'
                  : 'The BIS Act 2016 establishes the Bureau of Indian Standards as the National Standards Body of India. Under Section 16, the Central Government mandates conformity to Indian Standards to protect consumer health, safety, and national industrial excellence.'}
              </p>
              <ul className="heritage-check-list">
                <li>✓ {isHi ? 'धारा 16: केंद्र सरकार द्वारा अनिवार्य क्यूसीओ अधिसूचनाएं' : 'Section 16: Mandatory Central Government QCO Orders'}</li>
                <li>✓ {isHi ? 'धारा 29: मानक चिन्ह के अवैध उपयोग पर कारावास व भारी जुर्माना' : 'Section 29: Strict Penalties & Imprisonment on Counterfeiting'}</li>
                <li>✓ {isHi ? 'धारा 14-15: लाइसेंस अनुदान, अनुरूपता मूल्यांकन एवं फैक्ट्री निगरानी' : 'Sections 14-15: Conformity Assessment & Factory Surveillance'}</li>
                <li>✓ {isHi ? 'सूक्ष्म व लघु उद्योगों (MSME) हेतु 50% अंकन शुल्क रियायत' : '50% Statutory Marking Fee Concessions for MSMEs & Startups'}</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenModule('qco')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(23,90,103,0.12)] hover:bg-[rgba(23,90,103,0.2)] text-[var(--ink)] dark:bg-[rgba(56,189,248,0.15)] dark:text-sky-300 transition-colors cursor-pointer"
                >
                  {isHi ? 'राजपत्र QCO आदेश देखें →' : 'Browse Gazette QCOs →'}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenModule('documents')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-[rgba(23,90,103,0.25)] hover:bg-[rgba(23,90,103,0.06)] text-[var(--ink)] dark:border-[rgba(56,189,248,0.3)] transition-colors cursor-pointer"
                >
                  {isHi ? 'अधिनियम दस्तावेज पढ़ें →' : 'Read Act Documents →'}
                </button>
              </div>
            </div>

            <div className="heritage-story-box">
              <h3>{isHi ? 'राष्ट्रीय नियामक एवं संपर्क केंद्र' : 'National Contact & Regulatory Hub'}</h3>
              <ul className="heritage-contact-detail-list">
                <li>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  <div>
                    <strong>{isHi ? 'आधिकारिक ईमेल' : 'Official Support Email'}</strong>
                    <a href="mailto:info@bis.gov.in">info@bis.gov.in</a>
                  </div>
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
                  <div>
                    <strong>{isHi ? 'राष्ट्रीय टोल-फ्री हेल्पलाइन' : 'National Consumer Helpline'}</strong>
                    <a href="tel:1915">1915</a> / <a href="tel:+911123230131">+91 11 2323 0131</a>
                  </div>
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>
                  <div>
                    <strong>{isHi ? 'केंद्रीय मुख्यालय' : 'Central Headquarters'}</strong>
                    <span>{isHi ? 'मानक भवन, 9 बहादुर शाह जफर मार्ग, नई दिल्ली 110002' : 'Manak Bhavan, 9 Bahadur Shah Zafar Marg, New Delhi 110002'}</span>
                  </div>
                </li>
                <li>
                  <MapPin className="w-5 h-5 text-teal-700 dark:text-teal-400 shrink-0" />
                  <div>
                    <strong>{isHi ? '5 क्षेत्रीय कार्यालय' : '5 Regional Directorates'}</strong>
                    <span>{isHi ? 'उत्तर (चंडीगढ़), पश्चिम (मुंबई), पूर्व (कोलकाता), दक्षिण (चेन्नई), मध्य (दिल्ली)' : 'North (Chandigarh), West (Mumbai), East (Kolkata), South (Chennai), Central (Delhi)'}</span>
                  </div>
                </li>
              </ul>
              <div className="mt-4 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenModule('laboratories')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(23,90,103,0.12)] hover:bg-[rgba(23,90,103,0.2)] text-[var(--ink)] dark:bg-[rgba(56,189,248,0.15)] dark:text-sky-300 transition-colors cursor-pointer"
                >
                  {isHi ? 'मान्यता प्राप्त प्रयोगशालाएं खोजें →' : 'Locate Certified BIS / NABL Labs →'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: COMPLETE 10 COMPLIANCE MODULES SUITE */}
        <section id="tools-section" className="heritage-content-section">
          <div className="heritage-section-header">
            <span className="heritage-section-tag">{isHi ? 'अध्याय 03' : 'Chapter 03'}</span>
            <h2 className="heritage-section-title">{isHi ? 'संपूर्ण 10 अनुपालन मॉड्यूल' : 'The 10 Compliance Modules'}</h2>
            <p className="heritage-section-desc">
              {isHi
                ? 'निर्माताओं, एमएसएमई, परीक्षण प्रयोगशालाओं एवं नागरिकों के लिए संपूर्ण कार्यक्षेत्र उपकरण'
                : 'Full-spectrum workspace suite designed for manufacturers, MSMEs, testing laboratories, and certifying officers.'}
            </p>
          </div>

          <div className="heritage-tools-grid">
            {/* 1. Voice AI Assistant */}
            <div className="heritage-tool-card">
              <div className="heritage-tool-card-header">
                <span className="heritage-tool-icon">🎙️</span>
                <span className="heritage-tool-tag">{isHi ? 'द्विभाषी वॉइस एआई' : 'Bilingual Voice AI'}</span>
              </div>
              <h4>{isHi ? 'एआई वॉइस सलाहकार' : 'Voice AI Consultant'}</h4>
              <p>{isHi ? 'हिंदी और अंग्रेजी में प्राकृतिक आवाज से बातचीत, सटीक धारा उद्धरण, टीटीएस ऑडियो प्लेबैक एवं पीडीएफ रिपोर्ट।' : 'Interactive bilingual voice AI consultant with real-time text-to-speech, verified IS clause citations, and PDF export.'}</p>
              <div className="heritage-tool-card-badge-bottom flex items-center gap-1.5 text-[11px] text-teal-700 dark:text-teal-400 font-semibold pt-3 mt-auto border-t border-[rgba(23,90,103,0.12)] dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>{isHi ? 'बीआईएस सारथी मॉड्यूल 01' : 'BIS Saarthi Module 01'}</span>
              </div>
            </div>

            {/* 2. Standards Catalogue */}
            <div className="heritage-tool-card">
              <div className="heritage-tool-card-header">
                <span className="heritage-tool-icon">📚</span>
                <span className="heritage-tool-tag">{isHi ? '22,000+ मानक' : '22,000+ Standards'}</span>
              </div>
              <h4>{isHi ? 'मानक संग्रह (KYS)' : 'Standards Catalogue'}</h4>
              <p>{isHi ? 'सभी भारतीय मानकों (IS कोड्स), क्लॉज ब्रेकडाउन, उत्पाद विशिष्टताओं एवं अनुरूपता प्रक्रियाओं की संपूर्ण डायरेक्टरी।' : 'Instant search across active Indian standards with clause hierarchy, amendment tracking, and conformity parameters.'}</p>
              <div className="heritage-tool-card-badge-bottom flex items-center gap-1.5 text-[11px] text-teal-700 dark:text-teal-400 font-semibold pt-3 mt-auto border-t border-[rgba(23,90,103,0.12)] dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>{isHi ? 'बीआईएस सारथी मॉड्यूल 02' : 'BIS Saarthi Module 02'}</span>
              </div>
            </div>

            {/* 3. QCO Orders */}
            <div className="heritage-tool-card">
              <div className="heritage-tool-card-header">
                <span className="heritage-tool-icon">⚖️</span>
                <span className="heritage-tool-tag">{isHi ? 'राजपत्र आदेश' : 'Gazette QCOs'}</span>
              </div>
              <h4>{isHi ? 'क्यूसीओ आदेश व समयसीमा' : 'QCO Orders & Deadlines'}</h4>
              <p>{isHi ? 'भारत के राजपत्र में प्रकाशित सभी अनिवार्य गुणवत्ता नियंत्रण आदेश, लागू होने की अंतिम तिथियां व छूट नियम।' : 'Track gazetted mandatory Quality Control Orders, statutory enforcement cutoffs, ministry circulars, and grace periods.'}</p>
              <div className="heritage-tool-card-badge-bottom flex items-center gap-1.5 text-[11px] text-teal-700 dark:text-teal-400 font-semibold pt-3 mt-auto border-t border-[rgba(23,90,103,0.12)] dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>{isHi ? 'बीआईएस सारथी मॉड्यूल 03' : 'BIS Saarthi Module 03'}</span>
              </div>
            </div>

            {/* 4. Scheme of Testing (SIT) */}
            <div className="heritage-tool-card">
              <div className="heritage-tool-card-header">
                <span className="heritage-tool-icon">🔬</span>
                <span className="heritage-tool-tag">{isHi ? 'एसआईटी प्रोटोकॉल' : 'SIT Protocols'}</span>
              </div>
              <h4>{isHi ? 'परीक्षण व निरीक्षण योजना' : 'Testing Schemes (SIT)'}</h4>
              <p>{isHi ? 'इन-हाउस लैब उपकरण चेकलिस्ट, सैंपलिंग प्लान, परीक्षण आवृत्ति एवं गुणवत्ता लॉग तैयार करने की मार्गदर्शिका।' : 'In-house test apparatus checklist, batch sampling rates, routine vs acceptance tests, and inspection logs.'}</p>
              <div className="heritage-tool-card-badge-bottom flex items-center gap-1.5 text-[11px] text-teal-700 dark:text-teal-400 font-semibold pt-3 mt-auto border-t border-[rgba(23,90,103,0.12)] dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>{isHi ? 'बीआईएस सारथी मॉड्यूल 04' : 'BIS Saarthi Module 04'}</span>
              </div>
            </div>

            {/* 5. Laboratory Directory */}
            <div className="heritage-tool-card">
              <div className="heritage-tool-card-header">
                <span className="heritage-tool-icon">🧪</span>
                <span className="heritage-tool-tag">{isHi ? 'बीआईएस व एनएबीएल' : 'BIS & NABL Labs'}</span>
              </div>
              <h4>{isHi ? 'प्रयोगशाला निर्देशिका' : 'Testing Lab Directory'}</h4>
              <p>{isHi ? 'अपने उत्पाद और आईएस कोड के आधार पर पूरे भारत में मान्यता प्राप्त परीक्षण प्रयोगशालाएं और संपर्क खोजें।' : 'Locate certified government and private NABL/BIS test laboratories filterable by IS code, city, and scope.'}</p>
              <div className="heritage-tool-card-badge-bottom flex items-center gap-1.5 text-[11px] text-teal-700 dark:text-teal-400 font-semibold pt-3 mt-auto border-t border-[rgba(23,90,103,0.12)] dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>{isHi ? 'बीआईएस सारथी मॉड्यूल 05' : 'BIS Saarthi Module 05'}</span>
              </div>
            </div>

            {/* 6. Fee & MSME Estimator */}
            <div className="heritage-tool-card">
              <div className="heritage-tool-card-header">
                <span className="heritage-tool-icon">🧮</span>
                <span className="heritage-tool-tag">{isHi ? '50% छूट गणक' : '50% MSME Rebate'}</span>
              </div>
              <h4>{isHi ? 'लाइसेंस शुल्क गणक' : 'Fee & Subsidy Calculator'}</h4>
              <p>{isHi ? 'आवेदन शुल्क, ऑडिट खर्च और न्यूनतम वार्षिक अंकन शुल्क की तुरंत गणना; सूक्ष्म/लघु उद्यमों हेतु 50% छूट।' : 'Calculate exact application fees, annual marking charges, inspection costs, and automated 50% MSME rebates.'}</p>
              <div className="heritage-tool-card-badge-bottom flex items-center gap-1.5 text-[11px] text-teal-700 dark:text-teal-400 font-semibold pt-3 mt-auto border-t border-[rgba(23,90,103,0.12)] dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>{isHi ? 'बीआईएस सारथी मॉड्यूल 06' : 'BIS Saarthi Module 06'}</span>
              </div>
            </div>

            {/* 7. Compliance Calendar */}
            <div className="heritage-tool-card">
              <div className="heritage-tool-card-header">
                <span className="heritage-tool-icon">📅</span>
                <span className="heritage-tool-tag">{isHi ? 'समयसीमा कैलेंडर' : 'Compliance Tracker'}</span>
              </div>
              <h4>{isHi ? 'अनुपालन कैलेंडर' : 'Regulatory Calendar'}</h4>
              <p>{isHi ? 'लाइसेंस नवीनीकरण, अनिवार्य निगरानी ऑडिट, क्यूसीओ प्रवर्तन तिथियां और वैधानिक अलर्ट का प्रबंधन।' : 'Schedule surveillance audits, manage license renewal deadlines, track QCO cutoff dates, and set email reminders.'}</p>
              <div className="heritage-tool-card-badge-bottom flex items-center gap-1.5 text-[11px] text-teal-700 dark:text-teal-400 font-semibold pt-3 mt-auto border-t border-[rgba(23,90,103,0.12)] dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>{isHi ? 'बीआईएस सारथी मॉड्यूल 07' : 'BIS Saarthi Module 07'}</span>
              </div>
            </div>

            {/* 8. Factory Audit Simulator */}
            <div className="heritage-tool-card">
              <div className="heritage-tool-card-header">
                <span className="heritage-tool-icon">📋</span>
                <span className="heritage-tool-tag">{isHi ? 'ऑडिट तैयारी' : 'Readiness Score'}</span>
              </div>
              <h4>{isHi ? 'फैक्ट्री ऑडिट सिम्युलेटर' : 'Audit Readiness Simulator'}</h4>
              <p>{isHi ? 'बीआईएस अधिकारी निरीक्षण से पूर्व फैक्ट्री की तैयारी का डिजिटल मूल्यांकन, कमियों की पहचान व रेडीनेस स्कोर।' : 'Simulate official BIS factory technical inspection, identify non-conformities, and receive readiness scorecards.'}</p>
              <div className="heritage-tool-card-badge-bottom flex items-center gap-1.5 text-[11px] text-teal-700 dark:text-teal-400 font-semibold pt-3 mt-auto border-t border-[rgba(23,90,103,0.12)] dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>{isHi ? 'बीआईएस सारथी मॉड्यूल 08' : 'BIS Saarthi Module 08'}</span>
              </div>
            </div>

            {/* 9. Form-V Dossier Builder */}
            <div className="heritage-tool-card">
              <div className="heritage-tool-card-header">
                <span className="heritage-tool-icon">📑</span>
                <span className="heritage-tool-tag">{isHi ? 'फॉर्म-V फाइल' : 'Form-V Dossier'}</span>
              </div>
              <h4>{isHi ? 'तकनीकी डोजियर बिल्डर' : 'Application Dossier Builder'}</h4>
              <p>{isHi ? 'फॉर्म-V तकनीकी फाइल, विनिर्माण प्रक्रिया चार्ट, गुणवत्ता नियंत्रण योजना और निर्यात योग्य आवेदन दस्तावेज।' : 'Step-by-step Form-V technical file generation, process flow charts, QC plans, and audit-ready package exports.'}</p>
              <div className="heritage-tool-card-badge-bottom flex items-center gap-1.5 text-[11px] text-teal-700 dark:text-teal-400 font-semibold pt-3 mt-auto border-t border-[rgba(23,90,103,0.12)] dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>{isHi ? 'बीआईएस सारथी मॉड्यूल 09' : 'BIS Saarthi Module 09'}</span>
              </div>
            </div>

            {/* 10. Documents & Statutory Hub */}
            <div className="heritage-tool-card">
              <div className="heritage-tool-card-header">
                <span className="heritage-tool-icon">🏛️</span>
                <span className="heritage-tool-tag">{isHi ? 'वैधानिक रिपॉजिटरी' : 'Statutory Repository'}</span>
              </div>
              <h4>{isHi ? 'अधिनियम व दस्तावेज संग्रह' : 'Statutory Documents Hub'}</h4>
              <p>{isHi ? 'बीआईएस अधिनियम 2016, अनुरूपता मूल्यांकन विनियम 2018, उत्पाद मैनुअल और आधिकारिक राजपत्र सर्कुलर।' : 'Direct access to official BIS Act 2016 legal text, 2018 regulations, product manuals, and gazette notifications.'}</p>
              <div className="heritage-tool-card-badge-bottom flex items-center gap-1.5 text-[11px] text-teal-700 dark:text-teal-400 font-semibold pt-3 mt-auto border-t border-[rgba(23,90,103,0.12)] dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>{isHi ? 'बीआईएस सारथी मॉड्यूल 10' : 'BIS Saarthi Module 10'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: BENEFICIARY PERSONAS */}
        <section id="personas-section" className="heritage-content-section">
          <div className="heritage-section-header">
            <span className="heritage-section-tag">{isHi ? 'अध्याय 04' : 'Chapter 04'}</span>
            <h2 className="heritage-section-title">{isHi ? 'हितधारक समाधान एवं भूमिकाएं' : 'Tailored for Every Stakeholder'}</h2>
            <p className="heritage-section-desc">
              {isHi
                ? 'उद्योग जगत, छोटे उद्यमियों, गुणवत्ता इंजीनियरों और आम उपभोक्ताओं के लिए विशेष समाधान'
                : 'Purpose-built pathways empowering enterprises, micro-manufacturers, testing laboratories, and citizens.'}
            </p>
          </div>

          <div className="heritage-persona-grid">
            {/* Persona 1: Manufacturers */}
            <div className="persona-card" onClick={() => handleOpenModule('audit')}>
              <div className="persona-header">
                <div className="persona-icon-wrap">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4>{isHi ? 'निर्माता एवं उद्योग' : 'Manufacturers & Industry'}</h4>
                </div>
              </div>
              <p>
                {isHi
                  ? 'योजना-I (ISI मार्क) और एफएमसीएस लाइसेंस प्राप्त करें, इन-हाउस लैब सेटअप करें और ऑडिट सिम्युलेटर से प्री-इंस्पेक्शन तैयारी पूरी करें।'
                  : 'Achieve Scheme-I (ISI Mark) and FMCS licenses smoothly. Simulate pre-inspection audits, align in-house test equipment, and eliminate non-conformities.'}
              </p>
              <div className="persona-tags">
                <span className="persona-tag">ISI Mark</span>
                <span className="persona-tag">Audit Prep</span>
                <span className="persona-tag">Form-V</span>
                <span className="persona-tag">FMCS</span>
              </div>
            </div>

            {/* Persona 2: MSMEs & Startups */}
            <div className="persona-card" onClick={() => handleOpenModule('calculator')}>
              <div className="persona-header">
                <div className="persona-icon-wrap">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4>{isHi ? 'एमएसएमई एवं स्टार्टअप्स' : 'MSMEs & Startups'}</h4>
                </div>
              </div>
              <p>
                {isHi
                  ? 'उद्यम पंजीकरण के आधार पर 50% वैधानिक अंकन शुल्क रियायत का लाभ उठाएं और कम बजट में चरणबद्ध प्रमाणन प्रक्रिया पूरी करें।'
                  : 'Unlock statutory 50% marking fee concessions linked to Udyam registration, budget testing costs, and follow step-by-step simplified application workflows.'}
              </p>
              <div className="persona-tags">
                <span className="persona-tag">50% Subsidy</span>
                <span className="persona-tag">Udyam Linked</span>
                <span className="persona-tag">Budget Calculator</span>
              </div>
            </div>

            {/* Persona 3: Testing Labs & QC Officers */}
            <div className="persona-card" onClick={() => handleOpenModule('testing')}>
              <div className="persona-header">
                <div className="persona-icon-wrap">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h4>{isHi ? 'परीक्षण प्रयोगशालाएं व क्यूसी' : 'Testing Labs & QC Officers'}</h4>
                </div>
              </div>
              <p>
                {isHi
                  ? 'मानक निरीक्षण एवं परीक्षण योजना (SIT) के तहत परीक्षण उपकरण कैलिब्रेट करें, टेस्ट लॉग व्यवस्थित करें और एनएबीएल मैपिंग समझें।'
                  : 'Align with Scheme of Inspection & Testing (SIT) standards, calibrate testing apparatus, manage sample tracking, and connect with regional manufacturers.'}
              </p>
              <div className="persona-tags">
                <span className="persona-tag">SIT Protocols</span>
                <span className="persona-tag">NABL Directory</span>
                <span className="persona-tag">Sampling Log</span>
              </div>
            </div>

            {/* Persona 4: Consumers & Procurement */}
            <div className="persona-card" onClick={() => handleOpenModule('standards')}>
              <div className="persona-header">
                <div className="persona-icon-wrap">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4>{isHi ? 'उपभोक्ता एवं खरीद अधिकारी' : 'Procurement & Citizens'}</h4>
                </div>
              </div>
              <p>
                {isHi
                  ? 'आईएसआई मार्क की प्रामाणिकता जांचें, 6-अंकीय गोल्ड हॉलमार्क HUID सत्यापित करें, क्यूसीओ अनिवार्यता जानें और मिलावट की शिकायत करें।'
                  : 'Verify ISI marks, validate 6-digit gold HUID hallmarks, check mandatory QCO compliance before buying, and report spurious quality standards to BIS 1915.'}
              </p>
              <div className="persona-tags">
                <span className="persona-tag">HUID Verify</span>
                <span className="persona-tag">IS 1417</span>
                <span className="persona-tag">QCO Verification</span>
                <span className="persona-tag">1915 Help</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: THE LETTER / GAZETTE SUBSCRIBER */}
        <section id="newsletter-section" className="heritage-content-section">
          <div className="heritage-newsletter-box">
            <span className="heritage-section-tag">{isHi ? 'राजपत्र बुलेटिन' : 'The Letter'}</span>
            <h2>{isHi ? 'नवीनतम राजपत्र क्यूसीओ सूचनाएं प्राप्त करें' : 'Stay Ahead of National Quality Orders'}</h2>
            <p>
              {isHi
                ? 'जब भी केंद्र सरकार कोई नया अनिवार्य क्यूसीओ या मसौदा मानक प्रकाशित करती है, तुरंत सूचना प्राप्त करें।'
                : 'Sign up for timely notices on newly gazetted QCO deadlines, draft standards open for public review, and MSME subsidy updates.'}
            </p>

            {subscribed ? (
              <div className="subscribe-success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{isHi ? 'धन्यवाद! आप सफलतापूर्वक पंजीकृत हो गए हैं।' : 'Subscribed! You will receive new QCO alerts.'}</span>
              </div>
            ) : (
              <form className="subscribe" onSubmit={handleSubscribe}>
                <label htmlFor="nl-email" className="sr-only">Email address</label>
                <input
                  id="nl-email"
                  type="email"
                  name="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder={isHi ? 'अपना कार्य ईमेल दर्ज करें' : 'Leave your email'}
                  autoComplete="email"
                  required
                />
                <button type="submit" aria-label="Subscribe">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 12h15M13 6l6 6-6 6" />
                  </svg>
                </button>
              </form>
            )}

            <div className="heritage-cta-final">
              <button
                type="button"
                onClick={() => onGetStarted('auth')}
                className="heritage-launch-large-btn"
              >
                <span>{isHi ? 'शुरू करें (लॉगिन) →' : 'Get Started →'}</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ─── HERITAGE COMPREHENSIVE FOOTER ─────────────────────────────── */}
      <footer className="heritage-footer">
        {/* Quick Helpline & Action Strip */}
        <div className="heritage-footer-banner">
          <div className="heritage-footer-banner-inner">
            <div className="banner-text">
              <span className="banner-badge">
                {isHi ? 'राष्ट्रीय गुणवत्ता हेल्पलाइन' : 'National Standards Helpline'}
              </span>
              <p>
                {isHi
                  ? 'किसी भी मानक, प्रमाणीकरण या QCO संबंधी सहायता हेतु 1915 पर कॉल करें या बीआईएस सारथी AI से 24/7 पूछें।'
                  : 'For immediate standard verification, lab inquiry, or QCO assistance, dial 1915 or consult BIS Saarthi AI 24/7.'}
              </p>
            </div>
            <div className="banner-actions">
              <button
                type="button"
                onClick={() => handleOpenModule('assistant')}
                className="banner-cta-primary"
              >
                <span>💬 {isHi ? 'AI चैट प्रारंभ करें' : 'Launch AI Assistant'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenModule('standards')}
                className="banner-cta-secondary"
              >
                <span>🔍 {isHi ? 'मानक खोजें (KYS)' : 'Search IS Codes'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Footer Directory Grid */}
        <div className="heritage-footer-grid">
          {/* Col 1: Brand & Statutory Identity */}
          <div className="footer-col footer-col-brand">
            <div className="footer-brand-header">
              <svg className="footer-crest" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="24" cy="24" r="21" strokeDasharray="3 3" />
                <path d="M24 6v36M6 24h36M12 12l24 24M36 12L12 36" opacity="0.35" />
                <circle cx="24" cy="24" r="8" fill="currentColor" fillOpacity="0.1" />
                <path d="M20 18h8v12h-8z" />
                <path d="M24 14v4M24 30v4M16 24h4M28 24h4" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div>
                <span className="footer-brand-title">बीआईएस सारथी • BIS Saarthi</span>
                <span className="footer-brand-sub">National Standards Intelligence</span>
              </div>
            </div>
            <p className="footer-brand-desc">
              {isHi
                ? 'भारतीय मानक ब्यूरो अधिनियम, 2016 के तहत राष्ट्रीय गुणवत्ता, अनिवार्य क्यूसीओ एवं प्रमाणन प्रक्रियाओं को सुलभ बनाने हेतु भारत सरकार का आधुनिक डिजिटल सेतु।'
                : 'National intelligence and compliance interface aligning Indian enterprises and citizens with the Bureau of Indian Standards (BIS Act 2016) and mandatory Quality Control Orders.'}
            </p>
            <div className="footer-badges">
              <span className="footer-gov-badge">🇮🇳 {isHi ? 'उपभोक्ता मामले मंत्रालय' : 'Ministry of Consumer Affairs'}</span>
              <span className="footer-gov-badge">🏛️ {isHi ? 'भारत सरकार की पहल' : 'Govt. of India Initiative'}</span>
              <span className="footer-gov-badge">📜 {isHi ? 'बीआईएस अधिनियम, 2016' : 'BIS Act, 2016 Statutory'}</span>
            </div>
          </div>

          {/* Col 2: Schemes & Certification */}
          <div className="footer-col">
            <h4 className="footer-col-title">{isHi ? 'प्रमाणन योजनाएं' : 'Certification Schemes'}</h4>
            <ul className="footer-links">
              <li>
                <button type="button" onClick={() => handleOpenModule('standards')}>
                  {isHi ? 'आईएसआई मार्क योजना (Scheme-I)' : 'ISI Mark Scheme (Scheme-I)'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleOpenModule('standards')}>
                  {isHi ? 'अनिवार्य पंजीकरण योजना (CRS)' : 'Compulsory Registration (CRS)'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleOpenModule('standards')}>
                  {isHi ? 'स्वर्ण व रजत हॉलमार्किंग (HUID)' : 'Gold & Silver Hallmarking (HUID)'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleOpenModule('testing')}>
                  {isHi ? 'निरीक्षण व परीक्षण योजना (SIT)' : 'Testing & Inspection Scheme (SIT)'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleOpenModule('calculator')}>
                  {isHi ? 'एमएसएमई 50% शुल्क रियायत' : 'MSME 50% Fee Concessions'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleOpenModule('qco')}>
                  {isHi ? 'अनिवार्य QCO आदेश व कटऑफ' : 'Mandatory Gazette QCO Orders'}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Digital Tools & Portals */}
          <div className="footer-col">
            <h4 className="footer-col-title">{isHi ? 'डिजिटल सेवाएं' : 'Digital Services'}</h4>
            <ul className="footer-links">
              <li>
                <button type="button" onClick={() => handleOpenModule('assistant')}>
                  {isHi ? 'एआई वॉइस सलाहकार' : 'Voice AI Consultant (Bilingual)'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleOpenModule('standards')}>
                  {isHi ? 'मानक संग्रह डायरेक्टरी (KYS)' : 'Standards Catalogue (KYS)'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleOpenModule('qco')}>
                  {isHi ? 'राजपत्र QCO आदेश ट्रैकर' : 'Gazette QCO Orders Tracker'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleOpenModule('calculator')}>
                  {isHi ? 'अंकन एवं निरीक्षण शुल्क गणक' : 'Marking Fee & Subsidy Estimator'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleOpenModule('laboratories')}>
                  {isHi ? 'एनएबीएल / बीआईएस प्रयोगशालाएं' : 'NABL / BIS Lab Locator'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleOpenModule('audit')}>
                  {isHi ? 'फैक्ट्री ऑडिट सिम्युलेटर' : 'Factory Audit Simulator'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleOpenModule('dossier')}>
                  {isHi ? 'तकनीकी डोजियर बिल्डर (Form-V)' : 'Technical Dossier Builder (Form-V)'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleOpenModule('calendar')}>
                  {isHi ? 'विनियामक अनुपालन कैलेंडर' : 'Regulatory Compliance Calendar'}
                </button>
              </li>
              <li>
                <a href="https://www.manakonline.in" target="_blank" rel="noopener noreferrer">
                  {isHi ? 'मानकऑनलाइन (e-BIS पोर्टल)' : 'Manakonline Portal (e-BIS)'} ↗
                </a>
              </li>
              <li>
                <a href="https://www.crsbis.in" target="_blank" rel="noopener noreferrer">
                  {isHi ? 'सीआरएस इलेक्ट्रॉनिक्स पोर्टल' : 'CRS Electronics Portal'} ↗
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Statutory & Legal */}
          <div className="footer-col">
            <h4 className="footer-col-title">{isHi ? 'अधिनियम एवं विनियम' : 'Statutory & Regulatory'}</h4>
            <ul className="footer-links">
              <li>
                <button type="button" onClick={() => handleOpenModule('documents')}>
                  {isHi ? 'भारतीय मानक ब्यूरो अधिनियम, 2016' : 'BIS Act, 2016 Legal Text'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleOpenModule('qco')}>
                  {isHi ? 'धारा 16: अनिवार्य क्यूसीओ आदेश' : 'Section 16: Mandatory QCOs'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleOpenModule('documents')}>
                  {isHi ? 'धारा 29: दंडात्मक प्रावधान' : 'Section 29: Penal Provisions'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleOpenModule('testing')}>
                  {isHi ? 'अनुरूपता मूल्यांकन विनियम 2018' : 'Conformity Assessment 2018'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleOpenModule('documents')}>
                  {isHi ? 'आधिकारिक उत्पाद मैनुअल व दिशानिर्देश' : 'Official Product Manuals & Guidelines'}
                </button>
              </li>
              <li>
                <a href="https://www.bis.gov.in" target="_blank" rel="noopener noreferrer">
                  {isHi ? 'बीआईएस आधिकारिक वेबसाइट (bis.gov.in)' : 'BIS Official Portal (bis.gov.in)'} ↗
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Helpdesk & Central Contact */}
          <div className="footer-col footer-col-contact">
            <h4 className="footer-col-title">{isHi ? 'संपर्क एवं सहायता' : 'Contact & Helpdesk'}</h4>
            <div className="footer-contact-item">
              <span className="contact-icon">📍</span>
              <div>
                <strong>{isHi ? 'मुख्यालय' : 'Central HQ'}:</strong>
                <p>{isHi ? 'मानक भवन, 9 बहादुर शाह जफर मार्ग, नई दिल्ली 110002' : 'Manak Bhavan, 9 Bahadur Shah Zafar Marg, New Delhi 110002'}</p>
              </div>
            </div>
            <div className="footer-contact-item">
              <span className="contact-icon">📞</span>
              <div>
                <strong>{isHi ? 'टोल-फ्री हेल्पलाइन' : 'Toll-Free Helpline'}:</strong>
                <p><a href="tel:1915">1915</a> / <a href="tel:+911123230131">+91 11 2323 0131</a></p>
              </div>
            </div>
            <div className="footer-contact-item">
              <span className="contact-icon">✉️</span>
              <div>
                <strong>{isHi ? 'आधिकारिक ईमेल' : 'Support Email'}:</strong>
                <p><a href="mailto:info@bis.gov.in">info@bis.gov.in</a></p>
              </div>
            </div>
            <div className="footer-contact-item">
              <span className="contact-icon">🕒</span>
              <div>
                <strong>{isHi ? 'कार्यालय समय' : 'Working Hours'}:</strong>
                <p>{isHi ? 'सोम - शुक्र: सुबह 9:00 से शाम 5:30 IST' : 'Mon – Fri: 09:00 AM – 05:30 PM IST'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="heritage-footer-divider" />

        {/* Bottom Bar with Socials, Legal, & Copyright */}
        <div className="heritage-footer-bottom">
          <div className="footer-bottom-left">
            <p className="copyright-text">
              © {new Date().getFullYear()} <strong>BIS Saarthi</strong>. {isHi ? 'भारतीय मानक ब्यूरो अधिनियम, 2016 के संदर्भ में विकसित।' : 'Bureau of Indian Standards & National Quality Mission.'}
            </p>
            <span className="footer-subtext">
              {isHi ? 'विकसित भारत 2047 के निर्माण में समर्पित • भारत में निर्मित' : 'Dedicated to Viksit Bharat 2047 & Atmanirbhar Bharat • Made in India'}
            </span>
          </div>

          <div className="footer-socials">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter" title="X / Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" title="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" title="YouTube">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </div>

          <nav className="footer-legal-links" aria-label="Footer Legal Links">
            <button type="button" onClick={() => handleOpenModule('documents')} className="legal-link">
              {isHi ? 'गोपनीयता नीति' : 'Privacy Policy'}
            </button>
            <span className="dot-sep">•</span>
            <button type="button" onClick={() => handleOpenModule('documents')} className="legal-link">
              {isHi ? 'उपयोग की शर्तें' : 'Terms of Service'}
            </button>
            <span className="dot-sep">•</span>
            <button type="button" onClick={() => handleOpenModule('documents')} className="legal-link">
              {isHi ? 'हाइपरलिंकिंग नीति' : 'Hyperlink Policy'}
            </button>
            <span className="dot-sep">•</span>
            <button type="button" onClick={() => handleOpenModule('documents')} className="legal-link">
              {isHi ? 'अस्वीकरण' : 'Disclaimer'}
            </button>
            <span className="dot-sep">•</span>
            <button type="button" onClick={() => scrollToSection('tools-section')} className="legal-link">
              {isHi ? 'साइटमैप' : 'Sitemap'}
            </button>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default WovenLanding;
