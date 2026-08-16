"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppState, PillButton } from "../../../components/Shared";
import { useRouter } from "next/navigation";

export default function BusinessRegister() {
  const { currentUser } = useAppState();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    businessName: "",
    address: "",
    registrationNumber: "",
    contactNumber: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // If not logged in or not a Vendor, redirect
    if (!currentUser) {
      router.push("/");
    } else if (currentUser.role !== "Vendor") {
      router.push("/");
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("nexus_token");
      const res = await fetch("/api/business/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to register business");
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

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[var(--color-surface)] pt-[100px] pb-[60px] px-[20px] flex justify-center items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-[#fff] p-[40px] rounded-[24px] border border-[var(--color-line)] shadow-sm"
      >
        <div className="text-center mb-[32px]">
          <h1 className="text-[32px] font-semibold tracking-tight text-[#111]">Register Business</h1>
          <p className="text-[16px] text-[rgba(17,17,17,0.6)] mt-[8px]">Set up your NexusCart vendor profile</p>
        </div>

        {success ? (
          <div className="bg-[#e6f4ea] text-[#137333] p-[20px] rounded-[12px] text-center">
            <h3 className="font-semibold text-[18px]">Registration Submitted!</h3>
            <p className="mt-[8px] text-[14px]">Your business is pending admin approval. Redirecting to dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
            {error && (
              <div className="bg-[#fce8e6] text-[#c5221f] p-[12px] rounded-[8px] text-[14px]">
                {error}
              </div>
            )}
            
            <div className="flex flex-col gap-[8px]">
              <label className="text-[14px] font-medium text-[#111]">Business Name</label>
              <input 
                type="text" 
                required
                value={formData.businessName}
                onChange={e => setFormData({...formData, businessName: e.target.value})}
                className="w-full rounded-[12px] border border-[var(--color-line)] px-[16px] py-[12px] text-[16px] outline-none transition-colors focus:border-[var(--color-ink)]"
                placeholder="e.g. Nexus Electronics"
              />
            </div>
            
            <div className="flex flex-col gap-[8px]">
              <label className="text-[14px] font-medium text-[#111]">Registration Number</label>
              <input 
                type="text" 
                required
                value={formData.registrationNumber}
                onChange={e => setFormData({...formData, registrationNumber: e.target.value})}
                className="w-full rounded-[12px] border border-[var(--color-line)] px-[16px] py-[12px] text-[16px] outline-none transition-colors focus:border-[var(--color-ink)]"
                placeholder="e.g. BR-123456"
              />
            </div>
            
            <div className="flex flex-col gap-[8px]">
              <label className="text-[14px] font-medium text-[#111]">Contact Number</label>
              <input 
                type="text" 
                required
                value={formData.contactNumber}
                onChange={e => setFormData({...formData, contactNumber: e.target.value})}
                className="w-full rounded-[12px] border border-[var(--color-line)] px-[16px] py-[12px] text-[16px] outline-none transition-colors focus:border-[var(--color-ink)]"
                placeholder="e.g. +1 234 567 8900"
              />
            </div>
            
            <div className="flex flex-col gap-[8px]">
              <label className="text-[14px] font-medium text-[#111]">Business Address</label>
              <textarea 
                required
                rows={3}
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                className="w-full rounded-[12px] border border-[var(--color-line)] px-[16px] py-[12px] text-[16px] outline-none transition-colors focus:border-[var(--color-ink)] resize-none"
                placeholder="Full address of your business headquarters..."
              />
            </div>
            
            <div className="mt-[12px]">
              <PillButton type="submit" className="w-full justify-center text-[16px]" disabled={loading}>
                {loading ? "Submitting..." : "Submit Registration"}
              </PillButton>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
