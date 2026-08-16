"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header, NavMenu } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Sections";
import { RequestModal } from "@/components/RequestModal";
import { AuthModal } from "@/components/AuthModal";
import { AdminDashboard } from "@/components/AdminDashboard";
import { useAppState, PillButton } from "@/components/Shared";
import { ShoppingBag, Star, ArrowRight, Tag, Truck, Shield, RefreshCw } from "lucide-react";

function FeaturedProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products?isFeatured=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data.slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="bg-[#fff]">
        <div className="shell px-[1.25rem] py-[5rem] sm:px-[2rem] lg:py-[7rem]">
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-[rgba(17,17,17,0.4)] text-[0.875rem]">Loading products...</div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="bg-[#fff]">
      <div className="shell px-[1.25rem] py-[5rem] sm:px-[2rem] lg:py-[7rem]">
        <div className="mb-[3rem] flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-[0.5rem] text-[0.875rem] font-medium text-[rgba(17,17,17,0.7)]">
            <div className="h-[0.375rem] w-[0.375rem] rounded-[9999px] bg-[rgba(17,17,17,0.5)]" />
            Featured Products
          </div>
          <h2 className="mt-[1rem] text-[2.25rem] font-semibold tracking-[-.02em] sm:text-[3rem]">
            Handpicked for you
          </h2>
          <p className="mt-[0.75rem] max-w-[40ch] text-[1rem] text-[rgba(17,17,17,0.5)]">
            Discover our curated selection of premium products at unbeatable prices.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-[1.5rem] sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p, i) => (
            <motion.a
              key={p._id}
              href={`/product/${p._id}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 24 }}
              whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }}
              className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-[var(--color-line)] bg-[#fff] transition-shadow hover:shadow-lg"
            >
              <div className="relative aspect-square overflow-hidden bg-[rgba(241,240,238,0.5)]">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ShoppingBag className="h-12 w-12 text-[rgba(17,17,17,0.15)]" />
                  </div>
                )}
                {p.stock <= 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.4)]">
                    <span className="rounded-full bg-[#fff] px-[1rem] py-[0.375rem] text-[0.75rem] font-semibold text-[#111]">Out of Stock</span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-[0.5rem] p-[1.25rem]">
                <span className="text-[0.7rem] font-medium uppercase tracking-wider text-[rgba(17,17,17,0.4)]">{p.category}</span>
                <h3 className="text-[1rem] font-medium leading-snug text-[#111] line-clamp-2">{p.name}</h3>
                <div className="mt-auto flex items-center justify-between pt-[0.5rem]">
                  <span className="text-[1.125rem] font-semibold text-[#111]">${Number(p.price).toFixed(2)}</span>
                  {p.stock > 0 && (
                    <span className="text-[0.7rem] font-medium text-green-600">In Stock</span>
                  )}
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        <div className="mt-[3rem] flex justify-center">
          <PillButton variant="dark" withArrow href="/shop">
            View All Products
          </PillButton>
        </div>
      </div>
    </section>
  );
}

function CategoryCards() {
  const categories = [
    { name: "Electronics", icon: "⚡", desc: "Latest gadgets & devices" },
    { name: "Fashion", icon: "👕", desc: "Trending styles & apparel" },
    { name: "Home & Living", icon: "🏠", desc: "Decor & essentials" },
    { name: "Sports", icon: "🏋️", desc: "Fitness & outdoor gear" },
  ];

  return (
    <section className="bg-[#fff]">
      <div className="shell px-[1.25rem] pb-[5rem] sm:px-[2rem] lg:pb-[7rem]">
        <div className="mb-[3rem] flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-[0.5rem] text-[0.875rem] font-medium text-[rgba(17,17,17,0.7)]">
            <div className="h-[0.375rem] w-[0.375rem] rounded-[9999px] bg-[rgba(17,17,17,0.5)]" />
            Browse Categories
          </div>
          <h2 className="mt-[1rem] text-[2.25rem] font-semibold tracking-[-.02em] sm:text-[3rem]">
            Shop by category
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-[1rem] sm:gap-[1.5rem] lg:grid-cols-4">
          {categories.map((cat, i) => (
            <motion.a
              key={cat.name}
              href={`/shop?category=${encodeURIComponent(cat.name)}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 24 }}
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
              className="group flex flex-col items-center gap-[1rem] rounded-[1.5rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.3)] p-[2rem] text-center transition-colors hover:bg-[rgba(241,240,238,0.6)]"
            >
              <span className="text-[2.5rem]">{cat.icon}</span>
              <h3 className="text-[1rem] font-semibold text-[#111]">{cat.name}</h3>
              <p className="text-[0.8rem] text-[rgba(17,17,17,0.5)]">{cat.desc}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustBadges() {
  const badges = [
    { icon: <Truck className="h-6 w-6" />, title: "Free Shipping", desc: "On orders over $50" },
    { icon: <Shield className="h-6 w-6" />, title: "Secure Payment", desc: "100% protected" },
    { icon: <RefreshCw className="h-6 w-6" />, title: "Easy Returns", desc: "30-day return policy" },
    { icon: <Star className="h-6 w-6" />, title: "Top Quality", desc: "Curated products" },
  ];

  return (
    <section className="bg-[#fff]">
      <div className="shell px-[1.25rem] pb-[5rem] sm:px-[2rem]">
        <div className="rounded-[2rem] bg-[var(--color-ink)] p-[3rem_1.5rem] sm:p-[4rem_2rem] md:px-[4rem]">
          <div className="grid grid-cols-2 gap-[2rem] lg:grid-cols-4">
            {badges.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 24 }}
                className="flex flex-col items-center gap-[0.75rem] text-center"
              >
                <div className="grid h-[3rem] w-[3rem] place-items-center rounded-full bg-[rgba(255,255,255,0.1)] text-[#fff]">
                  {b.icon}
                </div>
                <div className="text-[0.875rem] font-semibold text-[#fff]">{b.title}</div>
                <div className="text-[0.75rem] text-[rgba(255,255,255,0.5)]">{b.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { currentUser, isAuthInitialized } = useAppState();
  const isAdmin = isAuthInitialized && currentUser?.role === "Admin";

  return (
    <>
      <a 
        href="#main" 
        className="sr-only focus:not-sr-only focus:fixed focus:left-[1rem] focus:top-[1rem] focus:z-60 focus:rounded-[0.875rem] focus:bg-[var(--color-ink)] focus:p-[0.5rem_1rem] focus:text-[0.875rem] focus:text-[#fff]"
      >
        Skip to content
      </a>

      <Header />
      {isAdmin ? null : <NavMenu />}
      
      <main id="main" className="flex flex-col">
        {isAdmin ? (
          <AdminDashboard />
        ) : (
          <>
            <Hero />
            <FeaturedProducts />
            <CategoryCards />
            <TrustBadges />
          </>
        )}
      </main>
      
      {isAdmin ? null : <Footer />}
      <RequestModal />
      <AuthModal />
    </>
  );
}
