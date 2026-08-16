"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Header, NavMenu } from "@/components/Header";
import { Footer } from "@/components/Sections";
import { AuthModal } from "@/components/AuthModal";
import { PillButton } from "@/components/Shared";
import { ShoppingBag, ArrowLeft, Minus, Plus, Check, Truck, Shield, RefreshCw } from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/products/${params.id}`)
      .then((r) => r.json())
      .then((data) => { if (data._id) setProduct(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  const allImages = product ? [product.imageUrl, ...(product.images || [])].filter(Boolean) : [];

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

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center bg-[#fff]">
          <div className="text-[rgba(17,17,17,0.4)] text-[0.875rem]">Loading product...</div>
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <NavMenu />
        <main className="flex min-h-screen flex-col items-center justify-center gap-[1rem] bg-[#fff]">
          <ShoppingBag className="h-12 w-12 text-[rgba(17,17,17,0.15)]" />
          <div className="text-[rgba(17,17,17,0.4)] text-[0.875rem]">Product not found.</div>
          <a href="/shop" className="text-[0.875rem] font-medium text-[#111] underline underline-offset-2">Back to shop</a>
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

      <main className="min-h-screen bg-[#fff]">
        <div className="shell px-[1.25rem] pt-[8rem] pb-[5rem] sm:px-[2rem] lg:pb-[7rem]">
          {/* Back link */}
          <a href="/shop" className="mb-[2rem] inline-flex items-center gap-[0.5rem] text-[0.875rem] text-[rgba(17,17,17,0.5)] transition-colors hover:text-[#111]">
            <ArrowLeft className="h-4 w-4" /> Back to shop
          </a>

          <div className="grid grid-cols-1 gap-[3rem] lg:grid-cols-2 lg:gap-[5rem]">
            {/* Images */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="flex flex-col gap-[1rem]">
              <div className="aspect-square overflow-hidden rounded-[2rem] bg-[rgba(241,240,238,0.5)]">
                {allImages.length > 0 ? (
                  <img src={allImages[activeImage]} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ShoppingBag className="h-20 w-20 text-[rgba(17,17,17,0.1)]" />
                  </div>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-[0.75rem]">
                  {allImages.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`h-[4rem] w-[4rem] overflow-hidden rounded-[0.75rem] border-2 transition-colors ${i === activeImage ? "border-[#111]" : "border-transparent"}`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="flex flex-col">
              <span className="text-[0.8rem] font-medium uppercase tracking-wider text-[rgba(17,17,17,0.4)]">{product.category}</span>
              <h1 className="mt-[0.75rem] text-[2rem] font-semibold tracking-[-.02em] sm:text-[2.5rem]">{product.name}</h1>
              <div className="mt-[1rem] text-[2rem] font-semibold text-[#111]">${Number(product.price).toFixed(2)}</div>

              <div className="mt-[1.5rem] flex items-center gap-[0.75rem]">
                {product.stock > 0 ? (
                  <span className="inline-flex items-center gap-[0.375rem] rounded-full bg-green-50 px-[0.75rem] py-[0.25rem] text-[0.8rem] font-medium text-green-700">
                    <Check className="h-3.5 w-3.5" /> In Stock ({product.stock} available)
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-red-50 px-[0.75rem] py-[0.25rem] text-[0.8rem] font-medium text-red-600">
                    Out of Stock
                  </span>
                )}
                {product.isFeatured && (
                  <span className="rounded-full bg-[rgba(17,17,17,0.05)] px-[0.75rem] py-[0.25rem] text-[0.8rem] font-medium text-[rgba(17,17,17,0.6)]">
                    Featured
                  </span>
                )}
              </div>

              <p className="mt-[2rem] text-[0.9375rem] leading-relaxed text-[rgba(17,17,17,0.6)]">
                {product.description}
              </p>

              {/* Quantity + Add to Cart */}
              {product.stock > 0 && (
                <div className="mt-[2.5rem] flex items-center gap-[1rem]">
                  <div className="flex items-center rounded-[1rem] border border-[var(--color-line)]">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-[0.75rem] py-[0.625rem] text-[rgba(17,17,17,0.5)] hover:text-[#111]">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[2.5rem] text-center text-[0.875rem] font-medium">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="px-[0.75rem] py-[0.625rem] text-[rgba(17,17,17,0.5)] hover:text-[#111]">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <PillButton variant="dark" onClick={addToCart} className="flex-1 justify-center">
                    {added ? "Added!" : `Add to Cart — $${(product.price * quantity).toFixed(2)}`}
                  </PillButton>
                </div>
              )}

              {/* Trust badges */}
              <div className="mt-[3rem] grid grid-cols-3 gap-[1rem] border-t border-[var(--color-line)] pt-[2rem]">
                {[
                  { icon: <Truck className="h-5 w-5" />, text: "Free shipping" },
                  { icon: <Shield className="h-5 w-5" />, text: "Secure payment" },
                  { icon: <RefreshCw className="h-5 w-5" />, text: "Easy returns" },
                ].map((b, i) => (
                  <div key={i} className="flex flex-col items-center gap-[0.5rem] text-center">
                    <span className="text-[rgba(17,17,17,0.3)]">{b.icon}</span>
                    <span className="text-[0.75rem] text-[rgba(17,17,17,0.5)]">{b.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
