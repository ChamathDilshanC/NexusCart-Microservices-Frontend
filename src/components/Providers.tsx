"use client";

import React from "react";
import { AppStateProvider } from "./providers/AppStateProvider";
import { CartProvider } from "./providers/CartProvider";
import { ToastProvider } from "./providers/ToastProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppStateProvider>
      <CartProvider>
        <ToastProvider>{children}</ToastProvider>
      </CartProvider>
    </AppStateProvider>
  );
}
