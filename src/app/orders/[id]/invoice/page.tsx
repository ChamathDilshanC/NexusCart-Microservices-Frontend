"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useAppState } from "@/components/providers/AppStateProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { apiFetch, ApiError } from "@/lib/api";

type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

interface ShippingAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface Order {
  _id: string;
  customerEmail?: string;
  customerName?: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress?: ShippingAddress;
  status: OrderStatus;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatAddress(addr?: ShippingAddress) {
  if (!addr) return null;
  const parts = [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(
    (p) => p && p.trim().length > 0
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

export default function InvoicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { currentUser, isAuthInitialized } = useAppState();
  const { formatPrice } = useCurrency();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (isAuthInitialized && !currentUser) {
      router.replace("/auth");
    }
  }, [isAuthInitialized, currentUser, router]);

  useEffect(() => {
    if (!isAuthInitialized || !currentUser) return;
    let cancelled = false;
    setLoading(true);
    apiFetch<Order>(`/orders/${params.id}`)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setNotFound(true);
          toast.error(err instanceof ApiError ? err.message : "Failed to load invoice.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthInitialized, currentUser?.id, params.id]);

  if (!isAuthInitialized || !currentUser || loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AppHeader />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AppHeader />
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h1 className="text-xl font-semibold text-white mb-2">Invoice not found</h1>
          <p className="text-gray-500 text-sm mb-8">
            This order doesn&apos;t exist, or you don&apos;t have access to it.
          </p>
          <Link
            href="/profile"
            className="bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors"
          >
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const address = formatAddress(order.shippingAddress);

  return (
    <div className="min-h-screen bg-black text-white print:bg-white">
      <div className="print:hidden">
        <AppHeader />
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 print:p-0 print:max-w-none">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link href="/profile" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to orders
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>

        <div className="bg-white text-black rounded-2xl p-10 print:rounded-none print:p-0">
          <div className="flex items-start justify-between pb-8 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">NexusCart</h1>
              <p className="text-xs text-gray-500 mt-1">Invoice</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">#{order._id.slice(-8).toUpperCase()}</p>
              <p className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
              <span className="inline-block mt-2 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                {order.status}
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-8 py-8">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">Bill to</p>
              <p className="text-sm font-medium">{order.customerName || "—"}</p>
              <p className="text-sm text-gray-600">{order.customerEmail}</p>
            </div>
            {address && (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">Ship to</p>
                <p className="text-sm text-gray-600">{address}</p>
              </div>
            )}
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-left font-medium text-[11px] uppercase tracking-wide text-gray-500 pb-2">Item</th>
                <th className="text-center font-medium text-[11px] uppercase tracking-wide text-gray-500 pb-2">Qty</th>
                <th className="text-right font-medium text-[11px] uppercase tracking-wide text-gray-500 pb-2">Price</th>
                <th className="text-right font-medium text-[11px] uppercase tracking-wide text-gray-500 pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={`${item.productId}-${idx}`} className="border-b border-gray-100">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                      )}
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600">{formatPrice(item.price)}</td>
                  <td className="py-3 text-right font-medium">{formatPrice(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end pt-6">
            <div className="w-full max-w-xs flex items-center justify-between pt-4 border-t-2 border-gray-900">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-semibold">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center pt-10">Thank you for shopping with NexusCart.</p>
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 24mm 16mm; }
        }
      `}</style>
    </div>
  );
}
