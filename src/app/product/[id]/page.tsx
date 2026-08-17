"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header, NavMenu } from "@/components/Header";
import { Footer } from "@/components/Sections";
import { AuthModal } from "@/components/AuthModal";
import {
  ShoppingBag, ChevronRight, Minus, Plus, ShoppingCart,
  Truck, Shield, RefreshCw, Check, Home, Package,
  CreditCard, Banknote, Wallet, Clock, Zap, Heart, Share2, Star
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/products/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data._id) {
          setProduct(data);
          fetch(`/api/products?category=${encodeURIComponent(data.category)}`)
            .then((r) => r.json())
            .then((arr) => {
              if (Array.isArray(arr)) {
                setRelatedProducts(arr.filter((p: any) => p._id !== data._id).slice(0, 4));
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  const allImages = product
    ? [product.imageUrl, ...(product.images || [])].filter(Boolean)
    : [];

  const addToCart = () => {
    if (!product) return;
    const cart = JSON.parse(localStorage.getItem("nexus_cart") || "[]");
    const existing = cart.find((item: any) => item.productId === product._id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ productId: product._id, name: product.name, price: product.price, imageUrl: product.imageUrl, quantity });
    }
    localStorage.setItem("nexus_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-surface)" }}>
          <div className="flex flex-col items-center gap-[0.75rem]">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[rgba(0,0,0,0.06)] border-t-[var(--color-accent)]" />
            <span className="text-[0.8125rem] font-medium text-[rgba(17,17,17,0.5)]">Loading product...</span>
          </div>
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <NavMenu />
        <main className="flex min-h-screen flex-col items-center justify-center gap-[1rem]" style={{ background: "var(--color-surface)" }}>
          <div className="flex h-[5rem] w-[5rem] items-center justify-center rounded-full bg-[#fff] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <ShoppingBag className="h-8 w-8 text-[rgba(0,0,0,0.15)]" />
          </div>
          <p className="text-[1rem] font-semibold text-[#111111]">Product not found</p>
          <a href="/shop" className="rounded-[8px] px-[1.25rem] py-[0.5rem] text-[0.8125rem] font-semibold text-white transition-all hover:brightness-110" style={{ background: "var(--color-accent)" }}>
            Back to shop
          </a>
        </main>
        <Footer />
      </>
    );
  }

  const installmentPrice = (Number(product.price) / 4).toFixed(2);

  return (
    <>
      <Header />
      <NavMenu />
      <AuthModal />

      <main className="min-h-screen" style={{ background: "var(--color-surface)" }}>
        {/* Breadcrumb */}
        <div className="border-b border-[rgba(0,0,0,0.06)] bg-[#fff]">
          <div className="shell flex flex-wrap items-center gap-[0.5rem] px-[1.25rem] py-[0.75rem] text-[0.8125rem] sm:px-[2rem]">
            <a href="/" className="text-[rgba(17,17,17,0.5)] hover:text-[#111111] transition-colors"><Home className="h-3.5 w-3.5" /></a>
            <ChevronRight className="h-3 w-3 text-[rgba(0,0,0,0.2)]" />
            <a href="/shop" className="text-[rgba(17,17,17,0.5)] hover:text-[#111111] transition-colors">Shop</a>
            <ChevronRight className="h-3 w-3 text-[rgba(0,0,0,0.2)]" />
            <a href={`/shop?category=${encodeURIComponent(product.category)}`} className="text-[rgba(17,17,17,0.5)] hover:text-[#111111] transition-colors">{product.category}</a>
            <ChevronRight className="h-3 w-3 text-[rgba(0,0,0,0.2)]" />
            <span className="max-w-[12rem] truncate font-medium text-[#111111] sm:max-w-none">{product.name}</span>
          </div>
        </div>

        {/* Product section */}
        <div className="shell px-[1.25rem] py-[1.5rem] sm:px-[2rem] lg:py-[2.5rem]">
          <div className="overflow-hidden rounded-[16px] bg-[#fff] shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr]">
              {/* Image Gallery — Left */}
              <div className="flex flex-col gap-[0.5rem] bg-[var(--color-surface)] p-[1.25rem] sm:p-[1.5rem] lg:p-[2rem]">
                {/* Main image */}
                <div className="relative aspect-square overflow-hidden rounded-[12px] bg-[#fff] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                  {allImages.length > 0 ? (
                    <img src={allImages[activeImage]} alt={product.name} className="h-full w-full object-contain transition-opacity duration-300" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingBag className="h-20 w-20 text-[rgba(0,0,0,0.06)]" />
                    </div>
                  )}
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.3)]">
                      <span className="rounded-[8px] bg-white/90 px-[1.25rem] py-[0.5rem] text-[0.875rem] font-bold text-[#111111] shadow-lg backdrop-blur-sm">Sold Out</span>
                    </div>
                  )}
                </div>
                {/* Thumbnails */}
                {allImages.length > 1 && (
                  <div className="flex gap-[0.5rem] overflow-x-auto pb-[0.25rem]">
                    {allImages.map((img: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={`h-[3.75rem] w-[3.75rem] shrink-0 overflow-hidden rounded-[8px] border-2 transition-all duration-200 ${
                          i === activeImage
                            ? "border-[var(--color-accent)] shadow-[0_0_0_2px_rgba(177,95,44,0.2)]"
                            : "border-[rgba(0,0,0,0.06)] opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info — Right */}
              <div className="flex flex-col p-[1.5rem] sm:p-[2rem] lg:p-[2.5rem]">
                {/* Top actions row */}
                <div className="mb-[1rem] flex items-center justify-between">
                  <a
                    href={`/shop?category=${encodeURIComponent(product.category)}`}
                    className="inline-flex items-center gap-[0.375rem] rounded-[6px] px-[0.75rem] py-[0.3125rem] text-[0.65rem] font-bold uppercase tracking-[0.08em] transition-all hover:brightness-110"
                    style={{ background: "var(--color-accent)", color: "var(--color-ink)" }}
                  >
                    <Package className="h-3 w-3" /> {product.category}
                  </a>
                  <div className="flex items-center gap-[0.375rem]">
                    <button className="flex h-[2rem] w-[2rem] items-center justify-center rounded-[8px] text-[rgba(17,17,17,0.5)] transition-colors hover:bg-[var(--color-surface)] hover:text-[#ef4444]">
                      <Heart className="h-4 w-4" />
                    </button>
                    <button className="flex h-[2rem] w-[2rem] items-center justify-center rounded-[8px] text-[rgba(17,17,17,0.5)] transition-colors hover:bg-[var(--color-surface)] hover:text-[#111111]">
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Name */}
                <h1 className="text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-[#111111] sm:text-[1.75rem] lg:text-[2rem]">
                  {product.name}
                </h1>

                {/* Rating placeholder */}
                <div className="mt-[0.5rem] flex items-center gap-[0.375rem]">
                  <div className="flex gap-[1px]">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className="h-3.5 w-3.5 fill-[#f59e0b] text-[#f59e0b]" />
                    ))}
                  </div>
                  <span className="text-[0.75rem] text-[rgba(17,17,17,0.5)]">({Math.floor(Math.random() * 50 + 10)} reviews)</span>
                </div>

                {/* Price */}
                <div className="mt-[1rem] flex items-baseline gap-[0.75rem]">
                  <span className="text-[2.25rem] font-bold tracking-[-0.03em] text-[#111111]">
                    ${Number(product.price).toFixed(2)}
                  </span>
                  {product.isFeatured && (
                    <span className="rounded-[6px] bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-[0.625rem] py-[0.25rem] text-[0.65rem] font-bold uppercase tracking-wider text-white">
                      Featured
                    </span>
                  )}
                </div>

                {/* Stock badge */}
                <div className="mt-[0.75rem]">
                  {product.stock > 0 ? (
                    <span className="inline-flex items-center gap-[0.375rem] rounded-[8px] bg-[#dcfce7] px-[0.875rem] py-[0.375rem] text-[0.75rem] font-bold text-[#166534]">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} /> In Stock — {product.stock} available
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-[0.375rem] rounded-[8px] bg-[#fee2e2] px-[0.875rem] py-[0.375rem] text-[0.75rem] font-bold text-[#991b1b]">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="mt-[1.25rem] text-[0.875rem] leading-[1.7] text-[rgba(17,17,17,0.5)]">
                  {product.description}
                </p>

                {/* Quantity + Add to Cart */}
                {product.stock > 0 && (
                  <div className="mt-[1.75rem] flex flex-col gap-[0.75rem]">
                    <div className="flex items-center gap-[0.75rem]">
                      <span className="text-[0.8125rem] font-semibold text-[#111111]">Quantity</span>
                      <div className="flex items-center rounded-[10px] border border-[rgba(0,0,0,0.1)] bg-[var(--color-surface)]">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-l-[10px] text-[rgba(17,17,17,0.5)] transition-colors hover:bg-[rgba(0,0,0,0.04)] hover:text-[#111111]"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="flex h-[2.5rem] w-[3rem] items-center justify-center border-x border-[rgba(0,0,0,0.08)] text-[0.9375rem] font-bold text-[#111111]">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          className="flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-r-[10px] text-[rgba(17,17,17,0.5)] transition-colors hover:bg-[rgba(0,0,0,0.04)] hover:text-[#111111]"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={addToCart}
                      className="flex w-full items-center justify-center gap-[0.625rem] rounded-[12px] py-[0.9375rem] text-[0.9375rem] font-bold text-[var(--color-ink)] shadow-[0_4px_16px_rgba(177,95,44,0.3)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_6px_24px_rgba(177,95,44,0.4)] active:translate-y-0 active:scale-[0.99]"
                      style={{ background: "var(--color-accent)" }}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      {added ? "Added to Cart!" : `Add to Cart — $${(product.price * quantity).toFixed(2)}`}
                    </button>
                  </div>
                )}

                {/* Specs Table */}
                <div className="mt-[1.75rem] overflow-hidden rounded-[10px] border border-[rgba(0,0,0,0.06)]">
                  <div className="border-b border-[rgba(0,0,0,0.06)] bg-[var(--color-surface)] px-[1rem] py-[0.625rem]">
                    <span className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[rgba(17,17,17,0.5)]">Product Details</span>
                  </div>
                  <table className="w-full text-[0.8125rem]">
                    <tbody>
                      {[
                        { label: "Category", value: product.category },
                        { label: "Availability", value: product.stock > 0 ? `In Stock (${product.stock} units)` : "Out of Stock" },
                        { label: "SKU", value: product._id?.slice(-8).toUpperCase() || "—" },
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-[rgba(0,0,0,0.04)] last:border-0">
                          <td className="px-[1rem] py-[0.75rem] font-semibold text-[#111111] w-[40%]">{row.label}</td>
                          <td className="px-[1rem] py-[0.75rem] text-[rgba(17,17,17,0.5)]">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Options Section */}
          <div className="mt-[1.25rem] overflow-hidden rounded-[16px] bg-[#fff] shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
            <div className="border-b border-[rgba(0,0,0,0.06)] bg-[var(--color-surface)] px-[1.5rem] py-[1rem]">
              <div className="flex items-center gap-[0.5rem]">
                <CreditCard className="h-5 w-5 text-[var(--color-accent)]" />
                <span className="text-[0.875rem] font-bold text-[#111111]">Payment Options</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-[1rem] p-[1.5rem] sm:grid-cols-2 lg:grid-cols-4">
              {/* Card Payment */}
              <div className="flex flex-col gap-[0.75rem] rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-[var(--color-surface)] p-[1.125rem] transition-all hover:border-[var(--color-accent)] hover:shadow-[0_2px_8px_rgba(177,95,44,0.1)]">
                <div className="flex items-center gap-[0.5rem]">
                  <div className="flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-[8px] bg-[#fff] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                    <CreditCard className="h-4 w-4 text-[#1e40af]" />
                  </div>
                  <span className="text-[0.8125rem] font-bold text-[#111111]">Credit / Debit Card</span>
                </div>
                <div className="flex items-center gap-[0.375rem]">
                  {["Visa", "MC", "Amex"].map((card) => (
                    <span key={card} className="rounded-[4px] bg-[#fff] px-[0.375rem] py-[0.1875rem] text-[0.55rem] font-bold text-[rgba(17,17,17,0.5)] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                      {card}
                    </span>
                  ))}
                </div>
                <p className="text-[0.7rem] leading-relaxed text-[rgba(17,17,17,0.5)]">
                  Secure checkout with 256-bit SSL encryption
                </p>
              </div>

              {/* Installments */}
              <div className="flex flex-col gap-[0.75rem] rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-[var(--color-surface)] p-[1.125rem] transition-all hover:border-[var(--color-accent)] hover:shadow-[0_2px_8px_rgba(177,95,44,0.1)]">
                <div className="flex items-center gap-[0.5rem]">
                  <div className="flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-[8px] bg-[#fff] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                    <Clock className="h-4 w-4 text-[#7c3aed]" />
                  </div>
                  <span className="text-[0.8125rem] font-bold text-[#111111]">Pay in 4</span>
                </div>
                <div className="rounded-[6px] bg-[#fff] px-[0.625rem] py-[0.375rem] text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <span className="text-[0.75rem] font-bold text-[#111111]">4 × ${installmentPrice}</span>
                </div>
                <p className="text-[0.7rem] leading-relaxed text-[rgba(17,17,17,0.5)]">
                  Interest-free installments, every 2 weeks
                </p>
              </div>

              {/* Digital Wallet */}
              <div className="flex flex-col gap-[0.75rem] rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-[var(--color-surface)] p-[1.125rem] transition-all hover:border-[var(--color-accent)] hover:shadow-[0_2px_8px_rgba(177,95,44,0.1)]">
                <div className="flex items-center gap-[0.5rem]">
                  <div className="flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-[8px] bg-[#fff] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                    <Wallet className="h-4 w-4 text-[#059669]" />
                  </div>
                  <span className="text-[0.8125rem] font-bold text-[#111111]">Digital Wallet</span>
                </div>
                <div className="flex items-center gap-[0.375rem]">
                  {["PayPal", "Apple Pay"].map((w) => (
                    <span key={w} className="rounded-[4px] bg-[#fff] px-[0.375rem] py-[0.1875rem] text-[0.55rem] font-bold text-[rgba(17,17,17,0.5)] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                      {w}
                    </span>
                  ))}
                </div>
                <p className="text-[0.7rem] leading-relaxed text-[rgba(17,17,17,0.5)]">
                  One-tap checkout with your digital wallet
                </p>
              </div>

              {/* Bank Transfer */}
              <div className="flex flex-col gap-[0.75rem] rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-[var(--color-surface)] p-[1.125rem] transition-all hover:border-[var(--color-accent)] hover:shadow-[0_2px_8px_rgba(177,95,44,0.1)]">
                <div className="flex items-center gap-[0.5rem]">
                  <div className="flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-[8px] bg-[#fff] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                    <Banknote className="h-4 w-4 text-[#dc2626]" />
                  </div>
                  <span className="text-[0.8125rem] font-bold text-[#111111]">Bank Transfer</span>
                </div>
                <div className="rounded-[6px] bg-[#fff] px-[0.625rem] py-[0.375rem] text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <span className="text-[0.75rem] font-bold text-[#111111]">Direct Deposit</span>
                </div>
                <p className="text-[0.7rem] leading-relaxed text-[rgba(17,17,17,0.5)]">
                  Transfer directly to our bank account
                </p>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-[1.25rem] grid grid-cols-1 gap-[0.75rem] sm:grid-cols-3">
            {[
              { icon: <Truck className="h-5 w-5" />, title: "Free Shipping", desc: "On orders over $50", color: "#0ea5e9" },
              { icon: <Shield className="h-5 w-5" />, title: "Secure Payment", desc: "256-bit SSL encryption", color: "#22c55e" },
              { icon: <RefreshCw className="h-5 w-5" />, title: "Easy Returns", desc: "30-day return policy", color: "#f59e0b" },
            ].map((badge, i) => (
              <div
                key={i}
                className="flex items-center gap-[1rem] rounded-[12px] bg-[#fff] p-[1.125rem] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
              >
                <div className="flex h-[2.75rem] w-[2.75rem] shrink-0 items-center justify-center rounded-[10px]" style={{ background: `${badge.color}15` }}>
                  <span style={{ color: badge.color }}>{badge.icon}</span>
                </div>
                <div>
                  <div className="text-[0.8125rem] font-bold text-[#111111]">{badge.title}</div>
                  <div className="text-[0.7rem] text-[rgba(17,17,17,0.5)]">{badge.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-[2.5rem]">
              <div className="mb-[1.25rem] flex items-center justify-between">
                <h2 className="text-[1.25rem] font-bold tracking-[-0.02em] text-[#111111]">Related Products</h2>
                <a href={`/shop?category=${encodeURIComponent(product.category)}`} className="text-[0.8125rem] font-semibold transition-colors hover:underline" style={{ color: "var(--color-accent)" }}>
                  View all →
                </a>
              </div>
              <div className="grid grid-cols-2 gap-[0.75rem] sm:grid-cols-3 lg:grid-cols-4">
                {relatedProducts.map((p: any) => (
                  <a
                    key={p._id}
                    href={`/product/${p._id}`}
                    className="group flex flex-col overflow-hidden rounded-[12px] bg-[#fff] shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)]"
                  >
                    <div className="relative aspect-square overflow-hidden bg-[var(--color-surface)]">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-10 w-10 text-[rgba(0,0,0,0.08)]" />
                        </div>
                      )}
                      {p.stock > 0 ? (
                        <span className="absolute left-[0.5rem] top-[0.5rem] inline-flex items-center gap-[0.25rem] rounded-[6px] bg-[#22c55e]/90 px-[0.375rem] py-[0.1875rem] text-[0.55rem] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                          <Check className="h-2.5 w-2.5" strokeWidth={3} /> In Stock
                        </span>
                      ) : (
                        <span className="absolute left-[0.5rem] top-[0.5rem] rounded-[6px] bg-[#ef4444]/90 px-[0.375rem] py-[0.1875rem] text-[0.55rem] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                          Sold Out
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-[0.875rem]">
                      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-accent)]">{p.category}</span>
                      <span className="mt-[0.25rem] text-[0.8125rem] font-semibold leading-snug text-[#111111] line-clamp-2 transition-colors group-hover:text-[var(--color-accent)]">
                        {p.name}
                      </span>
                      <span className="mt-auto pt-[0.5rem] text-[1.125rem] font-bold tracking-[-0.02em] text-[#111111]">
                        ${Number(p.price).toFixed(2)}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
