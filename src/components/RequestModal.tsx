"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScroll } from "./ScrollProvider";
import { useAppState as useAppStateShared, cn, PillButton } from "./Shared";
import { X } from "lucide-react";
import { LogoMark } from "./Icons";

export function RequestModal() {
  const { isModalOpen, setIsModalOpen } = useAppStateShared();
  const { stopScroll, startScroll } = useScroll();
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");

  useEffect(() => {
    if (isModalOpen) {
      stopScroll();
    } else {
      startScroll();
      // Reset after a delay if closed
      if (status !== "idle") {
        setTimeout(() => setStatus("idle"), 300);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    if (isModalOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isModalOpen, setIsModalOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setTimeout(() => {
      setStatus("success");
    }, 800);
  };

  return (
    <AnimatePresence>
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[110] flex items-end justify-center bg-[rgba(17,17,17,0.3)] p-[1rem] backdrop-blur-[16px] sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[32rem] overflow-hidden rounded-[2rem] bg-[#fff] p-[1.5rem] shadow-2xl ring-1 ring-[var(--color-line)] sm:p-[2rem]"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-[1rem] top-[1rem] grid h-[2.25rem] w-[2.25rem] place-items-center rounded-[9999px] bg-[var(--color-surface)] text-[rgba(17,17,17,0.6)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[#111]"
            >
              <X className="h-[1.25rem] w-[1.25rem]" />
            </button>

            {status === "success" ? (
              <div className="flex flex-col items-center justify-center gap-[1rem] py-[2rem] text-center">
                <div className="grid h-[3.5rem] w-[3.5rem] place-items-center rounded-[9999px] bg-[var(--color-ink)] text-[1.5rem] text-[var(--color-accent-from)]">
                  <LogoMark className="h-[1.5em] w-[1.5em]" />
                </div>
                <h2 className="text-[1.5rem] font-semibold tracking-[-.01em]">Request received</h2>
                <p className="max-w-[32ch] text-[0.875rem] text-[rgba(17,17,17,0.6)]">
                  Thanks for reaching out — we&apos;ll get back to you within one business day.
                </p>
                <div className="mt-[1rem]">
                  <PillButton variant="dark" onClick={() => setIsModalOpen(false)}>
                    Close
                  </PillButton>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-[1rem]">
                <div className="mb-[1.5rem] flex flex-col gap-[0.375rem]">
                  <div className="inline-flex items-center gap-[0.5rem] text-[0.875rem] font-medium text-[rgba(17,17,17,0.6)]">
                    <div className="h-[0.375rem] w-[0.375rem] rounded-[9999px] bg-[var(--color-accent)]" />
                    Start a project
                  </div>
                  <h2 className="text-[1.5rem] font-semibold tracking-[-.01em] sm:text-[1.875rem]">
                    Tell us what you&apos;re building.
                  </h2>
                </div>

                <label className="flex flex-col gap-[0.5rem]">
                  <span className="text-[0.75rem] font-medium uppercase tracking-[.025em] text-[rgba(17,17,17,0.5)]">Name</span>
                  <input 
                    type="text" 
                    required 
                    placeholder="Your name"
                    className="w-full rounded-[0.875rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.5)] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none transition-colors focus:border-[rgba(17,17,17,0.3)] focus:bg-[#fff]"
                  />
                </label>

                <label className="flex flex-col gap-[0.5rem]">
                  <span className="text-[0.75rem] font-medium uppercase tracking-[.025em] text-[rgba(17,17,17,0.5)]">Email</span>
                  <input 
                    type="email" 
                    required 
                    placeholder="you@company.com"
                    className="w-full rounded-[0.875rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.5)] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none transition-colors focus:border-[rgba(17,17,17,0.3)] focus:bg-[#fff]"
                  />
                </label>

                <label className="flex flex-col gap-[0.5rem]">
                  <span className="text-[0.75rem] font-medium uppercase tracking-[.025em] text-[rgba(17,17,17,0.5)]">Project</span>
                  <textarea 
                    required 
                    rows={4}
                    placeholder="A few words about your project, timeline, and budget."
                    className="w-full resize-none rounded-[0.875rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.5)] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none transition-colors focus:border-[rgba(17,17,17,0.3)] focus:bg-[#fff]"
                  />
                </label>

                <div className="mt-[0.5rem] flex items-center justify-between gap-[1rem]">
                  <span className="text-[0.75rem] text-[rgba(17,17,17,0.45)]">We reply within one business day.</span>
                  <PillButton 
                    variant="dark" 
                    withArrow 
                    arrow="up-right" 
                    type="submit"
                    disabled={status === "sending"}
                  >
                    {status === "sending" ? "Sending…" : "Send request"}
                  </PillButton>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
