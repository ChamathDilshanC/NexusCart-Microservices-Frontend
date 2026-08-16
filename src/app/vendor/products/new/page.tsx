"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAppState, PillButton } from "../../../../components/Shared";
import Link from "next/link";

export default function NewProduct() {
  const { currentUser } = useAppState();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    imageUrl: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "Vendor") {
      router.push("/");
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("nexus_token");
      
      const payload = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock)
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to create product");
      }
      
      setSuccess(true);
      setTimeout(() => {
        router.push("/vendor/dashboard");
      }, 1500);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[var(--color-surface)] pt-[120px] pb-[60px] px-[20px] flex justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#fff] p-[40px] rounded-[24px] border border-[var(--color-line)] shadow-sm"
      >
        
        <div className="flex items-center gap-[16px] mb-[32px]">
          <Link href="/vendor/dashboard" className="text-[rgba(17,17,17,0.5)] hover:text-[#111] transition-colors">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </Link>
          <div>
            <h1 className="text-[32px] font-semibold tracking-tight text-[#111]">Add Product</h1>
            <p className="text-[16px] text-[rgba(17,17,17,0.6)] mt-[4px]">List a new item in your store</p>
          </div>
        </div>

        {success ? (
          <div className="bg-[#e6f4ea] text-[#137333] p-[24px] rounded-[16px] text-center">
            <div className="inline-flex items-center justify-center w-[48px] h-[48px] rounded-full bg-[#ceead6] mb-[16px]">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 className="font-semibold text-[20px]">Product Created!</h3>
            <p className="mt-[8px] text-[15px]">Taking you back to the dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-[24px]">
            {error && (
              <div className="bg-[#fce8e6] text-[#c5221f] p-[16px] rounded-[12px] text-[14px] flex items-start gap-[12px]">
                <svg className="shrink-0 mt-[2px]" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {error}
              </div>
            )}
            
            <div className="flex flex-col gap-[8px]">
              <label className="text-[14px] font-medium text-[#111]">Product Name</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full rounded-[12px] border border-[var(--color-line)] px-[16px] py-[12px] text-[16px] outline-none transition-colors focus:border-[var(--color-ink)]"
                placeholder="e.g. Wireless Noise-Cancelling Headphones"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
              <div className="flex flex-col gap-[8px]">
                <label className="text-[14px] font-medium text-[#111]">Price ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  required
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  className="w-full rounded-[12px] border border-[var(--color-line)] px-[16px] py-[12px] text-[16px] outline-none transition-colors focus:border-[var(--color-ink)]"
                  placeholder="0.00"
                />
              </div>
              <div className="flex flex-col gap-[8px]">
                <label className="text-[14px] font-medium text-[#111]">Stock Quantity</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  value={formData.stock}
                  onChange={e => setFormData({...formData, stock: e.target.value})}
                  className="w-full rounded-[12px] border border-[var(--color-line)] px-[16px] py-[12px] text-[16px] outline-none transition-colors focus:border-[var(--color-ink)]"
                  placeholder="e.g. 50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-[8px]">
              <label className="text-[14px] font-medium text-[#111]">Category</label>
              <select 
                required
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full rounded-[12px] border border-[var(--color-line)] px-[16px] py-[12px] text-[16px] outline-none transition-colors focus:border-[var(--color-ink)] bg-white"
              >
                <option value="" disabled>Select a category</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Home & Garden">Home & Garden</option>
                <option value="Sports">Sports</option>
                <option value="Books">Books</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex flex-col gap-[8px]">
              <label className="text-[14px] font-medium text-[#111]">Image URL</label>
              <input 
                type="url" 
                value={formData.imageUrl}
                onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                className="w-full rounded-[12px] border border-[var(--color-line)] px-[16px] py-[12px] text-[16px] outline-none transition-colors focus:border-[var(--color-ink)]"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            <div className="flex flex-col gap-[8px]">
              <label className="text-[14px] font-medium text-[#111]">Description</label>
              <textarea 
                required
                rows={4}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full rounded-[12px] border border-[var(--color-line)] px-[16px] py-[12px] text-[16px] outline-none transition-colors focus:border-[var(--color-ink)] resize-none"
                placeholder="Describe your product in detail..."
              />
            </div>
            
            <div className="mt-[8px] pt-[24px] border-t border-[var(--color-line)] flex justify-end gap-[16px]">
              <Link href="/vendor/dashboard">
                <PillButton variant="ghost" className="!text-[15px]">Cancel</PillButton>
              </Link>
              <PillButton type="submit" variant="dark" className="!text-[15px]" disabled={loading}>
                {loading ? "Creating..." : "Create Product"}
              </PillButton>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
