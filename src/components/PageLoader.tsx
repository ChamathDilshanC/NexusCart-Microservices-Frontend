"use client";

import React, { useEffect, useState } from "react";
import { motion, useAnimation, cubicBezier } from "framer-motion";
import { useScroll } from "./ScrollProvider";
import { useAppState, cn } from "./Shared";
import { LogoMark } from "./Icons";

const easeInOutCubic = cubicBezier(0.645, 0.045, 0.355, 1);

export function PageLoader() {
  const { stopScroll, startScroll } = useScroll();
  const { setReady } = useAppState();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const controls = useAnimation();
  const contentControls = useAnimation();

  useEffect(() => {
    stopScroll();

    let start = performance.now();
    const duration = 1300;

    const animateProgress = (time: number) => {
      let t = (time - start) / duration;
      if (t > 1) t = 1;
      
      // easeInOutCubic
      const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      setProgress(Math.round(easedT * 100));

      if (t < 1) {
        requestAnimationFrame(animateProgress);
      } else {
        // Exit animation
        Promise.all([
          controls.start({
            y: "-100%",
            transition: { type: "spring", stiffness: 220, damping: 30 }
          }),
          contentControls.start({
            y: -12,
            opacity: 0,
            transition: { type: "spring", stiffness: 260, damping: 26 } // content fade matching spring
          })
        ]).then(() => {
          setReady(true);
          startScroll();
          setIsVisible(false);
        });
      }
    };

    requestAnimationFrame(animateProgress);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      animate={controls}
      initial={{ y: "0%" }}
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-[2rem] rounded-b-[2rem] bg-[#0a0a0a] text-[#fff]"
    >
      <motion.div
        animate={contentControls}
        initial={{ y: 0, opacity: 1 }}
        className="flex flex-col items-center gap-[1.25rem] text-center"
      >
        <div className="flex items-center gap-[0.5rem] text-[1.5rem] font-semibold sm:text-[1.875rem]">
          <LogoMark className="h-[1.875rem] w-[1.875rem] text-[#cf8047]" />
          NexusCart
        </div>
        <p className="max-w-[24ch] text-[0.875rem] text-[rgba(255,255,255,0.55)]">
          Scalable commerce, shipped with quiet precision.
        </p>
      </motion.div>

      <div className="flex w-[min(22rem,72vw)] flex-col gap-[0.75rem]">
        <div className="h-[1px] w-full bg-[rgba(255,255,255,0.15)]">
          <div
            className="h-full bg-[#cf8047] transition-[width] duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[0.75rem] font-medium uppercase tracking-[.05em] text-[rgba(255,255,255,0.45)]">
          <span>Loading</span>
          <span className="tabular-nums text-[rgba(255,255,255,0.8)]">
            {progress.toString().padStart(3, "0")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
