"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { KeyRound, Loader2, Lock, Mail, User } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useAppState } from "@/components/providers/AppStateProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError, apiFetch, setSession, SessionUser } from "@/lib/api";

type AuthView = "login" | "signup" | "otp" | "forgot" | "reset";

interface AuthResponse {
  message: string;
  token: string;
  user: SessionUser;
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

/* ---------------------------------- Page shell ---------------------------------- */

export default function AuthPage() {
  return (
    <>
      <AppHeader />
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Suspense fallback={<CenteredLoader />}>
          <AuthPageContent />
        </Suspense>
      </GoogleOAuthProvider>
    </>
  );
}

function CenteredLoader() {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-6">
      <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
    </div>
  );
}

/* ---------------------------------- Shared field ---------------------------------- */

function TextField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  icon: Icon,
  required = true,
  minLength,
  maxLength,
  inputMode,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  icon?: React.ComponentType<{ className?: string }>;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-gray-500">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />}
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          inputMode={inputMode}
          className={`bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-colors w-full ${
            Icon ? "pl-11" : ""
          }`}
        />
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="h-px flex-1 bg-white/10" />
      <span className="text-xs uppercase tracking-wide text-gray-500">or</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

/* ---------------------------------- Content ---------------------------------- */

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, setCurrentUser, isAuthInitialized } = useAppState();
  const toast = useToast();

  const [view, setView] = useState<AuthView>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google's rendered sign-in button is an iframe with a fixed pixel width
  // (no auto/percentage support), so it doesn't shrink with its container
  // on its own — measure the wrapper and re-render the button at that width
  // whenever it changes, clamped to Google's documented 200–400px range.
  const googleBtnWrapRef = useRef<HTMLDivElement>(null);
  const [googleBtnWidth, setGoogleBtnWidth] = useState(336);

  useEffect(() => {
    const el = googleBtnWrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setGoogleBtnWidth(Math.round(Math.min(400, Math.max(200, width))));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Deep-link into signup on first mount only, e.g. /auth?view=signup
  useEffect(() => {
    if (searchParams.get("view") === "signup") {
      setView("signup");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Already signed in — bounce away from the auth page entirely.
  useEffect(() => {
    if (isAuthInitialized && currentUser) {
      router.replace("/");
    }
  }, [isAuthInitialized, currentUser, router]);

  if (!isAuthInitialized || currentUser) {
    return <CenteredLoader />;
  }

  function switchView(next: AuthView) {
    setError(null);
    setView(next);
  }

  function completeAuth(user: SessionUser, token: string) {
    setSession(user, token);
    setCurrentUser(user);
    router.replace(user.role === "Admin" ? "/admin" : "/");
  }

  function messageFromError(err: unknown, fallback: string) {
    return err instanceof ApiError ? err.message : fallback;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
      });
      completeAuth(res.user, res.token);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        // Account exists but isn't OTP-verified yet — route into verification.
        setError(`${err.message} Enter the code we sent you to verify your account.`);
        setView("otp");
      } else {
        setError(messageFromError(err, "Something went wrong. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: { email, password, name, role: "Customer" },
        auth: false,
      });
      toast.success("We sent a verification code to your email.");
      setView("otp");
    } catch (err) {
      setError(messageFromError(err, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<AuthResponse>("/auth/verify-otp", {
        method: "POST",
        body: { email, otp },
        auth: false,
      });
      completeAuth(res.user, res.token);
    } catch (err) {
      setError(messageFromError(err, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: { email },
        auth: false,
      });
      toast.success("We sent a password reset code to your email.");
      setView("reset");
    } catch (err) {
      setError(messageFromError(err, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: { email, otp, newPassword },
        auth: false,
      });
      setPassword("");
      setOtp("");
      setNewPassword("");
      setView("login");
      toast.success("Password reset. Please sign in.");
    } catch (err) {
      setError(messageFromError(err, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credential?: string) {
    if (!credential) {
      setError("Google sign-in failed. Please try again.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<AuthResponse>("/auth/google", {
        method: "POST",
        body: { credential, role: "Customer" },
        auth: false,
      });
      completeAuth(res.user, res.token);
    } catch (err) {
      setError(messageFromError(err, "Google sign-in failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  const copy: Record<AuthView, { title: string; subtitle: string }> = {
    login: { title: "Welcome back", subtitle: "Sign in to continue to NexusCart." },
    signup: { title: "Create an account", subtitle: "Join NexusCart to start shopping." },
    otp: {
      title: "Verify your email",
      subtitle: email ? `Enter the code we sent to ${email}.` : "Enter the verification code we emailed you.",
    },
    forgot: { title: "Reset your password", subtitle: "Enter your email and we'll send you a reset code." },
    reset: {
      title: "Set a new password",
      subtitle: email ? `Enter the code sent to ${email} and choose a new password.` : "Enter your reset code and choose a new password.",
    },
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/Logo/Logo%20with%20out%20Text.png"
            alt="NexusCart"
            className="h-10 w-10 object-contain mb-5"
          />
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white text-center">
            {copy[view].title}
          </h1>
          <p className="text-sm text-gray-400 mt-2 text-center">{copy[view].subtitle}</p>
        </div>

        <div className="bg-[#111113] border border-white/10 rounded-2xl p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl px-4 py-3 mb-6">
              {error}
            </div>
          )}

          {(view === "login" || view === "signup") && (
            <>
              <div ref={googleBtnWrapRef} className="flex justify-center">
                <GoogleLogin
                  onSuccess={(credentialResponse) => handleGoogleSuccess(credentialResponse.credential)}
                  onError={() => setError("Google sign-in failed. Please try again.")}
                  theme="filled_black"
                  shape="pill"
                  text={view === "signup" ? "signup_with" : "signin_with"}
                  logo_alignment="center"
                  width={String(googleBtnWidth)}
                />
              </div>
              <Divider />
            </>
          )}

          {view === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <TextField
                id="login-email"
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
                icon={Mail}
              />
              <TextField
                id="login-password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoComplete="current-password"
                icon={Lock}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading ? "..." : "Sign in"}
              </button>
              <div className="flex items-center justify-between text-sm mt-1">
                <button
                  type="button"
                  onClick={() => switchView("forgot")}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => switchView("signup")}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Don&apos;t have an account? <span className="text-white">Sign up</span>
                </button>
              </div>
            </form>
          )}

          {view === "signup" && (
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <TextField
                id="signup-name"
                label="Name"
                value={name}
                onChange={setName}
                placeholder="Jane Doe"
                autoComplete="name"
                icon={User}
              />
              <TextField
                id="signup-email"
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
                icon={Mail}
              />
              <TextField
                id="signup-password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoComplete="new-password"
                icon={Lock}
                minLength={6}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading ? "..." : "Create account"}
              </button>
              <div className="text-center text-sm mt-1">
                <button
                  type="button"
                  onClick={() => switchView("login")}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Already have an account? <span className="text-white">Sign in</span>
                </button>
              </div>
            </form>
          )}

          {view === "otp" && (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <TextField
                id="otp-code"
                label="Verification code"
                value={otp}
                onChange={(v) => setOtp(v.replace(/[^0-9]/g, ""))}
                placeholder="123456"
                autoComplete="one-time-code"
                icon={KeyRound}
                inputMode="numeric"
                maxLength={6}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading ? "..." : "Verify"}
              </button>
              <div className="text-center text-sm mt-1">
                <button
                  type="button"
                  onClick={() => switchView("login")}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            </form>
          )}

          {view === "forgot" && (
            <form onSubmit={handleForgot} className="flex flex-col gap-4">
              <TextField
                id="forgot-email"
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
                icon={Mail}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading ? "..." : "Send reset code"}
              </button>
              <div className="text-center text-sm mt-1">
                <button
                  type="button"
                  onClick={() => switchView("login")}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            </form>
          )}

          {view === "reset" && (
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <TextField
                id="reset-otp"
                label="Reset code"
                value={otp}
                onChange={(v) => setOtp(v.replace(/[^0-9]/g, ""))}
                placeholder="123456"
                autoComplete="one-time-code"
                icon={KeyRound}
                inputMode="numeric"
                maxLength={6}
              />
              <TextField
                id="reset-new-password"
                label="New password"
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="••••••••"
                autoComplete="new-password"
                icon={Lock}
                minLength={6}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading ? "..." : "Reset password"}
              </button>
              <div className="text-center text-sm mt-1">
                <button
                  type="button"
                  onClick={() => switchView("login")}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
