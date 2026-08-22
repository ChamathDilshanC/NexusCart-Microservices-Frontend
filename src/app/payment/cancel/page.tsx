"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useAppState } from "@/components/providers/AppStateProvider";

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

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<CenteredLoader />}>
      <PaymentCancelContent />
    </Suspense>
  );
}

function PaymentCancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isAuthInitialized } = useAppState();
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    if (isAuthInitialized && !currentUser) {
      router.replace("/auth?view=login");
    }
  }, [isAuthInitialized, currentUser, router]);

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

  return (
    <div className="min-h-screen bg-black text-white">
      <AppHeader />
      <div className="max-w-xl mx-auto px-6 py-24">
        <div className="bg-[#111113] border border-white/10 rounded-2xl p-10 flex flex-col items-center text-center gap-5">
          <div className="grid place-items-center h-16 w-16 rounded-full bg-red-500/10">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-white mb-2">Payment cancelled</h1>
            <p className="text-sm text-gray-400 max-w-sm">
              Your payment was cancelled and you haven't been charged. Your order is still saved — you
              can try paying again from My Orders.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-2">
            {orderId ? (
              <Link
                href={`/orders/${orderId}/invoice`}
                className="bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors"
              >
                View order
              </Link>
            ) : (
              <Link
                href="/shop"
                className="bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors"
              >
                Continue shopping
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
