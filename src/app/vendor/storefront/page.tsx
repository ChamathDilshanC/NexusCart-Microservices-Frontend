"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAppState } from "../../../components/Shared";
import { LiquidRevealCanvas } from "../../../components/Hero";
import Link from "next/link";
import {
  ArrowLeft, Save, Check, Loader2, AlertTriangle,
  Palette, Image, Link2, Type, Tag, Globe, Eye
} from "lucide-react";

export default function StorefrontEditor() {
  const { currentUser, isAuthInitialized, ready } = useAppState();
  const router = useRouter();

  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    description: "",
    logoUrl: "",
    coverImageUrl: "",
    themeColor: "#0a0a0a",
    bannerTitle: "",
    bannerSubtitle: "",
    bannerImageUrl: "",
    categories: "",
    contactNumber: "",
    address: "",
    socialLinks: {
      facebook: "",
      instagram: "",
      youtube: "",
      twitter: "",
      whatsapp: ""
    }
  });

  useEffect(() => {
    if (!isAuthInitialized) return;
    if (!currentUser || currentUser.role !== "Vendor") {
      router.push("/");
      return;
    }

    const fetchBusiness = async () => {
      try {
        const token = localStorage.getItem("nexus_token");
        const res = await fetch("/api/business/my-business", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBusiness(data);
          setForm({
            description: data.description || "",
            logoUrl: data.logoUrl || "",
            coverImageUrl: data.coverImageUrl || "",
            themeColor: data.themeColor || "#0a0a0a",
            bannerTitle: data.bannerTitle || "",
            bannerSubtitle: data.bannerSubtitle || "",
            bannerImageUrl: data.bannerImageUrl || "",
            categories: (data.categories || []).join(", "),
            contactNumber: data.contactNumber || "",
            address: data.address || "",
            socialLinks: {
              facebook: data.socialLinks?.facebook || "",
              instagram: data.socialLinks?.instagram || "",
              youtube: data.socialLinks?.youtube || "",
              twitter: data.socialLinks?.twitter || "",
              whatsapp: data.socialLinks?.whatsapp || ""
            }
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, [currentUser, isAuthInitialized, router]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("nexus_token");
      const payload = {
        ...form,
        categories: form.categories.split(",").map((c: string) => c.trim()).filter(Boolean)
      };
      const res = await fetch("/api/business/storefront", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setBusiness(data.business);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        throw new Error(data.message || "Failed to save");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthInitialized || loading) {
    return (
      <div className="min-h-screen bg-[#111] flex justify-center items-center">
        <div className="text-[rgba(255,255,255,0.5)] font-medium">Loading...</div>
      </div>
    );
  }

  if (!business || business.status !== "Approved") {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-400/60 mx-auto mb-4" />
          <p className="text-white/60">Your business must be approved to customize your storefront.</p>
          <button onClick={() => router.push("/vendor/dashboard")} className="mt-4 text-sm text-white/40 hover:text-white">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30 placeholder:text-white/30 transition-colors";
  const labelCls = "text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5 block";

  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-[#111]">
      <LiquidRevealCanvas />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[rgba(17,17,17,0.5)] via-[rgba(17,17,17,0.8)] to-[rgba(17,17,17,0.95)]" />

      <div className="shell relative z-20 flex flex-col gap-[2rem] px-[1.25rem] pb-[5rem] pt-[9rem] sm:px-[2rem] lg:px-[2rem]">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/vendor/dashboard" className="p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Customize Storefront</h1>
            <p className="text-sm text-white/40 mt-0.5">Design your store like a poster — make it yours</p>
          </div>
          <div className="flex items-center gap-3">
            {business.slug && (
              <Link
                href={`/store/${business.slug}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-xs font-medium text-white/60 hover:text-white hover:border-white/30 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> Preview
              </Link>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <Check className="w-4 h-4 text-green-600" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : success ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-6">
            {/* Branding */}
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
              <div className="flex items-center gap-2 mb-5">
                <Palette className="w-4 h-4 text-white/40" />
                <h2 className="text-sm font-semibold text-white">Branding</h2>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelCls}>Business Name</label>
                  <input value={business.businessName} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
                </div>
                <div>
                  <label className={labelCls}>Store Slug (URL)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/30">/store/</span>
                    <input value={business.slug || ""} disabled className={`${inputCls} opacity-50 cursor-not-allowed flex-1`} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Theme Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.themeColor}
                      onChange={e => setForm({ ...form, themeColor: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.themeColor}
                      onChange={e => setForm({ ...form, themeColor: e.target.value })}
                      className={`${inputCls} flex-1`}
                      placeholder="#0a0a0a"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className={`${inputCls} resize-none`}
                    placeholder="Tell customers about your business..."
                  />
                </div>
              </div>
            </div>

            {/* Banner */}
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
              <div className="flex items-center gap-2 mb-5">
                <Type className="w-4 h-4 text-white/40" />
                <h2 className="text-sm font-semibold text-white">Hero Banner (Marquee)</h2>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelCls}>Banner Title</label>
                  <input
                    value={form.bannerTitle}
                    onChange={e => setForm({ ...form, bannerTitle: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. FREE SHIPPING ON ALL ORDERS"
                  />
                </div>
                <div>
                  <label className={labelCls}>Banner Subtitle</label>
                  <input
                    value={form.bannerSubtitle}
                    onChange={e => setForm({ ...form, bannerSubtitle: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. Shop the latest tech at unbeatable prices"
                  />
                </div>
                <div>
                  <label className={labelCls}>Cover Image URL</label>
                  <input
                    value={form.coverImageUrl}
                    onChange={e => setForm({ ...form, coverImageUrl: e.target.value })}
                    className={inputCls}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className={labelCls}>Banner Image URL (optional)</label>
                  <input
                    value={form.bannerImageUrl}
                    onChange={e => setForm({ ...form, bannerImageUrl: e.target.value })}
                    className={inputCls}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
              <div className="flex items-center gap-2 mb-5">
                <Image className="w-4 h-4 text-white/40" />
                <h2 className="text-sm font-semibold text-white">Images</h2>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelCls}>Logo URL</label>
                  <input
                    value={form.logoUrl}
                    onChange={e => setForm({ ...form, logoUrl: e.target.value })}
                    className={inputCls}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-6">
            {/* Categories */}
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
              <div className="flex items-center gap-2 mb-5">
                <Tag className="w-4 h-4 text-white/40" />
                <h2 className="text-sm font-semibold text-white">Categories</h2>
              </div>
              <div>
                <label className={labelCls}>Store Categories (comma-separated)</label>
                <input
                  value={form.categories}
                  onChange={e => setForm({ ...form, categories: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Laptops, Monitors, Keyboards, Gaming"
                />
                <p className="text-xs text-white/30 mt-2">These will appear as navigation tabs on your storefront</p>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
              <div className="flex items-center gap-2 mb-5">
                <Globe className="w-4 h-4 text-white/40" />
                <h2 className="text-sm font-semibold text-white">Contact & Location</h2>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelCls}>Contact Number</label>
                  <input
                    value={form.contactNumber}
                    onChange={e => setForm({ ...form, contactNumber: e.target.value })}
                    className={inputCls}
                    placeholder="+94 77 123 4567"
                  />
                </div>
                <div>
                  <label className={labelCls}>Address</label>
                  <textarea
                    rows={2}
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className={`${inputCls} resize-none`}
                    placeholder="Your business address..."
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
              <div className="flex items-center gap-2 mb-5">
                <Link2 className="w-4 h-4 text-white/40" />
                <h2 className="text-sm font-semibold text-white">Social Links</h2>
              </div>
              <div className="flex flex-col gap-4">
                {(["facebook", "instagram", "youtube", "twitter", "whatsapp"] as const).map(platform => (
                  <div key={platform}>
                    <label className={labelCls}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</label>
                    <input
                      value={form.socialLinks[platform]}
                      onChange={e => setForm({ ...form, socialLinks: { ...form.socialLinks, [platform]: e.target.value } })}
                      className={inputCls}
                      placeholder={`https://${platform}.com/yourpage`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Card */}
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Store Preview</h2>
              <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0a]">
                <div className="h-24 relative" style={{ background: form.coverImageUrl ? `url(${form.coverImageUrl}) center/cover` : `linear-gradient(135deg, ${form.themeColor}66, #0a0a0a)` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: form.themeColor }}>
                        {business.businessName[0]}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-white">{business.businessName}</span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-white/40 line-clamp-2">{form.description || "Your store description..."}</p>
                  {form.bannerTitle && (
                    <div className="mt-2 py-1 px-2 rounded text-[9px] font-bold text-center text-white" style={{ background: form.themeColor }}>
                      {form.bannerTitle}
                    </div>
                  )}
                </div>
              </div>
              {business.slug && (
                <Link href={`/store/${business.slug}`} target="_blank" className="mt-4 block text-center text-sm text-white/50 hover:text-white transition-colors">
                  View Live Store →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
