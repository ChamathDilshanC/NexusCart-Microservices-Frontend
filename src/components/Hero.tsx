"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAppState, PillButton, cn } from "./Shared";
import { ArrowRight, CircleDot, Star } from "lucide-react";
import { LogoMark } from "./Icons";

// The original prompt requires specific image mapping for the Liquid Reveal:
// beforeSrc (the always-visible base / LCP image) = .../hero/after.jpg
// afterSrc (the brush-revealed image) = .../hero/before.jpg
const ASSET_BASE_URL = "https://api.getlayers.ai/storage/v1/object/public/public/assets/lumora-e8b711fc68";
const beforeSrc = `${ASSET_BASE_URL}/hero/after.jpg`;
const afterSrc = `${ASSET_BASE_URL}/hero/before.jpg`;

export function LiquidRevealCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // If reduced motion is preferred, skip canvas
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let rect = container.getBoundingClientRect();
    
    let coverCanvas = document.createElement("canvas");
    let coverCtx = coverCanvas.getContext("2d")!;
    
    const brushRadius = 143;
    const decay = 0.016;
    let radius = brushRadius * dpr;
    let diam = Math.ceil(radius * 2);
    
    let brushCanvas = document.createElement("canvas");
    brushCanvas.width = diam;
    brushCanvas.height = diam;
    let brushCtx = brushCanvas.getContext("2d")!;

    let afterImg = new Image();
    afterImg.crossOrigin = "anonymous";
    afterImg.src = afterSrc;

    const resize = () => {
      rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      coverCanvas.width = rect.width * dpr;
      coverCanvas.height = rect.height * dpr;

      if (afterImg.complete) {
        drawCover();
      }
    };

    const drawCover = () => {
      // object-fit: cover logic
      const imgRatio = afterImg.width / afterImg.height;
      const cvsRatio = coverCanvas.width / coverCanvas.height;
      let drawW, drawH, drawX, drawY;

      if (imgRatio > cvsRatio) {
        drawH = coverCanvas.height;
        drawW = afterImg.width * (drawH / afterImg.height);
        drawX = (coverCanvas.width - drawW) / 2;
        drawY = 0;
      } else {
        drawW = coverCanvas.width;
        drawH = afterImg.height * (drawW / afterImg.width);
        drawX = 0;
        drawY = (coverCanvas.height - drawH) / 2;
      }
      coverCtx.clearRect(0, 0, coverCanvas.width, coverCanvas.height);
      coverCtx.drawImage(afterImg, drawX, drawY, drawW, drawH);
    };

    afterImg.onload = drawCover;
    resize();

    const ro = new ResizeObserver(() => resize());
    ro.observe(container);

    let points: { x: number, y: number }[] = [];
    let lastPoint: { x: number, y: number } | null = null;
    let idle = 0;
    let reqId: number;

    const handlePointerMove = (e: PointerEvent) => {
      const x = (e.clientX - rect.left) * dpr;
      const y = (e.clientY - rect.top) * dpr;

      // Ignore if far outside canvas
      if (x < -radius || x > canvas.width + radius || y < -radius || y > canvas.height + radius) {
        lastPoint = null;
        return;
      }

      if (!lastPoint) {
        points.push({ x, y });
      } else {
        const dx = x - lastPoint.x;
        const dy = y - lastPoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const step = Math.max(radius * 0.3, 1);
        const n = Math.min(Math.ceil(dist / step), 60);
        
        for (let i = 1; i <= n; i++) {
          points.push({
            x: lastPoint.x + dx * (i / n),
            y: lastPoint.y + dy * (i / n)
          });
        }
      }
      lastPoint = { x, y };
    };

    window.addEventListener("pointermove", handlePointerMove);

    const stamp = (x: number, y: number) => {
      brushCtx.clearRect(0, 0, diam, diam);
      brushCtx.globalCompositeOperation = "source-over";
      const grad = brushCtx.createRadialGradient(radius, radius, 0, radius, radius, radius);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.55, "rgba(255,255,255,0.82)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      brushCtx.fillStyle = grad;
      brushCtx.fillRect(0, 0, diam, diam);

      brushCtx.globalCompositeOperation = "source-in";
      brushCtx.drawImage(coverCanvas, x - radius, y - radius, diam, diam, 0, 0, diam, diam);

      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(brushCanvas, x - radius, y - radius);
    };

    const tick = () => {
      let drawing = points.length > 0;
      if (drawing) {
        idle = 0;
      } else {
        idle++;
      }

      if (idle > 120) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        const fade = drawing ? decay : Math.min(decay + idle * 0.004, 0.5);
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = `rgba(0,0,0,${fade})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (drawing) {
          for (const p of points) {
            stamp(p.x, p.y);
          }
          points = [];
        }
      }

      reqId = requestAnimationFrame(tick);
    };

    reqId = requestAnimationFrame(tick);

    return () => {
      ro.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(reqId);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0">
      <img src={beforeSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full pointer-events-none" />
    </div>
  );
}

function CarouselCard() {
  const items = [
    { caption: "Premium Quality", title: "Curated products." },
    { caption: "Free Shipping", title: "On orders over $50." },
    { caption: "Easy Returns", title: "30-day guarantee." },
  ];
  const [idx, setIdx] = useState(0);

  const next = () => setIdx((i) => (i + 1) % items.length);
  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i - 1 + items.length) % items.length);
  };

  return (
    <div 
      onClick={next}
      className="w-full max-w-[24rem] lg:w-[19rem] cursor-pointer rounded-[1.25rem] bg-[rgba(255,255,255,0.7)] p-[0.5rem] shadow-sm ring-1 ring-[rgba(230,229,226,0.7)] backdrop-blur-[12px]"
    >
      <div className="flex gap-[0.5rem] rounded-[0.875rem]">
        <div className="grid aspect-square w-[6rem] place-items-center rounded-[0.875rem] bg-[var(--color-ink)] text-[1.875rem] text-[#fff]">
          <LogoMark className="text-[var(--color-accent-from)] w-[1em] h-[1em]" />
        </div>
        <div className="flex flex-1 flex-col justify-between rounded-[0.875rem] bg-[rgba(241,240,238,0.7)] p-[0.75rem]">
          <div className="relative min-h-[3.25rem] overflow-hidden">
            {items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: i > idx ? 14 : -14 }}
                animate={{ opacity: i === idx ? 1 : 0, y: i === idx ? 0 : i > idx ? 14 : -14 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="absolute inset-0"
                style={{ pointerEvents: i === idx ? "auto" : "none" }}
              >
                <div className="text-[0.65rem] font-medium uppercase tracking-[.05em] text-[rgba(17,17,17,0.45)]">
                  {item.caption}
                </div>
                <div className="mt-1 max-w-[8rem] text-[0.875rem] font-medium leading-[1.35]">
                  {item.title}
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-[0.25rem]">
              {items.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-[0.25rem] rounded-[9999px] transition-all duration-300",
                    i === idx ? "w-[1rem] bg-[rgba(17,17,17,0.7)]" : "w-[0.375rem] bg-[rgba(17,17,17,0.2)]"
                  )}
                />
              ))}
            </div>
            <div className="flex gap-[0.25rem]">
              <button 
                onClick={prev} 
                className="grid h-[1.75rem] w-[1.75rem] place-items-center rounded-[9999px] bg-[#fff] text-[rgba(17,17,17,0.7)] ring-1 ring-[var(--color-line)] transition-colors hover:text-[#111]"
              >
                <ArrowRight className="h-[1em] w-[1em] rotate-180" />
              </button>
              <button 
                className="grid h-[1.75rem] w-[1.75rem] place-items-center rounded-[9999px] bg-[#fff] text-[rgba(17,17,17,0.7)] ring-1 ring-[var(--color-line)] transition-colors hover:text-[#111]"
              >
                <ArrowRight className="h-[1em] w-[1em]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const { ready } = useAppState();

  const easeOutCubic = [0.215, 0.61, 0.355, 1] as const;

  const titleLines = ["Shop smarter,", "live better"];
  const partners = ["Electronics", "Fashion", "Home", "Sports", "Beauty", "Books", "Toys"];

  return (
    <section id="home" className="relative isolate overflow-hidden rounded-b-[2rem] bg-[var(--color-hero-to)]">
      <LiquidRevealCanvas />
      
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[rgba(255,255,255,0.35)] via-transparent to-[rgba(255,255,255,0.35)]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={ready ? { opacity: 0.4, y: 0 } : {}}
        transition={{ type: "spring", stiffness: 120, damping: 30, delay: 0.3 }}
        className="pointer-events-none absolute inset-x-0 bottom-[7rem] z-[1] select-none text-center text-[10rem] font-bold leading-none text-[rgba(255,255,255,0.4)]"
      >
        NEXUSCART
      </motion.div>

      <div className="shell relative z-20 flex flex-col gap-[2rem] px-[1.25rem] pb-[5rem] pt-[7rem] sm:px-[2rem] lg:grid lg:min-h-[100lvh] lg:grid-cols-12 lg:gap-[2.5rem] lg:px-[2rem] lg:pb-[7rem] lg:pt-[9rem]">
        
        {/* Left Col */}
        <div className="flex flex-col gap-[1.75rem] lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-[0.5rem] text-[0.875rem] font-medium text-[rgba(17,17,17,0.7)]">
              <div className="h-[0.375rem] w-[0.375rem] rounded-[9999px] bg-[rgba(17,17,17,0.5)]" />
              Enterprise E-commerce
            </div>
          </motion.div>

          <h1 className="max-w-[18ch] text-[2.25rem] font-semibold leading-[0.98] tracking-[-.02em] sm:text-[3rem] md:text-[3.75rem]">
            {titleLines.map((line, i) => (
              <span key={i} className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: "100%", opacity: 0 }}
                  animate={ready ? { y: "0%", opacity: 1 } : {}}
                  transition={{ delay: 0.25 + i * 0.12, duration: 0.9, ease: easeOutCubic }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.65, duration: 0.6 }}
            className="flex items-center gap-[0.75rem]"
          >
            <span className="flex text-[var(--color-accent)] text-[1rem]">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-[1em] w-[1em]" />)}
            </span>
            <span className="text-[0.875rem] font-medium text-[rgba(17,17,17,0.7)]">
              200+ happy customers
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.75, duration: 0.6 }}
            className="flex flex-wrap gap-[0.75rem]"
          >
            <PillButton variant="dark" withArrow arrow="right" href="/shop">
              Shop Now
            </PillButton>
            <PillButton variant="outline" href="/shop?sort=newest">
              New Arrivals
            </PillButton>
          </motion.div>
        </div>

        {/* Right Col */}
        <div className="flex flex-col items-start gap-[2rem] lg:col-span-5 lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={ready ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.4 }}
            className="w-full"
          >
            <CarouselCard />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.55 }}
            className="w-full max-w-[24rem] lg:w-[19rem]"
          >
            <div className="mb-[0.75rem] text-left text-[0.75rem] font-medium text-[rgba(17,17,17,0.45)] lg:text-right">
              Trusted by
            </div>
            <div className="grid grid-cols-4 gap-x-[1rem] gap-y-[0.75rem]">
              {partners.map((p, i) => (
                <motion.span
                  key={i}
                  whileHover="hover"
                  variants={{ hover: { y: -2, opacity: 1, transition: { type: "spring", stiffness: 320, damping: 20 } } }}
                  className="flex items-center gap-[0.375rem] text-[0.75rem] text-[rgba(17,17,17,0.7)] opacity-70 cursor-pointer"
                >
                  <CircleDot className="h-[0.875rem] w-[0.875rem] text-[rgba(17,17,17,0.4)]" />
                  {p}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Status Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="shell flex items-center justify-between gap-[0.75rem] border-t border-[rgba(17,17,17,0.1)] p-[1.25rem] text-[0.75rem] font-medium uppercase tracking-[.025em] text-[rgba(17,17,17,0.6)] sm:px-[2rem]"
      >
        <span>Working since 2014</span>
        <span className="hidden sm:inline">Remote-first, worldwide</span>
        <span className="inline-flex gap-[0.5rem]">
          Scroll to explore <span>↓</span>
        </span>
      </motion.div>
    </section>
  );
}
