"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail, MapPin, PackageOpen, ShoppingBag, Receipt } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useAppState } from "@/components/providers/AppStateProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError, apiFetch, clearSession } from "@/lib/api";

type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress?: ShippingAddress;
  status: OrderStatus;
  createdAt: string;
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  PAID: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  SHIPPED: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  DELIVERED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  CANCELLED: "bg-red-500/10 text-red-300 border-red-500/20",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAddress(addr: ShippingAddress) {
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
}

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

/* ---------------------------------- Page ---------------------------------- */

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const { currentUser, setCurrentUser, isAuthInitialized } = useAppState();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Auth gate — redirect once we know for sure there's no session.
  useEffect(() => {
    if (isAuthInitialized && !currentUser) {
      router.replace("/auth");
    }
  }, [isAuthInitialized, currentUser, router]);

  // Load order history once we have a confirmed session.
  useEffect(() => {
    if (!isAuthInitialized || !currentUser) return;
    let cancelled = false;
    setOrdersLoading(true);
    apiFetch<Order[]>("/orders/my-orders")
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setOrders([]);
          toast.error(err instanceof ApiError ? err.message : "Failed to load your orders.");
        }
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthInitialized, currentUser?.id]);

  if (!isAuthInitialized || !currentUser) {
    return (
      <>
        <AppHeader />
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-6">
          <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
        </div>
      </>
    );
  }

  function handleSignOut() {
    clearSession();
    setCurrentUser(null);
    window.location.href = "/";
  }

  return (
    <>
      <AppHeader />
      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          <aside className="bg-[#111113] border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center h-fit lg:sticky lg:top-24">
            <div className="h-20 w-20 rounded-full bg-white/10 grid place-items-center text-2xl font-semibold text-white mb-4">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-semibold text-white break-words w-full">{currentUser.name}</h2>
            <div className="flex items-center justify-center gap-1.5 text-sm text-gray-400 mt-1.5 w-full">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{currentUser.email}</span>
            </div>
            <span className="mt-4 text-xs font-medium px-3 py-1 rounded-full border bg-white/5 border-white/10 text-gray-300">
              {currentUser.role}
            </span>
            <button
              onClick={handleSignOut}
              className="mt-6 w-full bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-6 py-3 rounded-full border border-white/5 transition-colors"
            >
              Sign out
            </button>
          </aside>

          <section className="flex flex-col gap-6 min-w-0">
            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">Order History</h1>
              {!ordersLoading && (
                <span className="text-sm text-gray-500">
                  {orders.length} order{orders.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {ordersLoading ? (
              <div className="flex flex-col gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="bg-[#111113] border border-white/10 rounded-2xl p-6 h-28 animate-pulse" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-[#111113] border border-white/10 rounded-2xl p-8 py-16 flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-full bg-white/5 grid place-items-center">
                  <PackageOpen className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <p className="text-white font-medium">No orders yet</p>
                  <p className="text-sm text-gray-500 mt-1">When you place an order, it will show up here.</p>
                </div>
                <Link
                  href="/shop"
                  className="bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors"
                >
                  Start shopping
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {orders.map((order) => (
                  <div key={order._id} className="bg-[#111113] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">Order #{order._id.slice(-8)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[order.status]}`}
                        >
                          {order.status}
                        </span>
                        <span className="text-sm font-semibold text-white">{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={`${item.productId}-${idx}`}
                          className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full pl-1 pr-3 py-1"
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-6 h-6 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-white/10 grid place-items-center shrink-0">
                              <ShoppingBag className="w-3 h-3 text-gray-400" />
                            </span>
                          )}
                          <span className="text-xs text-gray-300">
                            {item.name} × {item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
                      {order.shippingAddress ? (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{formatAddress(order.shippingAddress)}</span>
                        </div>
                      ) : (
                        <span />
                      )}
                      <Link
                        href={`/orders/${order._id}/invoice`}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors shrink-0"
                      >
                        <Receipt className="w-3.5 h-3.5" /> View invoice
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
