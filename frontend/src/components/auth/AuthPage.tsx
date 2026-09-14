import React from "react";
import AuthSwitch from "@/components/ui/auth-switch";
import { CinematicThemeToggler } from "@/components/ui/cinematic-theme-toggler";
import { Languages, ArrowLeft } from "lucide-react";

export interface AuthPageProps {
  onSuccess: (email: string, user?: any) => void;
  onBackToLanding: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  language: "en" | "hi";
  setLanguage: (lang: "en" | "hi") => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onSuccess,
  onBackToLanding,
  isDark,
  onToggleTheme,
  language,
  setLanguage,
}) => {
  const isHi = language === "hi";

  return (
    <div className="heritage-landing-container heritage-auth-container h-screen h-[100dvh] max-h-screen overflow-hidden flex flex-col justify-between">
      {/* ─── FLOATING CAPSULE HERITAGE TOP NAVBAR ─── */}
      <header className="heritage-navbar shrink-0">
        <div className="heritage-nav-inner">
          {/* Brand Logo & Name */}
          <div
            className="heritage-nav-brand min-w-0 cursor-pointer"
            onClick={onBackToLanding}
            title={isHi ? "लैंडिंग पेज पर लौटें" : "Return to Landing Page"}
          >
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
              <span className="heritage-nav-brand-title truncate">
                {isHi ? "बीआईएस सारथी" : "BIS Saarthi"}
              </span>
            </div>
          </div>

          {/* Right Action Tools: Return to Landing, Language, Theme */}
          <div className="heritage-nav-actions shrink-0 flex items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              onClick={onBackToLanding}
              className="heritage-nav-icon-btn shrink-0"
              title={isHi ? "लैंडिंग पेज पर लौटें" : "Return to Landing Page"}
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{isHi ? "लैंडिंग पेज" : "Back to Landing"}</span>
            </button>

            <button
              type="button"
              onClick={() => setLanguage(isHi ? "en" : "hi")}
              className="heritage-nav-icon-btn shrink-0"
              title={isHi ? "Switch to English" : "हिंदी में बदलें"}
            >
              <Languages className="w-3.5 h-3.5 shrink-0" />
              <span>{isHi ? "EN" : "हिन्दी"}</span>
            </button>

            <div className="heritage-theme-toggle-wrap shrink-0">
              <CinematicThemeToggler
                isDark={isDark}
                onToggle={onToggleTheme}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Center Stage: Fits within viewport, no scrolling */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-2 sm:p-3 md:p-4 overflow-hidden">
        <AuthSwitch
          onSuccess={onSuccess}
          onBackToLanding={onBackToLanding}
          isDark={isDark}
          language={language}
        />
      </main>

      {/* Compact Heritage Footer: Never pushes page into scrolling */}
      <footer className="relative z-10 py-1.5 px-4 text-center text-[10px] sm:text-[11px] font-mono border-t border-[rgba(23,90,103,0.18)] dark:border-[rgba(56,189,248,0.18)] text-[var(--ink-soft)] bg-[rgba(234,227,222,0.65)] dark:bg-[rgba(6,14,23,0.7)] backdrop-blur-md shrink-0">
        <p>
          © {new Date().getFullYear()} BIS Saarthi (बीआईएस सारथी) • Bureau of Indian Standards • BIS Act 2016 • PS 26107
        </p>
      </footer>
    </div>
  );
};

export default AuthPage;
