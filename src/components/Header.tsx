"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoMark, Grid, X } from "./Icons";
import { useAppState, cn, PillButton } from "./Shared";

function useClock() {
  const [time, setTime] = useState("9:41am");
  const [dateStr, setDateStr] = useState("12 March, 2025");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      const now = new Date();
      let hours = now.getHours();
      const ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12 || 12;
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setTime(`${hours}:${minutes}${ampm}`);

      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      setDateStr(`${now.getDate()} ${months[now.getMonth()]}, ${now.getFullYear()}`);
    };
    
    tick(); // initial tick
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return { time, dateStr, mounted };
}

export function Header() {
  const { ready, setIsMenuOpen, setIsModalOpen, currentUser, setCurrentUser, setAuthView, setIsAuthModalOpen } = useAppState();
  const { time, dateStr, mounted } = useClock();

  const scrollTo = (id: string) => {
    // simplified scrollTo for now since lenis handles smooth scrolling via anchor natively
    // but the prompt asked for a specific helper. I'll implement a basic one:
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <AnimatePresence>
      {ready && (
        <motion.header
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 210, damping: 26, delay: 0.15 }}
          className="absolute inset-x-0 top-0 z-50"
        >
          <div className="shell flex items-center justify-between gap-[1.5rem] p-[1.25rem] sm:px-[2rem] sm:py-[1.5rem]">
            {/* Left */}
            <button onClick={() => scrollTo("home")} className="group outline-none">
              <motion.span 
                className="flex items-center gap-[0.75rem]"
                whileHover="hover"
                variants={{ hover: { scale: 1.04, transition: { type: "spring", stiffness: 320, damping: 18 } } }}
              >
                <img src="/Logo/Logo with out Text.png" alt="NexusCart" className="h-8 w-auto object-contain" />
                <span className="text-[1.125rem] font-semibold tracking-[-.01em]">NexusCart</span>
              </motion.span>
            </button>

            {/* Center */}
            <ul className="hidden lg:flex gap-[2rem] text-[0.875rem] font-medium">
              {[
                { label: "Home", id: "home" },
                { label: "Platform", id: "platform" },
                { label: "Services", id: "services", dropdown: true },
                { label: "About", id: "about" },
                { label: "Careers", id: "careers" },
                { label: "Contact", modal: true }
              ].map((item, i) => (
                <li key={i}>
                  <button 
                    onClick={() => item.modal ? setIsModalOpen(true) : scrollTo(item.id as string)}
                    className="group outline-none flex items-center gap-1"
                    aria-current={item.label === "Home" ? "page" : undefined}
                  >
                    <motion.span
                      whileHover="hover"
                      variants={{ hover: { y: -2, opacity: 1, transition: { type: "spring", stiffness: 320, damping: 22 } } }}
                      className="opacity-80 transition-opacity"
                    >
                      {item.label}
                    </motion.span>
                    {item.dropdown && <span className="text-[0.75rem] opacity-60">▾</span>}
                  </button>
                </li>
              ))}
            </ul>

            {/* Right */}
            <div className="flex items-center gap-[0.75rem]">
              <div className="hidden md:flex items-center gap-[0.75rem] rounded-[0.875rem] border border-[rgba(230,229,226,0.8)] bg-[rgba(255,255,255,0.4)] px-[0.75rem] py-[0.5rem] text-[0.75rem] text-[rgba(17,17,17,0.7)] backdrop-blur-[4px]">
                <span className="text-[rgba(17,17,17,0.45)]">Local time</span>
                <span className="min-w-[3.5rem] font-medium tabular-nums text-[#111]">{time}</span>
                <span className="text-[rgba(17,17,17,0.3)]">•</span>
                <span className="font-medium">{dateStr}</span>
              </div>

              {currentUser ? (
                <div className="hidden lg:flex items-center gap-[0.75rem]">
                  <div className="text-[0.75rem] font-medium text-[rgba(17,17,17,0.7)]">
                    {currentUser.name} ({currentUser.role})
                  </div>
                  <button 
                    onClick={() => {
                      setCurrentUser(null);
                      localStorage.removeItem('nexus_user');
                    }}
                    className="rounded-[0.875rem] bg-[rgba(241,240,238,0.6)] px-[0.75rem] py-[0.5rem] text-[0.75rem] font-medium text-[rgba(17,17,17,0.7)] transition-colors hover:bg-[rgba(17,17,17,0.1)]"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setAuthView('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="hidden lg:flex rounded-[0.875rem] bg-[var(--color-ink)] px-[1rem] py-[0.5rem] text-[0.75rem] font-medium text-[#fff] transition-colors hover:bg-[rgba(17,17,17,0.8)]"
                >
                  Login
                </button>
              )}

              <button 
                onClick={() => setIsMenuOpen(true)}
                className="group rounded-[0.875rem] border border-[rgba(230,229,226,0.8)] bg-[rgba(255,255,255,0.4)] backdrop-blur-[4px] transition-colors hover:bg-[rgba(255,255,255,0.7)] outline-none"
              >
                <motion.span 
                  className="flex items-center gap-[0.5rem] px-[1rem] py-[0.5rem] text-[0.75rem] font-medium uppercase tracking-[.05em]"
                  whileHover="hover"
                  variants={{ hover: { scale: 1.05, transition: { type: "spring", stiffness: 320, damping: 18 } } }}
                >
                  <Grid className="h-[0.875rem] w-[0.875rem]" />
                  <span className="hidden sm:inline">Menu</span>
                </motion.span>
              </button>
            </div>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
}

export function NavMenu() {
  const { isMenuOpen, setIsMenuOpen, setIsModalOpen } = useAppState();
  const { time } = useClock();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    if (isMenuOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isMenuOpen, setIsMenuOpen]);

  const handleLink = (target: "modal" | string) => {
    setIsMenuOpen(false);
    if (target === "modal") {
      setTimeout(() => setIsModalOpen(true), 300); // slight delay to let menu close
    } else {
      setTimeout(() => {
        const el = document.getElementById(target);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  };

  const navItems = [
    { label: "Home", id: "home" },
    { label: "Platform", id: "platform" },
    { label: "Services", id: "services" },
    { label: "About", id: "about" },
    { label: "Careers", id: "careers" },
    { label: "Contact", modal: true }
  ];

  return (
    <AnimatePresence>
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 32 }}
          className="fixed inset-0 z-[115] flex flex-col bg-[#0a0a0a] text-[#fff]"
        >
          {/* Top bar */}
          <div className="shell flex items-center justify-between p-[1.25rem] sm:px-[2rem] sm:py-[1.5rem] w-full">
            <div className="flex items-center gap-[0.75rem]">
              <img src="/Logo/Logo with out Text.png" alt="NexusCart" className="h-8 w-auto object-contain invert" />
              <span className="text-[1.125rem] font-semibold tracking-[-.01em]">NexusCart</span>
            </div>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="inline-flex items-center gap-[0.5rem] rounded-[0.875rem] border border-[rgba(255,255,255,0.15)] px-[1rem] py-[0.5rem] text-[0.75rem] font-medium uppercase tracking-[.05em] text-[rgba(255,255,255,0.7)] transition-colors hover:border-[rgba(255,255,255,0.4)] hover:text-[#fff]"
            >
              <X className="h-[0.875rem] w-[0.875rem]" /> Close
            </button>
          </div>

          {/* Nav */}
          <div className="shell flex flex-1 flex-col justify-center w-full">
            <ul className="flex flex-col gap-[0.25rem]">
              {navItems.map((item, i) => (
                <li key={i} className="overflow-hidden">
                  <motion.button
                    initial={{ y: "1rem", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "1rem", opacity: 0 }}
                    transition={{ delay: (i * 45 + 80) / 1000, duration: 0.5, ease: "easeOut" }}
                    onClick={() => handleLink(item.modal ? "modal" : item.id as string)}
                    className="group flex w-full items-center gap-[1rem] py-[0.5rem] text-left text-[2.25rem] font-semibold tracking-[-.02em] sm:text-[3.75rem]"
                  >
                    <span className="text-[1rem] font-normal text-[rgba(255,255,255,0.3)] transition-colors group-hover:text-[var(--color-accent-from)]">
                      0{i + 1}
                    </span>
                    <span className="text-[rgba(255,255,255,0.7)] transition-colors duration-300 group-hover:text-[#fff]">
                      {item.label}
                    </span>
                  </motion.button>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom bar */}
          <div className="shell flex flex-col gap-[0.75rem] border-t border-[rgba(255,255,255,0.1)] px-[1.25rem] py-[1.5rem] text-[0.75rem] uppercase tracking-[.025em] text-[rgba(255,255,255,0.45)] sm:flex-row sm:justify-between sm:px-[2rem] w-full">
            <span>Local time — {time}</span>
            <button 
              onClick={() => handleLink("modal")}
              className="text-left text-[rgba(255,255,255,0.7)] hover:text-[#fff] hover:underline sm:text-right"
            >
              Start a project →
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
