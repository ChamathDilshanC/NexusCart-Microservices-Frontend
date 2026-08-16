"use client";

import React, { useState, useEffect } from "react";
import { useAppState, PillButton } from "../../../components/Shared";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminBusinesses() {
  const { currentUser, isAuthInitialized } = useAppState();
  const router = useRouter();
  
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthInitialized) return;

    // Only Admin can access
    if (!currentUser || currentUser.role !== "Admin") {
      router.push("/");
      return;
    }

    fetchPendingBusinesses();
  }, [currentUser, isAuthInitialized, router]);

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
        // Remove from list
        setBusinesses(prev => prev.filter(b => b._id !== id));
      } else {
        alert("Failed to review business");
      }
    } catch (err) {
      console.error("Review error", err);
    }
  };

  if (!isAuthInitialized || loading) {
    return <div className="min-h-screen pt-[100px] flex justify-center"><p>Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] pt-[120px] pb-[60px]">
      <div className="shell max-w-[1000px] mx-auto px-[20px]">
        
        <div className="mb-[40px]">
          <h1 className="text-[36px] font-semibold text-[#111]">Admin Panel</h1>
          <p className="text-[16px] text-[rgba(17,17,17,0.6)]">Review pending vendor applications</p>
        </div>

        <div className="bg-[#fff] rounded-[16px] border border-[var(--color-line)] shadow-sm overflow-hidden">
          <div className="p-[24px] border-b border-[var(--color-line)]">
            <h2 className="text-[20px] font-semibold text-[#111]">Pending Businesses</h2>
          </div>
          
          {businesses.length === 0 ? (
            <div className="p-[48px] text-center">
              <p className="text-[rgba(17,17,17,0.5)]">No pending business applications.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[rgba(241,240,238,0.4)] text-[12px] uppercase tracking-wider text-[rgba(17,17,17,0.6)]">
                    <th className="p-[16px] font-medium">Business Details</th>
                    <th className="p-[16px] font-medium">Vendor</th>
                    <th className="p-[16px] font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line)]">
                  {businesses.map(b => (
                    <motion.tr 
                      key={b._id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-[rgba(241,240,238,0.2)] transition-colors"
                    >
                      <td className="p-[16px]">
                        <p className="font-semibold text-[#111]">{b.businessName}</p>
                        <p className="text-[14px] text-[rgba(17,17,17,0.7)] mt-[4px]">Reg No: {b.registrationNumber}</p>
                        <p className="text-[14px] text-[rgba(17,17,17,0.7)] mt-[2px]">{b.address}</p>
                        <p className="text-[14px] text-[rgba(17,17,17,0.7)] mt-[2px]">{b.contactNumber}</p>
                      </td>
                      <td className="p-[16px] align-top">
                        {b.vendorId ? (
                          <>
                            <p className="font-medium text-[#111]">{b.vendorId.name}</p>
                            <p className="text-[14px] text-[rgba(17,17,17,0.7)]">{b.vendorId.email}</p>
                          </>
                        ) : (
                          <span className="text-[rgba(17,17,17,0.5)]">Unknown</span>
                        )}
                      </td>
                      <td className="p-[16px] align-top text-right">
                        <div className="flex items-center justify-end gap-[12px]">
                          <button 
                            onClick={() => handleReview(b._id, 'Rejected')}
                            className="text-[14px] font-medium text-[#c5221f] hover:underline"
                          >
                            Reject
                          </button>
                          <PillButton 
                            className="!py-[6px] !px-[16px] !text-[14px] bg-[#137333] hover:bg-[#0d5023] text-white"
                            onClick={() => handleReview(b._id, 'Approved')}
                          >
                            Approve
                          </PillButton>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
