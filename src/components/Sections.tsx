"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { AnimatedLink, PillButton, useAppState } from "./Shared";
import { LogoMark } from "./Icons";

const easeOutCubic = [0.215, 0.61, 0.355, 1] as const;
const easeOutQuart = [0.165, 0.84, 0.44, 1] as const;

export function ScrollLineReveal({ children, stagger = 0.1 }: { children: React.ReactNode, stagger?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  const childrenArray = React.Children.toArray(children);

  return (
    <span ref={ref} className="block w-fit">
      {childrenArray.map((child, i) => (
        <span key={i} className="block overflow-hidden">
          <motion.span
            className="block"
            initial={{ y: "100%", opacity: 0 }}
            animate={isInView ? { y: "0%", opacity: 1 } : {}}
            transition={{ delay: i * stagger, duration: 0.9, ease: easeOutCubic }}
          >
            {child}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export function ScrollWordReveal({ text, highlightText }: { text: string, highlightText?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  const words = text.split(" ");
  const highlightWords = highlightText ? highlightText.split(" ") : [];

  return (
    <span ref={ref} className="inline-block">
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          initial={{ y: 24, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: i * 0.035, duration: 0.7, ease: easeOutQuart }}
        >
          {word}
        </motion.span>
      ))}
      {highlightWords.map((word, i) => (
        <motion.span
          key={`h-${i}`}
          className="inline-block mr-[0.25em] text-[var(--color-muted)]"
          initial={{ y: 24, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: (words.length + i) * 0.035, duration: 0.7, ease: easeOutQuart }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export function RevealBlock({ children, delay = 0, yOffset = 24 }: { children: React.ReactNode, delay?: number, yOffset?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ y: yOffset, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : {}}
      transition={{ delay, type: "spring", stiffness: 200, damping: 24 }}
    >
      {children}
    </motion.div>
  );
}

export function Footer() {
  const { setIsModalOpen } = useAppState();

  return (
    <footer className="relative overflow-hidden rounded-t-[2rem] bg-[var(--color-ink)] text-[#fff]">
      <div className="shell relative z-10 p-[5rem_1.25rem_2.5rem] sm:px-[2rem] lg:pt-[6rem]">

        {/* CTA */}
        <div className="flex flex-col gap-[2rem] border-b border-[rgba(255,255,255,0.1)] pb-[4rem] lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[16ch] text-[2.25rem] font-semibold tracking-[-.02em] sm:text-[3rem] md:text-[3.75rem]">
            <ScrollLineReveal stagger={0.1}>
              <span>Have a project</span>
              <span>in mind? Let&apos;s</span>
              <span>get to work.</span>
            </ScrollLineReveal>
          </div>
          <PillButton variant="light" withArrow arrow="up-right" onClick={() => setIsModalOpen(true)}>
            Start a project
          </PillButton>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-1 gap-[3rem] py-[4rem] md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-[1rem]">
            <div className="flex items-center gap-[0.5rem] text-[1.125rem] font-semibold">
              <LogoMark className="h-[1.25rem] w-[1.25rem] text-[var(--color-accent-from)]" />
              NexusCart
            </div>
            <p className="max-w-[20rem] text-[0.875rem] text-[rgba(255,255,255,0.55)]">
              A highly scalable, microservices-based e-commerce platform built for modern businesses.
            </p>
          </div>

          {[
            { title: "Shop", links: [{ l: "All products", h: "/shop" }, { l: "New arrivals", h: "/shop?sort=newest" }, { l: "Your cart", h: "/cart" }, { l: "Your orders", h: "/profile" }] },
            { title: "Company", links: [{ l: "Careers", h: "#careers" }, { l: "Contact", h: "#contact" }] },
            { title: "Social", links: [{ l: "X / Twitter", h: "#" }, { l: "Instagram", h: "#" }, { l: "LinkedIn", h: "#" }] },
          ].map(col => (
            <div key={col.title} className="flex flex-col gap-[1rem]">
              <div className="text-[0.75rem] uppercase tracking-[.025em] text-[rgba(255,255,255,0.4)]">{col.title}</div>
              <div className="flex flex-col items-start gap-[0.5rem] text-[0.875rem]">
                {col.links.map(link => (
                  <AnimatedLink key={link.l} href={link.h}>{link.l}</AnimatedLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legal */}
        <div className="flex flex-col items-center justify-between gap-[1rem] border-t border-[rgba(255,255,255,0.1)] pt-[2rem] text-[0.75rem] text-[rgba(255,255,255,0.45)] sm:flex-row">
          <div>© 2026 NexusCart. All rights reserved.</div>
          <div className="flex gap-[1.5rem]">
            <AnimatedLink href="#privacy" xOffset={3} opacityFrom={0.7}>Privacy</AnimatedLink>
            <AnimatedLink href="#terms" xOffset={3} opacityFrom={0.7}>Terms</AnimatedLink>
          </div>
        </div>

      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[-1.5rem] z-0 select-none text-center text-[10rem] font-bold leading-none text-[rgba(255,255,255,0.05)]">
        NEXUSCART
      </div>
    </footer>
  );
}
