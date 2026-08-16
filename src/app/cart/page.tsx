"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header, NavMenu } from "@/components/Header";
import { Footer } from "@/components/Sections";
import { PillButton } from "@/components/Shared";
import { ShoppingBag, Trash2, Minus, Plus, ArrowLeft } from "lucide-react";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem("nexus_cart") || "[]");
    setItems(cart);
  };

  useEffect(() => {
    loadCart();
    setMounted(true);
    window.addEventListener("cart-updated", loadCart);
    return () => window.removeEventListener("cart-updated", loadCart);
  }, []);

  const saveCart = (newItems: CartItem[]) => {
    localStorage.setItem("nexus_cart", JSON.stringify(newItems));
    setItems(newItems);
    window.dispatchEvent(new Event("cart-updated"));
  };

  const updateQuantity = (productId: string, delta: number) => {
    const newItems = items.map((item) => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    saveCart(newItems);
  };

  const removeItem = (productId: string) => {
    saveCart(items.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    saveCart([]);
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  if (!mounted) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center bg-[#fff]">
          <div className="text-[rgba(17,17,17,0.4)] text-[0.875rem]">Loading...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <NavMenu />

      <main className="min-h-screen bg-[#fff]">
        <div className="shell px-[1.25rem] pt-[8rem] pb-[5rem] sm:px-[2rem] lg:pb-[7rem]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-[2.5rem] font-semibold tracking-[-.02em] sm:text-[3rem]">Shopping Cart</h1>
          </motion.div>

          {items.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="mt-[4rem] flex flex-col items-center gap-[1.5rem]">
              <div className="grid h-[5rem] w-[5rem] place-items-center rounded-full bg-[rgba(241,240,238,0.5)]">
                <ShoppingBag className="h-8 w-8 text-[rgba(17,17,17,0.2)]" />
              </div>
              <div className="text-[1.125rem] font-medium text-[rgba(17,17,17,0.5)]">Your cart is empty</div>
              <PillButton variant="dark" withArrow href="/shop">
                Continue Shopping
              </PillButton>
            </motion.div>
          ) : (
            <div className="mt-[2.5rem] grid grid-cols-1 gap-[3rem] lg:grid-cols-[1fr_24rem]">
              {/* Cart Items */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="flex flex-col gap-[1rem]">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-[1.25rem] rounded-[1.5rem] border border-[var(--color-line)] p-[1.25rem]">
                    <div className="h-[5rem] w-[5rem] shrink-0 overflow-hidden rounded-[1rem] bg-[rgba(241,240,238,0.5)]">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-[rgba(17,17,17,0.15)]" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-[0.375rem]">
                      <a href={`/product/${item.productId}`} className="text-[1rem] font-medium text-[#111] hover:underline">{item.name}</a>
                      <div className="text-[0.875rem] text-[rgba(17,17,17,0.4)]">${Number(item.price).toFixed(2)} each</div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center rounded-[0.75rem] border border-[var(--color-line)]">
                          <button onClick={() => updateQuantity(item.productId, -1)} className="px-[0.5rem] py-[0.375rem] text-[rgba(17,17,17,0.5)] hover:text-[#111]">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-[2rem] text-center text-[0.875rem] font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, 1)} className="px-[0.5rem] py-[0.375rem] text-[rgba(17,17,17,0.5)] hover:text-[#111]">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-[1rem]">
                          <span className="text-[1rem] font-semibold text-[#111]">${(item.price * item.quantity).toFixed(2)}</span>
                          <button onClick={() => removeItem(item.productId)} className="text-[rgba(17,17,17,0.3)] hover:text-red-500 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={clearCart} className="mt-[0.5rem] self-start text-[0.8rem] text-[rgba(17,17,17,0.4)] hover:text-red-500 transition-colors">
                  Clear cart
                </button>
              </motion.div>

              {/* Order Summary */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
                <div className="sticky top-[7rem] rounded-[1.5rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.2)] p-[1.5rem]">
                  <h2 className="text-[1.125rem] font-semibold">Order Summary</h2>
                  <div className="mt-[1.25rem] flex flex-col gap-[0.75rem]">
                    <div className="flex justify-between text-[0.875rem]">
                      <span className="text-[rgba(17,17,17,0.5)]">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[0.875rem]">
                      <span className="text-[rgba(17,17,17,0.5)]">Shipping</span>
                      <span className="font-medium">{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                    </div>
                    {shipping > 0 && (
                      <div className="text-[0.75rem] text-[rgba(17,17,17,0.4)]">Free shipping on orders over $50</div>
                    )}
                    <div className="border-t border-[var(--color-line)] pt-[0.75rem] flex justify-between">
                      <span className="text-[1rem] font-semibold">Total</span>
                      <span className="text-[1rem] font-semibold">${total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-[1.5rem]">
                    <PillButton variant="dark" withArrow href="/checkout" className="w-full justify-center">
                      Proceed to Checkout
                    </PillButton>
                  </div>
                  <a href="/shop" className="mt-[1rem] flex items-center justify-center gap-[0.375rem] text-[0.8rem] text-[rgba(17,17,17,0.5)] hover:text-[#111]">
                    <ArrowLeft className="h-3.5 w-3.5" /> Continue shopping
                  </a>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
