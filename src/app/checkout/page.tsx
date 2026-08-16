"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Header, NavMenu } from "@/components/Header";
import { PillButton } from "@/components/Shared";
import { ShoppingBag, Lock, ArrowLeft } from "lucide-react";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
  });

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("nexus_cart") || "[]");
    setItems(cart);
    // Redirect to login if not authenticated
    const token = localStorage.getItem("nexus_token");
    if (!token) {
      router.push("/");
    }
  }, [router]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("nexus_token");
      const orderItems = items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        imageUrl: item.imageUrl,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: orderItems,
          totalAmount: total,
          shippingAddress: form,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to place order");
      }

      // Clear cart
      localStorage.setItem("nexus_cart", JSON.stringify([]));
      window.dispatchEvent(new Event("cart-updated"));

      // Redirect to profile
      router.push("/profile");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <Header />
        <NavMenu />
        <main className="flex min-h-screen flex-col items-center justify-center gap-[1.5rem] bg-[#fff]">
          <ShoppingBag className="h-12 w-12 text-[rgba(17,17,17,0.15)]" />
          <div className="text-[1.125rem] font-medium text-[rgba(17,17,17,0.5)]">Your cart is empty</div>
          <PillButton variant="dark" withArrow href="/shop">Go to Shop</PillButton>
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
            <h1 className="text-[2.5rem] font-semibold tracking-[-.02em] sm:text-[3rem]">Checkout</h1>
          </motion.div>

          <div className="mt-[2.5rem] grid grid-cols-1 gap-[3rem] lg:grid-cols-[1fr_22rem]">
            {/* Shipping Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              onSubmit={handleSubmit}
              className="flex flex-col gap-[1.5rem]"
            >
              <h2 className="text-[1.25rem] font-semibold">Shipping Address</h2>

              {error && (
                <div className="rounded-[0.75rem] bg-red-50 border border-red-100 p-[1rem] text-[0.8rem] text-red-600">{error}</div>
              )}

              <label className="flex flex-col gap-[0.375rem]">
                <span className="text-[0.75rem] font-medium uppercase tracking-[.025em] text-[rgba(17,17,17,0.5)]">Street Address</span>
                <input type="text" required value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} placeholder="123 Main Street" className="w-full rounded-[0.875rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.5)] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none transition-colors focus:border-[rgba(17,17,17,0.3)] focus:bg-[#fff]" />
              </label>

              <div className="grid grid-cols-2 gap-[1rem]">
                <label className="flex flex-col gap-[0.375rem]">
                  <span className="text-[0.75rem] font-medium uppercase tracking-[.025em] text-[rgba(17,17,17,0.5)]">City</span>
                  <input type="text" required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="New York" className="w-full rounded-[0.875rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.5)] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none transition-colors focus:border-[rgba(17,17,17,0.3)] focus:bg-[#fff]" />
                </label>
                <label className="flex flex-col gap-[0.375rem]">
                  <span className="text-[0.75rem] font-medium uppercase tracking-[.025em] text-[rgba(17,17,17,0.5)]">State</span>
                  <input type="text" required value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="NY" className="w-full rounded-[0.875rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.5)] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none transition-colors focus:border-[rgba(17,17,17,0.3)] focus:bg-[#fff]" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-[1rem]">
                <label className="flex flex-col gap-[0.375rem]">
                  <span className="text-[0.75rem] font-medium uppercase tracking-[.025em] text-[rgba(17,17,17,0.5)]">ZIP Code</span>
                  <input type="text" required value={form.zipCode} onChange={e => setForm({ ...form, zipCode: e.target.value })} placeholder="10001" className="w-full rounded-[0.875rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.5)] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none transition-colors focus:border-[rgba(17,17,17,0.3)] focus:bg-[#fff]" />
                </label>
                <label className="flex flex-col gap-[0.375rem]">
                  <span className="text-[0.75rem] font-medium uppercase tracking-[.025em] text-[rgba(17,17,17,0.5)]">Country</span>
                  <input type="text" required value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="United States" className="w-full rounded-[0.875rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.5)] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none transition-colors focus:border-[rgba(17,17,17,0.3)] focus:bg-[#fff]" />
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-[1rem] flex items-center justify-center gap-[0.5rem] rounded-[1rem] bg-[var(--color-ink)] px-[2rem] py-[0.875rem] text-[0.875rem] font-medium text-[#fff] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <Lock className="h-4 w-4" />
                {loading ? "Placing Order..." : `Place Order — $${total.toFixed(2)}`}
              </button>

              <a href="/cart" className="flex items-center gap-[0.375rem] text-[0.8rem] text-[rgba(17,17,17,0.5)] hover:text-[#111]">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to cart
              </a>
            </motion.form>

            {/* Order Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
              <div className="sticky top-[7rem] rounded-[1.5rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.2)] p-[1.5rem]">
                <h2 className="text-[1.125rem] font-semibold">Order Summary</h2>
                <div className="mt-[1.25rem] flex flex-col gap-[0.75rem]">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-[0.75rem]">
                      <div className="h-[2.5rem] w-[2.5rem] shrink-0 overflow-hidden rounded-[0.5rem] bg-[rgba(241,240,238,0.5)]">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingBag className="h-3.5 w-3.5 text-[rgba(17,17,17,0.15)]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.8rem] font-medium text-[#111] truncate">{item.name}</div>
                        <div className="text-[0.7rem] text-[rgba(17,17,17,0.4)]">x{item.quantity}</div>
                      </div>
                      <div className="text-[0.8rem] font-medium">${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                  <div className="border-t border-[var(--color-line)] pt-[0.75rem] flex flex-col gap-[0.5rem]">
                    <div className="flex justify-between text-[0.8rem]">
                      <span className="text-[rgba(17,17,17,0.5)]">Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[0.8rem]">
                      <span className="text-[rgba(17,17,17,0.5)]">Shipping</span>
                      <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                    </div>
                    <div className="border-t border-[var(--color-line)] pt-[0.5rem] flex justify-between">
                      <span className="text-[1rem] font-semibold">Total</span>
                      <span className="text-[1rem] font-semibold">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </>
  );
}
