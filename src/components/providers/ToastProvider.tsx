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
      <GoeyToaster position="bottom-right" theme="light" closeButton showProgress />
    </ToastContext.Provider>
  );
}
