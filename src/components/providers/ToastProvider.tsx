"use client";

import React, { createContext, useContext } from "react";
import { GoeyToaster, goeyToast } from "goey-toast";
import "goey-toast/styles.css";

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ success: () => {}, error: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const value: ToastContextValue = {
    success: (message) => goeyToast.success(message),
    error: (message) => goeyToast.error(message),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* offset clears the sticky header (~72px tall) with room to spare —
          goey-toast's offset is a single value applied to all sides, so
          this also insets toasts 96px from the right edge, not just the top. */}
      <GoeyToaster position="top-right" offset="96px" theme="light" closeButton showProgress />
    </ToastContext.Provider>
  );
}
