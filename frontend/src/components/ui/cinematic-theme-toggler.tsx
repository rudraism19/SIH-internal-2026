"use client";

import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Particle helpers
// ---------------------------------------------------------------------------
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 0.35,
    duration: 0.35 + Math.random() * 0.4,
  }));
}

// ---------------------------------------------------------------------------
// View Transition theme switcher helper
// ---------------------------------------------------------------------------
export function applyTheme(isDark: boolean) {
  const root = document.documentElement;
  if (isDark) {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
    try {
      localStorage.setItem("theme", "dark");
      localStorage.setItem("bis_theme", "dark");
    } catch {}
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
    try {
      localStorage.setItem("theme", "light");
      localStorage.setItem("bis_theme", "light");
    } catch {}
  }
}

export function initTheme(): boolean {
  const stored = localStorage.getItem("theme") || localStorage.getItem("bis_theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = stored !== null ? stored === "dark" : prefersDark;
  applyTheme(dark);
  return dark;
}

// ---------------------------------------------------------------------------
// Icon components (no lucide dependency needed)
// ---------------------------------------------------------------------------
function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
interface CinematicThemeTogglerProps {
  isDark: boolean;
  onToggle: () => void;
  className?: string;
}

export function CinematicThemeToggler({
  isDark,
  onToggle,
  className,
}: CinematicThemeTogglerProps) {
  const [particles, setParticles] = React.useState<Particle[]>([]);
  const [burst, setBurst] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  const [origin, setOrigin] = React.useState({ x: 0, y: 0 });
  const [coverSize, setCoverSize] = React.useState(0);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // ── Radial fill helpers ───────────────────────────────────────────────────
  function getCoverDiameter(w: number, h: number, x: number, y: number) {
    return Math.ceil(
      2 *
        Math.max(
          Math.hypot(x, y),
          Math.hypot(w - x, y),
          Math.hypot(x, h - y),
          Math.hypot(w - x, h - y)
        )
    );
  }

  const updateOriginFromPointer = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setOrigin({ x, y });
    setCoverSize(getCoverDiameter(rect.width, rect.height, x, y));
  };

  const showFill = hovered || isPressed;

  // ── Click handler: particle burst + Smooth View Transition ───────────────
  const handleClick = () => {
    setBurst(true);
    setParticles(generateParticles(12));
    setTimeout(() => {
      setBurst(false);
      setParticles([]);
    }, 700);

    const buttonEl = buttonRef.current;
    if (
      typeof document.startViewTransition !== "function" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      onToggle();
      return;
    }

    const rect = buttonEl?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth * 0.9;
    const y = rect ? rect.top + rect.height / 2 : 24;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      onToggle();
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 450,
          easing: "cubic-bezier(0.25, 1, 0.35, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  return (
    <button
      ref={buttonRef}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={handleClick}
      onPointerEnter={(e) => {
        updateOriginFromPointer(e);
        setHovered(true);
      }}
      onPointerLeave={() => {
        setHovered(false);
        setIsPressed(false);
      }}
      onPointerDown={(e) => {
        updateOriginFromPointer(e);
        setIsPressed(true);
        setHovered(true);
      }}
      onPointerUp={() => setIsPressed(false)}
      className={cn(
        "relative h-8 w-[60px] rounded-full border overflow-hidden cursor-pointer select-none",
        "transition-all duration-300 shadow-xs flex items-center shrink-0",
        isDark
          ? "bg-slate-900/85 border-[rgba(56,189,248,0.3)] hover:border-[#38bdf8] text-slate-100"
          : "bg-white/85 border-[rgba(23,90,103,0.25)] hover:border-[var(--ink)] text-slate-800",
        className
      )}
    >
      {/* Origin-fill radial ripple */}
      <AnimatePresence>
        {showFill && coverSize > 0 && (
          <motion.span
            key="fill"
            aria-hidden
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full",
              isDark ? "bg-sky-500/40 shadow-[0_0_16px_rgba(56,189,248,0.5)]" : "bg-amber-200/80"
            )}
            style={{
              width: coverSize,
              height: coverSize,
              left: origin.x,
              top: origin.y,
            }}
          />
        )}
      </AnimatePresence>

      {/* Particle burst */}
      <AnimatePresence>
        {burst &&
          particles.map((p) => (
            <motion.span
              key={p.id}
              aria-hidden
              initial={{ x: "50%", y: "50%", opacity: 1, scale: 1 }}
              animate={{ x: `${p.x}%`, y: `${p.y}%`, opacity: 0, scale: 0 }}
              transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
              className={cn(
                "pointer-events-none absolute rounded-full",
                isDark ? "bg-sky-400" : "bg-amber-500"
              )}
              style={{ width: p.size, height: p.size }}
            />
          ))}
      </AnimatePresence>

      {/* Decorative background gradient */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 transition-opacity duration-300 pointer-events-none",
          isDark
            ? "bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950"
            : "bg-gradient-to-r from-amber-50/60 via-white to-amber-50/60"
        )}
      />

      {/* Decorative stars in dark mode */}
      <span aria-hidden className="absolute inset-0 pointer-events-none">
        {isDark && (
          <>
            <span className="absolute top-[30%] left-[16%] w-1 h-1 rounded-full bg-white opacity-80" />
            <span className="absolute top-[65%] left-[24%] w-0.5 h-0.5 rounded-full bg-sky-200 opacity-70" />
            <span className="absolute top-[45%] left-[10%] w-0.5 h-0.5 rounded-full bg-sky-300 opacity-60" />
          </>
        )}
      </span>

      {/* Sliding thumb with Sun / Moon icon */}
      <motion.span
        aria-hidden
        animate={{ x: isDark ? 32 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={cn(
          "absolute top-1 left-0 z-10 flex items-center justify-center rounded-full shadow-md",
          "w-6 h-6 transition-colors duration-300",
          isDark ? "bg-[#38bdf8] text-[#020617]" : "bg-amber-500 text-white"
        )}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.span
              key="moon"
              initial={{ rotate: -30, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 30, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.18 }}
              className="flex items-center justify-center"
            >
              <MoonIcon />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ rotate: 30, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -30, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.18 }}
              className="flex items-center justify-center"
            >
              <SunIcon />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
    </button>
  );
}
