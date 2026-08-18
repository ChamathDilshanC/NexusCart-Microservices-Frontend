"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, ShoppingBag, User as UserIcon, LogOut, LayoutDashboard } from "lucide-react";
import { useAppState } from "./providers/AppStateProvider";
import { useCart } from "./providers/CartProvider";
import { clearSession } from "@/lib/api";
import { CurrencySwitcher } from "./CurrencySwitcher";

export function AppHeader() {
  const { currentUser, setCurrentUser, isAuthInitialized } = useAppState();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <img
              src="/Logo/Logo%20with%20out%20Text.png"
              alt="NexusCart"
              className="h-8 w-8 object-contain"
            />
            <span className="text-lg font-semibold tracking-tight text-white">NexusCart</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/shop" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Shop
            </Link>
            <Link
              href="/shop?sort=newest"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              New Arrivals
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <CurrencySwitcher />
            </div>

            <Link
              href="/cart"
              className="relative grid place-items-center h-10 w-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag className="w-4 h-4 text-white" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 grid place-items-center h-4 min-w-4 px-1 rounded-full bg-white text-black text-[10px] font-semibold">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>

            {!isAuthInitialized ? (
              <div className="hidden md:block h-9 w-20 rounded-full bg-white/5 animate-pulse" />
            ) : currentUser ? (
              <div className="hidden md:flex items-center gap-1">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white px-3 py-2 rounded-full hover:bg-white/5 transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  {currentUser.name}
                </Link>
                {currentUser.role === "Admin" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white px-3 py-2 rounded-full hover:bg-white/5 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  aria-label="Sign out"
                  className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white px-3 py-2 rounded-full hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="hidden md:block bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-5 py-2.5 rounded-full border border-white/5 transition-colors"
              >
                Sign in
              </Link>
            )}

            <button
              className="md:hidden text-white"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-white/5 px-6 py-4 flex flex-col gap-4 bg-black/95">
          <CurrencySwitcher />

          <Link href="/shop" onClick={() => setMenuOpen(false)} className="text-sm text-gray-300 hover:text-white">
            Shop
          </Link>
          <Link
            href="/shop?sort=newest"
            onClick={() => setMenuOpen(false)}
            className="text-sm text-gray-300 hover:text-white"
          >
            New Arrivals
          </Link>
          {currentUser ? (
            <>
              <Link href="/profile" onClick={() => setMenuOpen(false)} className="text-sm text-gray-300 hover:text-white">
                My Orders
              </Link>
              {currentUser.role === "Admin" && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-sm text-gray-300 hover:text-white">
                  Admin
                </Link>
              )}
              <button onClick={handleLogout} className="text-sm text-left text-gray-300 hover:text-white">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/auth" onClick={() => setMenuOpen(false)} className="text-sm text-gray-300 hover:text-white">
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
