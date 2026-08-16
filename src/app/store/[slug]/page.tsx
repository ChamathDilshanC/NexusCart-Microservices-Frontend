"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Search, Menu, X, Plus, Minus, Trash2, ArrowLeft,
  Star, Package, MapPin, Phone, Mail, Globe, ExternalLink,
  MessageCircle, ChevronRight, Heart, Share2,
  Truck, Shield, Clock, Headphones
} from "lucide-react";

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
}

interface Business {
  _id: string;
  businessName: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  themeColor: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerImageUrl: string;
  categories: string[];
  contactNumber: string;
  address: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
    whatsapp?: string;
  };
}

interface CartItem extends Product {
  quantity: number;
}

export default function StorefrontPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    street: "", city: "", state: "", zipCode: "", country: "Sri Lanka"
  });

  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`cart_${slug}`);
    if (saved) setCart(JSON.parse(saved));
  }, [slug]);

  // Save cart to localStorage
  useEffect(() => {
    if (slug) localStorage.setItem(`cart_${slug}`, JSON.stringify(cart));
  }, [cart, slug]);

  // Fetch business and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bizRes, prodRes] = await Promise.all([
          fetch(`/api/business/storefront/${slug}`),
          fetch(`/api/products/by-slug/${slug}`)
        ]);
        if (!bizRes.ok) throw new Error("Store not found");
        const bizData = await bizRes.json();
        setBusiness(bizData);
        if (prodRes.ok) {
          setProducts(await prodRes.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === product._id);
      if (existing) {
        return prev.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i._id === id) {
        const q = i.quantity + delta;
        return q > 0 ? { ...i, quantity: q } : i;
      }
      return i;
    }).filter(i => i.quantity > 0));
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(i => i._id !== id));
  }, []);

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const filteredProducts = activeCategory === "All"
    ? products
    : products.filter(p => p.category === activeCategory);

  const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

  const handleCheckout = async () => {
    try {
      const token = localStorage.getItem("nexus_token");
      if (!token) {
        alert("Please login to place an order");
        return;
      }
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          businessId: business?._id,
          items: cart.map(i => ({ productId: i._id, name: i.name, quantity: i.quantity, price: i.price })),
          shippingAddress
        })
      });
      if (res.ok) {
        setOrderPlaced(true);
        setCart([]);
        setTimeout(() => { setOrderPlaced(false); setIsCheckoutOpen(false); }, 3000);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to place order");
      }
    } catch {
      alert("Error placing order");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Loading store...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h1 className="text-white text-2xl font-semibold mb-2">Store Not Found</h1>
          <p className="text-white/50 mb-6">This store doesn't exist or hasn't been approved yet.</p>
          <button onClick={() => router.push("/")} className="text-sm bg-white text-black px-6 py-2 rounded-full font-medium">
            Go to NexusCart
          </button>
        </div>
      </div>
    );
  }

  const themeColor = business.themeColor || "#0a0a0a";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ─── NAVIGATION ─── */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/")} className="text-white/50 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              {business.logoUrl ? (
                <img src={business.logoUrl} alt={business.businessName} className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: themeColor }}>
                  {business.businessName[0]}
                </div>
              )}
              <span className="font-semibold text-lg tracking-tight">{business.businessName}</span>
            </div>

            {/* Desktop categories */}
            <div className="hidden lg:flex items-center gap-6 text-sm font-medium">
              {categories.slice(0, 7).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`transition-colors ${activeCategory === cat ? "text-white" : "text-white/50 hover:text-white/80"}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background: themeColor }}>
                    {cartCount}
                  </span>
                )}
              </button>
              <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-full hover:bg-white/10">
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── HERO / BANNER ─── */}
      <section className="relative overflow-hidden">
        {business.coverImageUrl || business.bannerImageUrl ? (
          <div className="relative h-[50vh] sm:h-[60vh] lg:h-[70vh]">
            <img
              src={business.coverImageUrl || business.bannerImageUrl}
              alt={business.businessName}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 lg:p-16">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}>
                <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tighter mb-3">
                  {business.bannerTitle || business.businessName}
                </h1>
                <p className="text-white/70 text-lg sm:text-xl max-w-2xl">
                  {business.bannerSubtitle || business.description || "Welcome to our store"}
                </p>
                <button
                  onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
                  className="mt-6 px-8 py-3 rounded-full font-medium text-sm transition-transform hover:scale-105 active:scale-95"
                  style={{ background: themeColor, color: "#fff" }}
                >
                  Shop Now
                </button>
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="relative py-20 sm:py-28 lg:py-36 px-6" style={{ background: `linear-gradient(135deg, ${themeColor}33, #0a0a0a)` }}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="max-w-[1400px] mx-auto text-center">
              {business.logoUrl && (
                <img src={business.logoUrl} alt="" className="w-20 h-20 rounded-2xl object-cover mx-auto mb-6 shadow-2xl" />
              )}
              <h1 className="text-4xl sm:text-6xl lg:text-8xl font-bold tracking-tighter mb-4">
                {business.bannerTitle || business.businessName}
              </h1>
              <p className="text-white/60 text-lg sm:text-xl max-w-xl mx-auto">
                {business.bannerSubtitle || business.description || "Your one-stop shop for amazing products"}
              </p>
              <button
                onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
                className="mt-8 px-8 py-3 rounded-full font-medium text-sm bg-white text-black transition-transform hover:scale-105 active:scale-95"
              >
                Explore Products
              </button>
            </motion.div>
          </div>
        )}

        {/* Marquee banner */}
        {business.bannerTitle && (
          <div className="py-3 overflow-hidden border-y border-white/5" style={{ background: themeColor }}>
            <div className="flex animate-marquee whitespace-nowrap">
              {Array(5).fill(null).map((_, i) => (
                <span key={i} className="mx-8 text-sm font-semibold tracking-wider uppercase opacity-90">
                  {business.bannerTitle} ★ {business.businessName} ★
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ─── STATS ─── */}
      <section className="py-12 sm:py-16 border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { icon: Package, label: "Products", value: products.length.toString() },
              { icon: Truck, label: "Fast Delivery", value: "Island-wide" },
              { icon: Shield, label: "Secure Payment", value: "100% Safe" },
              { icon: Headphones, label: "Support", value: "24/7" }
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <Icon className="w-6 h-6 mx-auto mb-2 text-white/40" />
                <div className="text-xl sm:text-2xl font-bold">{value}</div>
                <div className="text-xs text-white/50 mt-1 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRODUCTS ─── */}
      <section id="products" className="py-12 sm:py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category tabs - mobile scrollable */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide lg:hidden">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "text-white"
                    : "bg-white/5 text-white/50 hover:text-white/80"
                }`}
                style={activeCategory === cat ? { background: themeColor } : {}}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* New Arrivals */}
          {filteredProducts.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-6 w-1 rounded-full" style={{ background: themeColor }} />
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {activeCategory === "All" ? "All Products" : activeCategory}
                </h2>
                <span className="text-sm text-white/40">({filteredProducts.length})</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((product, idx) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                    className="group rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all hover:shadow-2xl"
                  >
                    <div className="relative aspect-square bg-white/[0.03] overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-10 h-10 text-white/10" />
                        </div>
                      )}
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-sm font-medium text-white/70 bg-black/50 px-4 py-1 rounded-full">Out of Stock</span>
                        </div>
                      )}
                      {product.isFeatured && (
                        <span className="absolute top-3 left-3 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider" style={{ background: themeColor }}>
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{product.category}</p>
                      <h3 className="font-medium text-sm text-white leading-tight mb-2 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg">Rs. {product.price.toLocaleString()}</span>
                        <button
                          onClick={() => addToCart(product)}
                          disabled={product.stock <= 0}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90 disabled:opacity-30 disabled:hover:scale-100"
                          style={{ background: themeColor }}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <Package className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/40">No products found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── WHY CHOOSE US ─── */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-10">Why Choose Us?</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "📦", title: "Fast Delivery", desc: "Quick island-wide delivery" },
              { icon: "💰", title: "Best Prices", desc: "Competitive pricing guaranteed" },
              { icon: "🔒", title: "Secure Payment", desc: "Multiple safe payment options" },
              { icon: "🛠️", title: "24/7 Support", desc: "Always here to help you" }
            ].map(item => (
              <div key={item.title} className="text-center p-4">
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-white/40">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 bg-[#050505]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                {business.logoUrl ? (
                  <img src={business.logoUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold" style={{ background: themeColor }}>
                    {business.businessName[0]}
                  </div>
                )}
                <span className="font-semibold text-lg">{business.businessName}</span>
              </div>
              <p className="text-sm text-white/40 leading-relaxed">{business.description || "Your trusted store on NexusCart."}</p>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Contact</h3>
              <div className="flex flex-col gap-3 text-sm text-white/50">
                {business.contactNumber && (
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {business.contactNumber}</div>
                )}
                {business.address && (
                  <div className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0" /> {business.address}</div>
                )}
              </div>
            </div>

            {/* Social */}
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Follow Us</h3>
              <div className="flex gap-3">
                {business.socialLinks?.facebook && (
                  <a href={business.socialLinks.facebook} target="_blank" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-xs font-bold">
                    fb
                  </a>
                )}
                {business.socialLinks?.instagram && (
                  <a href={business.socialLinks.instagram} target="_blank" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-xs font-bold">
                    ig
                  </a>
                )}
                {business.socialLinks?.youtube && (
                  <a href={business.socialLinks.youtube} target="_blank" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-xs font-bold">
                    yt
                  </a>
                )}
                {business.socialLinks?.twitter && (
                  <a href={business.socialLinks.twitter} target="_blank" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <Globe className="w-4 h-4" />
                  </a>
                )}
                {business.socialLinks?.whatsapp && (
                  <a href={business.socialLinks.whatsapp} target="_blank" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-white/30">
            <span>© {new Date().getFullYear()} {business.businessName}. All rights reserved.</span>
            <span>Powered by NexusCart</span>
          </div>
        </div>
      </footer>

      {/* ─── CART DRAWER ─── */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
              onClick={() => setIsCartOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#111] z-[61] flex flex-col border-l border-white/5"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-lg font-semibold">Cart ({cartCount})</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 rounded-full hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingCart className="w-12 h-12 text-white/10 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {cart.map(item => (
                      <div key={item._id} className="flex gap-3 bg-white/[0.03] rounded-xl p-3 border border-white/5">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center">
                            <Package className="w-6 h-6 text-white/10" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">{item.name}</h4>
                          <p className="text-xs text-white/40 mt-0.5">Rs. {item.price.toLocaleString()}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => updateQuantity(item._id, -1)} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item._id, 1)} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                              <Plus className="w-3 h-3" />
                            </button>
                            <button onClick={() => removeFromCart(item._id)} className="ml-auto p-1 text-white/30 hover:text-red-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-white/5 p-5">
                  <div className="flex justify-between mb-4">
                    <span className="text-white/60">Total</span>
                    <span className="text-xl font-bold">Rs. {cartTotal.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                    className="w-full py-3 rounded-full font-medium text-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: themeColor }}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── CHECKOUT MODAL ─── */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[70] backdrop-blur-sm"
              onClick={() => setIsCheckoutOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg bg-[#111] z-[71] rounded-2xl border border-white/5 overflow-y-auto max-h-[90vh]"
            >
              {orderPlaced ? (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Order Placed!</h2>
                  <p className="text-white/50 text-sm">Your order has been placed successfully.</p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Checkout</h2>
                    <button onClick={() => setIsCheckoutOpen(false)} className="p-2 rounded-full hover:bg-white/10">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-white/[0.03] rounded-xl p-4 mb-6 border border-white/5">
                    <h3 className="text-sm font-medium mb-3 text-white/70">Order Summary</h3>
                    {cart.map(item => (
                      <div key={item._id} className="flex justify-between text-sm py-1">
                        <span className="text-white/60">{item.name} × {item.quantity}</span>
                        <span>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t border-white/5 mt-3 pt-3 flex justify-between font-bold">
                      <span>Total</span>
                      <span>Rs. {cartTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Shipping */}
                  <div className="flex flex-col gap-3 mb-6">
                    <h3 className="text-sm font-medium text-white/70">Shipping Address</h3>
                    {[
                      { key: "street", label: "Street Address", type: "text" },
                      { key: "city", label: "City", type: "text" },
                      { key: "state", label: "State/Province", type: "text" },
                      { key: "zipCode", label: "Zip Code", type: "text" },
                      { key: "country", label: "Country", type: "text" }
                    ].map(({ key, label, type }) => (
                      <input
                        key={key}
                        type={type}
                        placeholder={label}
                        value={(shippingAddress as any)[key]}
                        onChange={e => setShippingAddress({ ...shippingAddress, [key]: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30 placeholder:text-white/30"
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full py-3 rounded-full font-medium text-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: themeColor }}
                  >
                    Place Order — Rs. {cartTotal.toLocaleString()}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── MOBILE MENU ─── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-[#111] z-[61] flex flex-col border-r border-white/5"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <span className="font-semibold">{business.businessName}</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 flex flex-col gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setActiveCategory(cat); setIsMobileMenuOpen(false); }}
                    className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      activeCategory === cat ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80 hover:bg-white/5"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Marquee animation CSS */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
