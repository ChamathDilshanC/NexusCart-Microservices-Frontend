"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingBag,
  Users,
  ImagePlus,
  ImageOff,
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
  DollarSign,
  Percent,
  Search,
  Receipt,
  Settings as SettingsIcon,
  RefreshCw,
  Sparkles,
  Info,
  Bell,
} from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";
import { useCurrency } from "@/components/providers/CurrencyProvider";

/* ---------------------------------- Types ---------------------------------- */

type TabId = "products" | "orders" | "users" | "banners" | "promotions" | "notifications" | "settings";
type IconType = React.ComponentType<{ className?: string }>;

interface Metrics {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "Customer" | "Admin";
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  images?: string[];
  isFeatured?: boolean;
  effectivePrice?: number;
  discountPercent?: number;
  promotionName?: string | null;
  templateIds?: string[];
}

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface ShippingAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface Order {
  _id: string;
  customerEmail?: string;
  customerName?: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress?: ShippingAddress;
  status: OrderStatus;
  createdAt: string;
}

interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  productId?: string;
  order: number;
  isActive: boolean;
  templateIds?: string[];
}

interface ProductFormValues {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  images: string[];
  isFeatured: boolean;
  templateIds: string[];
}

interface BannerFormValues {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  productId: string;
  order: number;
  isActive: boolean;
  templateIds: string[];
}

type BannerLayout = "carousel" | "grid" | "spotlight" | "sidebar" | "showcase" | "bento" | "marquee" | "cinematic";
type BannerPosition = "top" | "above-grid" | "bottom" | "sidebar";
// How prominent the banner block is on screen — shared by every layout, each
// mapping the same four steps to its own height/width scale.
type BannerSize = "small" | "medium" | "large" | "full";

interface BannerTemplateOptions {
  carousel: {
    autoAdvance: boolean;
    intervalMs: number;
    showArrows: boolean;
    showDots: boolean;
  };
  grid: {
    columns: number;
    aspectRatio: "landscape" | "square";
    showSubtitle: boolean;
  };
  spotlight: {
    maxListItems: number;
    showListSubtitle: boolean;
  };
  sidebar: {
    autoAdvance: boolean;
    intervalMs: number;
  };
  showcase: {
    autoAdvance: boolean;
    intervalMs: number;
    showArrows: boolean;
  };
  bento: {
    featuredCount: number;
    showSubtitle: boolean;
  };
  marquee: {
    speed: "slow" | "normal" | "fast";
    direction: "left" | "right";
    pauseOnHover: boolean;
  };
  cinematic: {
    autoAdvance: boolean;
    intervalMs: number;
    showProgressBar: boolean;
    kenBurnsEffect: boolean;
  };
}

interface BannerTemplate {
  _id: string;
  name: string;
  layout: BannerLayout;
  position: BannerPosition;
  size: BannerSize;
  isActive: boolean;
  order: number;
  options: BannerTemplateOptions;
}

interface BannerTemplateFormValues {
  name: string;
  layout: BannerLayout;
  position: BannerPosition;
  size: BannerSize;
  isActive: boolean;
  order: number;
  options: BannerTemplateOptions;
}

type ProductTemplateLayout = "carousel" | "grid" | "spotlight" | "sidebar" | "showcase" | "bento" | "marquee" | "cinematic";
type ProductTemplatePosition = "top" | "above-grid" | "bottom" | "sidebar";
type ProductTemplateSize = "small" | "medium" | "large" | "full";

interface ProductTemplateOptions {
  carousel: {
    autoAdvance: boolean;
    intervalMs: number;
    showArrows: boolean;
    showDots: boolean;
  };
  grid: {
    columns: number;
    rows: number;
    autoAdvance: boolean;
    intervalMs: number;
  };
  spotlight: {
    maxListItems: number;
  };
  sidebar: {
    autoAdvance: boolean;
    intervalMs: number;
  };
  showcase: {
    autoAdvance: boolean;
    intervalMs: number;
    showArrows: boolean;
  };
  bento: {
    featuredCount: number;
  };
  marquee: {
    speed: "slow" | "normal" | "fast";
    direction: "left" | "right";
    pauseOnHover: boolean;
  };
  cinematic: {
    autoAdvance: boolean;
    intervalMs: number;
    showProgressBar: boolean;
    kenBurnsEffect: boolean;
  };
}

interface ProductTemplate {
  _id: string;
  name: string;
  layout: ProductTemplateLayout;
  position: ProductTemplatePosition;
  size: ProductTemplateSize;
  isActive: boolean;
  order: number;
  applyToAllProducts: boolean;
  isDefaultGrid: boolean;
  options: ProductTemplateOptions;
}

interface ProductTemplateFormValues {
  name: string;
  layout: ProductTemplateLayout;
  position: ProductTemplatePosition;
  size: ProductTemplateSize;
  isActive: boolean;
  order: number;
  applyToAllProducts: boolean;
  isDefaultGrid: boolean;
  options: ProductTemplateOptions;
}

const SIZE_OPTIONS: { value: BannerSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "full", label: "Full screen" },
];

// Actual width/height each size resolves to on the shop page — every layout
// maps the same four steps to a different dimension, so this is keyed by
// layout too. Keep in sync with the BANNER_CONTAINER_WIDTH / *_HEIGHT_CLASSES
// / *_ROW_CLASSES / *_CARD_CLASSES tables in components/shop/ShopBrowser.tsx.
const SIZE_DIMENSIONS: Record<BannerLayout, Record<BannerSize, string>> = {
  carousel: {
    small: "Full width, 200–280px tall",
    medium: "Full width, 280–380px tall",
    large: "Full width, 360–480px tall",
    full: "Full width, 70–88% of screen height",
  },
  grid: {
    small: "Section up to 1280px wide",
    medium: "Section up to 1600px wide",
    large: "Section up to 1920px wide",
    full: "Section spans the full screen width",
  },
  spotlight: {
    small: "Up to 1280px wide, featured banner 200–300px tall",
    medium: "Up to 1600px wide, featured banner 280–420px tall",
    large: "Up to 1920px wide, featured banner 340–500px tall",
    full: "Full width, featured banner 60–75% of screen height",
  },
  sidebar: {
    small: "Rail width 160px",
    medium: "Rail width 192px",
    large: "Rail width 224px",
    full: "Rail width 256px",
  },
  showcase: {
    small: "Up to 1280px wide, row 160–240px tall",
    medium: "Up to 1600px wide, row 220–320px tall",
    large: "Up to 1920px wide, row 280–400px tall",
    full: "Full width, row 55–70% of screen height",
  },
  bento: {
    small: "Up to 1280px wide, tile rows 100–115px",
    medium: "Up to 1600px wide, tile rows 130–150px",
    large: "Up to 1920px wide, tile rows 160–190px",
    full: "Full width, tile rows 200–240px",
  },
  marquee: {
    small: "Cards ~224×128px – 288×176px",
    medium: "Cards ~288×160px – 384×224px",
    large: "Cards ~320×192px – 420×256px",
    full: "Cards ~384×224px – 480×288px",
  },
  cinematic: {
    small: "Immersive layout, 300–420px tall",
    medium: "Immersive layout, 400–560px tall",
    large: "Immersive layout, 500–680px tall",
    full: "Immersive layout, 85–92% of screen height",
  },
};

const DEFAULT_TEMPLATE_OPTIONS: BannerTemplateOptions = {
  carousel: { autoAdvance: true, intervalMs: 5000, showArrows: true, showDots: true },
  grid: { columns: 3, aspectRatio: "landscape", showSubtitle: true },
  spotlight: { maxListItems: 4, showListSubtitle: false },
  sidebar: { autoAdvance: true, intervalMs: 4000 },
  showcase: { autoAdvance: true, intervalMs: 5000, showArrows: true },
  bento: { featuredCount: 1, showSubtitle: true },
  marquee: { speed: "normal", direction: "left", pauseOnHover: true },
  cinematic: { autoAdvance: true, intervalMs: 6000, showProgressBar: true, kenBurnsEffect: true },
};

// Same four-step scale and pixel ranges as SIZE_DIMENSIONS above — kept in
// sync with the PRODUCT_* size-class tables in components/shop/ShopBrowser.tsx.
const PRODUCT_SIZE_DIMENSIONS: Record<ProductTemplateLayout, Record<ProductTemplateSize, string>> = {
  carousel: {
    small: "Full width, 200–280px tall",
    medium: "Full width, 280–380px tall",
    large: "Full width, 360–480px tall",
    full: "Full width, 70–88% of screen height",
  },
  grid: {
    small: "Section up to 1280px wide",
    medium: "Section up to 1600px wide",
    large: "Section up to 1920px wide",
    full: "Section spans the full screen width",
  },
  spotlight: {
    small: "Up to 1280px wide, featured product 200–300px tall",
    medium: "Up to 1600px wide, featured product 280–420px tall",
    large: "Up to 1920px wide, featured product 340–500px tall",
    full: "Full width, featured product 60–75% of screen height",
  },
  sidebar: {
    small: "Rail width 160px",
    medium: "Rail width 192px",
    large: "Rail width 224px",
    full: "Rail width 256px",
  },
  showcase: {
    small: "Up to 1280px wide, row 160–240px tall",
    medium: "Up to 1600px wide, row 220–320px tall",
    large: "Up to 1920px wide, row 280–400px tall",
    full: "Full width, row 55–70% of screen height",
  },
  bento: {
    small: "Up to 1280px wide, tile rows 100–115px",
    medium: "Up to 1600px wide, tile rows 130–150px",
    large: "Up to 1920px wide, tile rows 160–190px",
    full: "Full width, tile rows 200–240px",
  },
  marquee: {
    small: "Cards ~224×128px – 288×176px",
    medium: "Cards ~288×160px – 384×224px",
    large: "Cards ~320×192px – 420×256px",
    full: "Cards ~384×224px – 480×288px",
  },
  cinematic: {
    small: "Immersive layout, 300–420px tall",
    medium: "Immersive layout, 400–560px tall",
    large: "Immersive layout, 500–680px tall",
    full: "Immersive layout, 85–92% of screen height",
  },
};

const DEFAULT_PRODUCT_TEMPLATE_OPTIONS: ProductTemplateOptions = {
  carousel: { autoAdvance: true, intervalMs: 5000, showArrows: true, showDots: true },
  grid: { columns: 4, rows: 2, autoAdvance: true, intervalMs: 5000 },
  spotlight: { maxListItems: 4 },
  sidebar: { autoAdvance: true, intervalMs: 4000 },
  showcase: { autoAdvance: true, intervalMs: 5000, showArrows: true },
  bento: { featuredCount: 1 },
  marquee: { speed: "normal", direction: "left", pauseOnHover: true },
  cinematic: { autoAdvance: true, intervalMs: 6000, showProgressBar: true, kenBurnsEffect: true },
};

type DiscountType = "percentage" | "fixed";
type PromotionScope = "all" | "category" | "products";

interface Promotion {
  _id: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  scope: PromotionScope;
  category?: string;
  productIds: string[];
  isActive: boolean;
}

interface PromotionFormValues {
  name: string;
  discountType: DiscountType;
  discountValue: number;
  scope: PromotionScope;
  category: string;
  productIds: string[];
  isActive: boolean;
}

const ALL_CURRENCIES = ["USD", "LKR", "EUR", "GBP", "INR", "AUD", "CAD", "JPY", "SGD", "AED"];

interface CurrencySettings {
  baseCurrency: string;
  supportedCurrencies: string[];
}

/* ---------------------------------- Shared styles ---------------------------------- */

const inputClass =
  "bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-colors w-full";
const primaryButtonClass =
  "bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const secondaryButtonClass =
  "bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-6 py-3 rounded-full border border-white/5 transition-colors";
const cardClass = "bg-[#111113] border border-white/10 rounded-2xl p-6";

const STATUS_OPTIONS: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  PAID: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  SHIPPED: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  DELIVERED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  CANCELLED: "bg-red-500/10 text-red-300 border-red-500/20",
};

const TABS: { id: TabId; label: string; icon: IconType }[] = [
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "users", label: "Users", icon: Users },
  { id: "banners", label: "Banners", icon: ImagePlus },
  { id: "promotions", label: "Promotions", icon: Percent },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

/* ---------------------------------- Helpers ---------------------------------- */

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatAddress(addr?: ShippingAddress): string | null {
  if (!addr) return null;
  const parts = [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(
    (p) => p && p.trim().length > 0
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

/* ---------------------------------- Small building blocks ---------------------------------- */

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: IconType }) {
  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
        <Icon className="w-4 h-4 text-gray-600" />
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className={`${cardClass} text-center text-sm text-gray-500`}>{message}</div>
  );
}

function InfoTooltip({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-flex group">
      <button
        type="button"
        aria-label="Size details"
        className="text-gray-500 hover:text-white transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-72 -translate-x-1/2 rounded-xl border border-white/10 bg-[#1a1a1c] p-3 text-xs opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {children}
      </span>
    </span>
  );
}

function Thumbnail({ src, alt, size = "h-16 w-16" }: { src?: string; alt: string; size?: string }) {
  return (
    <div className={`${size} shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/10 grid place-items-center`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <ImageOff className="w-5 h-5 text-gray-600" />
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
  widthClass = "max-w-2xl",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm px-4 py-10"
      onClick={onClose}
    >
      <div
        className={`w-full ${widthClass} bg-[#111113] border border-white/10 rounded-2xl p-6 my-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ImageField({
  value,
  onChange,
  onRemoveSlot,
}: {
  value: string;
  onChange: (v: string) => void;
  onRemoveSlot?: () => void;
}) {
  const toast = useToast();
  const [mode, setMode] = useState<"url" | "upload">(value.startsWith("data:") ? "upload" : "url");

  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.onerror = () => toast.error("Could not read that file");
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex gap-4">
      <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/10 grid place-items-center">
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Remove image"
              className="absolute top-1 right-1 grid place-items-center h-5 w-5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <ImageOff className="w-5 h-5 text-gray-600" />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setMode("url")}
              className={`px-3 py-1.5 transition-colors ${
                mode === "url" ? "bg-white text-black" : "bg-transparent text-gray-400 hover:text-white"
              }`}
            >
              URL
            </button>
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`px-3 py-1.5 transition-colors ${
                mode === "upload" ? "bg-white text-black" : "bg-transparent text-gray-400 hover:text-white"
              }`}
            >
              Upload
            </button>
          </div>
          {onRemoveSlot && (
            <button
              type="button"
              onClick={onRemoveSlot}
              aria-label="Remove image slot"
              className="ml-auto text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        {mode === "url" ? (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className={inputClass}
          />
        ) : (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
            className="block w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20 file:cursor-pointer cursor-pointer"
          />
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- Category picker ---------------------------------- */

function CategoryPicker({
  value,
  onChange,
  categories,
  categoryCounts,
  onRenameCategory,
  onDeleteCategory,
}: {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
  categoryCounts: Record<string, number>;
  onRenameCategory: (oldName: string, newName: string) => Promise<void>;
  onDeleteCategory: (name: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = categories.filter((cat) =>
    cat.toLowerCase().includes(value.trim().toLowerCase())
  );

  const handleRename = async (cat: string) => {
    const next = window.prompt(`Rename category "${cat}" to:`, cat);
    if (!next || !next.trim() || next.trim() === cat) return;
    setBusy(cat);
    try {
      await onRenameCategory(cat, next.trim());
      if (value === cat) onChange(next.trim());
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (cat: string) => {
    const count = categoryCounts[cat] ?? 0;
    const warning =
      count > 0
        ? `Delete "${cat}"? ${count} product${count !== 1 ? "s" : ""} will be moved to "Uncategorized". This cannot be undone.`
        : `Delete "${cat}"? This cannot be undone.`;
    if (!window.confirm(warning)) return;
    setBusy(cat);
    try {
      await onDeleteCategory(cat);
      if (value === cat) onChange("");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative">
      <input
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="e.g. Electronics"
        autoComplete="off"
        className={inputClass}
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-64 overflow-y-auto scrollbar-hide rounded-xl border border-white/10 bg-[#1a1a1c] py-1 shadow-xl">
          {filtered.map((cat) => (
            <div key={cat} className="flex items-center gap-1 px-2 py-1 hover:bg-white/5">
              <button
                type="button"
                onMouseDown={() => {
                  onChange(cat);
                  setOpen(false);
                }}
                className="flex-1 truncate px-1.5 py-1 text-left text-sm text-gray-200"
              >
                {cat}
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleRename(cat);
                }}
                disabled={busy === cat}
                aria-label={`Rename ${cat}`}
                className="shrink-0 rounded-lg p-1.5 text-gray-500 transition-colors hover:text-white disabled:opacity-40"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleDelete(cat);
                }}
                disabled={busy === cat}
                aria-label={`Delete ${cat}`}
                className="shrink-0 rounded-lg p-1.5 text-red-400/80 transition-colors hover:text-red-300 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Product form ---------------------------------- */

function ProductForm({
  initial,
  categories,
  categoryCounts,
  productTemplates,
  submitting,
  onCancel,
  onSubmit,
  onRenameCategory,
  onDeleteCategory,
}: {
  initial: Product | null;
  categories: string[];
  categoryCounts: Record<string, number>;
  productTemplates: ProductTemplate[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: ProductFormValues) => void;
  onRenameCategory: (oldName: string, newName: string) => Promise<void>;
  onDeleteCategory: (name: string) => Promise<void>;
}) {
  const { selectedCurrency } = useCurrency();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [stock, setStock] = useState(initial ? String(initial.stock) : "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [templateIds, setTemplateIds] = useState<string[]>(initial?.templateIds ?? []);

  const toggleTemplate = (id: string) => {
    setTemplateIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      price: Number.parseFloat(price) || 0,
      stock: Number.parseInt(stock, 10) || 0,
      category: category.trim(),
      imageUrl: imageUrl.trim(),
      images: images.map((i) => i.trim()).filter((i) => i.length > 0),
      isFeatured,
      templateIds,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product name"
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Category</label>
          <CategoryPicker
            value={category}
            onChange={setCategory}
            categories={categories}
            categoryCounts={categoryCounts}
            onRenameCategory={onRenameCategory}
            onDeleteCategory={onDeleteCategory}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Description</label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Product description"
          rows={4}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
            Price
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
              {selectedCurrency}
            </span>
          </label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Stock</label>
          <input
            required
            type="number"
            min="0"
            step="1"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Primary image</label>
        <ImageField value={imageUrl} onChange={setImageUrl} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-500">Additional images</label>
          <button
            type="button"
            onClick={() => setImages((prev) => [...prev, ""])}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add image
          </button>
        </div>
        {images.length === 0 ? (
          <p className="text-xs text-gray-600">No additional images.</p>
        ) : (
          <div className="space-y-4">
            {images.map((img, idx) => (
              <ImageField
                key={idx}
                value={img}
                onChange={(v) => setImages((prev) => prev.map((p, i) => (i === idx ? v : p)))}
                onRemoveSlot={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
              />
            ))}
          </div>
        )}
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
        />
        <span className="text-sm text-gray-300">Featured product</span>
      </label>

      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Show in product templates</label>
        {productTemplates.length === 0 ? (
          <p className="text-xs text-gray-600">
            No product templates yet — create one above and it&apos;ll appear here.
          </p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {productTemplates.map((tpl) => (
              <label
                key={tpl._id}
                className={`flex items-center gap-2 select-none ${
                  tpl.applyToAllProducts ? "cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  checked={tpl.applyToAllProducts || templateIds.includes(tpl._id)}
                  disabled={tpl.applyToAllProducts}
                  onChange={() => toggleTemplate(tpl._id)}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className={`text-sm ${tpl.applyToAllProducts ? "text-gray-500" : "text-gray-300"}`}>
                  {tpl.name}
                  {tpl.applyToAllProducts && " (all products)"}
                </span>
              </label>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-600 mt-1.5">Leave all unchecked to hide this product from every template.</p>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={secondaryButtonClass}>
          Cancel
        </button>
        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {submitting ? "Saving…" : initial ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}

/* ---------------------------------- Banner form ---------------------------------- */

function BannerForm({
  initial,
  templates,
  products,
  submitting,
  onCancel,
  onSubmit,
}: {
  initial: Banner | null;
  templates: BannerTemplate[];
  products: Product[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: BannerFormValues) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl ?? "");
  const [productId, setProductId] = useState(initial?.productId ?? "");
  const [order, setOrder] = useState(initial ? String(initial.order) : "0");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [templateIds, setTemplateIds] = useState<string[]>(initial?.templateIds ?? []);
  const toast = useToast();

  const toggleTemplate = (id: string) => {
    setTemplateIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      toast.error("Banner image is required");
      return;
    }
    onSubmit({
      title: title.trim(),
      subtitle: subtitle.trim(),
      linkUrl: linkUrl.trim(),
      productId,
      order: Number.parseInt(order, 10) || 0,
      isActive,
      imageUrl: imageUrl.trim(),
      templateIds,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Banner title"
          className={inputClass}
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Subtitle</label>
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Optional subtitle"
          className={inputClass}
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Tag a product</label>
        <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputClass}>
          <option value="" className="bg-[#111113]">
            No product — use link URL below
          </option>
          {products.map((p) => (
            <option key={p._id} value={p._id} className="bg-[#111113]">
              {p.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-600 mt-1.5">
          Clicking the banner will open this product&apos;s page instead of the link URL.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Link URL</label>
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="/shop"
            disabled={!!productId}
            className={`${inputClass} disabled:opacity-40 disabled:cursor-not-allowed`}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Display order</label>
          <input
            type="number"
            step="1"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Image</label>
        <ImageField value={imageUrl} onChange={setImageUrl} />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Show in templates</label>
        {templates.length === 0 ? (
          <p className="text-xs text-gray-600">
            No banner templates yet — create one below and it&apos;ll appear here.
          </p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {templates.map((tpl) => (
              <label key={tpl._id} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={templateIds.includes(tpl._id)}
                  onChange={() => toggleTemplate(tpl._id)}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
                />
                <span className="text-sm text-gray-300">{tpl.name}</span>
              </label>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-600 mt-1.5">Leave all unchecked to show in every template.</p>
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
        />
        <span className="text-sm text-gray-300">Active</span>
      </label>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={secondaryButtonClass}>
          Cancel
        </button>
        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {submitting ? "Saving…" : initial ? "Save changes" : "Create banner"}
        </button>
      </div>
    </form>
  );
}

/* ---------------------------------- Product template form ---------------------------------- */

const PRODUCT_TEMPLATE_POSITION_OPTIONS: { value: ProductTemplatePosition; label: string }[] = [
  { value: "top", label: "Top of page" },
  { value: "above-grid", label: "Above products" },
  { value: "bottom", label: "Bottom of page" },
];

function ProductTemplateForm({
  initial,
  submitting,
  onCancel,
  onSubmit,
}: {
  initial: ProductTemplate | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: ProductTemplateFormValues) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [layout, setLayout] = useState<ProductTemplateLayout>(initial?.layout ?? "grid");
  const [position, setPosition] = useState<ProductTemplatePosition>(initial?.position ?? "top");
  const [size, setSize] = useState<ProductTemplateSize>(initial?.size ?? "medium");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [order, setOrder] = useState(initial ? String(initial.order) : "0");
  const [applyToAllProducts, setApplyToAllProducts] = useState(initial?.applyToAllProducts ?? false);
  const [isDefaultGrid, setIsDefaultGrid] = useState(initial?.isDefaultGrid ?? false);
  const [options, setOptions] = useState<ProductTemplateOptions>(initial?.options ?? DEFAULT_PRODUCT_TEMPLATE_OPTIONS);
  const toast = useToast();

  const updateCarousel = (patch: Partial<ProductTemplateOptions["carousel"]>) =>
    setOptions((prev) => ({ ...prev, carousel: { ...prev.carousel, ...patch } }));
  const updateGrid = (patch: Partial<ProductTemplateOptions["grid"]>) =>
    setOptions((prev) => ({ ...prev, grid: { ...prev.grid, ...patch } }));
  const updateSpotlight = (patch: Partial<ProductTemplateOptions["spotlight"]>) =>
    setOptions((prev) => ({ ...prev, spotlight: { ...prev.spotlight, ...patch } }));
  const updateSidebar = (patch: Partial<ProductTemplateOptions["sidebar"]>) =>
    setOptions((prev) => ({ ...prev, sidebar: { ...prev.sidebar, ...patch } }));
  const updateShowcase = (patch: Partial<ProductTemplateOptions["showcase"]>) =>
    setOptions((prev) => ({ ...prev, showcase: { ...prev.showcase, ...patch } }));
  const updateBento = (patch: Partial<ProductTemplateOptions["bento"]>) =>
    setOptions((prev) => ({ ...prev, bento: { ...prev.bento, ...patch } }));
  const updateMarquee = (patch: Partial<ProductTemplateOptions["marquee"]>) =>
    setOptions((prev) => ({ ...prev, marquee: { ...prev.marquee, ...patch } }));
  const updateCinematic = (patch: Partial<ProductTemplateOptions["cinematic"]>) =>
    setOptions((prev) => ({ ...prev, cinematic: { ...prev.cinematic, ...patch } }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }
    onSubmit({
      name: name.trim(),
      layout,
      position: layout === "sidebar" ? "sidebar" : position,
      size,
      isActive,
      order: Number.parseInt(order, 10) || 0,
      applyToAllProducts,
      isDefaultGrid: layout === "grid" && isDefaultGrid,
      options,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Template name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. New Arrivals"
          className={inputClass}
        />
      </div>

      <div>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={applyToAllProducts}
            onChange={(e) => setApplyToAllProducts(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
          />
          <span className="text-sm text-gray-300">Apply to all products</span>
        </label>
        <p className="text-xs text-gray-600 mt-1.5">
          Shows every product in the catalog instead of only ones tagged to this template below.
        </p>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Layout</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {PRODUCT_LAYOUT_TEMPLATES.map((tpl) => (
            <button
              type="button"
              key={tpl.id}
              onClick={() => setLayout(tpl.id)}
              className={`text-left rounded-xl border p-4 transition-colors ${
                layout === tpl.id ? "border-white bg-white/5" : "border-white/10 hover:border-white/20"
              }`}
            >
              <LayoutPreview layout={tpl.id} />
              <div className="text-sm font-medium text-white mt-3">{tpl.label}</div>
              <div className="text-xs text-gray-500 mt-1">{tpl.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <label className="text-xs text-gray-500 block">Size</label>
          <InfoTooltip>
            <p className="font-medium text-white mb-2">
              {PRODUCT_LAYOUT_TEMPLATES.find((l) => l.id === layout)?.label ?? layout} dimensions
            </p>
            <ul className="space-y-1.5">
              {SIZE_OPTIONS.map((opt) => (
                <li key={opt.value} className="flex items-baseline justify-between gap-3">
                  <span className="text-gray-500 shrink-0">{opt.label}</span>
                  <span className="text-gray-300 text-right">{PRODUCT_SIZE_DIMENSIONS[layout][opt.value]}</span>
                </li>
              ))}
            </ul>
          </InfoTooltip>
        </div>
        <SegmentedControl value={size} onChange={setSize} options={SIZE_OPTIONS} />
        <p className="text-xs text-gray-600 mt-1.5">
          How prominent this product block is on the shop page — applies no matter which layout you pick above.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {layout === "sidebar" ? (
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Position on shop page</label>
            <p className="text-sm text-gray-400 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              Fixed to the page&apos;s left and right margins
            </p>
          </div>
        ) : (
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Position on shop page</label>
            <SegmentedControl
              value={position as "top" | "above-grid" | "bottom"}
              onChange={setPosition}
              options={PRODUCT_TEMPLATE_POSITION_OPTIONS}
            />
          </div>
        )}
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Order within position</label>
          <input
            type="number"
            step="1"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>

      {layout === "carousel" && (
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.carousel.autoAdvance}
              onChange={(e) => updateCarousel({ autoAdvance: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
            />
            <span className="text-sm text-gray-300">Auto-advance</span>
          </label>
          <div className="max-w-xs">
            <label className="text-xs text-gray-500 mb-1.5 block">Interval (seconds)</label>
            <ClampedNumberInput
              min={2}
              max={10}
              fallback={5}
              value={Math.round(options.carousel.intervalMs / 1000)}
              onCommit={(seconds) => updateCarousel({ intervalMs: seconds * 1000 })}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.carousel.showArrows}
                onChange={(e) => updateCarousel({ showArrows: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
              />
              <span className="text-sm text-gray-300">Show arrows</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.carousel.showDots}
                onChange={(e) => updateCarousel({ showDots: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
              />
              <span className="text-sm text-gray-300">Show dots</span>
            </label>
          </div>
        </div>
      )}

      {layout === "grid" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Columns</label>
              <SegmentedControl
                value={options.grid.columns}
                onChange={(v) => updateGrid({ columns: v })}
                options={[
                  { value: 2, label: "2" },
                  { value: 3, label: "3" },
                  { value: 4, label: "4" },
                ]}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Rows</label>
              <SegmentedControl
                value={options.grid.rows}
                onChange={(v) => updateGrid({ rows: v })}
                options={[
                  { value: 1, label: "1" },
                  { value: 2, label: "2" },
                  { value: 3, label: "3" },
                ]}
              />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.grid.autoAdvance}
              onChange={(e) => updateGrid({ autoAdvance: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
            />
            <span className="text-sm text-gray-300">Auto-advance</span>
          </label>
          <p className="text-xs text-gray-600">
            On: pages through the tagged products, {options.grid.columns * options.grid.rows} at a time. Off:
            shows every tagged product at once in one grid.
          </p>
          {options.grid.autoAdvance && (
            <div className="max-w-xs">
              <label className="text-xs text-gray-500 mb-1.5 block">Interval (seconds)</label>
              <ClampedNumberInput
                min={2}
                max={10}
                fallback={5}
                value={Math.round(options.grid.intervalMs / 1000)}
                onCommit={(seconds) => updateGrid({ intervalMs: seconds * 1000 })}
                className={inputClass}
              />
            </div>
          )}
          <div className="border-t border-white/10 pt-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDefaultGrid}
                onChange={(e) => setIsDefaultGrid(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
              />
              <span className="text-sm text-gray-300">Use as the main shop grid</span>
            </label>
            <p className="text-xs text-gray-600 mt-1.5">
              Replaces the default columns/page-size on the /shop catalog grid with this template&apos;s
              Columns × Rows. Only one template can be the default at a time — checking this unchecks it on
              any other template.
            </p>
          </div>
        </div>
      )}

      {layout === "spotlight" && (
        <div className="max-w-xs">
          <label className="text-xs text-gray-500 mb-1.5 block">Max list items</label>
          <ClampedNumberInput
            min={1}
            max={8}
            fallback={4}
            value={options.spotlight.maxListItems}
            onCommit={(value) => updateSpotlight({ maxListItems: value })}
            className={inputClass}
          />
        </div>
      )}

      {layout === "sidebar" && (
        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            Tag as many products to this template as you like below — the left and right rails will cycle
            through all of them.
          </p>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.sidebar.autoAdvance}
              onChange={(e) => updateSidebar({ autoAdvance: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
            />
            <span className="text-sm text-gray-300">Auto-advance</span>
          </label>
          <div className="max-w-xs">
            <label className="text-xs text-gray-500 mb-1.5 block">Interval (seconds)</label>
            <ClampedNumberInput
              min={2}
              max={15}
              fallback={4}
              value={Math.round(options.sidebar.intervalMs / 1000)}
              onCommit={(seconds) => updateSidebar({ intervalMs: seconds * 1000 })}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {layout === "showcase" && (
        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            Tag 4 or more products to this template — two show large in the center, the rest peek at the
            edges. Arrows (or auto-advance) slide the row by one product at a time.
          </p>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.showcase.autoAdvance}
              onChange={(e) => updateShowcase({ autoAdvance: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
            />
            <span className="text-sm text-gray-300">Auto-advance</span>
          </label>
          <div className="max-w-xs">
            <label className="text-xs text-gray-500 mb-1.5 block">Interval (seconds)</label>
            <ClampedNumberInput
              min={2}
              max={10}
              fallback={5}
              value={Math.round(options.showcase.intervalMs / 1000)}
              onCommit={(seconds) => updateShowcase({ intervalMs: seconds * 1000 })}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.showcase.showArrows}
              onChange={(e) => updateShowcase({ showArrows: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
            />
            <span className="text-sm text-gray-300">Show arrows</span>
          </label>
        </div>
      )}

      {layout === "bento" && (
        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            The first products (by order) become the large featured tiles; the rest fill in as smaller
            cells around them.
          </p>
          <div className="max-w-xs">
            <label className="text-xs text-gray-500 mb-1.5 block">Featured tiles</label>
            <SegmentedControl
              value={options.bento.featuredCount}
              onChange={(v) => updateBento({ featuredCount: v })}
              options={[
                { value: 1, label: "1 large" },
                { value: 2, label: "2 large" },
              ]}
            />
          </div>
        </div>
      )}

      {layout === "marquee" && (
        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            Every tagged product scrolls past in one continuous, looping strip.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Speed</label>
              <SegmentedControl
                value={options.marquee.speed}
                onChange={(v) => updateMarquee({ speed: v })}
                options={[
                  { value: "slow", label: "Slow" },
                  { value: "normal", label: "Normal" },
                  { value: "fast", label: "Fast" },
                ]}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Direction</label>
              <SegmentedControl
                value={options.marquee.direction}
                onChange={(v) => updateMarquee({ direction: v })}
                options={[
                  { value: "left", label: "Left" },
                  { value: "right", label: "Right" },
                ]}
              />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.marquee.pauseOnHover}
              onChange={(e) => updateMarquee({ pauseOnHover: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
            />
            <span className="text-sm text-gray-300">Pause on hover</span>
          </label>
        </div>
      )}

      {layout === "cinematic" && (
        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            Premium immersive layout with Ken Burns zoom, glassmorphism cards, and fade transitions.
          </p>
          <div className="max-w-xs">
            <label className="text-xs text-gray-500 mb-1.5 block">Transition interval</label>
            <div className="flex items-center gap-2">
              <ClampedNumberInput
                value={options.cinematic.intervalMs / 1000}
                min={3}
                max={15}
                fallback={6}
                onCommit={(s) => updateCinematic({ intervalMs: s * 1000 })}
                className="w-16 rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30"
              />
              <span className="text-sm text-gray-500">seconds</span>
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.cinematic.autoAdvance}
                onChange={(e) => updateCinematic({ autoAdvance: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
              />
              <span className="text-sm text-gray-300">Auto-advance to next product</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.cinematic.showProgressBar}
                onChange={(e) => updateCinematic({ showProgressBar: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
              />
              <span className="text-sm text-gray-300">Show progress bar</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.cinematic.kenBurnsEffect}
                onChange={(e) => updateCinematic({ kenBurnsEffect: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
              />
              <span className="text-sm text-gray-300">Enable Ken Burns (zoom & pan) effect on background</span>
            </label>
          </div>
        </div>
      )}

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
        />
        <span className="text-sm text-gray-300">Active (renders on the shop page)</span>
      </label>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={secondaryButtonClass}>
          Cancel
        </button>
        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {submitting ? "Saving…" : initial ? "Save changes" : "Create template"}
        </button>
      </div>
    </form>
  );
}

function ProductTemplatesSection({
  templates,
  onCreate,
  onUpdate,
  onDelete,
}: {
  templates: ProductTemplate[];
  onCreate: (values: ProductTemplateFormValues) => Promise<void>;
  onUpdate: (id: string, values: ProductTemplateFormValues) => Promise<void>;
  onDelete: (template: ProductTemplate) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProductTemplate | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (template: ProductTemplate) => {
    setEditing(template);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async (values: ProductTemplateFormValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await onUpdate(editing._id, values);
      } else {
        await onCreate(values);
      }
      closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  const POSITION_LABELS: Record<ProductTemplatePosition, string> = {
    top: "Top of page",
    "above-grid": "Above products",
    bottom: "Bottom of page",
    sidebar: "Page sides (left + right)",
  };

  const intervalLabel = (tpl: ProductTemplate): string | null => {
    switch (tpl.layout) {
      case "carousel":
        return tpl.options.carousel.autoAdvance ? `Every ${Math.round(tpl.options.carousel.intervalMs / 1000)}s` : "Auto-advance off";
      case "grid":
        return tpl.options.grid.autoAdvance ? `Every ${Math.round(tpl.options.grid.intervalMs / 1000)}s` : "Static grid";
      case "sidebar":
        return tpl.options.sidebar.autoAdvance ? `Every ${Math.round(tpl.options.sidebar.intervalMs / 1000)}s` : "Auto-advance off";
      case "showcase":
        return tpl.options.showcase.autoAdvance ? `Every ${Math.round(tpl.options.showcase.intervalMs / 1000)}s` : "Auto-advance off";
      case "marquee":
        return "Continuous scroll";
      default:
        return null;
    }
  };

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-white">Product templates</h3>
        <button onClick={openCreate} className={`${primaryButtonClass} flex items-center gap-2 !px-4 !py-2 text-xs`}>
          <Plus className="w-3.5 h-3.5" /> Add template
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Every active template renders on the shop page at its own position, all at once.
      </p>

      {templates.length === 0 ? (
        <EmptyState message="No product templates yet. Add one, then tag products into it from the product form." />
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => {
            const interval = intervalLabel(tpl);
            return (
              <div
                key={tpl._id}
                className="flex items-center gap-4 bg-[#0a0a0b] border border-white/10 rounded-xl p-4"
              >
                <div className="h-10 w-10 shrink-0 rounded-lg bg-white/5 grid place-items-center">
                  <LayoutPreview layout={tpl.layout} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-white truncate">{tpl.name}</h4>
                    <span
                      className={`shrink-0 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                        tpl.isActive
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                          : "bg-white/5 text-gray-500 border-white/10"
                      }`}
                    >
                      {tpl.isActive ? "Live" : "Hidden"}
                    </span>
                    {tpl.isDefaultGrid && (
                      <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-300 border-blue-500/20">
                        Default grid
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {PRODUCT_LAYOUT_TEMPLATES.find((l) => l.id === tpl.layout)?.label ?? tpl.layout} ·{" "}
                    {POSITION_LABELS[tpl.position]}
                    {interval && ` · ${interval}`} · Order {tpl.order} ·{" "}
                    {tpl.applyToAllProducts ? "All products" : "Tagged products"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => openEdit(tpl)}
                    aria-label="Edit template"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(tpl)}
                    aria-label="Delete template"
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit template" : "Add template"} onClose={closeForm} widthClass="max-w-4xl">
          <ProductTemplateForm initial={editing} submitting={submitting} onCancel={closeForm} onSubmit={handleSubmit} />
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------- Products tab ---------------------------------- */

function ProductsSection({
  products,
  categories,
  productTemplates,
  onCreate,
  onUpdate,
  onDelete,
  onRenameCategory,
  onDeleteCategory,
  onCreateProductTemplate,
  onUpdateProductTemplate,
  onDeleteProductTemplate,
}: {
  products: Product[];
  categories: string[];
  productTemplates: ProductTemplate[];
  onCreate: (values: ProductFormValues) => Promise<void>;
  onUpdate: (id: string, values: ProductFormValues) => Promise<void>;
  onDelete: (product: Product) => Promise<void>;
  onRenameCategory: (oldName: string, newName: string) => Promise<void>;
  onDeleteCategory: (name: string) => Promise<void>;
  onCreateProductTemplate: (values: ProductTemplateFormValues) => Promise<void>;
  onUpdateProductTemplate: (id: string, values: ProductTemplateFormValues) => Promise<void>;
  onDeleteProductTemplate: (template: ProductTemplate) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const { formatPrice } = useCurrency();

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) counts[p.category] = (counts[p.category] ?? 0) + 1;
    return counts;
  }, [products]);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (product: Product) => {
    setEditing(product);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async (values: ProductFormValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await onUpdate(editing._id, values);
      } else {
        await onCreate(values);
      }
      closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <ProductTemplatesSection
        templates={productTemplates}
        onCreate={onCreateProductTemplate}
        onUpdate={onUpdateProductTemplate}
        onDelete={onDeleteProductTemplate}
      />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-sm text-gray-500">
          {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
          {search.trim() && ` of ${products.length}`}
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className={`${inputClass} pl-10 w-56`}
            />
          </div>
          <button onClick={openCreate} className={`${primaryButtonClass} flex items-center gap-2 shrink-0`}>
            <Plus className="w-4 h-4" /> Add product
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState message="No products yet. Add your first product to get started." />
      ) : filteredProducts.length === 0 ? (
        <EmptyState message="No products match your search." />
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => {
            const imageCount = (product.imageUrl ? 1 : 0) + (product.images?.length ?? 0);
            const onSale = !!product.discountPercent && product.discountPercent > 0;
            return (
              <div key={product._id} className="flex items-center gap-4 bg-[#111113] border border-white/10 rounded-2xl p-4">
                <Thumbnail src={product.imageUrl} alt={product.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-white truncate">{product.name}</h4>
                    {product.isFeatured && (
                      <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/10">
                        Featured
                      </span>
                    )}
                    {onSale && (
                      <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        -{product.discountPercent}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {product.category} · {product.stock} in stock · {imageCount} image{imageCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-sm font-medium text-white shrink-0">
                  {onSale ? (
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 line-through">{formatPrice(product.price)}</span>
                      <span className="text-emerald-300">{formatPrice(product.effectivePrice ?? product.price)}</span>
                    </span>
                  ) : (
                    formatPrice(product.price)
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => openEdit(product)}
                    aria-label="Edit product"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(product)}
                    aria-label="Delete product"
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit product" : "Add product"} onClose={closeForm}>
          <ProductForm
            initial={editing}
            categories={categories}
            categoryCounts={categoryCounts}
            productTemplates={productTemplates}
            submitting={submitting}
            onCancel={closeForm}
            onSubmit={handleSubmit}
            onRenameCategory={onRenameCategory}
            onDeleteCategory={onDeleteCategory}
          />
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------- Orders tab ---------------------------------- */

function OrdersSection({
  orders,
  onStatusChange,
  onRefresh,
  highlightOrderId,
}: {
  orders: Order[];
  onStatusChange: (order: Order, status: OrderStatus) => Promise<void>;
  onRefresh: () => Promise<void>;
  highlightOrderId?: string | null;
}) {
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const { formatPrice } = useCurrency();

  const handleChange = async (order: Order, status: OrderStatus) => {
    setUpdating((prev) => new Set(prev).add(order._id));
    try {
      await onStatusChange(order, status);
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(order._id);
        return next;
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const newCount = orders.filter((o) => o.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-sm text-gray-500">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </h2>
        {newCount > 0 && (
          <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Sparkles className="w-3 h-3" /> {newCount} new
          </span>
        )}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh orders"
          className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <EmptyState message="No orders yet." />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const address = formatAddress(order.shippingAddress);
            const isUpdating = updating.has(order._id);
            const isNew = order.status === "PENDING";
            const isHighlighted = highlightOrderId === order._id;
            return (
              <div
                id={`order-${order._id}`}
                key={order._id}
                className={`${cardClass} ${isNew ? "border-amber-500/30" : ""} ${
                  isHighlighted ? "ring-2 ring-white/60 transition-shadow" : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">#{order._id.slice(-8)}</span>
                      {isNew && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
                          <Sparkles className="w-2.5 h-2.5" /> New
                        </span>
                      )}
                      <Link
                        href={`/orders/${order._id}/invoice`}
                        target="_blank"
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5" /> Invoice
                      </Link>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">{formatPrice(order.totalAmount)}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={`${item.productId}-${idx}`} className="flex items-center gap-3">
                      <Thumbnail src={item.imageUrl} alt={item.name} size="h-10 w-10" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.quantity} × {formatPrice(item.price)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-300 shrink-0">
                        {formatPrice(item.quantity * item.price)}
                      </div>
                    </div>
                  ))}
                </div>

                {address && <p className="text-xs text-gray-500 mb-4">{address}</p>}

                <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                  <span className="text-xs text-gray-500">Status</span>
                  <select
                    value={order.status}
                    disabled={isUpdating}
                    onChange={(e) => handleChange(order, e.target.value as OrderStatus)}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium focus:outline-none focus:border-white/30 transition-colors disabled:opacity-50 ${STATUS_STYLES[order.status]}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="bg-[#111113] text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Notifications tab ---------------------------------- */

function NotificationsSection({
  orders,
  onView,
}: {
  orders: Order[];
  onView: (orderId: string) => void;
}) {
  const { formatPrice } = useCurrency();
  const newOrders = orders
    .filter((o) => o.status === "PENDING")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-sm text-gray-500">
          {newOrders.length} new order{newOrders.length !== 1 ? "s" : ""}
        </h2>
        {newOrders.length > 0 && (
          <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Sparkles className="w-3 h-3" /> Needs attention
          </span>
        )}
      </div>

      {newOrders.length === 0 ? (
        <EmptyState message="No new orders. You're all caught up." />
      ) : (
        <div className="space-y-3">
          {newOrders.map((order) => {
            const address = formatAddress(order.shippingAddress);
            return (
              <div
                key={order._id}
                className={`${cardClass} border-amber-500/30 flex flex-wrap items-center justify-between gap-4`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">#{order._id.slice(-8)}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
                        New
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {formatDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      {address ? ` · ${address}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm font-medium text-white">{formatPrice(order.totalAmount)}</span>
                  <button
                    onClick={() => onView(order._id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-black bg-white hover:bg-gray-200 px-4 py-2 rounded-full transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Users tab ---------------------------------- */

function UsersSection({ users }: { users: AdminUser[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-sm text-gray-500">
        {users.length} user{users.length !== 1 ? "s" : ""}
      </h2>

      {users.length === 0 ? (
        <EmptyState message="No users found." />
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user._id} className="flex items-center gap-4 bg-[#111113] border border-white/10 rounded-2xl p-4">
              <div className="h-10 w-10 shrink-0 rounded-full bg-white/10 grid place-items-center text-sm font-semibold text-white">
                {(user.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{user.name}</div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
              </div>
              <span
                className={`shrink-0 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                  user.role === "Admin"
                    ? "bg-white/10 text-white border-white/20"
                    : "bg-white/5 text-gray-400 border-white/10"
                }`}
              >
                {user.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Banner layout panel ---------------------------------- */

const LAYOUT_TEMPLATES: { id: BannerLayout; label: string; description: string }[] = [
  { id: "carousel", label: "Carousel", description: "One full-width banner at a time, auto-advancing." },
  { id: "grid", label: "Grid", description: "All active banners shown at once in a card grid." },
  { id: "spotlight", label: "Spotlight", description: "One featured banner with a list of others beside it." },
  { id: "sidebar", label: "Sidebar", description: "Small auto-rotating banners fixed to the page's left and right margins." },
  { id: "showcase", label: "Showcase", description: "A row with two large banners in the center and smaller ones peeking at each side." },
  { id: "bento", label: "Bento", description: "Modern asymmetric grid — one or two large featured tiles with smaller ones filling in around them." },
  { id: "marquee", label: "Marquee", description: "All banners in one continuous, auto-scrolling strip." },
  { id: "cinematic", label: "Cinematic", description: "Premium immersive layout with Ken Burns zoom, glassmorphism cards, and fade transitions." },
];

function LayoutPreview({ layout }: { layout: BannerLayout }) {
  if (layout === "grid") {
    return (
      <div className="grid grid-cols-2 gap-1 h-12 w-full">
        <div className="rounded-md bg-white/20" />
        <div className="rounded-md bg-white/20" />
        <div className="rounded-md bg-white/20" />
        <div className="rounded-md bg-white/20" />
      </div>
    );
  }
  if (layout === "spotlight") {
    return (
      <div className="flex gap-1 h-12 w-full">
        <div className="flex-1 rounded-md bg-white/20" />
        <div className="w-6 flex flex-col gap-1">
          <div className="flex-1 rounded-md bg-white/20" />
          <div className="flex-1 rounded-md bg-white/20" />
          <div className="flex-1 rounded-md bg-white/20" />
        </div>
      </div>
    );
  }
  if (layout === "sidebar") {
    return (
      <div className="flex justify-between h-12 w-full">
        <div className="w-3 rounded-md bg-white/20" />
        <div className="flex-1" />
        <div className="w-3 rounded-md bg-white/20" />
      </div>
    );
  }
  if (layout === "showcase") {
    return (
      <div className="flex items-center gap-1 h-12 w-full">
        <div className="w-3 h-8 rounded-md bg-white/20" />
        <div className="flex-1 h-full rounded-md bg-white/20" />
        <div className="flex-1 h-full rounded-md bg-white/20" />
        <div className="w-3 h-8 rounded-md bg-white/20" />
      </div>
    );
  }
  if (layout === "bento") {
    return (
      <div className="grid grid-cols-3 grid-rows-2 gap-1 h-12 w-full">
        <div className="col-span-2 row-span-2 rounded-md bg-white/20" />
        <div className="rounded-md bg-white/20" />
        <div className="rounded-md bg-white/20" />
      </div>
    );
  }
  if (layout === "marquee") {
    return (
      <div className="flex items-center gap-1 h-12 w-full overflow-hidden">
        <div className="w-10 h-8 rounded-md bg-white/20 shrink-0" />
        <div className="w-10 h-8 rounded-md bg-white/20 shrink-0" />
        <div className="w-10 h-8 rounded-md bg-white/10 shrink-0" />
      </div>
    );
  }
  return <div className="h-12 w-full rounded-md bg-white/20" />;
}

const PRODUCT_LAYOUT_TEMPLATES: { id: ProductTemplateLayout; label: string; description: string }[] = [
  {
    id: "carousel",
    label: "Carousel",
    description: "One full-width product at a time, auto-advancing.",
  },
  {
    id: "grid",
    label: "Grid",
    description: "Tagged products in a 2-row grid; optionally auto-advances to the next set.",
  },
  {
    id: "spotlight",
    label: "Spotlight",
    description: "One featured product with a list of others beside it.",
  },
  {
    id: "sidebar",
    label: "Sidebar",
    description: "Small auto-rotating products fixed to the page's left and right margins.",
  },
  {
    id: "showcase",
    label: "Showcase",
    description: "A row with two large products in the center and smaller ones peeking at each side.",
  },
  {
    id: "bento",
    label: "Bento",
    description: "Modern asymmetric grid — one or two large featured tiles with smaller ones filling in around them.",
  },
  {
    id: "marquee",
    label: "Marquee",
    description: "All tagged products in one continuous, auto-scrolling strip.",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    description: "Premium immersive layout with Ken Burns zoom, glassmorphism cards, and fade transitions.",
  },
];

function SegmentedControl<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs w-fit">
      {options.map((opt) => (
        <button
          type="button"
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 transition-colors ${
            value === opt.value ? "bg-white text-black" : "bg-transparent text-gray-400 hover:text-white"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// A number input that lets you freely type/clear the field — clamping only
// happens once you leave it, instead of on every keystroke (which used to
// snap the value back mid-type and made it impossible to enter anything
// below the minimum, e.g. typing "10" when min is 2).
function ClampedNumberInput({
  value,
  min,
  max,
  fallback,
  onCommit,
  className,
}: {
  value: number;
  min: number;
  max: number;
  fallback: number;
  onCommit: (n: number) => void;
  className?: string;
}) {
  const [text, setText] = useState(String(value));

  const commit = () => {
    const parsed = Number.parseInt(text, 10);
    const clamped = Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
    setText(String(clamped));
    onCommit(clamped);
  };

  return (
    <input
      type="number"
      min={min}
      max={max}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className={className}
    />
  );
}

function BannerTemplateForm({
  initial,
  submitting,
  onCancel,
  onSubmit,
}: {
  initial: BannerTemplate | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: BannerTemplateFormValues) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [layout, setLayout] = useState<BannerLayout>(initial?.layout ?? "carousel");
  const [position, setPosition] = useState<BannerPosition>(initial?.position ?? "top");
  const [size, setSize] = useState<BannerSize>(initial?.size ?? "medium");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [order, setOrder] = useState(initial ? String(initial.order) : "0");
  const [options, setOptions] = useState<BannerTemplateOptions>(initial?.options ?? DEFAULT_TEMPLATE_OPTIONS);
  const toast = useToast();

  const updateCarousel = (patch: Partial<BannerTemplateOptions["carousel"]>) =>
    setOptions((prev) => ({ ...prev, carousel: { ...prev.carousel, ...patch } }));
  const updateGrid = (patch: Partial<BannerTemplateOptions["grid"]>) =>
    setOptions((prev) => ({ ...prev, grid: { ...prev.grid, ...patch } }));
  const updateSpotlight = (patch: Partial<BannerTemplateOptions["spotlight"]>) =>
    setOptions((prev) => ({ ...prev, spotlight: { ...prev.spotlight, ...patch } }));
  const updateSidebar = (patch: Partial<BannerTemplateOptions["sidebar"]>) =>
    setOptions((prev) => ({ ...prev, sidebar: { ...prev.sidebar, ...patch } }));
  const updateShowcase = (patch: Partial<BannerTemplateOptions["showcase"]>) =>
    setOptions((prev) => ({ ...prev, showcase: { ...prev.showcase, ...patch } }));
  const updateBento = (patch: Partial<BannerTemplateOptions["bento"]>) =>
    setOptions((prev) => ({ ...prev, bento: { ...prev.bento, ...patch } }));
  const updateMarquee = (patch: Partial<BannerTemplateOptions["marquee"]>) =>
    setOptions((prev) => ({ ...prev, marquee: { ...prev.marquee, ...patch } }));
  const updateCinematic = (patch: Partial<BannerTemplateOptions["cinematic"]>) =>
    setOptions((prev) => ({ ...prev, cinematic: { ...prev.cinematic, ...patch } }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }
    onSubmit({
      name: name.trim(),
      layout,
      position: layout === "sidebar" ? "sidebar" : position,
      size,
      isActive,
      order: Number.parseInt(order, 10) || 0,
      options,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Template name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Summer Sale Grid"
          className={inputClass}
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Layout</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {LAYOUT_TEMPLATES.map((tpl) => (
            <button
              type="button"
              key={tpl.id}
              onClick={() => setLayout(tpl.id)}
              className={`text-left rounded-xl border p-4 transition-colors ${
                layout === tpl.id ? "border-white bg-white/5" : "border-white/10 hover:border-white/20"
              }`}
            >
              <LayoutPreview layout={tpl.id} />
              <div className="text-sm font-medium text-white mt-3">{tpl.label}</div>
              <div className="text-xs text-gray-500 mt-1">{tpl.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <label className="text-xs text-gray-500 block">Size</label>
          <InfoTooltip>
            <p className="font-medium text-white mb-2">
              {LAYOUT_TEMPLATES.find((l) => l.id === layout)?.label ?? layout} dimensions
            </p>
            <ul className="space-y-1.5">
              {SIZE_OPTIONS.map((opt) => (
                <li key={opt.value} className="flex items-baseline justify-between gap-3">
                  <span className="text-gray-500 shrink-0">{opt.label}</span>
                  <span className="text-gray-300 text-right">{SIZE_DIMENSIONS[layout][opt.value]}</span>
                </li>
              ))}
            </ul>
          </InfoTooltip>
        </div>
        <SegmentedControl value={size} onChange={setSize} options={SIZE_OPTIONS} />
        <p className="text-xs text-gray-600 mt-1.5">
          How prominent this banner block is on the shop page — applies no matter which layout you pick above.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {layout === "sidebar" ? (
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Position on shop page</label>
            <p className="text-sm text-gray-400 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              Fixed to the page&apos;s left and right margins
            </p>
          </div>
        ) : (
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Position on shop page</label>
            <SegmentedControl
              value={position as "top" | "above-grid" | "bottom"}
              onChange={setPosition}
              options={[
                { value: "top", label: "Top of page" },
                { value: "above-grid", label: "Above products" },
                { value: "bottom", label: "Bottom of page" },
              ]}
            />
          </div>
        )}
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Order within position</label>
          <input
            type="number"
            step="1"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>

      {layout === "carousel" && (
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.carousel.autoAdvance}
              onChange={(e) => updateCarousel({ autoAdvance: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
            />
            <span className="text-sm text-gray-300">Auto-advance</span>
          </label>
          <div className="max-w-xs">
            <label className="text-xs text-gray-500 mb-1.5 block">Interval (seconds)</label>
            <ClampedNumberInput
              min={2}
              max={10}
              fallback={5}
              value={Math.round(options.carousel.intervalMs / 1000)}
              onCommit={(seconds) => updateCarousel({ intervalMs: seconds * 1000 })}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.carousel.showArrows}
                onChange={(e) => updateCarousel({ showArrows: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
              />
              <span className="text-sm text-gray-300">Show arrows</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.carousel.showDots}
                onChange={(e) => updateCarousel({ showDots: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
              />
              <span className="text-sm text-gray-300">Show dots</span>
            </label>
          </div>
        </div>
      )}

      {layout === "grid" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Columns</label>
              <SegmentedControl
                value={options.grid.columns}
                onChange={(v) => updateGrid({ columns: v })}
                options={[
                  { value: 2, label: "2" },
                  { value: 3, label: "3" },
                  { value: 4, label: "4" },
                ]}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Aspect ratio</label>
              <SegmentedControl
                value={options.grid.aspectRatio}
                onChange={(v) => updateGrid({ aspectRatio: v })}
                options={[
                  { value: "landscape", label: "Landscape" },
                  { value: "square", label: "Square" },
                ]}
              />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.grid.showSubtitle}
              onChange={(e) => updateGrid({ showSubtitle: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
            />
            <span className="text-sm text-gray-300">Show subtitle</span>
          </label>
        </div>
      )}

      {layout === "spotlight" && (
        <div className="space-y-4">
          <div className="max-w-xs">
            <label className="text-xs text-gray-500 mb-1.5 block">Max list items</label>
            <ClampedNumberInput
              min={1}
              max={8}
              fallback={4}
              value={options.spotlight.maxListItems}
              onCommit={(value) => updateSpotlight({ maxListItems: value })}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.spotlight.showListSubtitle}
              onChange={(e) => updateSpotlight({ showListSubtitle: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
            />
            <span className="text-sm text-gray-300">Show subtitle in list</span>
          </label>
        </div>
      )}

      {layout === "sidebar" && (
        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            Tag as many banners to this template as you like below — the left and right rails will cycle
            through all of them.
          </p>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.sidebar.autoAdvance}
              onChange={(e) => updateSidebar({ autoAdvance: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
            />
            <span className="text-sm text-gray-300">Auto-advance</span>
          </label>
          <div className="max-w-xs">
            <label className="text-xs text-gray-500 mb-1.5 block">Interval (seconds)</label>
            <ClampedNumberInput
              min={2}
              max={15}
              fallback={4}
              value={Math.round(options.sidebar.intervalMs / 1000)}
              onCommit={(seconds) => updateSidebar({ intervalMs: seconds * 1000 })}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {layout === "showcase" && (
        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            Tag 4 or more banners to this template — two show large in the center, the rest peek at the
            edges. Arrows (or auto-advance) slide the row by one banner at a time.
          </p>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.showcase.autoAdvance}
              onChange={(e) => updateShowcase({ autoAdvance: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
            />
            <span className="text-sm text-gray-300">Auto-advance</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Interval (seconds)</label>
              <ClampedNumberInput
                min={2}
                max={10}
                fallback={5}
                value={Math.round(options.showcase.intervalMs / 1000)}
                onCommit={(seconds) => updateShowcase({ intervalMs: seconds * 1000 })}
                className={inputClass}
              />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.showcase.showArrows}
              onChange={(e) => updateShowcase({ showArrows: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
            />
            <span className="text-sm text-gray-300">Show arrows</span>
          </label>
        </div>
      )}

      {layout === "bento" && (
        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            The first banners (by order) become the large featured tiles; the rest fill in as smaller
            cells around them.
          </p>
          <div className="max-w-xs">
            <label className="text-xs text-gray-500 mb-1.5 block">Featured tiles</label>
            <SegmentedControl
              value={options.bento.featuredCount}
              onChange={(v) => updateBento({ featuredCount: v })}
              options={[
                { value: 1, label: "1 large" },
                { value: 2, label: "2 large" },
              ]}
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.bento.showSubtitle}
              onChange={(e) => updateBento({ showSubtitle: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
            />
            <span className="text-sm text-gray-300">Show subtitle on featured tiles</span>
          </label>
        </div>
      )}

      {layout === "marquee" && (
        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            Every tagged banner scrolls past in one continuous, looping strip.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Speed</label>
              <SegmentedControl
                value={options.marquee.speed}
                onChange={(v) => updateMarquee({ speed: v })}
                options={[
                  { value: "slow", label: "Slow" },
                  { value: "normal", label: "Normal" },
                  { value: "fast", label: "Fast" },
                ]}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Direction</label>
              <SegmentedControl
                value={options.marquee.direction}
                onChange={(v) => updateMarquee({ direction: v })}
                options={[
                  { value: "left", label: "Left" },
                  { value: "right", label: "Right" },
                ]}
              />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.marquee.pauseOnHover}
              onChange={(e) => updateMarquee({ pauseOnHover: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
            />
            <span className="text-sm text-gray-300">Pause on hover</span>
          </label>
        </div>
      )}

      {layout === "cinematic" && (
        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            Premium immersive layout with Ken Burns zoom, glassmorphism cards, and fade transitions.
          </p>
          <div className="max-w-xs">
            <label className="text-xs text-gray-500 mb-1.5 block">Transition interval</label>
            <div className="flex items-center gap-2">
              <ClampedNumberInput
                value={options.cinematic.intervalMs / 1000}
                min={3}
                max={15}
                fallback={6}
                onCommit={(s) => updateCinematic({ intervalMs: s * 1000 })}
                className="w-16 rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30"
              />
              <span className="text-sm text-gray-500">seconds</span>
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.cinematic.autoAdvance}
                onChange={(e) => updateCinematic({ autoAdvance: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
              />
              <span className="text-sm text-gray-300">Auto-advance to next banner</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.cinematic.showProgressBar}
                onChange={(e) => updateCinematic({ showProgressBar: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
              />
              <span className="text-sm text-gray-300">Show progress bar</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.cinematic.kenBurnsEffect}
                onChange={(e) => updateCinematic({ kenBurnsEffect: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
              />
              <span className="text-sm text-gray-300">Enable Ken Burns (zoom & pan) effect on background</span>
            </label>
          </div>
        </div>
      )}

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
        />
        <span className="text-sm text-gray-300">Active (renders on the shop page)</span>
      </label>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={secondaryButtonClass}>
          Cancel
        </button>
        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {submitting ? "Saving…" : initial ? "Save changes" : "Create template"}
        </button>
      </div>
    </form>
  );
}

function BannerTemplatesSection({
  templates,
  onCreate,
  onUpdate,
  onDelete,
}: {
  templates: BannerTemplate[];
  onCreate: (values: BannerTemplateFormValues) => Promise<void>;
  onUpdate: (id: string, values: BannerTemplateFormValues) => Promise<void>;
  onDelete: (template: BannerTemplate) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BannerTemplate | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (template: BannerTemplate) => {
    setEditing(template);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async (values: BannerTemplateFormValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await onUpdate(editing._id, values);
      } else {
        await onCreate(values);
      }
      closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  const POSITION_LABELS: Record<BannerPosition, string> = {
    top: "Top of page",
    "above-grid": "Above products",
    bottom: "Bottom of page",
    sidebar: "Page sides (left + right)",
  };
  const SIZE_LABELS: Record<BannerSize, string> = {
    small: "Small",
    medium: "Medium",
    large: "Large",
    full: "Full screen",
  };

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-white">Banner templates</h3>
        <button onClick={openCreate} className={`${primaryButtonClass} flex items-center gap-2 !px-4 !py-2 text-xs`}>
          <Plus className="w-3.5 h-3.5" /> Add template
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Every active template renders on the shop page at its own position, all at once.
      </p>

      {templates.length === 0 ? (
        <EmptyState message="No banner templates yet. Add one to start showing banners on the shop page." />
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => (
            <div
              key={tpl._id}
              className="flex items-center gap-4 bg-[#0a0a0b] border border-white/10 rounded-xl p-4"
            >
              <div className="h-10 w-10 shrink-0 rounded-lg bg-white/5 grid place-items-center">
                <LayoutPreview layout={tpl.layout} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-white truncate">{tpl.name}</h4>
                  <span
                    className={`shrink-0 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                      tpl.isActive
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                        : "bg-white/5 text-gray-500 border-white/10"
                    }`}
                  >
                    {tpl.isActive ? "Live" : "Hidden"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {LAYOUT_TEMPLATES.find((l) => l.id === tpl.layout)?.label ?? tpl.layout} ·{" "}
                  {SIZE_LABELS[tpl.size ?? "medium"]} · {POSITION_LABELS[tpl.position]} · Order {tpl.order}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => openEdit(tpl)}
                  aria-label="Edit template"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(tpl)}
                  aria-label="Delete template"
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit template" : "Add template"} onClose={closeForm} widthClass="max-w-4xl">
          <BannerTemplateForm initial={editing} submitting={submitting} onCancel={closeForm} onSubmit={handleSubmit} />
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------- Banners tab ---------------------------------- */

function BannersSection({
  banners,
  templates,
  products,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onCreate,
  onUpdate,
  onDelete,
  onToggleActive,
}: {
  banners: Banner[];
  templates: BannerTemplate[];
  products: Product[];
  onCreateTemplate: (values: BannerTemplateFormValues) => Promise<void>;
  onUpdateTemplate: (id: string, values: BannerTemplateFormValues) => Promise<void>;
  onDeleteTemplate: (template: BannerTemplate) => Promise<void>;
  onCreate: (values: BannerFormValues) => Promise<void>;
  onUpdate: (id: string, values: BannerFormValues) => Promise<void>;
  onDelete: (banner: Banner) => Promise<void>;
  onToggleActive: (banner: Banner) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (banner: Banner) => {
    setEditing(banner);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async (values: BannerFormValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await onUpdate(editing._id, values);
      } else {
        await onCreate(values);
      }
      closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  const sortedBanners = [...banners].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <BannerTemplatesSection
        templates={templates}
        onCreate={onCreateTemplate}
        onUpdate={onUpdateTemplate}
        onDelete={onDeleteTemplate}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-sm text-gray-500">
          {banners.length} banner{banners.length !== 1 ? "s" : ""}
        </h2>
        <button onClick={openCreate} className={`${primaryButtonClass} flex items-center gap-2`}>
          <Plus className="w-4 h-4" /> Add banner
        </button>
      </div>

      {sortedBanners.length === 0 ? (
        <EmptyState message="No banners yet. Add your first banner to get started." />
      ) : (
        <div className="space-y-3">
          {sortedBanners.map((banner) => (
            <div key={banner._id} className="flex items-center gap-4 bg-[#111113] border border-white/10 rounded-2xl p-4">
              <Thumbnail src={banner.imageUrl} alt={banner.title} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-white truncate">{banner.title}</h4>
                  <span
                    className={`shrink-0 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                      banner.isActive
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                        : "bg-white/5 text-gray-500 border-white/10"
                    }`}
                  >
                    {banner.isActive ? "Live" : "Hidden"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {banner.subtitle ? `${banner.subtitle} · ` : ""}Order {banner.order}
                  {banner.productId
                    ? ` · → ${products.find((p) => p._id === banner.productId)?.name ?? "Unknown product"}`
                    : banner.linkUrl
                      ? ` · ${banner.linkUrl}`
                      : ""}{" "}
                  ·{" "}
                  {banner.templateIds && banner.templateIds.length > 0
                    ? banner.templateIds
                        .map((id) => templates.find((t) => t._id === id)?.name ?? "Unknown template")
                        .join(", ")
                    : "All templates"}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => onToggleActive(banner)}
                  aria-label={banner.isActive ? "Hide banner" : "Show banner"}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {banner.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => openEdit(banner)}
                  aria-label="Edit banner"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(banner)}
                  aria-label="Delete banner"
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit banner" : "Add banner"} onClose={closeForm}>
          <BannerForm
            initial={editing}
            templates={templates}
            products={products}
            submitting={submitting}
            onCancel={closeForm}
            onSubmit={handleSubmit}
          />
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------- Promotions tab ---------------------------------- */

function describeScope(promo: { scope: PromotionScope; category?: string; productIds: string[] }) {
  if (promo.scope === "all") return "All products";
  if (promo.scope === "category") return `Category: ${promo.category || "—"}`;
  return `${promo.productIds.length} product${promo.productIds.length !== 1 ? "s" : ""}`;
}

function describeDiscount(
  promo: { discountType: DiscountType; discountValue: number },
  formatPrice: (amount: number) => string
) {
  return promo.discountType === "percentage" ? `${promo.discountValue}% off` : `${formatPrice(promo.discountValue)} off`;
}

function PromotionForm({
  initial,
  categories,
  products,
  submitting,
  onCancel,
  onSubmit,
}: {
  initial: Promotion | null;
  categories: string[];
  products: Product[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: PromotionFormValues) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [discountType, setDiscountType] = useState<DiscountType>(initial?.discountType ?? "percentage");
  const [discountValue, setDiscountValue] = useState(initial ? String(initial.discountValue) : "10");
  const [scope, setScope] = useState<PromotionScope>(initial?.scope ?? "all");
  const [category, setCategory] = useState(initial?.category ?? categories[0] ?? "");
  const [productIds, setProductIds] = useState<string[]>(initial?.productIds ?? []);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const toast = useToast();

  const toggleProduct = (id: string) => {
    setProductIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Promotion name is required");
      return;
    }
    if (scope === "category" && !category) {
      toast.error("Pick a category");
      return;
    }
    if (scope === "products" && productIds.length === 0) {
      toast.error("Pick at least one product");
      return;
    }
    onSubmit({
      name: name.trim(),
      discountType,
      discountValue: Number.parseFloat(discountValue) || 0,
      scope,
      category: scope === "category" ? category : "",
      productIds: scope === "products" ? productIds : [],
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Promotion name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Summer Sale"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Discount type</label>
          <SegmentedControl
            value={discountType}
            onChange={setDiscountType}
            options={[
              { value: "percentage", label: "Percentage" },
              { value: "fixed", label: "Fixed amount" },
            ]}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">
            Value {discountType === "percentage" ? "(%)" : "($)"}
          </label>
          <input
            type="number"
            min={0}
            step={discountType === "percentage" ? 1 : 0.01}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Applies to</label>
        <SegmentedControl
          value={scope}
          onChange={setScope}
          options={[
            { value: "all", label: "All products" },
            { value: "category", label: "Category" },
            { value: "products", label: "Specific products" },
          ]}
        />
      </div>

      {scope === "category" && (
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            {categories.length === 0 && <option value="">No categories yet</option>}
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-[#111113]">
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}

      {scope === "products" && (
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Products</label>
          {products.length === 0 ? (
            <p className="text-xs text-gray-600">No products yet.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 bg-white/5 border border-white/10 rounded-xl p-3">
              {products.map((p) => (
                <label key={p._id} className="flex items-center gap-2.5 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productIds.includes(p._id)}
                    onChange={() => toggleProduct(p._id)}
                    className="accent-white w-4 h-4"
                  />
                  {p.name}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
        />
        <span className="text-sm text-gray-300">Active</span>
      </label>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={secondaryButtonClass}>
          Cancel
        </button>
        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {submitting ? "Saving…" : initial ? "Save changes" : "Create promotion"}
        </button>
      </div>
    </form>
  );
}

function PromotionsSection({
  promotions,
  categories,
  products,
  onCreate,
  onUpdate,
  onDelete,
}: {
  promotions: Promotion[];
  categories: string[];
  products: Product[];
  onCreate: (values: PromotionFormValues) => Promise<void>;
  onUpdate: (id: string, values: PromotionFormValues) => Promise<void>;
  onDelete: (promotion: Promotion) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { formatPrice } = useCurrency();

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (promotion: Promotion) => {
    setEditing(promotion);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async (values: PromotionFormValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await onUpdate(editing._id, values);
      } else {
        await onCreate(values);
      }
      closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-gray-500">
          {promotions.length} promotion{promotions.length !== 1 ? "s" : ""}
        </h2>
        <button onClick={openCreate} className={`${primaryButtonClass} flex items-center gap-2`}>
          <Plus className="w-4 h-4" /> Add promotion
        </button>
      </div>

      {promotions.length === 0 ? (
        <EmptyState message="No promotions yet. Add one to start discounting products." />
      ) : (
        <div className="space-y-3">
          {promotions.map((promo) => (
            <div key={promo._id} className="flex items-center gap-4 bg-[#111113] border border-white/10 rounded-2xl p-4">
              <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 grid place-items-center">
                <Percent className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-white truncate">{promo.name}</h4>
                  <span
                    className={`shrink-0 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                      promo.isActive
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                        : "bg-white/5 text-gray-500 border-white/10"
                    }`}
                  >
                    {promo.isActive ? "Live" : "Hidden"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {describeDiscount(promo, formatPrice)} · {describeScope(promo)}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => openEdit(promo)}
                  aria-label="Edit promotion"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(promo)}
                  aria-label="Delete promotion"
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit promotion" : "Add promotion"} onClose={closeForm}>
          <PromotionForm
            initial={editing}
            categories={categories}
            products={products}
            submitting={submitting}
            onCancel={closeForm}
            onSubmit={handleSubmit}
          />
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------- Settings tab ---------------------------------- */

function SettingsSection({
  settings,
  onUpdate,
}: {
  settings: CurrencySettings;
  onUpdate: (values: CurrencySettings) => Promise<void>;
}) {
  const [baseCurrency, setBaseCurrency] = useState(settings.baseCurrency);
  const [supported, setSupported] = useState<string[]>(settings.supportedCurrencies);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const toggleCurrency = (code: string) => {
    setSupported((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supported.includes(baseCurrency)) {
      toast.error("The base currency must also be a supported currency");
      return;
    }
    setSubmitting(true);
    try {
      await onUpdate({ baseCurrency, supportedCurrencies: supported });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cardClass}>
      <h2 className="text-sm font-semibold text-white mb-1">Currency</h2>
      <p className="text-xs text-gray-500 mb-6">
        Controls which currencies shoppers can switch between. Prices are stored and charged in the base
        currency — other currencies are a live, converted estimate only.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Base currency</label>
          <select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)} className={inputClass}>
            {ALL_CURRENCIES.map((code) => (
              <option key={code} value={code} className="bg-[#111113]">
                {code}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Currencies shoppers can switch to</label>
          <div className="flex flex-wrap gap-4">
            {ALL_CURRENCIES.map((code) => (
              <label key={code} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={supported.includes(code)}
                  onChange={() => toggleCurrency(code)}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
                />
                <span className="text-sm text-gray-300">{code}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={submitting} className={primaryButtonClass}>
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------------------------------- Main dashboard ---------------------------------- */

export function AdminDashboard() {
  const toast = useToast();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("products");
  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [productTemplates, setProductTemplates] = useState<ProductTemplate[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerTemplates, setBannerTemplates] = useState<BannerTemplate[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings>({
    baseCurrency: "USD",
    supportedCurrencies: ["USD"],
  });

  const fetchMetrics = useCallback(async () => {
    const data = await apiFetch<Metrics>("/admin/metrics");
    setMetrics(data);
  }, []);
  const fetchUsers = useCallback(async () => {
    const data = await apiFetch<AdminUser[]>("/admin/users");
    setUsers(data);
  }, []);
  const fetchProducts = useCallback(async () => {
    const data = await apiFetch<Product[]>("/admin/products");
    setProducts(data);
  }, []);
  const fetchCategories = useCallback(async () => {
    const data = await apiFetch<string[]>("/products/categories");
    setCategories(data);
  }, []);
  const fetchProductTemplates = useCallback(async () => {
    const data = await apiFetch<ProductTemplate[]>("/admin/product-templates");
    setProductTemplates(data);
  }, []);
  const fetchOrders = useCallback(async () => {
    const data = await apiFetch<Order[]>("/admin/orders");
    setOrders(data);
  }, []);
  const fetchBanners = useCallback(async () => {
    const data = await apiFetch<Banner[]>("/admin/banners");
    setBanners(data);
  }, []);
  const fetchBannerTemplates = useCallback(async () => {
    const data = await apiFetch<BannerTemplate[]>("/admin/banner-templates");
    setBannerTemplates(data);
  }, []);
  const fetchPromotions = useCallback(async () => {
    const data = await apiFetch<Promotion[]>("/admin/promotions");
    setPromotions(data);
  }, []);
  const fetchCurrencySettings = useCallback(async () => {
    const data = await apiFetch<CurrencySettings>("/admin/settings/currency");
    setCurrencySettings(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchMetrics(),
          fetchUsers(),
          fetchProducts(),
          fetchCategories(),
          fetchProductTemplates(),
          fetchOrders(),
          fetchBanners(),
          fetchBannerTemplates(),
          fetchPromotions(),
          fetchCurrencySettings(),
        ]);
      } catch (err) {
        if (!cancelled) toast.error(errorMessage(err, "Failed to load admin dashboard"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Products ---- */

  const handleCreateProduct = async (values: ProductFormValues) => {
    try {
      await apiFetch("/admin/products", { method: "POST", body: values });
      toast.success("Product created");
      await Promise.all([fetchProducts(), fetchMetrics(), fetchCategories()]);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to create product"));
    }
  };

  const handleUpdateProduct = async (id: string, values: ProductFormValues) => {
    try {
      await apiFetch(`/admin/products/${id}`, { method: "PUT", body: values });
      toast.success("Product updated");
      await Promise.all([fetchProducts(), fetchCategories()]);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update product"));
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/admin/products/${product._id}`, { method: "DELETE" });
      toast.success("Product deleted");
      await Promise.all([fetchProducts(), fetchMetrics()]);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete product"));
    }
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    try {
      await apiFetch(`/admin/categories/${encodeURIComponent(oldName)}`, {
        method: "PUT",
        body: { newName },
      });
      toast.success("Category renamed");
      await Promise.all([fetchProducts(), fetchCategories()]);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to rename category"));
    }
  };

  const handleDeleteCategory = async (name: string) => {
    try {
      await apiFetch(`/admin/categories/${encodeURIComponent(name)}`, { method: "DELETE" });
      toast.success("Category deleted");
      await Promise.all([fetchProducts(), fetchCategories()]);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete category"));
    }
  };

  const handleCreateProductTemplate = async (values: ProductTemplateFormValues) => {
    try {
      await apiFetch("/admin/product-templates", { method: "POST", body: values });
      toast.success("Product template created");
      await fetchProductTemplates();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to create product template"));
    }
  };

  const handleUpdateProductTemplate = async (id: string, values: ProductTemplateFormValues) => {
    try {
      await apiFetch(`/admin/product-templates/${id}`, { method: "PUT", body: values });
      toast.success("Product template updated");
      await fetchProductTemplates();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update product template"));
    }
  };

  const handleDeleteProductTemplate = async (template: ProductTemplate) => {
    if (!window.confirm(`Delete "${template.name}"? Products tagged to it will be untagged.`)) return;
    try {
      await apiFetch(`/admin/product-templates/${template._id}`, { method: "DELETE" });
      toast.success("Product template deleted");
      await Promise.all([fetchProductTemplates(), fetchProducts()]);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete product template"));
    }
  };

  /* ---- Orders ---- */

  const handleOrderStatusChange = async (order: Order, status: OrderStatus) => {
    try {
      await apiFetch(`/admin/orders/${order._id}/status`, { method: "PATCH", body: { status } });
      toast.success("Order status updated");
      await fetchOrders();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update order status"));
    }
  };

  const handleRefreshOrders = async () => {
    try {
      await fetchOrders();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to refresh orders"));
    }
  };

  const handleViewOrderNotification = (orderId: string) => {
    setActiveTab("orders");
    setHighlightOrderId(orderId);
  };

  useEffect(() => {
    if (activeTab !== "orders" || !highlightOrderId) return;
    const raf = requestAnimationFrame(() => {
      document.getElementById(`order-${highlightOrderId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const timer = setTimeout(() => setHighlightOrderId(null), 2000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [activeTab, highlightOrderId]);

  /* ---- Banners ---- */

  const handleCreateBanner = async (values: BannerFormValues) => {
    try {
      await apiFetch("/admin/banners", { method: "POST", body: values });
      toast.success("Banner created");
      await fetchBanners();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to create banner"));
    }
  };

  const handleUpdateBanner = async (id: string, values: BannerFormValues) => {
    try {
      await apiFetch(`/admin/banners/${id}`, { method: "PUT", body: values });
      toast.success("Banner updated");
      await fetchBanners();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update banner"));
    }
  };

  const handleDeleteBanner = async (banner: Banner) => {
    if (!window.confirm(`Delete "${banner.title}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/admin/banners/${banner._id}`, { method: "DELETE" });
      toast.success("Banner deleted");
      await fetchBanners();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete banner"));
    }
  };

  const handleToggleBannerActive = async (banner: Banner) => {
    try {
      await apiFetch(`/admin/banners/${banner._id}`, {
        method: "PUT",
        body: { isActive: !banner.isActive },
      });
      toast.success(banner.isActive ? "Banner hidden" : "Banner set live");
      await fetchBanners();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update banner"));
    }
  };

  const handleCreateBannerTemplate = async (values: BannerTemplateFormValues) => {
    try {
      await apiFetch("/admin/banner-templates", { method: "POST", body: values });
      toast.success("Template created");
      await fetchBannerTemplates();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to create template"));
    }
  };

  const handleUpdateBannerTemplate = async (id: string, values: BannerTemplateFormValues) => {
    try {
      await apiFetch(`/admin/banner-templates/${id}`, { method: "PUT", body: values });
      toast.success("Template updated");
      await fetchBannerTemplates();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update template"));
    }
  };

  const handleDeleteBannerTemplate = async (template: BannerTemplate) => {
    if (!window.confirm(`Delete "${template.name}"? Banners tagged to it will show in every remaining template instead.`))
      return;
    try {
      await apiFetch(`/admin/banner-templates/${template._id}`, { method: "DELETE" });
      toast.success("Template deleted");
      await Promise.all([fetchBannerTemplates(), fetchBanners()]);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete template"));
    }
  };

  /* ---- Promotions ---- */

  const handleCreatePromotion = async (values: PromotionFormValues) => {
    try {
      await apiFetch("/admin/promotions", { method: "POST", body: values });
      toast.success("Promotion created");
      await Promise.all([fetchPromotions(), fetchProducts()]);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to create promotion"));
    }
  };

  const handleUpdatePromotion = async (id: string, values: PromotionFormValues) => {
    try {
      await apiFetch(`/admin/promotions/${id}`, { method: "PUT", body: values });
      toast.success("Promotion updated");
      await Promise.all([fetchPromotions(), fetchProducts()]);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update promotion"));
    }
  };

  const handleDeletePromotion = async (promotion: Promotion) => {
    if (!window.confirm(`Delete "${promotion.name}"?`)) return;
    try {
      await apiFetch(`/admin/promotions/${promotion._id}`, { method: "DELETE" });
      toast.success("Promotion deleted");
      await Promise.all([fetchPromotions(), fetchProducts()]);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete promotion"));
    }
  };

  /* ---- Settings ---- */

  const handleUpdateCurrencySettings = async (values: CurrencySettings) => {
    try {
      const data = await apiFetch<CurrencySettings>("/admin/settings/currency", { method: "PUT", body: values });
      setCurrencySettings(data);
      toast.success("Currency settings updated");
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update currency settings"));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-8">Admin console</h1>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <span className="text-sm text-gray-500">Loading…</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total users" value={metrics ? metrics.totalUsers.toLocaleString() : "—"} icon={Users} />
            <StatCard
              label="Total products"
              value={metrics ? metrics.totalProducts.toLocaleString() : "—"}
              icon={Package}
            />
            <StatCard
              label="Total orders"
              value={metrics ? metrics.totalOrders.toLocaleString() : "—"}
              icon={ShoppingBag}
            />
            <StatCard
              label="Revenue"
              value={metrics ? formatPrice(metrics.totalRevenue) : "—"}
              icon={DollarSign}
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              const badgeCount =
                tab.id === "notifications" ? orders.filter((o) => o.status === "PENDING").length : 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full transition-colors ${
                    active
                      ? "bg-white text-black hover:bg-gray-200"
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {badgeCount > 0 && (
                    <span
                      className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-semibold ${
                        active ? "bg-amber-500 text-black" : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {activeTab === "products" && (
            <ProductsSection
              products={products}
              categories={categories}
              productTemplates={productTemplates}
              onCreate={handleCreateProduct}
              onUpdate={handleUpdateProduct}
              onDelete={handleDeleteProduct}
              onRenameCategory={handleRenameCategory}
              onDeleteCategory={handleDeleteCategory}
              onCreateProductTemplate={handleCreateProductTemplate}
              onUpdateProductTemplate={handleUpdateProductTemplate}
              onDeleteProductTemplate={handleDeleteProductTemplate}
            />
          )}
          {activeTab === "orders" && (
            <OrdersSection
              orders={orders}
              onStatusChange={handleOrderStatusChange}
              onRefresh={handleRefreshOrders}
              highlightOrderId={highlightOrderId}
            />
          )}
          {activeTab === "users" && <UsersSection users={users} />}
          {activeTab === "banners" && (
            <BannersSection
              banners={banners}
              templates={bannerTemplates}
              products={products}
              onCreateTemplate={handleCreateBannerTemplate}
              onUpdateTemplate={handleUpdateBannerTemplate}
              onDeleteTemplate={handleDeleteBannerTemplate}
              onCreate={handleCreateBanner}
              onUpdate={handleUpdateBanner}
              onDelete={handleDeleteBanner}
              onToggleActive={handleToggleBannerActive}
            />
          )}
          {activeTab === "promotions" && (
            <PromotionsSection
              promotions={promotions}
              categories={categories}
              products={products}
              onCreate={handleCreatePromotion}
              onUpdate={handleUpdatePromotion}
              onDelete={handleDeletePromotion}
            />
          )}
          {activeTab === "notifications" && (
            <NotificationsSection orders={orders} onView={handleViewOrderNotification} />
          )}
          {activeTab === "settings" && (
            <SettingsSection settings={currencySettings} onUpdate={handleUpdateCurrencySettings} />
          )}
        </>
      )}
    </div>
  );
}
