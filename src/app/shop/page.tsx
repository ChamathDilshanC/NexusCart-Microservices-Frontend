"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Header, NavMenu } from "@/components/Header";
import { Footer } from "@/components/Sections";
import { AuthModal } from "@/components/AuthModal";
import { useAppState } from "@/components/Shared";
import {
  Search, ShoppingBag, X, ChevronRight, ChevronLeft,
  SlidersHorizontal, ShoppingCart, Check, Home, Heart,
  Eye, ArrowUpDown, Tag, Filter, Box, CircleCheck, ChevronLeftCircle, ChevronRightCircle
} from "lucide-react";

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

interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  order: number;
  isActive: boolean;
}

const ITEMS_PER_PAGE = 12;

/* Custom checkbox component */
function CheckToggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" onClick={onChange} className="flex w-full items-center gap-[0.625rem] group">
      <span className={`relative flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-[4px] border-[1.5px] transition-all duration-200 ${
        checked ? "border-[var(--color-accent)] bg-[var(--color-accent)]" : "border-[rgba(0,0,0,0.2)] bg-[#fff] group-hover:border-[rgba(0,0,0,0.35)]"
      }`}>
        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </span>
      <span className={`text-[0.8125rem] transition-colors ${checked ? "font-medium text-[#111111]" : "text-[rgba(17,17,17,0.5)] group-hover:text-[#111111]"}`}>
        {label}
      </span>
    </button>
  );
}

export default function ShopPage() {
  const { currentUser, isAuthInitialized } = useAppState();
  const isAdmin = isAuthInitialized && currentUser?.role === "Admin";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sort, setSort] = useState("newest");
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(10000);
  const [availability, setAvailability] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    if (cat) setSelectedCategories([cat]);
    const s = params.get("sort");
    if (s) setSort(s);
  }, []);

  useEffect(() => {
    fetch("/api/products/categories")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, []);

  // Fetch banners
  useEffect(() => {
    fetch("/api/products/banners")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data) && data.length > 0) setBanners(data); })
      .catch(() => {});
  }, []);

  // Auto-advance banner carousel
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCategories.length === 1) params.set("category", selectedCategories[0]);
    if (sort) params.set("sort", sort);
    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setProducts(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, selectedCategories, sort]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 10000 };
    const prices = products.map((p) => p.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (selectedCategories.length > 1) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }
    result = result.filter((p) => p.price >= priceMin && p.price <= priceMax);
    if (availability.length > 0) {
      result = result.filter((p) => {
        if (availability.includes("in_stock")) return p.stock > 0;
        if (availability.includes("out_of_stock")) return p.stock <= 0;
        return true;
      });
    }
    return result;
  }, [products, selectedCategories, priceMin, priceMax, availability]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [search, selectedCategories, sort, priceMin, priceMax, availability]);

  const clearFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setSort("newest");
    setPriceMin(priceBounds.min);
    setPriceMax(priceBounds.max);
    setAvailability([]);
    window.history.replaceState({}, "", "/shop");
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleAvailability = (val: string) => {
    setAvailability((prev) =>
      prev.includes(val) ? prev.filter((a) => a !== val) : [...prev, val]
    );
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

  const hasActiveFilters = search || selectedCategories.length > 0 || availability.length > 0 ||
    priceMin > priceBounds.min || priceMax < priceBounds.max;

  const activeFilterCount = selectedCategories.length + availability.length + (search ? 1 : 0) +
    ((priceMin > priceBounds.min || priceMax < priceBounds.max) ? 1 : 0);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <>
      <Header />
      <NavMenu />
      <AuthModal />

      <main className="min-h-screen" style={{ background: "var(--color-surface)" }}>
        {/* Banner Marquee */}
        {banners.length > 0 && (
          <div className="relative w-full overflow-hidden bg-[#111]">
            <div className="relative h-[200px] sm:h-[280px] lg:h-[360px]">
              {banners.map((banner, i) => (
                <div
                  key={banner._id}
                  className="absolute inset-0 transition-all duration-700 ease-in-out"
                  style={{ opacity: i === bannerIndex ? 1 : 0, transform: i === bannerIndex ? "scale(1)" : "scale(1.05)" }}
                >
                  {banner.linkUrl ? (
                    <a href={banner.linkUrl} className="block h-full w-full">
                      <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
                    </a>
                  ) : (
                    <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
                  )}
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.6)] via-transparent to-transparent" />
                  {/* Text overlay */}
                  <div className="absolute bottom-[1.5rem] left-[1.5rem] right-[1.5rem] sm:bottom-[2rem] sm:left-[3rem] sm:right-auto lg:bottom-[3rem] lg:left-[4rem]">
                    <h2 className="text-[1.25rem] font-bold text-[#fff] drop-shadow-lg sm:text-[1.75rem] lg:text-[2.25rem]">
                      {banner.title}
                    </h2>
                    {banner.subtitle && (
                      <p className="mt-[0.25rem] text-[0.8125rem] text-[rgba(255,255,255,0.85)] drop-shadow sm:text-[0.9375rem]">
                        {banner.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Navigation arrows */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={() => setBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                  className="absolute left-[0.75rem] top-1/2 -translate-y-1/2 grid h-[2.25rem] w-[2.25rem] place-items-center rounded-full bg-[rgba(255,255,255,0.15)] text-white backdrop-blur-sm transition-colors hover:bg-[rgba(255,255,255,0.3)]"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setBannerIndex((prev) => (prev + 1) % banners.length)}
                  className="absolute right-[0.75rem] top-1/2 -translate-y-1/2 grid h-[2.25rem] w-[2.25rem] rounded-full bg-[rgba(255,255,255,0.15)] text-white backdrop-blur-sm transition-colors hover:bg-[rgba(255,255,255,0.3)] place-items-center"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                {/* Dots indicator */}
                <div className="absolute bottom-[0.75rem] left-1/2 flex -translate-x-1/2 gap-[0.375rem]">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setBannerIndex(i)}
                      className={`h-[0.375rem] rounded-full transition-all duration-300 ${i === bannerIndex ? "w-[1.5rem] bg-[var(--color-accent)]" : "w-[0.375rem] bg-[rgba(255,255,255,0.4)]"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Breadcrumb */}
        <div className="border-b border-[rgba(0,0,0,0.06)] bg-[#fff]">
          <div className="shell flex items-center gap-[0.5rem] px-[1.25rem] py-[0.75rem] text-[0.8125rem] sm:px-[2rem]">
            <a href="/" className="text-[rgba(17,17,17,0.5)] hover:text-[#111111] transition-colors"><Home className="h-3.5 w-3.5" /></a>
            <ChevronRight className="h-3 w-3 text-[rgba(0,0,0,0.2)]" />
            <a href="/shop" className="text-[rgba(17,17,17,0.5)] hover:text-[#111111] transition-colors">Shop</a>
            {selectedCategories.length === 1 && (
              <>
                <ChevronRight className="h-3 w-3 text-[rgba(0,0,0,0.2)]" />
                <span className="font-medium text-[#111111]">{selectedCategories[0]}</span>
              </>
            )}
          </div>
        </div>

        {/* Page heading */}
        <div className="shell px-[1.25rem] pt-[1.75rem] pb-[1.25rem] sm:px-[2rem]">
          <h1 className="text-[1.625rem] font-bold tracking-[-0.02em] text-[#111111] sm:text-[1.875rem]">
            {selectedCategories.length === 1 ? selectedCategories[0] : "All Products"}
          </h1>
          <p className="mt-[0.25rem] text-[0.8125rem] text-[rgba(17,17,17,0.5)]">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Mobile filter toggle */}
        <div className="shell px-[1.25rem] pb-[0.75rem] sm:px-[2rem] lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="inline-flex items-center gap-[0.5rem] rounded-[10px] border border-[rgba(0,0,0,0.08)] bg-[#fff] px-[1.125rem] py-[0.625rem] text-[0.8125rem] font-semibold text-[#111111] shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] active:scale-[0.98]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full px-[0.25rem] text-[0.6rem] font-bold text-white" style={{ background: "var(--color-accent)" }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="shell flex gap-[1.25rem] px-[1.25rem] pb-[4rem] sm:px-[2rem] lg:gap-[1.5rem] lg:pb-[5rem]">
          {/* Sidebar */}
          <aside className={`${sidebarOpen ? "fixed inset-0 z-[100] overflow-y-auto bg-[#fff] p-[1.5rem]" : "hidden"} w-full lg:sticky lg:top-[5rem] lg:block lg:h-fit lg:max-h-[calc(100vh-6rem)] lg:w-[260px] lg:shrink-0 lg:overflow-y-auto`}>
            {/* Sidebar card wrapper */}
            <div className="rounded-[12px] bg-[#fff] p-[1.25rem] shadow-[0_1px_4px_rgba(0,0,0,0.04)] lg:p-[1.5rem]">
              {/* Mobile close */}
              {sidebarOpen && (
                <div className="mb-[1.25rem] flex items-center justify-between lg:hidden">
                  <span className="text-[1rem] font-bold text-[#111111]">Filters</span>
                  <button onClick={() => setSidebarOpen(false)} className="rounded-[6px] p-[0.25rem] hover:bg-[rgba(0,0,0,0.05)]">
                    <X className="h-5 w-5 text-[#111111]" />
                  </button>
                </div>
              )}

              {/* Sidebar header */}
              <div className="mb-[1.25rem] hidden items-center gap-[0.5rem] lg:flex">
                <Filter className="h-4 w-4 text-[rgba(17,17,17,0.5)]" />
                <span className="text-[0.8125rem] font-semibold text-[#111111]">Filters</span>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="ml-auto text-[0.7rem] font-medium text-[var(--color-accent)] hover:underline">
                    Clear all
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="mb-[1.25rem] border-b border-[rgba(0,0,0,0.06)] pb-[1.25rem]">
                <div className="relative">
                  <Search className="absolute left-[0.75rem] top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(17,17,17,0.5)]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full rounded-[8px] border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface)] py-[0.625rem] pl-[2.375rem] pr-[0.75rem] text-[0.8125rem] text-[#111111] outline-none transition-all focus:border-[var(--color-accent)] focus:bg-[#fff] focus:shadow-[0_0_0_3px_rgba(177,95,44,0.1)] placeholder:text-[rgba(100,100,100,0.5)]"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="mb-[1.25rem] border-b border-[rgba(0,0,0,0.06)] pb-[1.25rem]">
                <label className="mb-[0.5rem] flex items-center gap-[0.375rem] text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[rgba(17,17,17,0.5)]">
                  <ArrowUpDown className="h-3 w-3" /> Sort By
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-[8px] border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface)] px-[0.75rem] py-[0.625rem] text-[0.8125rem] font-medium text-[#111111] outline-none transition-all focus:border-[var(--color-accent)] focus:bg-[#fff]"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="name_asc">Name: A → Z</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-[1.25rem] border-b border-[rgba(0,0,0,0.06)] pb-[1.25rem]">
                <label className="mb-[0.5rem] flex items-center gap-[0.375rem] text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[rgba(17,17,17,0.5)]">
                  <Tag className="h-3 w-3" /> Price Range
                </label>
                <div className="flex items-center gap-[0.5rem]">
                  <div className="relative flex-1">
                    <span className="absolute left-[0.625rem] top-1/2 -translate-y-1/2 text-[0.7rem] text-[rgba(17,17,17,0.5)]">$</span>
                    <input
                      type="number"
                      value={priceMin}
                      onChange={(e) => setPriceMin(Number(e.target.value))}
                      className="w-full rounded-[8px] border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface)] py-[0.5rem] pl-[1.375rem] pr-[0.5rem] text-[0.8125rem] text-[#111111] outline-none focus:border-[var(--color-accent)] focus:bg-[#fff]"
                      placeholder="Min"
                      min={0}
                    />
                  </div>
                  <div className="h-[1px] w-[0.75rem] bg-[rgba(0,0,0,0.15)]" />
                  <div className="relative flex-1">
                    <span className="absolute left-[0.625rem] top-1/2 -translate-y-1/2 text-[0.7rem] text-[rgba(17,17,17,0.5)]">$</span>
                    <input
                      type="number"
                      value={priceMax}
                      onChange={(e) => setPriceMax(Number(e.target.value))}
                      className="w-full rounded-[8px] border border-[rgba(0,0,0,0.08)] bg-[var(--color-surface)] py-[0.5rem] pl-[1.375rem] pr-[0.5rem] text-[0.8125rem] text-[#111111] outline-none focus:border-[var(--color-accent)] focus:bg-[#fff]"
                      placeholder="Max"
                      min={0}
                    />
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="mb-[1.25rem] border-b border-[rgba(0,0,0,0.06)] pb-[1.25rem]">
                <label className="mb-[0.625rem] flex items-center gap-[0.375rem] text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[rgba(17,17,17,0.5)]">
                  <CircleCheck className="h-3 w-3" /> Availability
                </label>
                <div className="flex flex-col gap-[0.5rem]">
                  <CheckToggle checked={availability.includes("in_stock")} onChange={() => toggleAvailability("in_stock")} label="In Stock" />
                  <CheckToggle checked={availability.includes("out_of_stock")} onChange={() => toggleAvailability("out_of_stock")} label="Out of Stock" />
                </div>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div className="mb-[0.5rem]">
                  <label className="mb-[0.625rem] flex items-center gap-[0.375rem] text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[rgba(17,17,17,0.5)]">
                    <Box className="h-3 w-3" /> Categories
                  </label>
                  <div className="flex flex-col gap-[0.5rem]">
                    {categories.map((cat) => (
                      <CheckToggle key={cat} checked={selectedCategories.includes(cat)} onChange={() => toggleCategory(cat)} label={cat} />
                    ))}
                  </div>
                </div>
              )}

              {/* Clear filters button (sidebar) */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-[1rem] flex w-full items-center justify-center gap-[0.375rem] rounded-[8px] border border-[rgba(0,0,0,0.08)] px-[0.75rem] py-[0.625rem] text-[0.8125rem] font-medium text-[rgba(17,17,17,0.5)] transition-all hover:border-[rgba(0,0,0,0.15)] hover:bg-[var(--color-surface)] hover:text-[#111111]"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear All Filters
                </button>
              )}

              {/* Mobile apply button */}
              {sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="mt-[1rem] w-full rounded-[10px] py-[0.75rem] text-[0.875rem] font-bold text-[var(--color-ink)] shadow-[0_2px_8px_rgba(177,95,44,0.3)] transition-all hover:shadow-[0_4px_16px_rgba(177,95,44,0.4)] lg:hidden"
                  style={{ background: "var(--color-accent)" }}
                >
                  Show {filteredProducts.length} Results
                </button>
              )}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex h-[400px] items-center justify-center rounded-[12px] bg-[#fff] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="flex flex-col items-center gap-[0.75rem]">
                  <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[rgba(0,0,0,0.06)] border-t-[var(--color-accent)]" />
                  <span className="text-[0.8125rem] font-medium text-[rgba(17,17,17,0.5)]">Loading products...</span>
                </div>
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="flex h-[400px] flex-col items-center justify-center gap-[1rem] rounded-[12px] bg-[#fff] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-[var(--color-surface)]">
                  <ShoppingBag className="h-8 w-8 text-[rgba(0,0,0,0.2)]" />
                </div>
                <div className="text-center">
                  <p className="text-[1rem] font-semibold text-[#111111]">No products found</p>
                  <p className="mt-[0.25rem] text-[0.8125rem] text-[rgba(17,17,17,0.5)]">Try adjusting your filters</p>
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="mt-[0.5rem] rounded-[8px] px-[1rem] py-[0.5rem] text-[0.8125rem] font-semibold text-white transition-all hover:brightness-110" style={{ background: "var(--color-accent)" }}>
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Product grid */}
                <div className="grid grid-cols-1 gap-[0.75rem] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {paginatedProducts.map((p) => (
                    <div
                      key={p._id}
                      className="group relative flex flex-col overflow-hidden rounded-[12px] bg-[#fff] shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)]"
                    >
                      <a href={`/product/${p._id}`} className="relative block aspect-square overflow-hidden bg-[var(--color-surface)]">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingBag className="h-12 w-12 text-[rgba(0,0,0,0.08)]" />
                          </div>
                        )}
                        {/* Quick view overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.15)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <span className="inline-flex items-center gap-[0.375rem] rounded-[8px] bg-white/90 px-[0.875rem] py-[0.5rem] text-[0.75rem] font-semibold text-[#111111] shadow-lg backdrop-blur-sm">
                            <Eye className="h-3.5 w-3.5" /> Quick View
                          </span>
                        </div>
                        {/* Stock badge */}
                        {p.stock > 0 ? (
                          <span className="absolute left-[0.625rem] top-[0.625rem] inline-flex items-center gap-[0.25rem] rounded-[6px] bg-[#22c55e]/90 px-[0.5rem] py-[0.25rem] text-[0.6rem] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm">
                            <Check className="h-2.5 w-2.5" strokeWidth={3} /> In Stock
                          </span>
                        ) : (
                          <span className="absolute left-[0.625rem] top-[0.625rem] rounded-[6px] bg-[#ef4444]/90 px-[0.5rem] py-[0.25rem] text-[0.6rem] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm">
                            Sold Out
                          </span>
                        )}
                        {p.isFeatured && (
                          <span className="absolute right-[0.625rem] top-[0.625rem] rounded-[6px] bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-[0.5rem] py-[0.25rem] text-[0.6rem] font-bold uppercase tracking-wider text-white shadow-sm">
                            Featured
                          </span>
                        )}
                      </a>
                      <div className="flex flex-1 flex-col p-[1rem]">
                        <span className="mb-[0.25rem] text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-accent)]">{p.category}</span>
                        <a href={`/product/${p._id}`} className="text-[0.875rem] font-semibold leading-snug text-[#111111] line-clamp-2 transition-colors hover:text-[var(--color-accent)]">
                          {p.name}
                        </a>
                        <div className="mt-auto flex items-center justify-between pt-[0.875rem]">
                          <span className="text-[1.25rem] font-bold tracking-[-0.02em] text-[#111111]">
                            ${Number(p.price).toFixed(2)}
                          </span>
                          {p.stock > 0 && (
                            <button
                              onClick={(e) => { e.preventDefault(); addToCart(p); }}
                              className="flex items-center gap-[0.375rem] rounded-[8px] px-[0.75rem] py-[0.4375rem] text-[0.7rem] font-bold text-[var(--color-ink)] shadow-[0_2px_6px_rgba(177,95,44,0.25)] transition-all hover:shadow-[0_4px_12px_rgba(177,95,44,0.4)] hover:brightness-110 active:scale-95"
                              style={{ background: "var(--color-accent)" }}
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-[2.5rem] flex items-center justify-center gap-[0.375rem]">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-[8px] bg-[#fff] text-[rgba(17,17,17,0.5)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {getPageNumbers().map((page, i) =>
                      typeof page === "string" ? (
                        <span key={`dots-${i}`} className="flex h-[2.25rem] w-[2.25rem] items-center justify-center text-[0.875rem] text-[rgba(17,17,17,0.5)]">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-[8px] text-[0.875rem] font-semibold transition-all ${
                            currentPage === page
                              ? "text-white shadow-[0_2px_8px_rgba(177,95,44,0.35)]"
                              : "bg-[#fff] text-[#111111] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                          }`}
                          style={currentPage === page ? { background: "var(--color-accent)" } : {}}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-[8px] bg-[#fff] text-[rgba(17,17,17,0.5)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
