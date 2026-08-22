"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

const STORAGE_KEY = "nexus_currency";
const DEFAULT_CURRENCIES = ["USD", "LKR", "EUR", "GBP", "INR", "AUD"];

interface CurrencySettings {
  baseCurrency: string;
  supportedCurrencies: string[];
}

interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
}

interface CurrencyContextValue {
  baseCurrency: string;
  selectedCurrency: string;
  supportedCurrencies: string[];
  setSelectedCurrency: (code: string) => void;
  /** Converts and formats an amount that's denominated in the store's base currency. */
  formatPrice: (amount: number) => string;
  /** The raw multiplier formatPrice uses internally (selectedCurrency rate / baseCurrency rate) — for callers (e.g. checkout) that need to send it to the backend alongside the order, so later displays (emails, invoices) can convert consistently instead of only working in the browser. */
  exchangeRate: number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<CurrencySettings>({
    baseCurrency: "USD",
    supportedCurrencies: DEFAULT_CURRENCIES,
  });
  const [rates, setRates] = useState<ExchangeRates>({ base: "USD", rates: { USD: 1 } });
  const [selectedCurrency, setSelectedCurrencyState] = useState("USD");

  useEffect(() => {
    (async () => {
      const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (stored) setSelectedCurrencyState(stored);

      try {
        const data = await apiFetch<CurrencySettings>("/products/settings/currency", { auth: false });
        setSettings(data);
        if (!stored) setSelectedCurrencyState(data.baseCurrency);
      } catch {
        // Non-fatal: keep USD-only defaults.
      }
      try {
        const data = await apiFetch<ExchangeRates>("/products/exchange-rates", { auth: false });
        setRates(data);
      } catch {
        // Non-fatal: formatPrice falls back to a 1:1 rate.
      }
    })();
  }, []);

  const setSelectedCurrency = (code: string) => {
    setSelectedCurrencyState(code);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, code);
  };

  const exchangeRate = useMemo(() => {
    const baseRate = rates.rates[rates.base] ?? 1;
    const targetRate = rates.rates[selectedCurrency] ?? baseRate;
    return targetRate / baseRate;
  }, [rates, selectedCurrency]);

  const formatPrice = useMemo(() => {
    return (amount: number) => {
      const converted = amount * exchangeRate;
      try {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: selectedCurrency,
          maximumFractionDigits: 2,
        }).format(converted);
      } catch {
        return `${selectedCurrency} ${converted.toFixed(2)}`;
      }
    };
  }, [exchangeRate, selectedCurrency]);

  const value: CurrencyContextValue = {
    baseCurrency: settings.baseCurrency,
    selectedCurrency,
    supportedCurrencies: settings.supportedCurrencies,
    setSelectedCurrency,
    formatPrice,
    exchangeRate,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider");
  return ctx;
}
