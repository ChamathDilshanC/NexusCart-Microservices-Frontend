"use client";

import React, { useState, useEffect } from "react";
import { useAppState, PillButton } from "../../../components/Shared";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { LiquidRevealCanvas } from "../../../components/Hero";
import { Clock, Plus, Package, DollarSign, ShoppingCart, Info, AlertTriangle } from "lucide-react";

export default function VendorDashboard() {
  const { currentUser, isAuthInitialized, ready } = useAppState();
  const router = useRouter();
  
  const [business, setBusiness] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthInitialized) return;

    if (!currentUser || currentUser.role !== "Vendor") {
      router.push("/");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("nexus_token");
        // Fetch Business Profile
        const res = await fetch("/api/business/my-business", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 404) {
          // No business registered yet
          router.push("/vendor/register");
          return;
        }

        const data = await res.json();
        setBusiness(data);

        // If Approved, fetch products
        if (data.status === "Approved") {
          const prodRes = await fetch("/api/products/vendor", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (prodRes.ok) {
            const prodData = await prodRes.json();
            setProducts(prodData);
          }
        }
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser, isAuthInitialized, router]);

  if (!isAuthInitialized || loading) {
    return (
      <div className="min-h-screen bg-[#111] flex justify-center items-center">
        <div className="text-[rgba(255,255,255,0.5)] font-medium">Loading dashboard...</div>
      </div>
    );
  }

  if (!business) return null;

  return (
    <section id="vendor-dashboard" className="relative isolate min-h-screen overflow-hidden rounded-b-[2rem] bg-[#111]">
      <LiquidRevealCanvas />
      
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[rgba(17,17,17,0.5)] via-[rgba(17,17,17,0.8)] to-[rgba(17,17,17,0.95)]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={ready ? { opacity: 0.08, y: 0 } : {}}
        transition={{ type: "spring", stiffness: 120, damping: 30, delay: 0.3 }}
        className="pointer-events-none absolute inset-x-0 top-[20vh] z-[1] select-none text-center text-[10rem] font-bold leading-none text-[#fff] tracking-tighter"
      >
        VENDOR
      </motion.div>

      <div className="shell relative z-20 flex flex-col gap-[2rem] px-[1.25rem] pb-[5rem] pt-[9rem] sm:px-[2rem] lg:min-h-[100lvh] lg:px-[2rem] lg:pb-[7rem] lg:pt-[11rem]">
        
        <div className="flex flex-col gap-[1rem]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-[0.5rem] text-[0.875rem] font-medium text-[rgba(255,255,255,0.7)]">
              <div className="h-[0.375rem] w-[0.375rem] rounded-[9999px] bg-[var(--color-accent)]" />
              NexusCart Vendor Hub
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={ready ? { y: 0, opacity: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-[24ch] text-[2.5rem] font-semibold leading-[1.05] tracking-[-.02em] text-[#fff] sm:text-[3.5rem]"
          >
            Welcome back, <br/><span className="text-[rgba(255,255,255,0.5)]">{business.businessName}</span>
          </motion.h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-[2rem] w-full max-w-[1200px]"
        >
          {business.status === "Pending" && (
            <div className="flex flex-col items-center justify-center gap-[1rem] rounded-[24px] border border-[rgba(251,220,142,0.2)] bg-[rgba(251,220,142,0.05)] p-[3rem] text-center backdrop-blur-xl shadow-2xl">
              <div className="grid h-[64px] w-[64px] place-items-center rounded-full bg-[rgba(251,220,142,0.1)] text-[#fbdc8e]">
                <Clock className="h-[32px] w-[32px]" />
              </div>
              <h2 className="text-[1.5rem] font-semibold text-[#fbdc8e]">Pending Approval</h2>
              <p className="text-[rgba(255,255,255,0.6)] mt-[0.5rem] max-w-lg mx-auto text-[0.875rem]">
                Your business registration ({business.registrationNumber}) is currently being reviewed by our administrative team. You will be able to add products once approved.
              </p>
            </div>
          )}

          {business.status === "Rejected" && (
            <div className="flex flex-col items-center justify-center gap-[1rem] rounded-[24px] border border-[rgba(242,184,181,0.2)] bg-[rgba(242,184,181,0.05)] p-[3rem] text-center backdrop-blur-xl shadow-2xl">
              <div className="grid h-[64px] w-[64px] place-items-center rounded-full bg-[rgba(242,184,181,0.1)] text-[#f2b8b5]">
                <AlertTriangle className="h-[32px] w-[32px]" />
              </div>
              <h2 className="text-[1.5rem] font-semibold text-[#f2b8b5]">Application Rejected</h2>
              <p className="text-[rgba(255,255,255,0.6)] mt-[0.5rem] text-[0.875rem]">
                Unfortunately, your business application was not approved. Please contact support.
              </p>
            </div>
          )}

          {business.status === "Approved" && (
            <div className="flex flex-col gap-[2rem]">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-[1.5rem]">
                <div className="bg-[rgba(255,255,255,0.03)] p-[1.5rem] rounded-[24px] border border-[rgba(255,255,255,0.1)] shadow-2xl backdrop-blur-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[0.75rem] uppercase tracking-wider text-[rgba(255,255,255,0.5)] font-medium">Total Products</p>
                    <h3 className="text-[2.5rem] font-semibold text-[#fff] mt-[0.25rem] leading-none">{products.length}</h3>
                  </div>
                  <div className="grid h-[48px] w-[48px] place-items-center rounded-full bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.6)]">
                    <Package className="h-[24px] w-[24px]" />
                  </div>
                </div>
                <div className="bg-[rgba(255,255,255,0.03)] p-[1.5rem] rounded-[24px] border border-[rgba(255,255,255,0.1)] shadow-2xl backdrop-blur-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[0.75rem] uppercase tracking-wider text-[rgba(255,255,255,0.5)] font-medium">Orders</p>
                    <h3 className="text-[2.5rem] font-semibold text-[#fff] mt-[0.25rem] leading-none">0</h3>
                  </div>
                  <div className="grid h-[48px] w-[48px] place-items-center rounded-full bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.6)]">
                    <ShoppingCart className="h-[24px] w-[24px]" />
                  </div>
                </div>
                <div className="bg-[rgba(255,255,255,0.03)] p-[1.5rem] rounded-[24px] border border-[rgba(255,255,255,0.1)] shadow-2xl backdrop-blur-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[0.75rem] uppercase tracking-wider text-[rgba(255,255,255,0.5)] font-medium">Revenue</p>
                    <h3 className="text-[2.5rem] font-semibold text-[#fff] mt-[0.25rem] leading-none">$0.00</h3>
                  </div>
                  <div className="grid h-[48px] w-[48px] place-items-center rounded-full bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.6)]">
                    <DollarSign className="h-[24px] w-[24px]" />
                  </div>
                </div>
              </div>

              {/* Products Section */}
              <div className="bg-[rgba(255,255,255,0.03)] rounded-[24px] border border-[rgba(255,255,255,0.1)] shadow-2xl backdrop-blur-2xl overflow-hidden">
                <div className="p-[1.5rem] border-b border-[rgba(255,255,255,0.1)] flex justify-between items-center bg-[rgba(255,255,255,0.02)]">
                  <div className="flex items-center gap-[0.75rem]">
                    <div className="h-[1.5rem] w-[0.25rem] rounded-full bg-[var(--color-accent)]" />
                    <h2 className="text-[1.25rem] font-semibold text-[#fff]">Your Products</h2>
                  </div>
                  <Link href="/vendor/products/new">
                    <button className="flex items-center gap-[0.5rem] rounded-[9999px] bg-[#fff] px-[1rem] py-[0.5rem] text-[0.875rem] font-medium text-[#111] transition-transform hover:scale-[1.02] active:scale-[0.98]">
                      <Plus className="h-[1rem] w-[1rem]" /> Add Product
                    </button>
                  </Link>
                </div>
                
                {products.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-[4rem] text-center">
                    <div className="grid h-[48px] w-[48px] place-items-center rounded-full bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.4)] mb-[1rem]">
                      <Info className="h-[24px] w-[24px]" />
                    </div>
                    <p className="text-[rgba(255,255,255,0.5)]">You haven't added any products yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[rgba(255,255,255,0.02)] text-[0.65rem] uppercase tracking-[0.1em] text-[rgba(255,255,255,0.5)]">
                          <th className="p-[1.25rem] font-medium">Product</th>
                          <th className="p-[1.25rem] font-medium">Category</th>
                          <th className="p-[1.25rem] font-medium">Price</th>
                          <th className="p-[1.25rem] font-medium">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(255,255,255,0.1)]">
                        {products.map(p => (
                          <tr key={p._id} className="hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                            <td className="p-[1.25rem]">
                              <div className="flex items-center gap-[1rem]">
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.name} className="w-[48px] h-[48px] rounded-[12px] object-cover bg-[rgba(255,255,255,0.1)] shadow-sm" />
                                ) : (
                                  <div className="w-[48px] h-[48px] rounded-[12px] bg-[rgba(255,255,255,0.1)] flex items-center justify-center">
                                    <Package className="h-[20px] w-[20px] text-[rgba(255,255,255,0.3)]" />
                                  </div>
                                )}
                                <span className="font-medium text-[#fff] text-[0.9375rem]">{p.name}</span>
                              </div>
                            </td>
                            <td className="p-[1.25rem] text-[rgba(255,255,255,0.6)] text-[0.875rem]">{p.category || '-'}</td>
                            <td className="p-[1.25rem] font-medium text-[#fff] text-[0.9375rem]">${p.price.toFixed(2)}</td>
                            <td className="p-[1.25rem]">
                              <span className={`inline-flex px-[0.625rem] py-[0.25rem] rounded-full text-[0.75rem] font-medium ${p.stock > 0 ? 'bg-[rgba(19,115,51,0.2)] text-[#4ade80] border border-[rgba(74,222,128,0.2)]' : 'bg-[rgba(197,34,31,0.2)] text-[#f87171] border border-[rgba(248,113,113,0.2)]'}`}>
                                {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
