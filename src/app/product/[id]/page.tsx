"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header, NavMenu } from "@/components/Header";
import { Footer } from "@/components/Sections";
import { AuthModal } from "@/components/AuthModal";
import {
  ShoppingBag, ChevronRight, Minus, Plus, ShoppingCart,
  Truck, Shield, RefreshCw, Check, Home, Package
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
          // Fetch related products from same category
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
    setTimeout(() => setAdded(false), 2000);
  };

  const shopFont = "'Red Hat Display', sans-serif";

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center" style={{ background: "var(--shop-bg)" }}>
          <div className="flex flex-col items-center gap-[0.75rem]">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[rgba(0,0,0,0.1)] border-t-[var(--shop-accent)]" />
            <span className="text-[0.875rem] text-[var(--shop-text-muted)]" style={{ fontFamily: shopFont }}>Loading product...</span>
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
        <main className="flex min-h-screen flex-col items-center justify-center gap-[1rem]" style={{ background: "var(--shop-bg)", fontFamily: shopFont }}>
          <ShoppingBag className="h-16 w-16 text-[rgba(0,0,0,0.1)]" />
          <p className="text-[1rem] font-medium text-[var(--shop-text)]">Product not found</p>
          <a href="/shop" className="text-[0.875rem] font-medium underline underline-offset-2" style={{ color: "var(--shop-accent)" }}>
            Back to shop
          </a>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <NavMenu />
      <AuthModal />

      <main className="min-h-screen" style={{ background: "var(--shop-bg)", fontFamily: shopFont }}>
        {/* Breadcrumb */}
        <div className="border-b border-[rgba(0,0,0,0.08)] bg-[#fff]">
          <div className="shell flex flex-wrap items-center gap-[0.5rem] px-[1.25rem] py-[0.875rem] text-[0.8125rem] sm:px-[2rem]">
            <a href="/" className="text-[var(--shop-text-muted)] hover:text-[var(--shop-text)] transition-colors">
              <Home className="h-3.5 w-3.5" />
            </a>
            <ChevronRight className="h-3 w-3 text-[var(--shop-text-muted)]" />
            <a href="/shop" className="text-[var(--shop-text-muted)] hover:text-[var(--shop-text)] transition-colors">Shop</a>
            <ChevronRight className="h-3 w-3 text-[var(--shop-text-muted)]" />
            <a href={`/shop?category=${encodeURIComponent(product.category)}`} className="text-[var(--shop-text-muted)] hover:text-[var(--shop-text)] transition-colors">
              {product.category}
            </a>
            <ChevronRight className="h-3 w-3 text-[var(--shop-text-muted)]" />
            <span className="font-medium text-[var(--shop-text)] line-clamp-1">{product.name}</span>
          </div>
        </div>

        {/* Product section */}
        <div className="shell px-[1.25rem] py-[2rem] sm:px-[2rem] lg:py-[3rem]">
          <div className="rounded-[12px] bg-[#fff] p-[1.5rem] shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-[2rem] lg:p-[2.5rem]">
            <div className="grid grid-cols-1 gap-[2rem] lg:grid-cols-2 lg:gap-[3rem]">
              {/* Image Gallery */}
              <div className="flex flex-col gap-[0.75rem]">
                {/* Main image */}
                <div className="aspect-square overflow-hidden rounded-[8px] bg-[var(--shop-bg)]">
                  {allImages.length > 0 ? (
                    <img
                      src={allImages[activeImage]}
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingBag className="h-20 w-20 text-[rgba(0,0,0,0.08)]" />
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
                        className={`h-[3.5rem] w-[3.5rem] shrink-0 overflow-hidden rounded-[6px] border-2 transition-colors ${
                          i === activeImage ? "border-[var(--shop-accent)]" : "border-[rgba(0,0,0,0.08)]"
                        }`}
                      >
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col">
                {/* Category */}
                <a
                  href={`/shop?category=${encodeURIComponent(product.category)}`}
                  className="inline-flex w-fit rounded-[4px] px-[0.625rem] py-[0.25rem] text-[0.7rem] font-semibold uppercase tracking-wider transition-colors hover:opacity-80"
                  style={{ background: "var(--shop-accent)", color: "var(--shop-header-bg)" }}
                >
                  {product.category}
                </a>

                {/* Name */}
                <h1 className="mt-[0.75rem] text-[1.5rem] font-bold leading-tight text-[var(--shop-text)] sm:text-[1.875rem]">
                  {product.name}
                </h1>

                {/* Price */}
                <div className="mt-[1rem] text-[2rem] font-bold text-[var(--shop-text)]">
                  ${Number(product.price).toFixed(2)}
                </div>

                {/* Stock badge */}
                <div className="mt-[1rem] flex items-center gap-[0.5rem]">
                  {product.stock > 0 ? (
                    <span className="inline-flex items-center gap-[0.375rem] rounded-[6px] bg-[#dcfce7] px-[0.75rem] py-[0.375rem] text-[0.75rem] font-semibold text-[#166534]">
                      <Check className="h-3.5 w-3.5" /> In Stock ({product.stock} available)
                    </span>
                  ) : (
                    <span className="rounded-[6px] bg-[#fee2e2] px-[0.75rem] py-[0.375rem] text-[0.75rem] font-semibold text-[#991b1b]">
                      Out of Stock
                    </span>
                  )}
                  {product.isFeatured && (
                    <span className="rounded-[6px] px-[0.75rem] py-[0.375rem] text-[0.75rem] font-semibold text-white" style={{ background: "var(--shop-accent)" }}>
                      Featured
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="mt-[1.5rem] text-[0.9375rem] leading-relaxed text-[var(--shop-text-muted)]">
                  {product.description}
                </p>

                {/* Quantity + Add to Cart */}
                {product.stock > 0 && (
                  <div className="mt-[2rem] flex items-center gap-[0.75rem]">
                    <div className="flex items-center rounded-[8px] border border-[rgba(0,0,0,0.12)]">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-[0.75rem] py-[0.625rem] text-[var(--shop-text-muted)] hover:text-[var(--shop-text)]"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-[2.5rem] text-center text-[0.875rem] font-semibold text-[var(--shop-text)]">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="px-[0.75rem] py-[0.625rem] text-[var(--shop-text-muted)] hover:text-[var(--shop-text)]"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={addToCart}
                      className="flex flex-1 items-center justify-center gap-[0.5rem] rounded-[8px] py-[0.75rem] text-[0.875rem] font-bold text-[var(--shop-header-bg)] transition-all hover:brightness-110 active:scale-[0.98]"
                      style={{ background: "var(--shop-accent)" }}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {added ? "Added to Cart!" : `Add to Cart — $${(product.price * quantity).toFixed(2)}`}
                    </button>
                  </div>
                )}

                {/* Specs Table */}
                <div className="mt-[2rem] overflow-hidden rounded-[8px] border border-[rgba(0,0,0,0.08)]">
                  <table className="w-full text-[0.8125rem]">
                    <tbody>
                      {[
                        { label: "Category", value: product.category },
                        { label: "Availability", value: product.stock > 0 ? `In Stock (${product.stock})` : "Out of Stock" },
                        { label: "Product ID", value: product._id?.slice(-8) || "—" },
                      ].map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-[var(--shop-bg)]" : "bg-[#fff]"}>
                          <td className="px-[1rem] py-[0.625rem] font-semibold text-[var(--shop-text)]">{row.label}</td>
                          <td className="px-[1rem] py-[0.625rem] text-[var(--shop-text-muted)]">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-[1.5rem] grid grid-cols-1 gap-[0.75rem] sm:grid-cols-3">
            {[
              { icon: <Truck className="h-6 w-6" />, title: "Free Shipping", desc: "On orders over $50" },
              { icon: <Shield className="h-6 w-6" />, title: "Secure Payment", desc: "100% protected transactions" },
              { icon: <RefreshCw className="h-6 w-6" />, title: "Easy Returns", desc: "30-day return policy" },
            ].map((badge, i) => (
              <div
                key={i}
                className="flex items-center gap-[1rem] rounded-[8px] bg-[#fff] p-[1.25rem] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <div className="flex h-[2.75rem] w-[2.75rem] shrink-0 items-center justify-center rounded-[8px]" style={{ background: "var(--shop-bg)" }}>
                  <span style={{ color: "var(--shop-accent)" }}>{badge.icon}</span>
                </div>
                <div>
                  <div className="text-[0.875rem] font-semibold text-[var(--shop-text)]">{badge.title}</div>
                  <div className="text-[0.75rem] text-[var(--shop-text-muted)]">{badge.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-[3rem]">
              <h2 className="mb-[1.25rem] text-[1.25rem] font-bold text-[var(--shop-text)]">Related Products</h2>
              <div className="grid grid-cols-2 gap-[0.5rem] sm:grid-cols-3 lg:grid-cols-4">
                {relatedProducts.map((p: any) => (
                  <a
                    key={p._id}
                    href={`/product/${p._id}`}
                    className="group flex flex-col overflow-hidden bg-[#fff] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
                    style={{ borderRadius: "var(--shop-card-radius)" }}
                  >
                    <div className="relative aspect-square overflow-hidden bg-[var(--shop-bg)]">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-10 w-10 text-[rgba(0,0,0,0.1)]" />
                        </div>
                      )}
                      {p.stock > 0 ? (
                        <span className="absolute left-[0.5rem] top-[0.5rem] inline-flex items-center gap-[0.25rem] rounded-[4px] bg-[#22c55e] px-[0.375rem] py-[0.125rem] text-[0.6rem] font-semibold uppercase text-white">
                          <Check className="h-2.5 w-2.5" /> In Stock
                        </span>
                      ) : (
                        <span className="absolute left-[0.5rem] top-[0.5rem] rounded-[4px] bg-[#ef4444] px-[0.375rem] py-[0.125rem] text-[0.6rem] font-semibold uppercase text-white">
                          Out of Stock
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-[0.75rem]">
                      <span className="text-[0.6rem] font-medium uppercase tracking-wider text-[var(--shop-text-muted)]">{p.category}</span>
                      <span className="mt-[0.125rem] text-[0.8125rem] font-medium leading-snug text-[var(--shop-text)] line-clamp-2 group-hover:underline">
                        {p.name}
                      </span>
                      <span className="mt-auto pt-[0.5rem] text-[1rem] font-bold text-[var(--shop-text)]">
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
