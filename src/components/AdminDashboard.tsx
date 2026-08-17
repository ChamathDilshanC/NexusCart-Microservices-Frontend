"use client";

import React, { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";

/* ---------------------------------- Types ---------------------------------- */

type TabId = "products" | "orders" | "users" | "banners";
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
  order: number;
  isActive: boolean;
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
}

interface BannerFormValues {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  order: number;
  isActive: boolean;
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

const TABS: { id: TabId; label: string; icon: IconType }[] = [
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "users", label: "Users", icon: Users },
  { id: "banners", label: "Banners", icon: ImagePlus },
];

/* ---------------------------------- Helpers ---------------------------------- */

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
}

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
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm px-4 py-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#111113] border border-white/10 rounded-2xl p-6 my-auto"
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

/* ---------------------------------- Product form ---------------------------------- */

function ProductForm({
  initial,
  submitting,
  onCancel,
  onSubmit,
}: {
  initial: Product | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: ProductFormValues) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [stock, setStock] = useState(initial ? String(initial.stock) : "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);

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
          <input
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Electronics"
            className={inputClass}
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
          <label className="text-xs text-gray-500 mb-1.5 block">Price</label>
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
  submitting,
  onCancel,
  onSubmit,
}: {
  initial: Banner | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: BannerFormValues) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl ?? "");
  const [order, setOrder] = useState(initial ? String(initial.order) : "0");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const toast = useToast();

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
      order: Number.parseInt(order, 10) || 0,
      isActive,
      imageUrl: imageUrl.trim(),
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Link URL</label>
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="/shop"
            className={inputClass}
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

/* ---------------------------------- Products tab ---------------------------------- */

function ProductsSection({
  products,
  onCreate,
  onUpdate,
  onDelete,
}: {
  products: Product[];
  onCreate: (values: ProductFormValues) => Promise<void>;
  onUpdate: (id: string, values: ProductFormValues) => Promise<void>;
  onDelete: (product: Product) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-gray-500">
          {products.length} product{products.length !== 1 ? "s" : ""}
        </h2>
        <button onClick={openCreate} className={`${primaryButtonClass} flex items-center gap-2`}>
          <Plus className="w-4 h-4" /> Add product
        </button>
      </div>

      {products.length === 0 ? (
        <EmptyState message="No products yet. Add your first product to get started." />
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const imageCount = (product.imageUrl ? 1 : 0) + (product.images?.length ?? 0);
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
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {product.category} · {product.stock} in stock · {imageCount} image{imageCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-sm font-medium text-white shrink-0">{formatCurrency(product.price)}</div>
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
          <ProductForm initial={editing} submitting={submitting} onCancel={closeForm} onSubmit={handleSubmit} />
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------- Orders tab ---------------------------------- */

function OrdersSection({
  orders,
  onStatusChange,
}: {
  orders: Order[];
  onStatusChange: (order: Order, status: OrderStatus) => Promise<void>;
}) {
  const [updating, setUpdating] = useState<Set<string>>(new Set());

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

  return (
    <div className="space-y-6">
      <h2 className="text-sm text-gray-500">
        {orders.length} order{orders.length !== 1 ? "s" : ""}
      </h2>

      {orders.length === 0 ? (
        <EmptyState message="No orders yet." />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const address = formatAddress(order.shippingAddress);
            const isUpdating = updating.has(order._id);
            return (
              <div key={order._id} className={cardClass}>
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="text-sm font-medium text-white">#{order._id.slice(-8)}</div>
                    <div className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">{formatCurrency(order.totalAmount)}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                {address && <p className="text-xs text-gray-500 mb-4">{address}</p>}

                <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                  <span className="text-xs text-gray-500">Status</span>
                  <select
                    value={order.status}
                    disabled={isUpdating}
                    onChange={(e) => handleChange(order, e.target.value as OrderStatus)}
                    className={`${inputClass} w-auto disabled:opacity-50`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="bg-[#111113]">
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

/* ---------------------------------- Banners tab ---------------------------------- */

function BannersSection({
  banners,
  onCreate,
  onUpdate,
  onDelete,
  onToggleActive,
}: {
  banners: Banner[];
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
                  {banner.linkUrl ? ` · ${banner.linkUrl}` : ""}
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
          <BannerForm initial={editing} submitting={submitting} onCancel={closeForm} onSubmit={handleSubmit} />
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------- Main dashboard ---------------------------------- */

export function AdminDashboard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("products");

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

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
  const fetchOrders = useCallback(async () => {
    const data = await apiFetch<Order[]>("/admin/orders");
    setOrders(data);
  }, []);
  const fetchBanners = useCallback(async () => {
    const data = await apiFetch<Banner[]>("/admin/banners");
    setBanners(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await Promise.all([fetchMetrics(), fetchUsers(), fetchProducts(), fetchOrders(), fetchBanners()]);
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
      await Promise.all([fetchProducts(), fetchMetrics()]);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to create product"));
    }
  };

  const handleUpdateProduct = async (id: string, values: ProductFormValues) => {
    try {
      await apiFetch(`/admin/products/${id}`, { method: "PUT", body: values });
      toast.success("Product updated");
      await fetchProducts();
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
              value={metrics ? formatCurrency(metrics.totalRevenue) : "—"}
              icon={DollarSign}
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
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
                </button>
              );
            })}
          </div>

          {activeTab === "products" && (
            <ProductsSection
              products={products}
              onCreate={handleCreateProduct}
              onUpdate={handleUpdateProduct}
              onDelete={handleDeleteProduct}
            />
          )}
          {activeTab === "orders" && <OrdersSection orders={orders} onStatusChange={handleOrderStatusChange} />}
          {activeTab === "users" && <UsersSection users={users} />}
          {activeTab === "banners" && (
            <BannersSection
              banners={banners}
              onCreate={handleCreateBanner}
              onUpdate={handleUpdateBanner}
              onDelete={handleDeleteBanner}
              onToggleActive={handleToggleBannerActive}
            />
          )}
        </>
      )}
    </div>
  );
}
