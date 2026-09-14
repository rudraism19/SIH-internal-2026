import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  authSignIn,
  authSignUp,
  authGoogleSignIn,
  authResendVerification,
  authInstantActivate,
} from "@/services/api";

export interface AuthSwitchProps {
  onSuccess?: (email: string, user?: any) => void;
  onBackToLanding?: () => void;
  isDark?: boolean;
  language?: "en" | "hi";
  className?: string;
}

export const AuthSwitch: React.FC<AuthSwitchProps> = ({
  onSuccess,
  onBackToLanding,
  isDark = true,
  language = "en",
  className,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email link verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationActionLink, setVerificationActionLink] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isInstantActivating, setIsInstantActivating] = useState(false);

  const isHi = language === "hi";

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ─── EMAIL LINK VERIFICATION HANDLERS ───────────────────────────────────────
  const handleResendVerification = async () => {
    if (resendCooldown > 0 || !verificationEmail) return;
    clearMessages();
    setIsResending(true);
    try {
      const res = await authResendVerification(verificationEmail);
      if (res.success) {
        if (res.action_link) setVerificationActionLink(res.action_link);
        setSuccessMessage(
          isHi
            ? "सत्यापन लिंक आपके ईमेल पर पुनः भेजा गया है!"
            : "A fresh verification link has been sent to your email!"
        );
        setResendCooldown(60);
      } else {
        setErrorMessage(res.error || (isHi ? "पुनः भेजने में त्रुटि।" : "Failed to resend verification link."));
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to resend verification link.");
    } finally {
      setIsResending(false);
    }
  };

  const handleInstantActivate = async () => {
    if (!verificationEmail) return;
    clearMessages();
    setIsInstantActivating(true);
    try {
      if (verificationActionLink) {
        window.location.href = verificationActionLink;
        return;
      }
      const res = await authInstantActivate(verificationEmail);
      if (res.success) {
        setSuccessMessage(
          isHi
            ? "खाता सफलतापूर्वक सक्रिय किया गया! वर्कस्पेस खुल रहा है..."
            : "Account successfully activated! Opening workspace..."
        );
        if (res.action_link) {
          window.location.href = res.action_link;
        } else {
          setIsVerifying(false);
          setIsSignUp(false);
          setEmail(verificationEmail);
        }
      } else {
        setErrorMessage(res.error || (isHi ? "सक्रियण विफल रहा।" : "Activation failed."));
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to activate account.");
    } finally {
      setIsInstantActivating(false);
    }
  };

  // ─── SIGN IN & SIGN UP HANDLERS ────────────────────────────────────────────
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const res = await authSignIn(email.trim(), password);
      if (res.requires_verification) {
        setVerificationEmail(email.trim());
        if (res.action_link) setVerificationActionLink(res.action_link);
        setIsVerifying(true);
        setErrorMessage(
          res.error ||
            (isHi
              ? "आपका ईमेल अभी सत्यापित नहीं है। कृपया इनबॉक्स में लिंक देखें या त्वरित सक्रियण का उपयोग करें।"
              : "Your email is not verified yet. Please check your inbox or use instant activation.")
        );
        return;
      }

      if (res.success && res.user) {
        if (res.access_token) {
          localStorage.setItem("bis_user_token", res.access_token);
        }
        localStorage.setItem("bis_user_email", res.user.email);
        localStorage.setItem("bis_user_profile", JSON.stringify(res.user));
        setSuccessMessage(isHi ? "सफलतापूर्वक लॉगिन किया गया!" : "Signed in successfully!");
        setTimeout(() => {
          onSuccess?.(res.user!.email, res.user);
        }, 400);
      } else {
        setErrorMessage(res.error || (isHi ? "लॉगिन विफल रहा। कृपया विवरण जांचें।" : "Invalid email or password."));
      }
    } catch (err: any) {
      setErrorMessage(err.message || (isHi ? "प्रमाणीकरण सर्वर से कनेक्ट करने में असमर्थ।" : "Failed to connect to authentication server."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (password.length < 6) {
      setErrorMessage(isHi ? "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।" : "Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authSignUp({
        email: email.trim(),
        password,
        full_name: name.trim() || undefined,
      });

      if (res.requires_verification) {
        setVerificationEmail(email.trim());
        setVerificationActionLink(res.action_link || null);
        setIsVerifying(true);
        setSuccessMessage(
          res.message ||
            (isHi
              ? "सत्यापन लिंक आपके ईमेल पर भेजा गया है। कृपया अपना इनबॉक्स जांचें।"
              : "A verification link has been sent to your email. Please check your inbox.")
        );
        return;
      }

      if (res.success && res.user) {
        if (res.access_token) {
          localStorage.setItem("bis_user_token", res.access_token);
        }
        localStorage.setItem("bis_user_email", res.user.email);
        localStorage.setItem("bis_user_profile", JSON.stringify(res.user));
        setSuccessMessage(isHi ? "खाता सफलतापूर्वक बन गया!" : "Account created successfully!");
        setTimeout(() => {
          onSuccess?.(res.user!.email, res.user);
        }, 450);
      } else {
        setErrorMessage(res.error || (isHi ? "पंजीकरण विफल रहा।" : "Registration failed."));
      }
    } catch (err: any) {
      setErrorMessage(err.message || (isHi ? "सर्वर त्रुटि।" : "Failed to connect to authentication server."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearMessages();
    setIsLoading(true);

    try {
      const promptEmail = prompt(
        isHi
          ? "अपना आधिकारिक Google ईमेल दर्ज करें:"
          : "Enter your Google account email to sign in via Supabase:"
      );
      if (!promptEmail || !promptEmail.trim()) {
        setIsLoading(false);
        return;
      }
      const res = await authGoogleSignIn({
        email: promptEmail.trim(),
        full_name: promptEmail.split("@")[0],
      });
      if (res.success && res.user) {
        localStorage.setItem("bis_user_email", res.user.email);
        localStorage.setItem("bis_user_profile", JSON.stringify(res.user));
        setSuccessMessage(isHi ? "Google से लॉगिन सफल!" : "Google sign in successful!");
        setTimeout(() => {
          onSuccess?.(res.user!.email, res.user);
        }, 400);
      } else {
        setErrorMessage(res.error || "Google authentication failed.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Google sign in error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "heritage-auth-card relative w-full max-w-[900px] max-h-[calc(100dvh-95px)] rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-500 shadow-2xl flex flex-col justify-center",
        className
      )}
    >
      {/* Top Mobile Brand Bar (Visible on small screens) */}
      <div className="md:hidden flex items-center justify-between px-4 py-2.5 border-b border-[rgba(23,90,103,0.18)] dark:border-[rgba(56,189,248,0.2)] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full border border-[rgba(23,90,103,0.25)] dark:border-[rgba(56,189,248,0.3)] bg-[rgba(23,90,103,0.08)] dark:bg-[rgba(56,189,248,0.12)] flex items-center justify-center p-1 shrink-0">
            <svg
              className="w-3.5 h-4.5 text-[var(--ink)] dark:text-[#38bdf8] shrink-0"
              width="14"
              height="18"
              viewBox="0 0 96 120"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <ellipse cx="48" cy="60" rx="45" ry="57" />
              <path d="M48 88V46" strokeLinecap="round" />
              <path d="M48 58c-8-2-14-8-16-16 9 0 15 5 16 16Zm0 0c8-2 14-8 16-16-9 0-15 5-16 16Z" />
              <path d="M48 74c-9-2-15-8-17-17 10 0 16 6 17 17Zm0 0c9-2 15-8 17-17-10 0-16 6-17 17Z" />
            </svg>
          </div>
          <span className="font-serif font-bold text-sm text-[var(--ink)] dark:text-[#38bdf8]">
            {isHi ? "बीआईएस सारथी" : "BIS Saarthi"}
          </span>
        </div>
        {!isVerifying && (
          <div className="flex bg-[rgba(23,90,103,0.08)] dark:bg-[rgba(56,189,248,0.1)] p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                clearMessages();
                setIsSignUp(false);
              }}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all text-xs",
                !isSignUp
                  ? "heritage-auth-btn-primary !text-white shadow-xs"
                  : "text-[var(--ink-soft)] dark:text-slate-400"
              )}
            >
              {isHi ? "साइन इन" : "Sign In"}
            </button>
            <button
              type="button"
              onClick={() => {
                clearMessages();
                setIsSignUp(true);
              }}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all text-xs",
                isSignUp
                  ? "heritage-auth-btn-primary !text-white shadow-xs"
                  : "text-[var(--ink-soft)] dark:text-slate-400"
              )}
            >
              {isHi ? "रजिस्टर" : "Sign Up"}
            </button>
          </div>
        )}
      </div>

      {isVerifying ? (
        /* ========================================================================= */
        /* EMAIL VERIFICATION SCREEN (Supabase Email Confirmation Link)              */
        /* ========================================================================= */
        <div className="p-6 sm:p-8 md:p-10 flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[rgba(23,90,103,0.12)] dark:bg-[rgba(56,189,248,0.15)] border border-[rgba(23,90,103,0.25)] dark:border-[rgba(56,189,248,0.3)] flex items-center justify-center text-[var(--ink)] dark:text-[#38bdf8] shadow-lg">
              <Mail className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-teal-600/30 bg-teal-600/10 text-teal-700 dark:text-teal-400 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isHi ? "ईमेल लिंक सत्यापन" : "Email Verification"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[var(--ink)] dark:text-[#38bdf8]">
              {isHi ? "सत्यापन एवं सक्रियण" : "Verify & Activate Account"}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] dark:text-slate-300 mt-1 max-w-md">
              {isHi ? "सत्यापन अनुरोध खाता:" : "Verification for account:"}
            </p>
            <div className="mt-2 inline-block px-3.5 py-1.5 rounded-lg bg-[rgba(23,90,103,0.08)] dark:bg-[rgba(56,189,248,0.1)] border border-[rgba(23,90,103,0.2)] dark:border-[rgba(56,189,248,0.25)] font-mono text-xs font-bold text-[var(--ink)] dark:text-[#38bdf8]">
              {verificationEmail}
            </div>
          </div>

          {errorMessage && (
            <div className="w-full p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-tight font-medium">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="w-full p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-start gap-2 text-left">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-tight font-medium">{successMessage}</span>
            </div>
          )}

          {/* Instant 1-Click Activation */}
          <div className="w-full p-4 rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-amber-500/10 dark:from-teal-500/20 dark:via-emerald-500/10 dark:to-amber-500/20 space-y-2.5 text-left shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-300">
                <Zap className="w-4 h-4 text-amber-500 shrink-0 fill-amber-500" />
                <span>{isHi ? "ईमेल नहीं आया? तुरंत 1-क्लिक सक्रिय करें" : "Didn't receive email? Instant 1-Click Activation"}</span>
              </div>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-semibold">
                Fast Track
              </span>
            </div>
            <p className="text-[11px] text-[var(--ink-soft)] dark:text-slate-300 leading-relaxed">
              {isHi
                ? "बिना प्रतीक्षा किए तुरंत अपने खाते को सक्रिय करें और वर्कस्पेस में प्रवेश करें:"
                : "Instantly activate your account and access the workspace right now:"}
            </p>
            <button
              type="button"
              onClick={handleInstantActivate}
              disabled={isInstantActivating}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
            >
              {isInstantActivating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{isHi ? "खाता सीधे तुरंत सक्रिय करें" : "Activate & Open Workspace Instantly"}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </>
              )}
            </button>
          </div>

          {/* Action buttons */}
          <div className="w-full flex flex-col sm:flex-row items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendCooldown > 0 || isResending}
              className="w-full sm:w-1/2 h-9 sm:h-10 px-4 rounded-xl border border-[rgba(23,90,103,0.25)] dark:border-[rgba(56,189,248,0.3)] bg-[rgba(23,90,103,0.06)] dark:bg-[rgba(56,189,248,0.1)] hover:bg-[rgba(23,90,103,0.12)] text-[var(--ink)] dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 shrink-0", isResending && "animate-spin")} />
              <span>
                {resendCooldown > 0
                  ? isHi
                    ? `${resendCooldown}s में पुनः भेजें`
                    : `Resend in ${resendCooldown}s`
                  : isHi
                  ? "लिंक पुनः भेजें"
                  : "Resend Email Link"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                clearMessages();
                setIsVerifying(false);
              }}
              className="heritage-auth-btn-primary w-full sm:w-1/2 h-9 sm:h-10 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>{isHi ? "साइन इन पर लौटें" : "Back to Sign In"}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative w-full flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
          {/* ========================================================================= */}
          {/* LEFT PANEL: Sign In Form                                                  */}
          {/* ========================================================================= */}
          <div
            className={cn(
              "w-full md:w-1/2 p-5 sm:p-7 md:p-9 flex flex-col justify-between transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.25,1,0.35,1)] z-10 will-change-transform",
              isSignUp
                ? "md:opacity-0 md:pointer-events-none md:translate-x-[-20px] hidden md:flex"
                : "opacity-100 pointer-events-auto translate-x-0 flex"
            )}
          >
            <div className="space-y-3.5 sm:space-y-4">
              {/* Header */}
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[rgba(23,90,103,0.2)] dark:border-[rgba(56,189,248,0.25)] bg-[rgba(23,90,103,0.08)] dark:bg-[rgba(56,189,248,0.12)] text-[var(--ink)] dark:text-[#38bdf8] text-[11px] font-semibold mb-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>Smart India Hackathon • PS 26107</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-serif text-[var(--ink)] dark:text-[#38bdf8] leading-tight">
                  {isHi ? "बीआईएस सारथी में प्रवेश करें" : "Sign In to BIS Saarthi"}
                </h2>
                <p className="text-[11px] sm:text-xs text-[var(--ink-soft)] dark:text-slate-300 mt-0.5">
                  {isHi
                    ? "22,000+ भारतीय मानक एवं एआई अनुपालन पोर्टल तक पहुंचें"
                    : "Access 22,000+ BIS standards & AI regulatory intelligence"}
                </p>
              </div>

              {/* Status alerts */}
              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight font-medium">{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight font-medium">{successMessage}</span>
                </div>
              )}

              {/* Google Quick Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="heritage-auth-btn-secondary w-full h-9 sm:h-10 px-3 rounded-lg sm:rounded-xl font-medium text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isHi ? "Google खाते से साइन इन करें" : "Sign in with Google"}</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-1 sm:my-1.5">
                <div className="border-t border-[rgba(23,90,103,0.18)] dark:border-[rgba(56,189,248,0.2)] w-full" />
                <span className="bg-transparent px-2.5 text-[10px] uppercase tracking-wider text-[var(--ink-soft)] dark:text-slate-400 font-mono">
                  {isHi ? "या ईमेल से" : "or email"}
                </span>
                <div className="border-t border-[rgba(23,90,103,0.18)] dark:border-[rgba(56,189,248,0.2)] w-full" />
              </div>

              <form onSubmit={handleSignInSubmit} className="space-y-2.5 sm:space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--ink)] dark:text-slate-200">
                    {isHi ? "ईमेल आईडी" : "Email Address"}
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-[var(--ink-soft)] dark:text-slate-400 absolute left-3 pointer-events-none shrink-0" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="heritage-auth-input w-full h-9 sm:h-10 pl-9 pr-3 rounded-lg sm:rounded-xl text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-[var(--ink)] dark:text-slate-200">
                      {isHi ? "पासवर्ड" : "Password"}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          isHi
                            ? "कृपया Google साइन-इन अथवा अपने पंजीकृत ईमेल क्रेडेंशियल्स का उपयोग करें।"
                            : "Please use Google Sign-in or your registered email credentials."
                        )
                      }
                      className="text-[10px] text-[var(--ink)] dark:text-[#38bdf8] font-medium hover:underline cursor-pointer"
                    >
                      {isHi ? "पासवर्ड भूल गए?" : "Forgot password?"}
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[var(--ink-soft)] dark:text-slate-400 absolute left-3 pointer-events-none shrink-0" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="heritage-auth-input w-full h-9 sm:h-10 pl-9 pr-9 rounded-lg sm:rounded-xl text-xs sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 p-1 text-[var(--ink-soft)] hover:text-[var(--ink)] dark:text-slate-400 dark:hover:text-[#38bdf8] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5 shrink-0" /> : <Eye className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="heritage-auth-btn-primary w-full h-9 sm:h-10 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer mt-1"
                >
                  {isLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isHi ? "पोर्टल में प्रवेश करें" : "Sign In to Portal"}</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Footer Back link */}
            {onBackToLanding && (
              <div className="pt-3 mt-2 border-t border-[rgba(23,90,103,0.15)] dark:border-[rgba(56,189,248,0.2)] flex items-center justify-center text-[11px] text-[var(--ink-soft)] dark:text-slate-400">
                <button
                  type="button"
                  onClick={onBackToLanding}
                  className="flex items-center gap-1.5 hover:text-[var(--ink)] dark:hover:text-[#38bdf8] transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                  <span>{isHi ? "लैंडिंग पेज पर लौटें" : "Back to Landing Page"}</span>
                </button>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* RIGHT PANEL: Sign Up Form (Firm & Role Removed)                           */}
          {/* ========================================================================= */}
          <div
            className={cn(
              "w-full md:w-1/2 p-5 sm:p-7 md:p-9 flex flex-col justify-between transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.25,1,0.35,1)] z-10 will-change-transform",
              !isSignUp
                ? "md:opacity-0 md:pointer-events-none md:translate-x-[20px] hidden md:flex"
                : "opacity-100 pointer-events-auto translate-x-0 flex"
            )}
          >
            <div className="space-y-3.5 sm:space-y-4">
              {/* Header */}
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold mb-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>{isHi ? "नया उपयोगकर्ता पंजीकरण" : "New User Registration"}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-serif text-[var(--ink)] dark:text-[#38bdf8] leading-tight">
                  {isHi ? "खाता बनाएं" : "Create an Account"}
                </h2>
                <p className="text-[11px] sm:text-xs text-[var(--ink-soft)] dark:text-slate-300 mt-0.5">
                  {isHi
                    ? "त्वरित पंजीकरण • नाम, ईमेल एवं पासवर्ड दर्ज करें"
                    : "Fast signup • Enter your name, email and password"}
                </p>
              </div>

              {/* Status alerts */}
              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight font-medium">{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight font-medium">{successMessage}</span>
                </div>
              )}

              {/* Clean Registration Form (Firm & Role completely removed) */}
              <form onSubmit={handleSignUpSubmit} className="space-y-2.5 sm:space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--ink)] dark:text-slate-200">
                    {isHi ? "पूरा नाम" : "Full Name"}
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-3.5 h-3.5 text-[var(--ink-soft)] dark:text-slate-400 absolute left-3 pointer-events-none shrink-0" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isHi ? "उदा. राजेश शर्मा" : "e.g. Rajesh Sharma"}
                      className="heritage-auth-input w-full h-9 sm:h-10 pl-9 pr-3 rounded-lg sm:rounded-xl text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--ink)] dark:text-slate-200">
                    {isHi ? "ईमेल पता" : "Email Address"}
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-3.5 h-3.5 text-[var(--ink-soft)] dark:text-slate-400 absolute left-3 pointer-events-none shrink-0" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="heritage-auth-input w-full h-9 sm:h-10 pl-9 pr-3 rounded-lg sm:rounded-xl text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--ink)] dark:text-slate-200">
                    {isHi ? "पासवर्ड बनाएं" : "Create Password"}
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-3.5 h-3.5 text-[var(--ink-soft)] dark:text-slate-400 absolute left-3 pointer-events-none shrink-0" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isHi ? "न्यूनतम 6 अक्षर" : "Min. 6 characters"}
                      className="heritage-auth-input w-full h-9 sm:h-10 pl-9 pr-9 rounded-lg sm:rounded-xl text-xs sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 p-0.5 text-[var(--ink-soft)] hover:text-[var(--ink)] dark:text-slate-400 dark:hover:text-[#38bdf8] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5 shrink-0" /> : <Eye className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="heritage-auth-btn-primary w-full h-9 sm:h-10 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isHi ? "पंजीकरण करें एवं शुरू करें" : "Register & Start Exploring"}</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="pt-2 border-t border-[rgba(23,90,103,0.15)] dark:border-[rgba(56,189,248,0.2)] text-[10px] text-center text-[var(--ink-soft)] dark:text-slate-400">
              <span>
                {isHi
                  ? "पंजीकरण द्वारा आप BIS अधिनियम 2016 दिशानिर्देशों से सहमत होते हैं।"
                  : "By registering, you comply with BIS Act 2016 statutory terms."}
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* DESKTOP BRAND OVERLAY PANEL (Teal / Amber Heritage Sliding)                */}
          {/* ========================================================================= */}
          <div
            className={cn(
              "hidden md:flex absolute top-0 bottom-0 left-0 w-1/2 transition-transform duration-[1000ms] ease-[cubic-bezier(0.25,1,0.35,1)] z-20 flex-col justify-between p-6 sm:p-8 text-white overflow-hidden shadow-2xl will-change-transform",
              isSignUp
                ? "translate-x-0 heritage-auth-overlay-alt"
                : "translate-x-full heritage-auth-overlay-teal"
            )}
          >
            {/* Subtle Corner BIS Lotus Crest Watermark */}
            <svg
              className="absolute -right-8 -bottom-8 w-56 h-64 text-white opacity-[0.08] pointer-events-none"
              width="224"
              height="256"
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

            {/* Top Brand identity */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center p-1 shrink-0">
                  <svg
                    className="w-4 h-5 text-amber-300 shrink-0"
                    width="16"
                    height="20"
                    viewBox="0 0 96 120"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <ellipse cx="48" cy="60" rx="45" ry="57" />
                    <path d="M48 88V46" strokeLinecap="round" />
                    <path d="M48 58c-8-2-14-8-16-16 9 0 15 5 16 16Zm0 0c8-2 14-8 16-16-9 0-15 5-16 16Z" />
                    <path d="M48 74c-9-2-15-8-17-17 10 0 16 6 17 17Zm0 0c9-2 15-8 17-17-10 0-16 6-17 17Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm tracking-tight text-white leading-none">
                    {isHi ? "बीआईएस सारथी" : "BIS Saarthi"}
                  </h3>
                  <p className="text-[10px] text-teal-100/80 font-mono tracking-wider">
                    Bureau of Indian Standards
                  </p>
                </div>
              </div>

              <div className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 border border-white/25 text-amber-300">
                PS 26107
              </div>
            </div>

            {/* Center Dynamic Content with Smooth Crossfade */}
            <div className="relative z-10 my-auto py-4 min-h-[220px] flex flex-col justify-center">
              {/* 1. When on Sign In: Invitation to Sign Up */}
              <div
                className={cn(
                  "transition-all duration-700 ease-[cubic-bezier(0.25,1,0.35,1)] space-y-3",
                  !isSignUp
                    ? "opacity-100 translate-y-0 relative pointer-events-auto"
                    : "opacity-0 -translate-y-3 absolute inset-0 pointer-events-none flex flex-col justify-center"
                )}
              >
                <h3 className="font-serif text-2xl sm:text-[1.75rem] font-bold tracking-tight text-white leading-snug">
                  {isHi ? "बीआईएस सारथी में नए हैं?" : "New to BIS Saarthi?"}
                </h3>
                <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed max-w-xs">
                  {isHi
                    ? "त्वरित खाता बनाएं और 22,000+ मानकों, लैब उपकरणों और राजपत्र QCO अधिसूचनाओं का लाभ उठाएं।"
                    : "Create an account to unlock Scheme-I test equipment checklists, 50% MSME marking fee concessions, and accredited lab networks."}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setIsSignUp(true);
                    }}
                    className="px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white font-semibold text-xs transition-all border border-white/30 backdrop-blur-md flex items-center gap-2 cursor-pointer shadow-md group"
                  >
                    <span>{isHi ? "नया खाता बनाएं" : "Create an Account"}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-300 shrink-0" />
                  </button>
                </div>
              </div>

              {/* 2. When on Sign Up: Invitation to Sign In */}
              <div
                className={cn(
                  "transition-all duration-700 ease-[cubic-bezier(0.25,1,0.35,1)] space-y-3",
                  isSignUp
                    ? "opacity-100 translate-y-0 relative pointer-events-auto"
                    : "opacity-0 translate-y-3 absolute inset-0 pointer-events-none flex flex-col justify-center"
                )}
              >
                <h3 className="font-serif text-2xl sm:text-[1.75rem] font-bold tracking-tight text-white leading-snug">
                  {isHi ? "पहले से खाता है?" : "Already Registered?"}
                </h3>
                <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed max-w-xs">
                  {isHi
                    ? "अपने क्रेडेंशियल्स अथवा Google खाते से लॉगिन करें और अपने अनुपालन वर्कस्पेस में प्रवेश करें।"
                    : "Sign in with your credentials or Google account to continue where you left off in your compliance workspace."}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setIsSignUp(false);
                    }}
                    className="px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white font-semibold text-xs transition-all border border-white/30 backdrop-blur-md flex items-center gap-2 cursor-pointer shadow-md group"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1.5 transition-transform duration-300 shrink-0" />
                    <span>{isHi ? "लॉगिन पृष्ठ पर जाएं" : "Sign In to Account"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Trust Line */}
            <div className="relative z-10 pt-2.5 border-t border-white/15 flex items-center justify-between text-[10px] text-white/75">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                BIS Act 2016 Compliant
              </span>
              <span>22,000+ Standards</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthSwitch;
