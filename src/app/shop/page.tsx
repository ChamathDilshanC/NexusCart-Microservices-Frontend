"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Header, NavMenu } from "@/components/Header";
import { Footer } from "@/components/Sections";
import { AuthModal } from "@/components/AuthModal";
import { PillButton } from "@/components/Shared";
import { Search, ShoppingBag, SlidersHorizontal, X } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  images: string[];
  isFeatured: boolean;
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("");

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (sort) params.set("sort", sort);
    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setProducts(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, category, sort]);

  useEffect(() => {
    fetch("/api/products/categories")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // Read category from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    if (cat) setCategory(cat);
  }, []);

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setSort("");
    window.history.replaceState({}, "", "/shop");
  };

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem("nexus_cart") || "[]");
    const existing = cart.find((item: any) => item.productId === product._id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ productId: product._id, name: product.name, price: product.price, imageUrl: product.imageUrl, quantity: 1 });
    }
    localStorage.setItem("nexus_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
  };

  return (
    <>
      <Header />
      <NavMenu />
      <AuthModal />

      <main className="min-h-screen bg-[#fff]">
        {/* Hero */}
        <div className="shell px-[1.25rem] pt-[8rem] pb-[3rem] sm:px-[2rem]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-[2.5rem] font-semibold tracking-[-.02em] sm:text-[3.5rem]">
              Shop
            </h1>
            <p className="mt-[0.75rem] max-w-[50ch] text-[1rem] text-[rgba(17,17,17,0.5)]">
              Browse our complete collection of products. Find exactly what you&apos;re looking for.
            </p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="shell px-[1.25rem] pb-[2rem] sm:px-[2rem]">
          <div className="flex flex-col gap-[1rem] sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-[1rem] top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(17,17,17,0.3)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-[1rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.3)] py-[0.75rem] pl-[2.75rem] pr-[1rem] text-[0.875rem] outline-none transition-colors focus:border-[rgba(17,17,17,0.3)] focus:bg-[#fff]"
              />
            </div>

            {/* Category filter */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-[1rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.3)] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none cursor-pointer appearance-none min-w-[10rem] transition-colors focus:border-[rgba(17,17,17,0.3)]"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-[1rem] border border-[var(--color-line)] bg-[rgba(241,240,238,0.3)] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none cursor-pointer appearance-none min-w-[10rem] transition-colors focus:border-[rgba(17,17,17,0.3)]"
            >
              <option value="">Sort By</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A-Z</option>
              <option value="newest">Newest First</option>
            </select>

            {(search || category || sort) && (
              <button onClick={clearFilters} className="flex items-center gap-[0.375rem] rounded-[1rem] border border-[var(--color-line)] px-[0.75rem] py-[0.75rem] text-[0.8rem] text-[rgba(17,17,17,0.5)] hover:text-[#111]">
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="shell px-[1.25rem] pb-[5rem] sm:px-[2rem] lg:pb-[7rem]">
          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <div className="text-[rgba(17,17,17,0.4)] text-[0.875rem]">Loading products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex h-[400px] flex-col items-center justify-center gap-[1rem]">
              <ShoppingBag className="h-12 w-12 text-[rgba(17,17,17,0.15)]" />
              <div className="text-[rgba(17,17,17,0.4)] text-[0.875rem]">No products found. Try different filters.</div>
              <button onClick={clearFilters} className="text-[0.875rem] font-medium text-[#111] underline underline-offset-2">Clear filters</button>
            </div>
          ) : (
            <>
              <div className="mb-[1.5rem] text-[0.8rem] text-[rgba(17,17,17,0.4)]">
                {products.length} product{products.length !== 1 ? "s" : ""}
              </div>
              <div className="grid grid-cols-1 gap-[1.5rem] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((p, i) => (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04, type: "spring", stiffness: 200, damping: 24 }}
                    className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-[var(--color-line)] bg-[#fff] transition-shadow hover:shadow-lg"
                  >
                    <a href={`/product/${p._id}`} className="relative aspect-square overflow-hidden bg-[rgba(241,240,238,0.5)]">
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
                    </a>
                    <div className="flex flex-1 flex-col gap-[0.5rem] p-[1.25rem]">
                      <span className="text-[0.7rem] font-medium uppercase tracking-wider text-[rgba(17,17,17,0.4)]">{p.category}</span>
                      <a href={`/product/${p._id}`} className="text-[1rem] font-medium leading-snug text-[#111] line-clamp-2 hover:underline">{p.name}</a>
                      <div className="mt-auto flex items-center justify-between pt-[0.5rem]">
                        <span className="text-[1.125rem] font-semibold text-[#111]">${Number(p.price).toFixed(2)}</span>
                        {p.stock > 0 && (
                          <button
                            onClick={(e) => { e.preventDefault(); addToCart(p); }}
                            className="rounded-[0.75rem] bg-[var(--color-ink)] px-[0.75rem] py-[0.375rem] text-[0.75rem] font-medium text-[#fff] transition-transform hover:scale-[1.05] active:scale-[0.95]"
                          >
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
