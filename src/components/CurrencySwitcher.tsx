"use client";

import React, { useState } from "react";
import { Globe } from "lucide-react";
import { useCurrency } from "./providers/CurrencyProvider";

export function CurrencySwitcher() {
  const { selectedCurrency, supportedCurrencies, setSelectedCurrency } = useCurrency();
  const [open, setOpen] = useState(false);

  if (supportedCurrencies.length <= 1) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-label="Change currency"
        className="flex items-center gap-1.5 h-10 px-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-white"
      >
        <Globe className="w-4 h-4" />
        {selectedCurrency}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 min-w-[7rem] bg-[#111113] border border-white/10 rounded-xl py-1.5 shadow-xl">
          {supportedCurrencies.map((code) => (
            <button
              key={code}
              onMouseDown={() => setSelectedCurrency(code)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                code === selectedCurrency ? "text-white font-medium" : "text-gray-400 hover:text-white"
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
