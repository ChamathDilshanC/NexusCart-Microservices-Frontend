"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Store, ArrowLeft, Loader2 } from "lucide-react";

interface Business {
  _id: string;
  businessName: string;
  slug: string;
  logoUrl: string;
  description: string;
  categories: string[];
  themeColor: string;
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Business[]>([]);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<any>(null);

  // Fetch all approved businesses on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch("/api/business/all");
        if (res.ok) {
          setAllBusinesses(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchAll();
    inputRef.current?.focus();
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length === 0) {
      setResults([]);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/business/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          setResults(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const displayBusinesses = query.trim().length > 0 ? results : allBusinesses;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="p-2 rounded-full hover:bg-white/10 transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search for a store..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 py-3 text-sm text-white outline-none focus:border-white/30 placeholder:text-white/30 transition-colors"
              />
              {loading && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 animate-spin" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8">
        {initialLoading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/40 text-sm">Loading stores...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-lg font-semibold">
                {query.trim() ? `Results for "${query}"` : "All Stores"}
              </h1>
              <span className="text-sm text-white/40">{displayBusinesses.length} store{displayBusinesses.length !== 1 ? "s" : ""}</span>
            </div>

            {displayBusinesses.length === 0 ? (
              <div className="text-center py-20">
                <Store className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40 text-sm">
                  {query.trim() ? "No stores found matching your search." : "No stores available yet."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {displayBusinesses.map((biz, idx) => (
                  <motion.button
                    key={biz._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    onClick={() => router.push(`/store/${biz.slug}`)}
                    className="group w-full text-left flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.04] transition-all"
                  >
                    {biz.logoUrl ? (
                      <img src={biz.logoUrl} alt={biz.businessName} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shrink-0"
                        style={{ background: biz.themeColor || "#333" }}
                      >
                        {biz.businessName[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">{biz.businessName}</h3>
                      <p className="text-sm text-white/40 mt-0.5 line-clamp-1">{biz.description || "Visit our store for amazing products"}</p>
                      {biz.categories && biz.categories.length > 0 && (
                        <div className="flex gap-1.5 mt-2 overflow-hidden">
                          {biz.categories.slice(0, 4).map(cat => (
                            <span key={cat} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/50">
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white/60 transition-colors shrink-0" />
                  </motion.button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
