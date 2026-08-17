"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScroll } from "./ScrollProvider";
import { useAppState, cn, PillButton } from "./Shared";
import { X } from "lucide-react";
import { LogoMark } from "./Icons";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

export function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, authView, setAuthView, setCurrentUser } = useAppState();
  const { stopScroll, startScroll } = useScroll();
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role] = useState<"Customer">("Customer");
  const [otp, setOtp] = useState("");
  
  // Business Registration States (Removed, moved to dedicated page)

  useEffect(() => {
    if (isAuthModalOpen) {
      stopScroll();
    } else {
      startScroll();
      if (status !== "idle") {
        setTimeout(() => setStatus("idle"), 300);
      }
      setError(null);
    }
  }, [isAuthModalOpen, stopScroll, startScroll, status]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsAuthModalOpen(false);
    };
    if (isAuthModalOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isAuthModalOpen, setIsAuthModalOpen]);

  // Clean form when view changes
  useEffect(() => {
    setError(null);
    setStatus("idle");
  }, [authView]);

  const apiCall = async (path: string, body: any) => {
    setStatus("loading");
    setError(null);
    try {
      const token = localStorage.getItem("nexus_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/auth/${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "An error occurred");
      setStatus("success");
      return data;
    } catch (err: any) {
      setError(err.message);
      setStatus("idle");
      return null;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await apiCall("login", { email, password });
    if (data) {
      localStorage.setItem("nexus_token", data.token);
      localStorage.setItem("nexus_user", JSON.stringify(data.user));
      setCurrentUser(data.user);
      
      setTimeout(() => {
        setIsAuthModalOpen(false);
        if (data.user.role === "Admin") {
          window.location.href = "/admin";
        }
      }, 1000);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await apiCall("register", { email, password, name, role });
    if (data) {
      setTimeout(() => setAuthView("otp"), 1000);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await apiCall("verify-otp", { email, otp });
    if (data) {
      // User is now created on verify — auto-login
      if (data.token) {
        localStorage.setItem("nexus_token", data.token);
        localStorage.setItem("nexus_user", JSON.stringify(data.user));
        setCurrentUser(data.user);
      }
      setTimeout(() => {
        setIsAuthModalOpen(false);
        if (data.user?.role === "Admin") {
          window.location.href = "/admin";
        }
      }, 1000);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    const data = await apiCall("google", { 
      credential: credentialResponse.credential,
      role: role // only used if signup, but google Auth handles both
    });
    
    if (data) {
      localStorage.setItem("nexus_token", data.token);
      localStorage.setItem("nexus_user", JSON.stringify(data.user));
      setCurrentUser(data.user);
      
      setTimeout(() => {
        setIsAuthModalOpen(false);
        if (data.user.role === "Admin") {
          window.location.href = "/admin";
        }
      }, 1000);
    }
  };



  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await apiCall("forgot-password", { email });
    if (data) {
      setTimeout(() => setAuthView("reset_password"), 1000);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await apiCall("reset-password", { email, otp, newPassword: password });
    if (data) {
      setTimeout(() => setAuthView("login"), 1000);
    }
  };

  const slideVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AnimatePresence>
        {isAuthModalOpen && (
          <div 
            className="fixed inset-0 z-[110] flex items-end justify-center bg-[rgba(17,17,17,0.3)] p-[1rem] backdrop-blur-[16px] sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsAuthModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[32rem] overflow-hidden rounded-[2rem] bg-[#fff] p-[1.5rem] shadow-2xl ring-1 ring-[var(--color-line)] sm:p-[2rem] min-h-[24rem] flex flex-col"
          >
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute right-[1rem] top-[1rem] z-10 grid h-[2.25rem] w-[2.25rem] place-items-center rounded-[9999px] bg-[var(--color-surface)] text-[rgba(17,17,17,0.6)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[#111]"
            >
              <X className="h-[1.25rem] w-[1.25rem]" />
            </button>

            <AnimatePresence mode="wait">
              {status === "success" && authView !== "login" && authView !== "otp" ? (
                <motion.div key="success" {...slideVariants} className="flex flex-col items-center justify-center gap-[1rem] py-[4rem] text-center m-auto">
                  <div className="grid h-[3.5rem] w-[3.5rem] place-items-center rounded-[9999px] bg-[var(--color-ink)] text-[1.5rem] text-[var(--color-accent-from)]">
                    <LogoMark className="h-[1.5em] w-[1.5em]" />
                  </div>
                  <h2 className="text-[1.5rem] font-semibold tracking-[-.01em]">Success</h2>
                </motion.div>
              ) : (
                <motion.div key={authView} {...slideVariants} transition={{ type: "spring", stiffness: 300, damping: 24 }} className="flex-1 flex flex-col">
                  <div className="mb-[1.5rem] flex flex-col gap-[0.375rem]">
                    <div className="inline-flex items-center gap-[0.5rem] text-[0.875rem] font-medium text-[rgba(17,17,17,0.6)]">
                      <div className="h-[0.375rem] w-[0.375rem] rounded-[9999px] bg-[var(--color-accent)]" />
                      {authView === 'login' && "Welcome back"}
                      {authView === 'signup' && "Create an account"}
                      {authView === 'otp' && "Verify your email"}
                      {authView === 'forgot_password' && "Reset your password"}
                      {authView === 'reset_password' && "Check your email"}
                    </div>
                    <h2 className="text-[1.5rem] font-semibold tracking-[-.01em] sm:text-[1.875rem]">
                      {authView === 'login' && "Sign in to NexusCart."}
                      {authView === 'signup' && "Join the platform."}
                      {authView === 'otp' && "Enter your 6-digit code."}
                      {authView === 'forgot_password' && "Forgot your password?"}
                      {authView === 'reset_password' && "Create new password."}
                    </h2>
                  </div>

                  {error && (
                    <div className="mb-4 rounded-[0.5rem] bg-red-50 p-[0.75rem] text-[0.75rem] text-red-600 border border-red-100">
                      {error}
                    </div>
                  )}

                  {authView === 'login' && (
                    <form onSubmit={handleLogin} className="flex flex-col gap-[1rem] flex-1">
                      <div className="flex justify-center mb-2 w-full">
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={() => setError("Google login failed.")}
                          useOneTap
                          width="400"
                          theme="outline"
                          shape="pill"
                          text="continue_with"
                          logo_alignment="center"
                        />
                      </div>
                      
                      <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-[var(--color-line)]"></div>
                        <span className="flex-shrink-0 mx-4 text-[rgba(17,17,17,0.4)] text-[0.75rem] uppercase tracking-wider font-medium">Or</span>
                        <div className="flex-grow border-t border-[var(--color-line)]"></div>
                      </div>

                      <label className="flex flex-col gap-[0.5rem]">
                        <span className="text-[0.75rem] font-medium uppercase tracking-[.025em] text-[rgba(17,17,17,0.5)]">Email</span>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="w-full rounded-[0.875rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.5)] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none transition-colors focus:border-[rgba(17,17,17,0.3)] focus:bg-[#fff]" />
                      </label>
                      <label className="flex flex-col gap-[0.5rem]">
                        <div className="flex items-center justify-between">
                          <span className="text-[0.75rem] font-medium uppercase tracking-[.025em] text-[rgba(17,17,17,0.5)]">Password</span>
                          <button type="button" onClick={() => setAuthView('forgot_password')} className="text-[0.75rem] font-medium text-[rgba(17,17,17,0.6)] hover:text-[#111] transition-colors">Forgot?</button>
                        </div>
                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-[0.875rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.5)] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none transition-colors focus:border-[rgba(17,17,17,0.3)] focus:bg-[#fff]" />
                      </label>
                      <div className="mt-auto pt-[1rem] flex items-center justify-between gap-[1rem]">
                        <button type="button" onClick={() => setAuthView('signup')} className="text-[0.75rem] font-medium text-[rgba(17,17,17,0.6)] hover:text-[#111] transition-colors">
                          Create an account
                        </button>
                        <PillButton variant="dark" withArrow arrow="right" type="submit" disabled={status === "loading"}>
                          {status === "loading" ? "Signing in…" : (status === "success" ? "Success" : "Sign in")}
                        </PillButton>
                      </div>
                    </form>
                  )}

                  {authView === 'signup' && (
                    <form onSubmit={handleSignup} className="flex flex-col gap-[1rem] flex-1">
                      <div className="flex justify-center mb-2 w-full">
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={() => setError("Google signup failed.")}
                          text="continue_with"
                          width="400"
                          theme="outline"
                          shape="pill"
                          logo_alignment="center"
                        />
                      </div>

                      <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-[var(--color-line)]"></div>
                        <span className="flex-shrink-0 mx-4 text-[rgba(17,17,17,0.4)] text-[0.75rem] uppercase tracking-wider font-medium">Or sign up with email</span>
                        <div className="flex-grow border-t border-[var(--color-line)]"></div>
                      </div>

                      <label className="flex flex-col gap-[0.5rem] flex-1">
                        <span className="text-[0.75rem] font-medium uppercase tracking-[.025em] text-[rgba(17,17,17,0.5)]">Name</span>
                        <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="w-full rounded-[0.875rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.5)] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none transition-colors focus:border-[rgba(17,17,17,0.3)] focus:bg-[#fff]" />
                      </label>
                      <label className="flex flex-col gap-[0.5rem]">
                        <span className="text-[0.75rem] font-medium uppercase tracking-[.025em] text-[rgba(17,17,17,0.5)]">Email</span>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="w-full rounded-[0.875rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.5)] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none transition-colors focus:border-[rgba(17,17,17,0.3)] focus:bg-[#fff]" />
                      </label>
                      <label className="flex flex-col gap-[0.5rem]">
                        <span className="text-[0.75rem] font-medium uppercase tracking-[.025em] text-[rgba(17,17,17,0.5)]">Password</span>
                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-[0.875rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.5)] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none transition-colors focus:border-[rgba(17,17,17,0.3)] focus:bg-[#fff]" />
                      </label>
                      
                      <div className="mt-auto pt-[1rem] flex items-center justify-between gap-[1rem]">
                        <button type="button" onClick={() => setAuthView('login')} className="text-[0.75rem] font-medium text-[rgba(17,17,17,0.6)] hover:text-[#111] transition-colors">
                          Already have an account?
                        </button>
                        <PillButton variant="dark" withArrow arrow="right" type="submit" disabled={status === "loading"}>
                          {status === "loading" ? "Registering…" : (status === "success" ? "Done" : "Sign up")}
                        </PillButton>
                      </div>
                    </form>
                  )}

                  {authView === 'otp' && (
                    <form onSubmit={handleVerify} className="flex flex-col gap-[1rem] flex-1">
                      <p className="text-[0.875rem] text-[rgba(17,17,17,0.6)] mb-[1rem]">
                        We sent a verification code to <strong>{email}</strong>.
                      </p>
                      <label className="flex flex-col gap-[0.5rem]">
                        <span className="text-[0.75rem] font-medium uppercase tracking-[.025em] text-[rgba(17,17,17,0.5)]">Verification Code</span>
                        <input type="text" required value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" maxLength={6} className="w-full rounded-[0.875rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.5)] px-[1rem] py-[0.75rem] text-[1.25rem] tracking-[.5em] text-center font-medium outline-none transition-colors focus:border-[rgba(17,17,17,0.3)] focus:bg-[#fff]" />
                      </label>
                      <div className="mt-auto pt-[2rem] flex items-center justify-between gap-[1rem]">
                        <button type="button" onClick={() => setAuthView('signup')} className="text-[0.75rem] font-medium text-[rgba(17,17,17,0.6)] hover:text-[#111] transition-colors">
                          Back
                        </button>
                        <PillButton variant="dark" type="submit" disabled={status === "loading"}>
                          {status === "loading" ? "Verifying…" : (status === "success" ? "Verified" : "Verify Code")}
                        </PillButton>
                      </div>
                    </form>
                  )}

                  {authView === 'forgot_password' && (
                    <form onSubmit={handleForgotPassword} className="flex flex-col gap-[1rem] flex-1">
                      <p className="text-[0.875rem] text-[rgba(17,17,17,0.6)] mb-[0.5rem]">
                        Enter your email address and we'll send you a 6-digit code to reset your password.
                      </p>
                      <label className="flex flex-col gap-[0.5rem]">
                        <span className="text-[0.75rem] font-medium uppercase tracking-[.025em] text-[rgba(17,17,17,0.5)]">Email</span>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="w-full rounded-[0.875rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.5)] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none transition-colors focus:border-[rgba(17,17,17,0.3)] focus:bg-[#fff]" />
                      </label>
                      <div className="mt-auto pt-[2rem] flex items-center justify-between gap-[1rem]">
                        <button type="button" onClick={() => setAuthView('login')} className="text-[0.75rem] font-medium text-[rgba(17,17,17,0.6)] hover:text-[#111] transition-colors">
                          Back to login
                        </button>
                        <PillButton variant="dark" type="submit" disabled={status === "loading"}>
                          {status === "loading" ? "Sending…" : (status === "success" ? "Sent" : "Send Code")}
                        </PillButton>
                      </div>
                    </form>
                  )}

                  {authView === 'reset_password' && (
                    <form onSubmit={handleResetPassword} className="flex flex-col gap-[1rem] flex-1">
                      <p className="text-[0.875rem] text-[rgba(17,17,17,0.6)] mb-[0.5rem]">
                        We sent a verification code to <strong>{email}</strong>.
                      </p>
                      <div className="flex gap-[1rem]">
                        <label className="flex flex-col gap-[0.5rem] flex-1">
                          <span className="text-[0.75rem] font-medium uppercase tracking-[.025em] text-[rgba(17,17,17,0.5)]">Verification Code</span>
                          <input type="text" required value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" maxLength={6} className="w-full rounded-[0.875rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.5)] px-[1rem] py-[0.75rem] text-[1.25rem] tracking-[.25em] text-center font-medium outline-none transition-colors focus:border-[rgba(17,17,17,0.3)] focus:bg-[#fff]" />
                        </label>
                      </div>
                      <label className="flex flex-col gap-[0.5rem]">
                        <span className="text-[0.75rem] font-medium uppercase tracking-[.025em] text-[rgba(17,17,17,0.5)]">New Password</span>
                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-[0.875rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.5)] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none transition-colors focus:border-[rgba(17,17,17,0.3)] focus:bg-[#fff]" />
                      </label>
                      <div className="mt-auto pt-[1.5rem] flex items-center justify-between gap-[1rem]">
                        <button type="button" onClick={() => setAuthView('forgot_password')} className="text-[0.75rem] font-medium text-[rgba(17,17,17,0.6)] hover:text-[#111] transition-colors">
                          Back
                        </button>
                        <PillButton variant="dark" type="submit" disabled={status === "loading"}>
                          {status === "loading" ? "Resetting…" : (status === "success" ? "Done" : "Reset Password")}
                        </PillButton>
                      </div>
                    </form>
                  )}


                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </GoogleOAuthProvider>
  );
}
