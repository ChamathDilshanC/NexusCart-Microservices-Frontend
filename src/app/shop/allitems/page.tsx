"use client";

import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ShopBrowser, ShopFallback } from "@/components/shop/ShopBrowser";

export default function ShopAllItemsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <AppHeader />
      <Suspense fallback={<ShopFallback />}>
        <ShopBrowser />
      </Suspense>
    </div>
  );
}
