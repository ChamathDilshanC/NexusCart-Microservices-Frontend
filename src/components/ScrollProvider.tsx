"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import Lenis from "lenis";

interface ScrollContextType {
  lenis: Lenis | null;
  stopScroll: () => void;
  startScroll: () => void;
  scrollTo: (target: string | number) => void;
}

const ScrollContext = createContext<ScrollContextType>({
  lenis: null,
  stopScroll: () => {},
  startScroll: () => {},
  scrollTo: () => {},
});

export const useScroll = () => useContext(ScrollContext);

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const reqIdRef = useRef<number>(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const lenisInstance = new Lenis({
      smoothWheel: true,
    });
    
    setLenis(lenisInstance);

    const raf = (time: number) => {
      lenisInstance.raf(time);
      reqIdRef.current = requestAnimationFrame(raf);
    };
    
    reqIdRef.current = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(reqIdRef.current);
      lenisInstance.destroy();
    };
  }, []);

  const stopScroll = () => {
    if (lenis) {
      lenis.stop();
      document.documentElement.style.position = "relative";
      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.height = "100%";
    }
  };

  const startScroll = () => {
    if (lenis) {
      lenis.start();
      document.documentElement.style.removeProperty("position");
      document.documentElement.style.removeProperty("overflow");
      document.documentElement.style.removeProperty("height");
    }
  };

  const scrollTo = (target: string | number) => {
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.2 });
      return;
    }
    if (typeof target === "string") {
      const el = document.getElementById(target);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: target, behavior: "smooth" });
    }
  };

  return (
    <ScrollContext.Provider value={{ lenis, stopScroll, startScroll, scrollTo }}>
      {children}
    </ScrollContext.Provider>
  );
}
