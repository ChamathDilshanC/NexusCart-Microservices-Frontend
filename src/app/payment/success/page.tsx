"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Receipt } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useAppState } from "@/components/providers/AppStateProvider";
import { useCart } from "@/components/providers/CartProvider";
import { apiFetch } from "@/lib/api";

type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface Order {
  _id: string;
  status: OrderStatus;
}

// PayHere returns the browser here as soon as the customer finishes on its
// hosted page, but the authoritative "payment succeeded" signal is its
// separate notify webhook, which can land a moment later — so this polls
// the order briefly instead of trusting the return alone.
const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 6;

function CenteredLoader() {
  return (
    <div className="min-h-screen bg-black text-white">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-6 py-24 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<CenteredLoader />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isAuthInitialized } = useAppState();
  const { clear } = useCart();
  const orderId = searchParams.get("order_id");

  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [pollsLeft, setPollsLeft] = useState(MAX_POLLS);
  const clearedRef = useRef(false);

  useEffect(() => {
    if (isAuthInitialized && !currentUser) {
      router.replace("/auth?view=login");
    }
  }, [isAuthInitialized, currentUser, router]);

  // The payment is confirmed (or at least no longer at risk of being
  // abandoned) once we're back on this page — safe to empty the cart now.
  useEffect(() => {
    if (!clearedRef.current) {
      clearedRef.current = true;
      clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!orderId || !currentUser) return;
    if (status === "PAID" || pollsLeft <= 0) return;

    let cancelled = false;
    const check = async () => {
      try {
        const order = await apiFetch<Order>(`/orders/${orderId}`);
        if (!cancelled) setStatus(order.status);
      } catch {
        // Transient failure — the next poll (or the fallback message) covers it.
      } finally {
        if (!cancelled) setPollsLeft((p) => p - 1);
      }
    };

    check();
    const interval = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, currentUser, status, pollsLeft]);

  if (!isAuthInitialized || !currentUser) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-6 py-24 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
        </div>
      </div>
    );
  }

  const confirmed = status === "PAID";
  const stillChecking = !confirmed && pollsLeft > 0;

  return (
    <div className="min-h-screen bg-black text-white">
      <AppHeader />
      <div className="max-w-xl mx-auto px-6 py-24">
        <div className="bg-[#111113] border border-white/10 rounded-2xl p-10 flex flex-col items-center text-center gap-5">
          <div className="grid place-items-center h-16 w-16 rounded-full bg-emerald-500/10">
            {stillChecking ? (
              <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            )}
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-white mb-2">
              {confirmed ? "Payment successful" : stillChecking ? "Confirming your payment…" : "Order placed"}
            </h1>
            <p className="text-sm text-gray-400 max-w-sm">
              {confirmed
                ? "Thanks for your order! We've received your payment and you'll get a confirmation email shortly."
                : stillChecking
                ? "We're confirming your payment with PayHere — this usually only takes a few seconds."
                : "We haven't received final confirmation from PayHere yet. If your card was charged, your order will update automatically — check My Orders in a moment."}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-2">
            {orderId && (
              <Link
                href={`/orders/${orderId}/invoice`}
                className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors"
              >
                <Receipt className="w-4 h-4" /> View invoice
              </Link>
            )}
            <Link
              href="/profile"
              className="bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-6 py-3 rounded-full border border-white/5 transition-colors"
            >
              My Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
