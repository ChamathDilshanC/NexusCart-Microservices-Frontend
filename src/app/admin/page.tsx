"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header, NavMenu } from "@/components/Header";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AuthModal } from "@/components/AuthModal";
import { useAppState } from "@/components/Shared";

export default function AdminPage() {
  const router = useRouter();
  const { currentUser, isAuthInitialized } = useAppState();

  useEffect(() => {
    if (isAuthInitialized) {
      if (!currentUser) {
        router.push("/");
      } else if (currentUser.role !== "Admin") {
        router.push("/");
      }
    }
  }, [isAuthInitialized, currentUser, router]);

  if (!isAuthInitialized || !currentUser || currentUser.role !== "Admin") {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center bg-[#fff]">
          <div className="text-[rgba(17,17,17,0.4)] text-[0.875rem]">Loading...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <AuthModal />
      <main className="flex flex-col">
        <AdminDashboard />
      </main>
    </>
  );
}
