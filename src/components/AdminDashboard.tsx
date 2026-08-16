"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppState, PillButton } from "./Shared";
import { LiquidRevealCanvas } from "./Hero";
import { Check, X, Building2, MapPin, Phone, User, Mail, FileText } from "lucide-react";
import { goeyToast } from "goey-toast";

export function AdminDashboard() {
  const { ready } = useAppState();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingBusinesses();
  }, []);

  const fetchPendingBusinesses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("nexus_token");
      const res = await fetch("/api/admin/businesses/pending", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setBusinesses(data);
      }
    } catch (err) {
      console.error("Failed to fetch pending businesses", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      const token = localStorage.getItem("nexus_token");
      const res = await fetch(`/api/admin/businesses/${id}/review`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setBusinesses(prev => prev.filter(b => b._id !== id));
        goeyToast.success(`Business ${status.toLowerCase()} successfully`);
      } else {
        goeyToast.error(`Failed to review business: ${res.statusText}`);
      }
    } catch (err) {
      console.error("Review error", err);
      goeyToast.error("An error occurred while reviewing the business");
    }
  };

  return (
    <section id="admin-home" className="relative isolate min-h-screen overflow-hidden rounded-b-[2rem] bg-[#111]">
      <LiquidRevealCanvas />
      
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[rgba(17,17,17,0.5)] via-[rgba(17,17,17,0.8)] to-[rgba(17,17,17,0.95)]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={ready ? { opacity: 0.1, y: 0 } : {}}
        transition={{ type: "spring", stiffness: 120, damping: 30, delay: 0.3 }}
        className="pointer-events-none absolute inset-x-0 top-[20vh] z-[1] select-none text-center text-[10rem] font-bold leading-none text-[#fff]"
      >
        ADMIN
      </motion.div>

      <div className="shell relative z-20 flex flex-col gap-[2rem] px-[1.25rem] pb-[5rem] pt-[9rem] sm:px-[2rem] lg:min-h-[100lvh] lg:px-[2rem] lg:pb-[7rem] lg:pt-[11rem]">
        
        <div className="flex flex-col gap-[1rem]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-[0.5rem] text-[0.875rem] font-medium text-[rgba(255,255,255,0.7)]">
              <div className="h-[0.375rem] w-[0.375rem] rounded-[9999px] bg-[#fff]" />
              NexusCart Admin
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={ready ? { y: 0, opacity: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-[20ch] text-[2.5rem] font-semibold leading-[1.05] tracking-[-.02em] text-[#fff] sm:text-[3.5rem]"
          >
            Awaiting your <br/><span className="text-[rgba(255,255,255,0.5)]">approval</span>
          </motion.h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-[2rem] w-full max-w-[1200px]"
        >
          {loading ? (
            <div className="flex h-[300px] items-center justify-center rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] backdrop-blur-xl">
              <div className="text-[rgba(255,255,255,0.5)] font-medium">Loading applications...</div>
            </div>
          ) : businesses.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center gap-[1rem] rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] backdrop-blur-xl">
              <div className="grid h-[64px] w-[64px] place-items-center rounded-full bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.5)]">
                <Check className="h-[32px] w-[32px]" />
              </div>
              <div className="text-[rgba(255,255,255,0.7)] font-medium text-[1.125rem]">You're all caught up!</div>
              <div className="text-[rgba(255,255,255,0.4)] text-[0.875rem]">No pending vendor applications at the moment.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1.5rem]">
              <AnimatePresence>
                {businesses.map((b) => (
                  <motion.div
                    key={b._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="flex flex-col justify-between overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-[1.5rem] shadow-2xl backdrop-blur-2xl transition-all hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.2)]"
                  >
                    <div className="flex flex-col gap-[1.25rem]">
                      <div>
                        <div className="flex items-start justify-between">
                          <h3 className="text-[1.25rem] font-semibold text-[#fff] leading-tight">{b.businessName}</h3>
                          <span className="shrink-0 rounded-full bg-[rgba(255,255,255,0.1)] px-[0.5rem] py-[0.125rem] text-[0.65rem] font-medium uppercase tracking-wider text-[rgba(255,255,255,0.7)]">
                            Pending
                          </span>
                        </div>
                        <p className="mt-[0.25rem] flex items-center gap-[0.375rem] text-[0.75rem] text-[rgba(255,255,255,0.5)]">
                          <FileText className="h-[0.875rem] w-[0.875rem]" />
                          Reg No: {b.registrationNumber}
                        </p>
                      </div>

                      <div className="flex flex-col gap-[0.75rem] border-t border-[rgba(255,255,255,0.1)] pt-[1rem]">
                        <div className="flex items-start gap-[0.5rem] text-[0.875rem] text-[rgba(255,255,255,0.7)]">
                          <MapPin className="mt-[0.125rem] h-[1rem] w-[1rem] shrink-0 opacity-50" />
                          <span className="leading-snug">{b.address}</span>
                        </div>
                        <div className="flex items-center gap-[0.5rem] text-[0.875rem] text-[rgba(255,255,255,0.7)]">
                          <Phone className="h-[1rem] w-[1rem] shrink-0 opacity-50" />
                          <span>{b.contactNumber}</span>
                        </div>
                      </div>

                      {b.vendorId && (
                        <div className="flex flex-col gap-[0.5rem] rounded-[12px] bg-[rgba(0,0,0,0.2)] p-[1rem]">
                          <div className="text-[0.65rem] font-medium uppercase tracking-[0.05em] text-[rgba(255,255,255,0.4)]">Vendor Info</div>
                          <div className="flex items-center gap-[0.5rem] text-[0.875rem] text-[#fff]">
                            <User className="h-[1rem] w-[1rem] shrink-0 text-[rgba(255,255,255,0.5)]" />
                            <span>{b.vendorId.name}</span>
                          </div>
                          <div className="flex items-center gap-[0.5rem] text-[0.875rem] text-[rgba(255,255,255,0.7)]">
                            <Mail className="h-[1rem] w-[1rem] shrink-0 text-[rgba(255,255,255,0.5)]" />
                            <span className="truncate">{b.vendorId.email}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-[1.5rem] flex items-center justify-between gap-[1rem] pt-[1rem] border-t border-[rgba(255,255,255,0.1)]">
                      <button 
                        onClick={() => handleReview(b._id, 'Rejected')}
                        className="flex flex-1 items-center justify-center gap-[0.5rem] rounded-[12px] py-[0.625rem] text-[0.875rem] font-medium text-[rgba(255,255,255,0.7)] transition-colors hover:bg-[rgba(255,0,0,0.1)] hover:text-red-400"
                      >
                        <X className="h-[1rem] w-[1rem]" /> Reject
                      </button>
                      <button 
                        onClick={() => handleReview(b._id, 'Approved')}
                        className="flex flex-1 items-center justify-center gap-[0.5rem] rounded-[12px] bg-[#fff] py-[0.625rem] text-[0.875rem] font-medium text-[#111] transition-transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Check className="h-[1rem] w-[1rem]" /> Approve
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
