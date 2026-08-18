"use client";

import React, { useEffect } from "react";
import { AppStateProvider } from "./providers/AppStateProvider";
import { CartProvider } from "./providers/CartProvider";
import { ToastProvider } from "./providers/ToastProvider";
import { CurrencyProvider } from "./providers/CurrencyProvider";

// Browsers change a focused number input's value when the mouse wheel
// scrolls over it, which silently corrupts the field while the page scrolls.
// Blur it instead so wheel scrolling never touches its value.
function useDisableNumberInputScroll() {
  useEffect(() => {
    const handleWheel = () => {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement && active.type === "number") {
        active.blur();
      }
    };
    document.addEventListener("wheel", handleWheel, { passive: true });
    return () => document.removeEventListener("wheel", handleWheel);
  }, []);
}

export function Providers({ children }: { children: React.ReactNode }) {
  useDisableNumberInputScroll();
  return (
    <AppStateProvider>
      <CartProvider>
        <ToastProvider>
          <CurrencyProvider>{children}</CurrencyProvider>
        </ToastProvider>
      </CartProvider>
    </AppStateProvider>
  );
}
