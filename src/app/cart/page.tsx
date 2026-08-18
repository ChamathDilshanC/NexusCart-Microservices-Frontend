"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, Trash2, Minus, Plus, ImageOff } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useCart } from "@/components/providers/CartProvider";
import { useCurrency } from "@/components/providers/CurrencyProvider";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clear } = useCart();
  const { formatPrice } = useCurrency();

  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  const handleClear = () => {
    if (items.length === 0) return;
    if (window.confirm("Remove all items from your cart?")) {
      clear();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-8">Your Cart</h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 bg-[#111113] border border-white/10 rounded-2xl">
            <div className="grid place-items-center h-16 w-16 rounded-full bg-white/5 mb-6">
              <ShoppingBag className="w-7 h-7 text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Your cart is empty</h2>
            <p className="text-gray-500 text-sm mb-8">Looks like you haven&apos;t added anything yet.</p>
            <Link
              href="/shop"
              className="bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </p>
                <button onClick={handleClear} className="text-xs text-gray-400 hover:text-white transition-colors">
                  Clear cart
                </button>
              </div>

              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-4 bg-[#111113] border border-white/10 rounded-2xl p-4"
                >
                  <Link
                    href={`/product/${item.productId}`}
                    className="relative h-20 w-20 rounded-xl overflow-hidden shrink-0 bg-white/5"
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.productId}`}
                      className="text-sm font-medium text-white hover:text-gray-300 transition-colors line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">{formatPrice(item.price)} each</p>
                  </div>

                  <div className="flex items-center border border-white/10 rounded-full shrink-0">
                    <button
                      onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                      className="h-9 w-9 grid place-items-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 rounded-full transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      aria-label="Increase quantity"
                      className="h-9 w-9 grid place-items-center text-white hover:bg-white/5 rounded-full transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-sm font-semibold text-white w-20 text-right shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </p>

                  <button
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Remove ${item.name}`}
                    className="text-gray-500 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="lg:sticky lg:top-24">
              <div className="bg-[#111113] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-white">Order Summary</h2>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span className="text-white">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Shipping</span>
                    <span className="text-white">{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                  </div>
                  {subtotal < 50 && <p className="text-xs text-gray-500">Free shipping on orders over $50</p>}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-sm font-semibold text-white">Total</span>
                  <span className="text-lg font-semibold text-white">{formatPrice(total)}</span>
                </div>
                <Link
                  href="/checkout"
                  className="bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors text-center"
                >
                  Proceed to Checkout
                </Link>
                <Link href="/shop" className="text-sm text-gray-400 hover:text-white transition-colors text-center">
                  Continue shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
