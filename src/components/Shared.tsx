"use client";

import React, { createContext, useContext, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export interface User {
  id: string;
  email: string;
  role: 'Customer' | 'Admin';
  name: string;
}

// App State Context
interface AppStateContextType {
  ready: boolean;
  setReady: (v: boolean) => void;
  isModalOpen: boolean;
  setIsModalOpen: (v: boolean) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (v: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (v: boolean) => void;
  authView: 'login' | 'signup' | 'otp' | 'forgot_password' | 'reset_password';
  setAuthView: (v: 'login' | 'signup' | 'otp' | 'forgot_password' | 'reset_password') => void;
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  isAuthInitialized: boolean;
}

const AppStateContext = createContext<AppStateContextType>({
  ready: false,
  setReady: () => {},
  isModalOpen: false,
  setIsModalOpen: () => {},
  isMenuOpen: false,
  setIsMenuOpen: () => {},
  isAuthModalOpen: false,
  setIsAuthModalOpen: () => {},
  authView: 'login',
  setAuthView: () => {},
  currentUser: null,
  setCurrentUser: () => {},
  isAuthInitialized: false,
});

export const useAppState = () => useContext(AppStateContext);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup' | 'otp' | 'forgot_password' | 'reset_password'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  // Read token from localStorage on mount
  React.useEffect(() => {
    const userStr = localStorage.getItem('nexus_user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {}
    }
    setIsAuthInitialized(true);
  }, []);

  return (
    <AppStateContext.Provider value={{ 
      ready, setReady, 
      isModalOpen, setIsModalOpen, 
      isMenuOpen, setIsMenuOpen,
      isAuthModalOpen, setIsAuthModalOpen,
      authView, setAuthView,
      currentUser, setCurrentUser,
      isAuthInitialized
    }}>
      {children}
    </AppStateContext.Provider>
  );
}

// Utility
export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// PillButton
type PillButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "dark" | "light" | "outline" | "ghost" | "accent";
  withArrow?: boolean;
  arrow?: "right" | "up-right";
  href?: string;
};

export const PillButton = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, PillButtonProps>(
  ({ className, variant = "dark", withArrow, arrow = "right", href, children, ...props }, ref) => {
    const Component = href ? motion.a : motion.button;
    
    const baseClasses = "inline-flex items-center gap-[0.75rem] rounded-[9999px] text-[0.875rem] font-medium";
    
    const variantClasses = {
      dark: "bg-[var(--color-ink)] text-[#fff]",
      light: "bg-[var(--color-surface)] text-[#111]",
      outline: "border border-[var(--color-line)] bg-transparent text-[#111]",
      ghost: "bg-[rgba(241,240,238,0.6)] text-[rgba(17,17,17,0.35)]",
      accent: "bg-gradient-to-br from-[var(--color-accent-from)] to-[var(--color-accent-to)] text-[#fff]",
    };

    const paddingClasses = withArrow ? "py-[0.375rem] pl-[1.5rem] pr-[0.375rem]" : "py-[0.875rem] px-[1.75rem]";
    
    const badgeVariantClasses = {
      dark: "bg-[#fff] text-[var(--color-ink)]",
      light: "bg-[var(--color-ink)] text-[#fff]",
      outline: "bg-[var(--color-ink)] text-[#fff]",
      ghost: "bg-[var(--color-ink)] text-[#fff]",
      accent: "bg-[var(--color-ink)] text-[#fff]",
    };

    return (
      <motion.div
        className="inline-block"
        whileHover="hover"
        variants={{
          hover: { scale: 1.04, transition: { type: "spring", stiffness: 320, damping: 18 } }
        }}
      >
        <Component
          href={href}
          ref={ref as any}
          className={cn(baseClasses, variantClasses[variant], paddingClasses, className)}
          {...(props as any)}
        >
          {children}
          {withArrow && (
            <div className={cn("grid h-[2.25rem] w-[2.25rem] place-items-center rounded-[9999px] text-[1rem]", badgeVariantClasses[variant])}>
              <motion.div
                variants={{
                  hover: {
                    x: arrow === "right" ? 3 : 2,
                    y: arrow === "up-right" ? -2 : 0,
                    transition: { type: "spring", stiffness: 320, damping: 18 }
                  }
                }}
              >
                {arrow === "right" ? <ArrowRight className="h-[1em] w-[1em]" /> : <ArrowUpRight className="h-[1em] w-[1em]" />}
              </motion.div>
            </div>
          )}
        </Component>
      </motion.div>
    );
  }
);
PillButton.displayName = "PillButton";

// Eyebrow
export const Eyebrow = ({ children, tone = "dark", className }: { children: React.ReactNode, tone?: "dark" | "light", className?: string }) => {
  return (
    <div className={cn("inline-flex items-center gap-[0.5rem] text-[0.875rem] font-medium", 
      tone === "dark" ? "text-[rgba(17,17,17,0.7)]" : "text-[rgba(255,255,255,0.7)]",
      className
    )}>
      <div className={cn("h-[0.375rem] w-[0.375rem] rounded-[9999px]", 
        tone === "dark" ? "bg-[rgba(17,17,17,0.5)]" : "bg-[rgba(255,255,255,0.6)]"
      )} />
      {children}
    </div>
  );
};

// TagChip
export const TagChip = ({ children, tone = "dark", className }: { children: React.ReactNode, tone?: "dark" | "light", className?: string }) => {
  return (
    <div className={cn(
      "inline-flex rounded-[9999px] border px-[1rem] py-[0.5rem] text-[0.875rem]",
      tone === "dark" ? "border-[var(--color-line)] text-[#111]" : "border-[rgba(255,255,255,0.25)] text-[#fff]",
      className
    )}>
      {children}
    </div>
  );
};

// ProductCard — shared across FeaturedProducts / related-products grids
export interface ProductCardData {
  _id: string;
  name: string;
  price: number;
  category?: string;
  imageUrl?: string;
  stock: number;
  isFeatured?: boolean;
}

export const ProductCard = ({ product, index = 0 }: { product: ProductCardData, index?: number }) => {
  return (
    <motion.a
      href={`/product/${product._id}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 200, damping: 24 }}
      whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-[var(--color-line)] bg-[#fff] transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-[rgba(241,240,238,0.5)]">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ArrowUpRight className="h-12 w-12 text-[rgba(17,17,17,0.15)]" />
          </div>
        )}
        {product.stock <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.4)]">
            <span className="rounded-full bg-[#fff] px-[1rem] py-[0.375rem] text-[0.75rem] font-semibold text-[#111]">Out of Stock</span>
          </div>
        )}
        {product.isFeatured && (
          <span className="absolute right-[0.625rem] top-[0.625rem] rounded-[6px] bg-gradient-to-r from-[var(--color-accent-from)] to-[var(--color-accent-to)] px-[0.5rem] py-[0.25rem] text-[0.6rem] font-bold uppercase tracking-wider text-white">
            Featured
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-[0.5rem] p-[1.25rem]">
        {product.category && (
          <span className="text-[0.7rem] font-medium uppercase tracking-wider text-[rgba(17,17,17,0.4)]">{product.category}</span>
        )}
        <h3 className="text-[1rem] font-medium leading-snug text-[#111] line-clamp-2">{product.name}</h3>
        <div className="mt-auto flex items-center justify-between pt-[0.5rem]">
          <span className="text-[1.125rem] font-semibold text-[#111]">${Number(product.price).toFixed(2)}</span>
          {product.stock > 0 && (
            <span className="text-[0.7rem] font-medium text-green-600">In Stock</span>
          )}
        </div>
      </div>
    </motion.a>
  );
};

// StatusPill — order-status badges (profile, admin)
export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

const STATUS_TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-[rgba(17,17,17,0.05)] text-[rgba(17,17,17,0.6)]",
  info: "bg-blue-50 text-blue-600",
  success: "bg-green-50 text-green-600",
  warning: "bg-yellow-50 text-yellow-600",
  danger: "bg-red-50 text-red-600",
};

export const ORDER_STATUS_TONES: Record<string, StatusTone> = {
  PENDING: "warning",
  PAID: "info",
  SHIPPED: "neutral",
  DELIVERED: "success",
  CANCELLED: "danger",
};

export const StatusPill = ({ children, tone = "neutral", icon, className }: { children: React.ReactNode, tone?: StatusTone, icon?: React.ReactNode, className?: string }) => {
  return (
    <span className={cn("inline-flex items-center gap-[0.25rem] rounded-full px-[0.75rem] py-[0.25rem] text-[0.7rem] font-medium", STATUS_TONE_CLASSES[tone], className)}>
      {icon}
      {children}
    </span>
  );
};

// AnimatedLink
export const AnimatedLink = ({ children, href, className, xOffset = 4, opacityFrom = 0.65 }: { children: React.ReactNode, href: string, className?: string, xOffset?: number, opacityFrom?: number }) => {
  return (
    <motion.a
      href={href}
      className={cn("inline-flex cursor-pointer", className)}
      initial="initial"
      whileHover="hover"
    >
      <motion.span
        variants={{
          initial: { x: 0, opacity: opacityFrom },
          hover: { x: xOffset, opacity: 1, transition: { type: "spring", stiffness: 320, damping: 22 } }
        }}
      >
        {children}
      </motion.span>
    </motion.a>
  );
};
