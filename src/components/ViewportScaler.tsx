"use client";

import { useEffect } from "react";

const BASE_WIDTH = 1920;
const BASE_FONT_SIZE = 16;

export function ViewportScaler() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const apply = () => {
      const width = window.innerWidth;
      if (width > BASE_WIDTH) {
        document.documentElement.style.fontSize = `${(width / BASE_WIDTH) * BASE_FONT_SIZE}px`;
      } else {
        document.documentElement.style.removeProperty("font-size");
      }
    };

    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  return null;
}
