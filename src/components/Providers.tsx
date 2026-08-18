"use client";

import React from "react";
import { AppStateProvider } from "./providers/AppStateProvider";
import { CartProvider } from "./providers/CartProvider";
import { ToastProvider } from "./providers/ToastProvider";
import { CurrencyProvider } from "./providers/CurrencyProvider";

export function Providers({ children }: { children: React.ReactNode }) {
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
