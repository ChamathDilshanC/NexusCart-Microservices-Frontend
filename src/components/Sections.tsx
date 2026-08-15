"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform, cubicBezier } from "framer-motion";
import { Eyebrow, PillButton, TagChip, AnimatedLink, cn, useAppState } from "./Shared";
import { Globe, ArrowRight, ArrowUpRight, CircleDot, LogoMark, X } from "./Icons";

const easeOutCubic = [0.215, 0.61, 0.355, 1] as const;
const easeOutQuart = [0.165, 0.84, 0.44, 1] as const;

function ScrollLineReveal({ children, stagger = 0.1 }: { children: React.ReactNode, stagger?: number }) {
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

function ScrollWordReveal({ text, highlightText }: { text: string, highlightText?: string }) {
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

function RevealBlock({ children, delay = 0, yOffset = 24 }: { children: React.ReactNode, delay?: number, yOffset?: number }) {
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

export function About() {
  return (
    <section id="about" className="bg-[#fff]">
      <div className="shell grid grid-cols-1 items-center gap-[3rem] p-[5rem_1.25rem] sm:px-[2rem] lg:grid-cols-2 lg:py-[7rem]">
        
        {/* Left */}
        <div className="relative min-h-[14rem] lg:min-h-[20rem]">
          <Globe className="absolute left-[-1rem] top-1/2 -translate-y-1/2 text-[12rem] text-[rgba(17,17,17,0.1)] sm:text-[16rem] lg:left-[-1.5rem] lg:text-[20rem]" />
          <Eyebrow className="relative">The Studio</Eyebrow>
          <div className="absolute bottom-0 left-0">
            <RevealBlock delay={0} yOffset={12}>
              <div className="flex items-center gap-[0.75rem] text-[0.875rem] text-[rgba(17,17,17,0.7)]">
                <Globe className="h-[1.5rem] w-[1.5rem] text-[#111]" />
                <span className="max-w-[14rem]">A distributed team building across every time zone.</span>
              </div>
            </RevealBlock>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col gap-[2.5rem]">
          <h2 className="text-[1.5rem] font-medium leading-[1.35] tracking-[-.01em] sm:text-[1.875rem]">
            <ScrollWordReveal 
              text="We partner with ambitious teams to ship " 
              highlightText="digital products, brand systems, and the strategy that holds them together." 
            />
          </h2>
          
          <RevealBlock delay={0.2} yOffset={12}>
            <div className="flex flex-wrap items-end justify-between gap-[1.5rem] border-t border-[var(--color-line)] pt-[1.5rem]">
              <div>
                <div className="mb-[0.5rem] text-[0.875rem] text-[rgba(17,17,17,0.45)]">Find us online</div>
                <div className="flex gap-[0.5rem]">
                  {[
                    { bg: "bg-[var(--color-accent)]", text: "text-[#fff]", icon: <X className="h-[1em] w-[1em]" /> },
                    { bg: "bg-[var(--color-surface)]", text: "text-[rgba(17,17,17,0.7)]", icon: <CircleDot className="h-[1em] w-[1em]" /> },
                    { bg: "bg-[var(--color-surface)]", text: "text-[rgba(17,17,17,0.7)]", icon: <CircleDot className="h-[1em] w-[1em]" /> }
                  ].map((social, i) => (
                    <motion.a 
                      key={i} href="#" 
                      className={cn("grid h-[2.25rem] w-[2.25rem] place-items-center rounded-[9999px] text-[0.875rem]", social.bg, social.text)}
                      whileHover="hover"
                    >
                      <motion.div variants={{ hover: { scale: 1.18, transition: { type: "spring", stiffness: 320, damping: 16 } } }}>
                        {social.icon}
                      </motion.div>
                    </motion.a>
                  ))}
                </div>
              </div>
              <PillButton variant="outline" withArrow href="#about">About Us</PillButton>
            </div>
          </RevealBlock>
        </div>
      </div>
    </section>
  );
}

export function CreateBand() {
  const pills = [
    { text: "We", variant: "light" },
    { text: "Build", variant: "accent" },
    { text: <ArrowRight className="text-[2.25rem] sm:text-[3rem]" />, variant: "dark" },
    { text: "Better", variant: "ghost" },
  ];

  return (
    <section className="bg-[#fff]">
      <ul className="shell flex flex-col gap-[0.75rem] px-[1.25rem] py-[2.5rem] sm:flex-row sm:gap-[1rem] sm:px-[2rem]">
        {pills.map((p, i) => (
          <li key={i} className="flex-1">
            <RevealBlock delay={i * 0.12} yOffset={28}>
              <motion.div
                whileHover="hover"
                variants={{ hover: { scale: 1.03, transition: { type: "spring", stiffness: 300, damping: 18 } } }}
                className={cn(
                  "grid h-[6rem] place-items-center rounded-[9999px] text-[1.875rem] font-medium sm:h-[10rem] sm:text-[2.25rem]",
                  p.variant === "light" && "bg-[var(--color-surface)] text-[#111]",
                  p.variant === "accent" && "bg-gradient-to-br from-[var(--color-accent-from)] to-[var(--color-accent-to)] text-[#fff]",
                  p.variant === "dark" && "bg-[var(--color-ink)] text-[#fff]",
                  p.variant === "ghost" && "bg-[rgba(241,240,238,0.6)] text-[rgba(17,17,17,0.35)]"
                )}
              >
                {p.text}
              </motion.div>
            </RevealBlock>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Portfolio() {
  const items = [
    { name: "Product Service", category: "Core", year: "v1.0", desc: "Manages catalog, inventory, and complex product variants with high availability.", tags: ["Catalog", "Inventory", "Search"], image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop" },
    { name: "Order Service", category: "Commerce", year: "v1.0", desc: "Handles cart management, checkout flows, and distributed transaction processing.", tags: ["Checkout", "Transactions"], image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200&auto=format&fit=crop" },
    { name: "Payment Service", category: "Finance", year: "v1.0", desc: "Secure integration with multiple payment gateways and refund management.", tags: ["Stripe", "Security", "Ledger"], image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1200&auto=format&fit=crop" },
    { name: "Auth & Admin", category: "Platform", year: "v1.0", desc: "Centralized identity management and comprehensive business administration.", tags: ["OAuth", "RBAC", "Dashboard"], image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=1200&auto=format&fit=crop" },
  ];

  return (
    <section id="platform" className="bg-[#fff]">
      <div className="shell px-[1.25rem] pb-[5rem] pt-[2.5rem] sm:px-[2rem] lg:pb-[7rem]">
        <div className="flex flex-col items-center text-center mb-[3.5rem]">
          <RevealBlock delay={0}>
            <Eyebrow className="rounded-[9999px] border border-[var(--color-line)] px-[1rem] py-[0.375rem]">Core Services</Eyebrow>
          </RevealBlock>
          <div className="mt-[1.25rem] text-[2.25rem] font-semibold tracking-[-.02em] sm:text-[3rem]">
            <ScrollLineReveal stagger={0.12}>
              <span>Platform Architecture</span>
            </ScrollLineReveal>
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-[1.5rem] md:grid-cols-2">
          {items.map((item, i) => (
            <li key={i}>
              <RevealBlock delay={i * 0.09} yOffset={48}>
                <motion.article
                  whileHover="hover"
                  initial="initial"
                  variants={{ hover: { y: -8, scale: 1.012, transition: { type: "spring", stiffness: 260, damping: 22 } } }}
                  className="group relative min-h-[22rem] overflow-hidden rounded-[2rem] bg-[var(--color-ink)] p-[1.5rem] text-[#fff] shadow-[0_0_0_1px_rgba(255,255,255,0.05)] sm:min-h-[26rem] sm:p-[2rem] cursor-pointer"
                >
                  <div className="relative z-10 flex justify-between text-[0.75rem] uppercase tracking-[.025em] text-[rgba(255,255,255,0.9)] drop-shadow-md">
                    <span>{item.category} — {item.year}</span>
                    <motion.div 
                      variants={{ hover: { rotate: 45, scale: 1.08, transition: { type: "spring", stiffness: 280, damping: 18 } } }}
                      className="grid h-[2.75rem] w-[2.75rem] place-items-center rounded-[9999px] bg-[rgba(255,255,255,0.1)] text-[#fff] ring-1 ring-[rgba(255,255,255,0.15)]"
                    >
                      <ArrowUpRight className="h-[1em] w-[1em]" />
                    </motion.div>
                  </div>
                  
                  <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover opacity-50 transition-transform duration-700 ease-out group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink)] via-[rgba(10,10,10,0.2)] to-transparent" />
                  </div>

                  <div className="absolute inset-x-[1.5rem] bottom-[1.5rem] z-10 sm:inset-x-[2rem] sm:bottom-[2rem]">
                    <h3 className="text-[1.5rem] font-medium tracking-[-.01em] sm:text-[1.875rem]">{item.name}</h3>
                    <p className="mt-[0.5rem] max-w-[28rem] text-[0.875rem] text-[rgba(255,255,255,0.55)]">{item.desc}</p>
                    <div className="mt-[1.25rem] flex flex-wrap gap-[0.5rem]">
                      {item.tags.map(tag => (
                        <TagChip key={tag} tone="light">{tag}</TagChip>
                      ))}
                    </div>
                  </div>
                </motion.article>
              </RevealBlock>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Services() {
  const rows = [
    { title: "Software Development", desc: "Scalable web & mobile products built to last." },
    { title: "Product Design", desc: "Interfaces that feel effortless and look sharp." },
    { title: "Quality Assurance", desc: "Rigorous testing for flawless, confident releases." },
    { title: "Consulting", desc: "Strategy and direction for ambitious teams." },
  ];

  return (
    <section id="services" className="bg-[#fff]">
      <div className="shell px-[1.25rem] py-[5rem] sm:px-[2rem] lg:py-[7rem]">
        <RevealBlock delay={0}>
          <Eyebrow>Services</Eyebrow>
        </RevealBlock>
        <div className="my-[1.25rem] mb-[3rem] max-w-[16ch] text-[2.25rem] font-semibold tracking-[-.02em] sm:mb-[3.5rem] sm:text-[3rem]">
          <ScrollLineReveal stagger={0.12}>
            <span>What we do best</span>
          </ScrollLineReveal>
        </div>

        <ul>
          {rows.map((row, i) => (
            <li key={i} className={i !== 0 ? "border-t border-[var(--color-line)]" : ""}>
              <RevealBlock delay={i * 0.08} yOffset={24}>
                <motion.a 
                  href="#"
                  initial="initial"
                  whileHover="hover"
                  variants={{
                    initial: { backgroundColor: "rgba(241,240,238,0)", paddingLeft: "1.5rem", paddingRight: "1.5rem" },
                    hover: { backgroundColor: "rgba(241,240,238,1)", paddingLeft: "2rem", paddingRight: "1.25rem", transition: { type: "spring", stiffness: 240, damping: 26 } }
                  }}
                  className="group flex cursor-pointer items-center gap-[1rem] rounded-[1.25rem] py-[1.5rem] sm:gap-[1.5rem] sm:py-[2rem]"
                >
                  <span className="w-[1.75rem] text-[0.875rem] font-medium text-[rgba(17,17,17,0.4)] sm:w-[2.5rem]">0{i + 1}</span>
                  <h3 className="flex-1 text-[1.5rem] font-medium tracking-[-.01em] sm:text-[1.875rem] md:text-[2.25rem]">{row.title}</h3>
                  <p className="hidden max-w-[20rem] text-[0.875rem] text-[rgba(17,17,17,0.55)] lg:block">{row.desc}</p>
                  
                  <motion.div
                    variants={{
                      initial: { x: 0 },
                      hover: { x: 5, transition: { type: "spring", stiffness: 300, damping: 18 } }
                    }}
                    className="grid h-[2.5rem] w-[2.5rem] place-items-center rounded-[9999px] bg-[var(--color-ink)] text-[#fff] sm:h-[3rem] sm:w-[3rem]"
                  >
                    <ArrowUpRight className="h-[1.25em] w-[1.25em]" />
                  </motion.div>
                </motion.a>
              </RevealBlock>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function StatItem({ value, suffix, label }: { value: number, suffix: string, label: string }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"]
  });
  
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      // throttle update roughly
      requestAnimationFrame(() => {
        setDisplayValue(Math.round(latest * value));
      });
    });
  }, [scrollYProgress, value]);

  return (
    <div ref={ref}>
      <div className="text-[3rem] font-semibold tracking-[-.02em] sm:text-[3.75rem] md:text-[4.5rem]">
        {displayValue}{suffix}
      </div>
      <div className="mt-[0.75rem] text-[0.875rem] text-[rgba(255,255,255,0.55)]">{label}</div>
    </div>
  );
}

export function Stats() {
  const [stats, setStats] = useState([
    { value: 150, suffix: "+", label: "Projects delivered" },
    { value: 98, suffix: "%", label: "Client retention" },
    { value: 12, suffix: "", label: "Years of craft" },
    { value: 40, suffix: "+", label: "Team members" }
  ]);

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(data => {
      if (data?.stats) setStats(data.stats);
    }).catch(e => console.error("Failed to load stats", e));
  }, []);

  return (
    <section className="bg-[#fff]">
      <div className="shell px-[1.25rem] pb-[5rem] sm:px-[2rem] lg:pb-[7rem]">
        <RevealBlock delay={0} yOffset={40}>
          <div className="rounded-[2rem] bg-[var(--color-ink)] p-[3rem_1.5rem] text-[#fff] sm:p-[4rem_2rem] md:px-[4rem]">
            <Eyebrow tone="light">By the numbers</Eyebrow>
            <div className="mt-[1rem] max-w-[20ch] text-[1.875rem] font-medium tracking-[-.01em] md:text-[2.25rem]">
              <ScrollLineReveal stagger={0.12}>
                <span>Proof in the work,</span>
                <span>not the words.</span>
              </ScrollLineReveal>
            </div>

            <ul className="mt-[3.5rem] grid grid-cols-2 gap-x-[2rem] gap-y-[3rem] lg:grid-cols-4">
              {stats.map((s, i) => (
                <li key={i}>
                  <RevealBlock delay={i * 0.09} yOffset={20}>
                    <StatItem value={s.value} suffix={s.suffix} label={s.label} />
                  </RevealBlock>
                </li>
              ))}
            </ul>
          </div>
        </RevealBlock>
      </div>
    </section>
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
            { title: "Company", links: [{ l: "About", h: "#about" }, { l: "Careers", h: "#careers" }, { l: "Partners", h: "#partners" }, { l: "Contact", h: "#contact" }] },
            { title: "Services", links: [{ l: "Development", h: "#development" }, { l: "Design", h: "#design" }, { l: "Quality Assurance", h: "#qa" }, { l: "Consulting", h: "#consulting" }] },
            { title: "Social", links: [{ l: "X / Twitter", h: "#" }, { l: "Behance", h: "#" }, { l: "Dribbble", h: "#" }, { l: "LinkedIn", h: "#" }] },
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
