"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { apiFetch, ApiError } from "@/lib/api";

/* ------------------------------- Types ------------------------------- */

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  images?: string[];
  isFeatured?: boolean;
  effectivePrice?: number;
  discountPercent?: number;
}

interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  productId?: string;
  order: number;
  isActive: boolean;
  templateIds?: string[];
}

function bannerHref(banner: Banner): string | undefined {
  return banner.productId ? `/product/${banner.productId}` : banner.linkUrl || undefined;
}

type BannerLayout = "carousel" | "grid" | "spotlight" | "sidebar";
type BannerPosition = "top" | "above-grid" | "bottom" | "sidebar";

interface BannerTemplateOptions {
  carousel: {
    autoAdvance: boolean;
    intervalMs: number;
    showArrows: boolean;
    showDots: boolean;
    height: "compact" | "standard" | "tall";
  };
  grid: {
    columns: number;
    aspectRatio: "landscape" | "square";
    showSubtitle: boolean;
  };
  spotlight: {
    maxListItems: number;
    showListSubtitle: boolean;
  };
  sidebar: {
    autoAdvance: boolean;
    intervalMs: number;
  };
}

interface BannerTemplate {
  _id: string;
  name: string;
  layout: BannerLayout;
  position: BannerPosition;
  isActive: boolean;
  order: number;
  options: BannerTemplateOptions;
}

type SortOption = "price_asc" | "price_desc" | "name_asc" | "newest";
type Availability = "in_stock" | "out_of_stock";

const PAGE_SIZE = 12;
const SECTION_SIZE = 8;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A to Z" },
];

const AVAILABILITY_OPTIONS: { value: Availability; label: string }[] = [
  { value: "in_stock", label: "In Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
];

const VALID_SORTS: SortOption[] = ["price_asc", "price_desc", "name_asc", "newest"];

/* ----------------------------- Loading shell ----------------------------- */

export function ShopFallback() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="h-9 w-56 bg-white/5 rounded-lg animate-pulse mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- Content ------------------------------- */

/**
 * The shared shop browsing experience: filters sidebar, banners, product grid.
 * `/shop` renders this with `alwaysFlat` (a flat, paginated "All Products"
 * grid, matching how it always worked); `/shop/allitems` renders it without,
 * so the no-filter state instead shows one section per category with a
 * "View all" link that switches to the same flat, paginated grid.
 */
export function ShopBrowser({ alwaysFlat = false }: { alwaysFlat?: boolean }) {
  const searchParams = useSearchParams();
  const toast = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerTemplates, setBannerTemplates] = useState<BannerTemplate[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [serverTotal, setServerTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const c = searchParams.get("category");
    return c ? [c] : [];
  });
  const [sort, setSort] = useState<SortOption>(() => {
    const s = searchParams.get("sort");
    return s && (VALID_SORTS as string[]).includes(s) ? (s as SortOption) : "newest";
  });
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [availability, setAvailability] = useState<Availability[]>([]);

  // With no search/category filter active, /shop/allitems shows every category
  // as its own section instead of one flat paginated grid; /shop always stays flat.
  const isFlatMode = alwaysFlat || search.trim() !== "" || selectedCategories.length > 0;

  // Fetch categories + banners + banner templates once.
  useEffect(() => {
    (async () => {
      try {
        const [cats, bnrs, tpls] = await Promise.all([
          apiFetch<string[]>("/products/categories", { auth: false }),
          apiFetch<Banner[]>("/products/banners", { auth: false }),
          apiFetch<BannerTemplate[]>("/products/banner-templates", { auth: false }).catch(() => []),
        ]);
        setCategories(cats);
        setBanners(bnrs);
        setBannerTemplates(tpls);
      } catch {
        // Non-fatal: filters/banner section simply stay empty.
      }
    })();
  }, []);

  // Debounced product fetch on search/category/sort/page change. When no
  // search/category filter is active (and alwaysFlat is off) we fetch the
  // whole (sorted) catalog once and group it by category client-side;
  // otherwise we fetch one paginated, server-filtered page at a time.
  useEffect(() => {
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (selectedCategories.length > 0) params.set("category", selectedCategories.join(","));
        params.set("sort", sort);

        if (isFlatMode) {
          params.set("page", String(currentPage));
          params.set("limit", String(PAGE_SIZE));
          const data = await apiFetch<{ items: Product[]; total: number; totalPages: number }>(
            `/products?${params.toString()}`,
            { auth: false }
          );
          setProducts(data.items);
          setServerTotal(data.total);
          setServerTotalPages(data.totalPages);
        } else {
          const data = await apiFetch<Product[]>(`/products?${params.toString()}`, { auth: false });
          setProducts(data);
          setServerTotal(data.length);
          setServerTotalPages(1);
        }
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load products");
        setProducts([]);
        setServerTotal(0);
        setServerTotalPages(1);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategories.join(","), sort, isFlatMode, currentPage]);

  // Reset to page 1 whenever any filter changes.
  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategories.join(","), sort, priceMin, priceMax, availability.join(",")]);

  // Active templates grouped by where they render on the page; every active
  // template renders simultaneously, each showing only its own tagged banners
  // (an untagged banner — no templateIds, or an empty list — shows under all of them).
  const templatesByPosition = useMemo(() => {
    const grouped: Record<BannerPosition, BannerTemplate[]> = {
      top: [],
      "above-grid": [],
      bottom: [],
      sidebar: [],
    };
    for (const tpl of bannerTemplates) {
      if (!tpl.isActive) continue;
      grouped[tpl.position]?.push(tpl);
    }
    (Object.keys(grouped) as BannerPosition[]).forEach((key) => {
      grouped[key] = [...grouped[key]].sort((a, b) => a.order - b.order);
    });
    return grouped;
  }, [bannerTemplates]);

  const bannersForTemplate = (template: BannerTemplate) =>
    banners.filter((b) => !b.templateIds || b.templateIds.length === 0 || b.templateIds.includes(template._id));

  const getBlocksForPosition = (position: BannerPosition) => {
    const list = templatesByPosition[position];
    if (!list || list.length === 0) return [];
    return list
      .map((tpl) => {
        const tplBanners = bannersForTemplate(tpl);
        return tplBanners.length > 0 ? { tpl, tplBanners } : null;
      })
      .filter((b): b is { tpl: BannerTemplate; tplBanners: Banner[] } => b !== null);
  };

  const renderTemplateGroup = (position: BannerPosition) => {
    const blocks = getBlocksForPosition(position);
    if (blocks.length === 0) return null;
    return (
      <div className="flex flex-col gap-4">
        {blocks.map(({ tpl, tplBanners }) => (
          <BannerBlock key={tpl._id} template={tpl} banners={tplBanners} />
        ))}
      </div>
    );
  };

  const topSection = renderTemplateGroup("top");
  const aboveGridSection = renderTemplateGroup("above-grid");
  const bottomSection = renderTemplateGroup("bottom");
  const sidebarBlocks = getBlocksForPosition("sidebar");

  const onSaleProducts = useMemo(
    () => products.filter((p) => p.discountPercent && p.discountPercent > 0).slice(0, 8),
    [products]
  );

  // Category filtering already happened server-side (see the fetch effect above)
  // when isFlatMode is true; price/availability aren't query params, so they're
  // always narrowed down client-side on top of whatever `products` holds.
  const filteredProducts = useMemo(() => {
    const min = priceMin.trim() === "" ? null : Number(priceMin);
    const max = priceMax.trim() === "" ? null : Number(priceMax);
    return products.filter((p) => {
      if (min !== null && !Number.isNaN(min) && p.price < min) return false;
      if (max !== null && !Number.isNaN(max) && p.price > max) return false;
      if (availability.length > 0) {
        const bucket: Availability = p.stock > 0 ? "in_stock" : "out_of_stock";
        if (!availability.includes(bucket)) return false;
      }
      return true;
    });
  }, [products, priceMin, priceMax, availability]);

  const totalPages = isFlatMode ? serverTotalPages : 1;
  const safePage = Math.min(currentPage, totalPages);

  // Default (no filter) view on /shop/allitems: the same fetched catalog,
  // split into one section per category so each can show a preview + a
  // "View all" entry point.
  const groupedByCategory = useMemo(() => {
    if (isFlatMode) return [];
    const byCategory = new Map<string, Product[]>();
    for (const p of filteredProducts) {
      const list = byCategory.get(p.category) ?? [];
      list.push(p);
      byCategory.set(p.category, list);
    }
    const orderedCategories = [
      ...categories.filter((c) => byCategory.has(c)),
      ...[...byCategory.keys()].filter((c) => !categories.includes(c)),
    ];
    return orderedCategories.map((category) => ({ category, items: byCategory.get(category)! }));
  }, [filteredProducts, categories, isFlatMode]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const toggleAvailability = (val: Availability) => {
    setAvailability((prev) => (prev.includes(val) ? prev.filter((a) => a !== val) : [...prev, val]));
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setSort("newest");
    setPriceMin("");
    setPriceMax("");
    setAvailability([]);
  };

  const activeFilterCount =
    selectedCategories.length +
    availability.length +
    (priceMin.trim() !== "" ? 1 : 0) +
    (priceMax.trim() !== "" ? 1 : 0) +
    (search.trim() !== "" ? 1 : 0);

  return (
    <>
      <SidebarRails blocks={sidebarBlocks} />

      {topSection}

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <p className="text-xs text-gray-500 mb-2">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span className="mx-1.5">/</span>
              <span className="text-gray-400">Shop</span>
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
              {selectedCategories.length === 1 ? selectedCategories[0] : "All Products"}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-gray-500">
                {loading
                  ? "Loading…"
                  : (() => {
                      const count = isFlatMode ? serverTotal : filteredProducts.length;
                      return `${count} product${count === 1 ? "" : "s"}`;
                    })()}
              </p>
              {alwaysFlat && (
                <Link
                  href="/shop/allitems"
                  className="flex items-center gap-1 text-sm font-medium text-white hover:text-gray-300 transition-colors"
                >
                  View all
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="lg:hidden relative flex items-center gap-2 bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-5 py-2.5 rounded-full border border-white/5 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="grid place-items-center h-5 min-w-5 px-1 rounded-full bg-white text-black text-[11px] font-semibold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {onSaleProducts.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold tracking-tight text-white">On Sale</h2>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Limited time
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {onSaleProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}

        {aboveGridSection && <div className="mb-8">{aboveGridSection}</div>}

        <div className="grid lg:grid-cols-4 gap-8">
          <aside className={`${filtersOpen ? "block" : "hidden"} lg:block lg:col-span-1`}>
            <div className="bg-[#111113] border border-white/10 rounded-2xl p-6 flex flex-col gap-6 lg:sticky lg:top-24">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Filters</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={clearFilters}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Clear filters
                  </button>
                  <button
                    onClick={() => setFiltersOpen(false)}
                    aria-label="Close filters"
                    className="lg:hidden text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-colors w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Sort by</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors w-full"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-[#111113]">
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Price range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="Min"
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-colors w-full"
                  />
                  <span className="text-gray-600 text-sm shrink-0">–</span>
                  <input
                    type="number"
                    min={0}
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="Max"
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-colors w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Availability</label>
                <div className="flex flex-col gap-2">
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2.5 text-sm text-gray-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={availability.includes(opt.value)}
                        onChange={() => toggleAvailability(opt.value)}
                        className="accent-white w-4 h-4"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {categories.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Category</label>
                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                    {categories.map((cat) => (
                      <label
                        key={cat}
                        className="flex items-center gap-2.5 text-sm text-gray-300 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat)}
                          onChange={() => toggleCategory(cat)}
                          className="accent-white w-4 h-4"
                        />
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          <section className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : isFlatMode ? (
              filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-24 bg-[#111113] border border-white/10 rounded-2xl">
                  <div className="grid place-items-center h-14 w-14 rounded-full bg-white/5 mb-4">
                    <ShoppingBag className="w-6 h-6 text-gray-500" />
                  </div>
                  <p className="text-white font-medium mb-1">No products found</p>
                  <p className="text-gray-500 text-sm mb-6">Try adjusting your filters or search terms.</p>
                  <button
                    onClick={clearFilters}
                    className="bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map((p) => (
                      <ProductCard key={p._id} product={p} />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <Pagination currentPage={safePage} totalPages={totalPages} onChange={setCurrentPage} />
                  )}
                </>
              )
            ) : groupedByCategory.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-24 bg-[#111113] border border-white/10 rounded-2xl">
                <div className="grid place-items-center h-14 w-14 rounded-full bg-white/5 mb-4">
                  <ShoppingBag className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-white font-medium mb-1">No products found</p>
                <p className="text-gray-500 text-sm mb-6">Check back soon.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {groupedByCategory.map(({ category, items }) => (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold tracking-tight text-white">{category}</h2>
                      <button
                        onClick={() => toggleCategory(category)}
                        className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors shrink-0"
                      >
                        View all
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {items.slice(0, SECTION_SIZE).map((p) => (
                        <ProductCard key={p._id} product={p} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {bottomSection && <div className="mt-10">{bottomSection}</div>}
      </div>
    </>
  );
}

/* ---------------------------- Banner block dispatcher ---------------------------- */

function BannerBlock({ template, banners }: { template: BannerTemplate; banners: Banner[] }) {
  if (template.layout === "grid") {
    return <BannerGrid banners={banners} options={template.options.grid} />;
  }
  if (template.layout === "spotlight") {
    return <BannerSpotlight banners={banners} options={template.options.spotlight} />;
  }
  return <BannerCarousel banners={banners} options={template.options.carousel} />;
}

/* ---------------------------- Sidebar rails ---------------------------- */

function SidebarRails({ blocks }: { blocks: { tpl: BannerTemplate; tplBanners: Banner[] }[] }) {
  if (blocks.length === 0) return null;
  return (
    <>
      <div className="hidden 2xl:flex flex-col gap-4 fixed left-6 top-28 z-20 w-48">
        {blocks.map(({ tpl, tplBanners }) => (
          <SidebarCarousel key={tpl._id} banners={tplBanners} options={tpl.options.sidebar} />
        ))}
      </div>
      <div className="hidden 2xl:flex flex-col gap-4 fixed right-6 top-28 z-20 w-48">
        {blocks.map(({ tpl, tplBanners }) => (
          <SidebarCarousel key={tpl._id} banners={tplBanners} options={tpl.options.sidebar} />
        ))}
      </div>
    </>
  );
}

function SidebarCarousel({
  banners,
  options,
}: {
  banners: Banner[];
  options: BannerTemplateOptions["sidebar"];
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex((i) => (banners.length === 0 ? 0 : i % banners.length));
  }, [banners.length]);

  useEffect(() => {
    if (!options.autoAdvance || banners.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, options.intervalMs);
    return () => clearInterval(id);
  }, [banners.length, options.autoAdvance, options.intervalMs]);

  if (banners.length === 0) return null;
  const banner = banners[index];
  const href = bannerHref(banner);

  const content = (
    <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-[#111113] border border-white/10">
      <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-xs font-semibold text-white leading-tight line-clamp-2">{banner.title}</p>
      </div>
    </div>
  );

  return href ? <a href={href}>{content}</a> : content;
}

/* ---------------------------- Banner carousel ---------------------------- */

const CAROUSEL_HEIGHT_CLASSES: Record<BannerTemplateOptions["carousel"]["height"], string> = {
  compact: "h-[200px] md:h-[280px]",
  standard: "h-[280px] md:h-[380px]",
  tall: "h-[360px] md:h-[480px]",
};

function BannerCarousel({
  banners,
  options,
}: {
  banners: Banner[];
  options: BannerTemplateOptions["carousel"];
}) {
  const [index, setIndex] = useState(0);

  // Keep the index in range whenever the banner set changes.
  useEffect(() => {
    setIndex((i) => (banners.length === 0 ? 0 : i % banners.length));
  }, [banners.length]);

  useEffect(() => {
    if (!options.autoAdvance) return;
    if (banners.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, options.intervalMs);
    return () => clearInterval(id);
  }, [banners.length, options.autoAdvance, options.intervalMs]);

  return (
    <div
      className={`relative w-full overflow-hidden bg-[#111113] ${CAROUSEL_HEIGHT_CLASSES[options.height]}`}
    >
      {banners.map((b, i) => (
        <BannerSlide key={b._id} banner={b} active={i === index} />
      ))}

      {banners.length > 1 && (
        <>
          {options.showArrows && (
            <>
              <button
                onClick={() => setIndex((index - 1 + banners.length) % banners.length)}
                aria-label="Previous banner"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 grid place-items-center h-9 w-9 rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIndex((index + 1) % banners.length)}
                aria-label="Next banner"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 grid place-items-center h-9 w-9 rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          {options.showDots && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to banner ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-6 bg-white" : "w-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BannerSlide({ banner, active }: { banner: Banner; active: boolean }) {
  const className = `absolute inset-0 block transition-opacity duration-700 ${
    active ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
  }`;

  const content = (
    <>
      <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-contain" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-10 max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-semibold text-white tracking-tight">{banner.title}</h2>
        {banner.subtitle && (
          <p className="text-sm md:text-base text-gray-300 mt-2 max-w-xl">{banner.subtitle}</p>
        )}
      </div>
    </>
  );

  const href = bannerHref(banner);
  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }
  return <div className={className}>{content}</div>;
}

/* ------------------------------ Banner grid ------------------------------ */

const GRID_COLUMN_CLASSES: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

function BannerGrid({
  banners,
  options,
}: {
  banners: Banner[];
  options: BannerTemplateOptions["grid"];
}) {
  const sorted = [...banners].sort((a, b) => a.order - b.order);
  const columnClass = GRID_COLUMN_CLASSES[options.columns] ?? GRID_COLUMN_CLASSES[3];
  const aspectClass = options.aspectRatio === "square" ? "aspect-square" : "aspect-video";

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className={`grid grid-cols-1 ${columnClass} gap-4`}>
        {sorted.map((banner) => {
          const card = (
            <div className="group relative w-full h-full overflow-hidden rounded-2xl bg-[#111113] border border-white/10">
              <div className={`relative w-full ${aspectClass} overflow-hidden`}>
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-white truncate">{banner.title}</h3>
                {options.showSubtitle && banner.subtitle && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{banner.subtitle}</p>
                )}
              </div>
            </div>
          );
          const href = bannerHref(banner);
          return href ? (
            <a key={banner._id} href={href} className="block h-full">
              {card}
            </a>
          ) : (
            <div key={banner._id}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------- Banner spotlight ---------------------------- */

function BannerSpotlight({
  banners,
  options,
}: {
  banners: Banner[];
  options: BannerTemplateOptions["spotlight"];
}) {
  const sorted = [...banners].sort((a, b) => a.order - b.order);
  const featured = sorted[0];
  const rest = sorted.slice(1, 1 + options.maxListItems);

  const featuredCard = (
    <div className="relative w-full h-[280px] md:h-[420px] overflow-hidden rounded-2xl bg-[#111113]">
      <img src={featured.imageUrl} alt={featured.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h2 className="text-xl md:text-3xl font-semibold text-white tracking-tight">{featured.title}</h2>
        {featured.subtitle && (
          <p className="text-sm text-gray-300 mt-2 max-w-xl">{featured.subtitle}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-2/3">
          {bannerHref(featured) ? (
            <a href={bannerHref(featured)} className="block">
              {featuredCard}
            </a>
          ) : (
            featuredCard
          )}
        </div>

        {rest.length > 0 && (
          <div className="lg:w-1/3 flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-visible">
            {rest.map((banner) => {
              const row = (
                <div className="flex items-center gap-3 bg-[#111113] border border-white/10 rounded-xl p-3 w-64 lg:w-full shrink-0">
                  <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-white/5">
                    <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{banner.title}</div>
                    {options.showListSubtitle && banner.subtitle && (
                      <div className="text-xs text-gray-500 truncate">{banner.subtitle}</div>
                    )}
                  </div>
                </div>
              );
              const href = bannerHref(banner);
              return href ? (
                <a key={banner._id} href={href} className="block">
                  {row}
                </a>
              ) : (
                <div key={banner._id}>{row}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Product card ------------------------------ */

function ProductImage({
  src,
  alt,
  className = "",
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div className={`bg-white/5 flex items-center justify-center ${className}`}>
        <ImageOff className="w-8 h-8 text-gray-600" />
      </div>
    );
  }
  return <img src={src} alt={alt} className={`object-cover ${className}`} />;
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const toast = useToast();
  const { formatPrice } = useCurrency();
  const inStock = product.stock > 0;
  const imgSrc = product.imageUrl || product.images?.[0];
  const onSale = !!product.discountPercent && product.discountPercent > 0;
  const displayPrice = onSale ? product.effectivePrice ?? product.price : product.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ productId: product._id, name: product.name, price: displayPrice, imageUrl: imgSrc }, 1);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Link
      href={`/product/${product._id}`}
      className="group relative flex flex-col bg-[#111113] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors"
    >
      <div className="relative aspect-square w-full overflow-hidden">
        <ProductImage
          src={imgSrc}
          alt={product.name}
          className="w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        {!inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-black/80 border border-white/10 text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
        {product.isFeatured && inStock && (
          <div className="absolute top-3 left-3 bg-white text-black text-[11px] font-medium px-2.5 py-1 rounded-full">
            Featured
          </div>
        )}
        {onSale && (
          <div className="absolute top-3 right-3 bg-emerald-500 text-black text-[11px] font-semibold px-2.5 py-1 rounded-full">
            -{product.discountPercent}%
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-4 flex-1">
        <span className="text-xs text-gray-500">{product.category}</span>
        <h3 className="text-sm font-medium text-white line-clamp-2">{product.name}</h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          {onSale ? (
            <span className="flex items-center gap-2">
              <span className="text-sm font-semibold text-emerald-400">{formatPrice(displayPrice)}</span>
              <span className="text-xs text-gray-500 line-through">{formatPrice(product.price)}</span>
            </span>
          ) : (
            <span className="text-sm font-semibold text-white">{formatPrice(product.price)}</span>
          )}
          {inStock && (
            <button
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to cart`}
              className="grid place-items-center h-8 w-8 rounded-full bg-white/10 hover:bg-white text-white hover:text-black transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

/* -------------------------------- Pagination -------------------------------- */

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

function Pagination({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const pages = getPageNumbers(currentPage, totalPages);
  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <button
        onClick={() => onChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="grid place-items-center h-9 w-9 rounded-full border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e-${i}`} className="w-9 text-center text-gray-600 text-sm select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`h-9 w-9 rounded-full text-sm font-medium transition-colors ${
              p === currentPage ? "bg-white text-black" : "text-gray-300 hover:bg-white/5"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="grid place-items-center h-9 w-9 rounded-full border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
