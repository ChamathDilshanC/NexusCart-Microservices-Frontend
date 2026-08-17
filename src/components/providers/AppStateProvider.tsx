"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getUser, SessionUser } from "@/lib/api";

interface AppStateValue {
  currentUser: SessionUser | null;
  setCurrentUser: (u: SessionUser | null) => void;
  isAuthInitialized: boolean;
}

const AppStateContext = createContext<AppStateValue>({
  currentUser: null,
  setCurrentUser: () => {},
  isAuthInitialized: false,
});

export const useAppState = () => useContext(AppStateContext);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  useEffect(() => {
    setCurrentUser(getUser());
    setIsAuthInitialized(true);
  }, []);

  return (
    <AppStateContext.Provider value={{ currentUser, setCurrentUser, isAuthInitialized }}>
      {children}
    </AppStateContext.Provider>
  );
}
