"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppState, PillButton } from "../../../../components/Shared";
import { LiquidRevealCanvas } from "../../../../components/Hero";
import Link from "next/link";
import { ArrowLeft, Check, AlertTriangle, Loader2 } from "lucide-react";

export default function NewProduct() {
  const { currentUser, isAuthInitialized, ready } = useAppState();
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
    if (!isAuthInitialized) return;
    if (!currentUser || currentUser.role !== "Vendor") {
      router.push("/");
    }
  }, [currentUser, isAuthInitialized, router]);

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
      }, 2000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthInitialized || !currentUser) return null;

  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-[#111]">
      <LiquidRevealCanvas />
      
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[rgba(17,17,17,0.5)] via-[rgba(17,17,17,0.8)] to-[rgba(17,17,17,0.95)]" />

      <div className="shell relative z-20 flex min-h-screen items-center justify-center px-[1.25rem] py-[8rem] sm:px-[2rem]">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={ready ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.3 }}
          className="w-full max-w-2xl rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-[2rem] shadow-2xl backdrop-blur-2xl sm:p-[3rem]"
        >
          <div className="mb-[2rem] flex items-center gap-[1rem]">
            <Link 
              href="/vendor/dashboard" 
              className="grid h-[2.5rem] w-[2.5rem] place-items-center rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.7)] transition-all hover:bg-[rgba(255,255,255,0.1)] hover:text-[#fff]"
            >
              <ArrowLeft className="h-[1.25rem] w-[1.25rem]" />
            </Link>
            <div>
              <h1 className="text-[1.75rem] font-semibold tracking-tight text-[#fff] sm:text-[2rem]">Add Product</h1>
              <p className="mt-[0.25rem] text-[0.875rem] text-[rgba(255,255,255,0.5)]">List a new item in your store</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center gap-[1rem] rounded-[16px] border border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.05)] p-[3rem] text-center"
              >
                <div className="grid h-[64px] w-[64px] place-items-center rounded-full bg-[rgba(74,222,128,0.1)] text-[#4ade80]">
                  <Check className="h-[32px] w-[32px]" />
                </div>
                <div>
                  <h3 className="text-[1.5rem] font-semibold text-[#4ade80]">Product Created!</h3>
                  <p className="mt-[0.5rem] text-[rgba(255,255,255,0.6)]">Taking you back to the dashboard...</p>
                </div>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, filter: "blur(10px)" }}
                onSubmit={handleSubmit} 
                className="flex flex-col gap-[1.5rem]"
              >
                {error && (
                  <div className="flex items-start gap-[0.75rem] rounded-[12px] border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.05)] p-[1rem] text-[0.875rem] text-[#f87171]">
                    <AlertTriangle className="mt-[0.125rem] h-[1.25rem] w-[1.25rem] shrink-0" />
                    {error}
                  </div>
                )}
                
                <div className="flex flex-col gap-[0.5rem]">
                  <label className="text-[0.875rem] font-medium text-[rgba(255,255,255,0.7)]">Product Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-[1rem] py-[0.875rem] text-[0.9375rem] text-[#fff] outline-none transition-all placeholder:text-[rgba(255,255,255,0.3)] focus:border-[rgba(255,255,255,0.3)] focus:bg-[rgba(255,255,255,0.08)]"
                    placeholder="e.g. Wireless Noise-Cancelling Headphones"
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-[1.5rem] md:grid-cols-2">
                  <div className="flex flex-col gap-[0.5rem]">
                    <label className="text-[0.875rem] font-medium text-[rgba(255,255,255,0.7)]">Price ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      required
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      className="w-full rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-[1rem] py-[0.875rem] text-[0.9375rem] text-[#fff] outline-none transition-all placeholder:text-[rgba(255,255,255,0.3)] focus:border-[rgba(255,255,255,0.3)] focus:bg-[rgba(255,255,255,0.08)]"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex flex-col gap-[0.5rem]">
                    <label className="text-[0.875rem] font-medium text-[rgba(255,255,255,0.7)]">Stock Quantity</label>
                    <input 
                      type="number" 
                      min="0"
                      required
                      value={formData.stock}
                      onChange={e => setFormData({...formData, stock: e.target.value})}
                      className="w-full rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-[1rem] py-[0.875rem] text-[0.9375rem] text-[#fff] outline-none transition-all placeholder:text-[rgba(255,255,255,0.3)] focus:border-[rgba(255,255,255,0.3)] focus:bg-[rgba(255,255,255,0.08)]"
                      placeholder="e.g. 50"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-[0.5rem]">
                  <label className="text-[0.875rem] font-medium text-[rgba(255,255,255,0.7)]">Category</label>
                  <select 
                    required
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-[1rem] py-[0.875rem] text-[0.9375rem] text-[#fff] outline-none transition-all focus:border-[rgba(255,255,255,0.3)] focus:bg-[rgba(255,255,255,0.08)] [&>option]:bg-[#111] [&>option]:text-[#fff]"
                  >
                    <option value="" disabled className="text-[rgba(255,255,255,0.3)]">Select a category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Home & Garden">Home & Garden</option>
                    <option value="Sports">Sports</option>
                    <option value="Books">Books</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-[0.5rem]">
                  <label className="text-[0.875rem] font-medium text-[rgba(255,255,255,0.7)]">Image URL</label>
                  <input 
                    type="url" 
                    value={formData.imageUrl}
                    onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                    className="w-full rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-[1rem] py-[0.875rem] text-[0.9375rem] text-[#fff] outline-none transition-all placeholder:text-[rgba(255,255,255,0.3)] focus:border-[rgba(255,255,255,0.3)] focus:bg-[rgba(255,255,255,0.08)]"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div className="flex flex-col gap-[0.5rem]">
                  <label className="text-[0.875rem] font-medium text-[rgba(255,255,255,0.7)]">Description</label>
                  <textarea 
                    required
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full resize-none rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-[1rem] py-[0.875rem] text-[0.9375rem] text-[#fff] outline-none transition-all placeholder:text-[rgba(255,255,255,0.3)] focus:border-[rgba(255,255,255,0.3)] focus:bg-[rgba(255,255,255,0.08)]"
                    placeholder="Describe your product in detail..."
                  />
                </div>
                
                <div className="mt-[1rem] flex items-center justify-end gap-[1rem] border-t border-[rgba(255,255,255,0.1)] pt-[1.5rem]">
                  <Link href="/vendor/dashboard" className="text-[0.875rem] font-medium text-[rgba(255,255,255,0.5)] transition-colors hover:text-[#fff]">
                    Cancel
                  </Link>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex items-center gap-[0.5rem] rounded-[9999px] bg-[#fff] px-[1.5rem] py-[0.75rem] text-[0.875rem] font-medium text-[#111] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                  >
                    {loading && <Loader2 className="h-[1rem] w-[1rem] animate-spin" />}
                    {loading ? "Creating..." : "Create Product"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
