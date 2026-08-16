"use client";

import React, { useState, useEffect } from "react";
import { useAppState, PillButton } from "../../../components/Shared";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function VendorDashboard() {
  const { currentUser } = useAppState();
  const router = useRouter();
  
  const [business, setBusiness] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "Vendor") {
      router.push("/");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("nexus_token");
        // Fetch Business Profile
        const res = await fetch("/api/business/me", {
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
  }, [currentUser, router]);

  if (loading) {
    return <div className="min-h-screen pt-[100px] flex justify-center"><p>Loading dashboard...</p></div>;
  }

  if (!business) return null;

  return (
    <div className="min-h-screen bg-[var(--color-surface)] pt-[120px] pb-[60px]">
      <div className="shell max-w-[1200px] mx-auto px-[20px]">
        
        <div className="mb-[40px]">
          <h1 className="text-[36px] font-semibold text-[#111]">Dashboard</h1>
          <p className="text-[16px] text-[rgba(17,17,17,0.6)]">Welcome back, {business.businessName}</p>
        </div>

        {business.status === "Pending" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#fff9e6] border border-[#fbdc8e] rounded-[16px] p-[32px] text-center shadow-sm"
          >
            <div className="inline-flex items-center justify-center w-[64px] h-[64px] rounded-full bg-[#fbdc8e] text-[#b47a00] mb-[20px]">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <h2 className="text-[24px] font-semibold text-[#b47a00]">Pending Approval</h2>
            <p className="text-[#b47a00] mt-[8px] max-w-lg mx-auto">
              Your business registration ({business.registrationNumber}) is currently being reviewed by our administrative team. You will be able to add products once approved.
            </p>
          </motion.div>
        )}

        {business.status === "Rejected" && (
          <div className="bg-[#fce8e6] border border-[#f2b8b5] rounded-[16px] p-[32px] text-center shadow-sm">
            <h2 className="text-[24px] font-semibold text-[#c5221f]">Application Rejected</h2>
            <p className="text-[#c5221f] mt-[8px]">Unfortunately, your business application was not approved. Please contact support.</p>
          </div>
        )}

        {business.status === "Approved" && (
          <div className="flex flex-col gap-[32px]">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
              <div className="bg-[#fff] p-[24px] rounded-[16px] border border-[var(--color-line)] shadow-sm">
                <p className="text-[14px] text-[rgba(17,17,17,0.6)] font-medium">Total Products</p>
                <h3 className="text-[32px] font-semibold text-[#111] mt-[8px]">{products.length}</h3>
              </div>
              <div className="bg-[#fff] p-[24px] rounded-[16px] border border-[var(--color-line)] shadow-sm">
                <p className="text-[14px] text-[rgba(17,17,17,0.6)] font-medium">Orders</p>
                <h3 className="text-[32px] font-semibold text-[#111] mt-[8px]">0</h3>
              </div>
              <div className="bg-[#fff] p-[24px] rounded-[16px] border border-[var(--color-line)] shadow-sm">
                <p className="text-[14px] text-[rgba(17,17,17,0.6)] font-medium">Revenue</p>
                <h3 className="text-[32px] font-semibold text-[#111] mt-[8px]">$0.00</h3>
              </div>
            </div>

            {/* Products Section */}
            <div className="bg-[#fff] rounded-[16px] border border-[var(--color-line)] shadow-sm overflow-hidden">
              <div className="p-[24px] border-b border-[var(--color-line)] flex justify-between items-center">
                <h2 className="text-[20px] font-semibold text-[#111]">Your Products</h2>
                <Link href="/vendor/products/new">
                  <PillButton className="!py-[8px] !px-[16px] text-[14px]">Add Product</PillButton>
                </Link>
              </div>
              
              {products.length === 0 ? (
                <div className="p-[48px] text-center">
                  <p className="text-[rgba(17,17,17,0.5)]">You haven't added any products yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[rgba(241,240,238,0.4)] text-[12px] uppercase tracking-wider text-[rgba(17,17,17,0.6)]">
                        <th className="p-[16px] font-medium">Product</th>
                        <th className="p-[16px] font-medium">Category</th>
                        <th className="p-[16px] font-medium">Price</th>
                        <th className="p-[16px] font-medium">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-line)]">
                      {products.map(p => (
                        <tr key={p._id} className="hover:bg-[rgba(241,240,238,0.2)] transition-colors">
                          <td className="p-[16px]">
                            <div className="flex items-center gap-[12px]">
                              {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-[40px] h-[40px] rounded-[8px] object-cover bg-[#f1f0ee]" />}
                              <span className="font-medium text-[#111]">{p.name}</span>
                            </div>
                          </td>
                          <td className="p-[16px] text-[rgba(17,17,17,0.7)]">{p.category || '-'}</td>
                          <td className="p-[16px] font-medium">${p.price.toFixed(2)}</td>
                          <td className="p-[16px]">
                            <span className={`inline-flex px-[8px] py-[2px] rounded-full text-[12px] font-medium ${p.stock > 0 ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#fce8e6] text-[#c5221f]'}`}>
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

      </div>
    </div>
  );
}
