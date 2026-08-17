"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Header, NavMenu } from "@/components/Header";
import { Footer } from "@/components/Sections";
import { PillButton, StatusPill, ORDER_STATUS_TONES } from "@/components/Shared";
import { Package, Mail, ShoppingBag, Clock, CheckCircle, Truck as TruckIcon, XCircle } from "lucide-react";

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-3.5 w-3.5" />,
  PAID: <CheckCircle className="h-3.5 w-3.5" />,
  SHIPPED: <TruckIcon className="h-3.5 w-3.5" />,
  DELIVERED: <CheckCircle className="h-3.5 w-3.5" />,
  CANCELLED: <XCircle className="h-3.5 w-3.5" />,
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("nexus_user");
    if (!userStr) {
      router.push("/");
      return;
    }
    try {
      setUser(JSON.parse(userStr));
    } catch {
      router.push("/");
      return;
    }

    const token = localStorage.getItem("nexus_token");
    fetch("/api/orders/my-orders", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setOrders(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const logout = () => {
    localStorage.removeItem("nexus_user");
    localStorage.removeItem("nexus_token");
    router.push("/");
  };

  if (!user) return null;

  return (
    <>
      <Header />
      <NavMenu />

      <main className="min-h-screen bg-[#fff]">
        <div className="shell px-[1.25rem] pt-[8rem] pb-[5rem] sm:px-[2rem] lg:pb-[7rem]">
          {/* Profile Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-[2.5rem] font-semibold tracking-[-.02em] sm:text-[3rem]">My Profile</h1>
          </motion.div>

          <div className="mt-[2.5rem] grid grid-cols-1 gap-[3rem] lg:grid-cols-[18rem_1fr]">
            {/* User Info Sidebar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}>
              <div className="rounded-[1.5rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.2)] p-[1.5rem]">
                <div className="flex flex-col items-center gap-[1rem] text-center">
                  <div className="grid h-[4rem] w-[4rem] place-items-center rounded-full bg-[var(--color-ink)] text-[1.5rem] font-semibold text-[#fff]">
                    {(user.name || user.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[1.125rem] font-semibold text-[#111]">{user.name || "—"}</div>
                    <div className="mt-[0.25rem] flex items-center gap-[0.375rem] text-[0.8rem] text-[rgba(17,17,17,0.5)]">
                      <Mail className="h-3.5 w-3.5" />
                      {user.email}
                    </div>
                    <div className="mt-[0.375rem]">
                      <span className="rounded-full bg-[rgba(17,17,17,0.05)] px-[0.75rem] py-[0.125rem] text-[0.7rem] font-medium text-[rgba(17,17,17,0.5)]">
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-[1.5rem] border-t border-[var(--color-line)] pt-[1.5rem]">
                  <button onClick={logout} className="w-full rounded-[1rem] bg-[rgba(17,17,17,0.05)] py-[0.625rem] text-[0.875rem] font-medium text-[rgba(17,17,17,0.6)] transition-colors hover:bg-[rgba(17,17,17,0.1)] hover:text-[#111]">
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Orders */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
              <div className="mb-[1.5rem] flex items-center justify-between">
                <h2 className="text-[1.25rem] font-semibold">Order History</h2>
                <span className="text-[0.8rem] text-[rgba(17,17,17,0.4)]">{orders.length} order{orders.length !== 1 ? "s" : ""}</span>
              </div>

              {loading ? (
                <div className="flex h-[200px] items-center justify-center rounded-[1.5rem] border border-[var(--color-line)]">
                  <div className="text-[rgba(17,17,17,0.4)] text-[0.875rem]">Loading orders...</div>
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center gap-[1.5rem] rounded-[1.5rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.2)] p-[3rem]">
                  <Package className="h-10 w-10 text-[rgba(17,17,17,0.15)]" />
                  <div className="text-[rgba(17,17,17,0.5)]">No orders yet. Start shopping!</div>
                  <PillButton variant="dark" withArrow href="/shop">Go to Shop</PillButton>
                </div>
              ) : (
                <div className="flex flex-col gap-[1rem]">
                  {orders.map((order) => {
                    return (
                      <div key={order._id} className="rounded-[1.5rem] border border-[var(--color-line)] p-[1.25rem] transition-colors hover:bg-[rgba(241,240,238,0.15)]">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[0.875rem] font-medium text-[#111]">Order #{order._id.slice(-8)}</div>
                            <div className="text-[0.75rem] text-[rgba(17,17,17,0.4)]">
                              {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                            </div>
                          </div>
                          <div className="flex items-center gap-[1rem]">
                            <StatusPill tone={ORDER_STATUS_TONES[order.status] || "neutral"} icon={statusIcons[order.status]}>
                              {order.status}
                            </StatusPill>
                            <span className="text-[1rem] font-semibold">${Number(order.totalAmount).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="mt-[1rem] border-t border-[var(--color-line)] pt-[1rem]">
                          <div className="flex flex-wrap gap-[0.5rem]">
                            {order.items?.map((item: any, i: number) => (
                              <div key={i} className="flex items-center gap-[0.5rem] rounded-[0.75rem] bg-[rgba(241,240,238,0.5)] px-[0.75rem] py-[0.375rem]">
                                <div className="h-[1.5rem] w-[1.5rem] overflow-hidden rounded-[0.375rem] bg-[rgba(241,240,238,0.8)]">
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                      <ShoppingBag className="h-2.5 w-2.5 text-[rgba(17,17,17,0.15)]" />
                                    </div>
                                  )}
                                </div>
                                <span className="text-[0.75rem] text-[rgba(17,17,17,0.6)]">{item.name} x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {order.shippingAddress && (
                          <div className="mt-[0.75rem] text-[0.7rem] text-[rgba(17,17,17,0.35)]">
                            Ships to: {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
