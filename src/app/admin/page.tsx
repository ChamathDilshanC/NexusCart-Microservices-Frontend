"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { useAppState } from "@/components/providers/AppStateProvider";
import { AdminDashboard } from "@/components/AdminDashboard";

export default function AdminPage() {
  const router = useRouter();
  const { currentUser, isAuthInitialized } = useAppState();

  useEffect(() => {
    if (!isAuthInitialized) return;
    if (!currentUser || currentUser.role !== "Admin") {
      router.replace("/");
    }
  }, [isAuthInitialized, currentUser, router]);

  const authorized = isAuthInitialized && !!currentUser && currentUser.role === "Admin";

  if (!authorized) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AppHeader />
        <div className="flex items-center justify-center py-32">
          <span className="text-sm text-gray-500">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AppHeader />
      <AdminDashboard />
    </div>
  );
}
