"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Header, NavMenu } from "@/components/Header";
import { Footer } from "@/components/Sections";
import { AuthModal } from "@/components/AuthModal";
import { useAppState } from "@/components/Shared";
import {
  Search, ShoppingBag, X, ChevronRight, ChevronLeft,
  SlidersHorizontal, ShoppingCart, Check, Home
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

const ITEMS_PER_PAGE = 12;

export default function ShopPage() {
  const { currentUser, isAuthInitialized } = useAppState();
  const isAdmin = isAuthInitialized && currentUser?.role === "Admin";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sort, setSort] = useState("newest");
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(10000);
  const [availability, setAvailability] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Read query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    if (cat) setSelectedCategories([cat]);
    const s = params.get("sort");
    if (s) setSort(s);
  }, []);

  // Fetch categories
  useEffect(() => {
    fetch("/api/products/categories")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, []);

  // Fetch products
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

  // Compute price bounds from products
  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 10000 };
    const prices = products.map((p) => p.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [products]);

  // Client-side filtering (price range, availability, multi-category)
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

  // Pagination
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

      <main className="min-h-screen" style={{ background: "var(--shop-bg)", fontFamily: "'Red Hat Display', sans-serif" }}>
        {/* Breadcrumb */}
        <div className="border-b border-[rgba(0,0,0,0.08)]" style={{ background: "#fff" }}>
          <div className="shell flex items-center gap-[0.5rem] px-[1.25rem] py-[0.875rem] text-[0.8125rem] sm:px-[2rem]">
            <a href="/" className="text-[var(--shop-text-muted)] hover:text-[var(--shop-text)] transition-colors"><Home className="h-3.5 w-3.5" /></a>
            <ChevronRight className="h-3 w-3 text-[var(--shop-text-muted)]" />
            <a href="/shop" className="text-[var(--shop-text-muted)] hover:text-[var(--shop-text)] transition-colors">Shop</a>
            {selectedCategories.length === 1 && (
              <>
                <ChevronRight className="h-3 w-3 text-[var(--shop-text-muted)]" />
                <span className="font-medium text-[var(--shop-text)]">{selectedCategories[0]}</span>
              </>
            )}
          </div>
        </div>

        {/* Page heading */}
        <div className="shell px-[1.25rem] pt-[2rem] pb-[1rem] sm:px-[2rem]">
          <h1 className="text-[1.75rem] font-bold text-[var(--shop-text)] sm:text-[2rem]">
            {selectedCategories.length === 1 ? selectedCategories[0] : "All Products"}
          </h1>
          <p className="mt-[0.25rem] text-[0.875rem] text-[var(--shop-text-muted)]">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} available
          </p>
        </div>

        {/* Mobile filter toggle */}
        <div className="shell px-[1.25rem] pb-[0.75rem] sm:px-[2rem] lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-[0.5rem] rounded-[8px] border border-[rgba(0,0,0,0.12)] bg-[#fff] px-[1rem] py-[0.625rem] text-[0.8125rem] font-medium text-[var(--shop-text)] transition-colors hover:bg-[rgba(0,0,0,0.03)]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-[0.25rem] flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] font-bold text-white" style={{ background: "var(--shop-accent)" }}>
                {(selectedCategories.length || 0) + availability.length + (search ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        <div className="shell flex gap-[1.5rem] px-[1.25rem] pb-[4rem] sm:px-[2rem] lg:pb-[5rem]">
          {/* Sidebar filters */}
          <aside className={`${sidebarOpen ? "fixed inset-0 z-[100] overflow-y-auto bg-[#fff] p-[1.5rem]" : "hidden"} w-full lg:sticky lg:top-[5rem] lg:block lg:h-fit lg:max-h-[calc(100vh-6rem)] lg:w-[260px] lg:shrink-0 lg:overflow-y-auto`}>
            {/* Mobile close */}
            {sidebarOpen && (
              <div className="mb-[1rem] flex items-center justify-between lg:hidden">
                <span className="text-[1rem] font-semibold text-[var(--shop-text)]">Filters</span>
                <button onClick={() => setSidebarOpen(false)} className="rounded-[6px] p-[0.25rem] hover:bg-[rgba(0,0,0,0.05)]">
                  <X className="h-5 w-5 text-[var(--shop-text)]" />
                </button>
              </div>
            )}

            {/* Search */}
            <div className="mb-[1.5rem]">
              <label className="mb-[0.625rem] block text-[0.75rem] font-semibold uppercase tracking-wider text-[var(--shop-text-muted)]">Search</label>
              <div className="relative">
                <Search className="absolute left-[0.75rem] top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--shop-text-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full rounded-[8px] border border-[rgba(0,0,0,0.12)] bg-[#fff] py-[0.625rem] pl-[2.25rem] pr-[0.75rem] text-[0.8125rem] text-[var(--shop-text)] outline-none transition-colors focus:border-[var(--shop-accent)] placeholder:text-[rgba(100,100,100,0.5)]"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="mb-[1.5rem]">
              <label className="mb-[0.625rem] block text-[0.75rem] font-semibold uppercase tracking-wider text-[var(--shop-text-muted)]">Sort By</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-[8px] border border-[rgba(0,0,0,0.12)] bg-[#fff] px-[0.75rem] py-[0.625rem] text-[0.8125rem] text-[var(--shop-text)] outline-none transition-colors focus:border-[var(--shop-accent)]"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A-Z</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="mb-[1.5rem]">
              <label className="mb-[0.625rem] block text-[0.75rem] font-semibold uppercase tracking-wider text-[var(--shop-text-muted)]">
                Price Range
              </label>
              <div className="flex items-center gap-[0.5rem]">
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(Number(e.target.value))}
                  className="w-full rounded-[8px] border border-[rgba(0,0,0,0.12)] bg-[#fff] px-[0.625rem] py-[0.5rem] text-[0.8125rem] text-[var(--shop-text)] outline-none focus:border-[var(--shop-accent)]"
                  placeholder="Min"
                  min={0}
                />
                <span className="text-[0.75rem] text-[var(--shop-text-muted)]">—</span>
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="w-full rounded-[8px] border border-[rgba(0,0,0,0.12)] bg-[#fff] px-[0.625rem] py-[0.5rem] text-[0.8125rem] text-[var(--shop-text)] outline-none focus:border-[var(--shop-accent)]"
                  placeholder="Max"
                  min={0}
                />
              </div>
            </div>

            {/* Availability */}
            <div className="mb-[1.5rem]">
              <label className="mb-[0.625rem] block text-[0.75rem] font-semibold uppercase tracking-wider text-[var(--shop-text-muted)]">Availability</label>
              <div className="flex flex-col gap-[0.5rem]">
                {[
                  { value: "in_stock", label: "In Stock" },
                  { value: "out_of_stock", label: "Out of Stock" },
                ].map((opt) => (
                  <label key={opt.value} className="flex cursor-pointer items-center gap-[0.5rem] text-[0.8125rem] text-[var(--shop-text)]">
                    <input
                      type="checkbox"
                      checked={availability.includes(opt.value)}
                      onChange={() => toggleAvailability(opt.value)}
                      className="h-[1rem] w-[1rem] cursor-pointer accent-[var(--shop-accent)]"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="mb-[1.5rem]">
                <label className="mb-[0.625rem] block text-[0.75rem] font-semibold uppercase tracking-wider text-[var(--shop-text-muted)]">Categories</label>
                <div className="flex flex-col gap-[0.5rem]">
                  {categories.map((cat) => (
                    <label key={cat} className="flex cursor-pointer items-center gap-[0.5rem] text-[0.8125rem] text-[var(--shop-text)]">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="h-[1rem] w-[1rem] cursor-pointer accent-[var(--shop-accent)]"
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex w-full items-center justify-center gap-[0.375rem] rounded-[8px] border border-[rgba(0,0,0,0.12)] px-[0.75rem] py-[0.625rem] text-[0.8125rem] font-medium text-[var(--shop-text-muted)] transition-colors hover:bg-[rgba(0,0,0,0.03)] hover:text-[var(--shop-text)]"
              >
                <X className="h-3.5 w-3.5" />
                Clear All Filters
              </button>
            )}

            {/* Mobile apply button */}
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="mt-[1rem] w-full rounded-[8px] py-[0.75rem] text-[0.875rem] font-semibold text-[var(--shop-header-bg)] lg:hidden"
                style={{ background: "var(--shop-accent)" }}
              >
                Show {filteredProducts.length} Results
              </button>
            )}
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-[0.75rem]">
                  <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[rgba(0,0,0,0.1)] border-t-[var(--shop-accent)]" />
                  <span className="text-[0.875rem] text-[var(--shop-text-muted)]">Loading products...</span>
                </div>
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="flex h-[400px] flex-col items-center justify-center gap-[1rem]">
                <ShoppingBag className="h-16 w-16 text-[rgba(0,0,0,0.1)]" />
                <div className="text-center">
                  <p className="text-[1rem] font-medium text-[var(--shop-text)]">No products found</p>
                  <p className="mt-[0.25rem] text-[0.875rem] text-[var(--shop-text-muted)]">Try adjusting your filters</p>
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="mt-[0.5rem] text-[0.875rem] font-medium underline underline-offset-2" style={{ color: "var(--shop-accent)" }}>
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Product grid */}
                <div className="grid grid-cols-1 gap-[0.5rem] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {paginatedProducts.map((p) => (
                    <div
                      key={p._id}
                      className="group flex flex-col overflow-hidden bg-[#fff] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
                      style={{ borderRadius: "var(--shop-card-radius)" }}
                    >
                      <a href={`/product/${p._id}`} className="relative block aspect-square overflow-hidden bg-[rgba(237,239,243,0.6)]">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingBag className="h-12 w-12 text-[rgba(0,0,0,0.1)]" />
                          </div>
                        )}
                        {/* Stock badge */}
                        {p.stock > 0 ? (
                          <span className="absolute left-[0.5rem] top-[0.5rem] inline-flex items-center gap-[0.25rem] rounded-[4px] bg-[#22c55e] px-[0.5rem] py-[0.25rem] text-[0.65rem] font-semibold uppercase tracking-wide text-white">
                            <Check className="h-3 w-3" /> In Stock
                          </span>
                        ) : (
                          <span className="absolute left-[0.5rem] top-[0.5rem] rounded-[4px] bg-[#ef4444] px-[0.5rem] py-[0.25rem] text-[0.65rem] font-semibold uppercase tracking-wide text-white">
                            Out of Stock
                          </span>
                        )}
                        {p.isFeatured && (
                          <span className="absolute right-[0.5rem] top-[0.5rem] rounded-[4px] px-[0.5rem] py-[0.25rem] text-[0.65rem] font-semibold uppercase tracking-wide text-white" style={{ background: "var(--shop-accent)" }}>
                            Featured
                          </span>
                        )}
                      </a>
                      <div className="flex flex-1 flex-col p-[0.875rem]">
                        <span className="mb-[0.25rem] text-[0.65rem] font-medium uppercase tracking-wider text-[var(--shop-text-muted)]">{p.category}</span>
                        <a href={`/product/${p._id}`} className="text-[0.875rem] font-medium leading-snug text-[var(--shop-text)] line-clamp-2 hover:underline">
                          {p.name}
                        </a>
                        <div className="mt-auto flex items-center justify-between pt-[0.75rem]">
                          <span className="text-[1.125rem] font-bold text-[var(--shop-text)]">
                            ${Number(p.price).toFixed(2)}
                          </span>
                          {p.stock > 0 && (
                            <button
                              onClick={(e) => { e.preventDefault(); addToCart(p); }}
                              className="flex items-center gap-[0.375rem] rounded-[6px] px-[0.625rem] py-[0.375rem] text-[0.7rem] font-semibold text-[var(--shop-header-bg)] transition-all hover:brightness-110 active:scale-95"
                              style={{ background: "var(--shop-accent)" }}
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
                      className="flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-[#fff] text-[var(--shop-text-muted)] transition-colors hover:bg-[rgba(0,0,0,0.03)] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {getPageNumbers().map((page, i) =>
                      typeof page === "string" ? (
                        <span key={`dots-${i}`} className="flex h-[2.25rem] w-[2.25rem] items-center justify-center text-[0.875rem] text-[var(--shop-text-muted)]">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-[8px] text-[0.875rem] font-medium transition-colors ${
                            currentPage === page
                              ? "text-white"
                              : "border border-[rgba(0,0,0,0.1)] bg-[#fff] text-[var(--shop-text)] hover:bg-[rgba(0,0,0,0.03)]"
                          }`}
                          style={currentPage === page ? { background: "var(--shop-accent)" } : {}}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-[#fff] text-[var(--shop-text-muted)] transition-colors hover:bg-[rgba(0,0,0,0.03)] disabled:opacity-40 disabled:cursor-not-allowed"
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
