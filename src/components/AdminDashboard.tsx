"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppState, PillButton } from "./Shared";
import { LiquidRevealCanvas } from "./Hero";
import { Package, ShoppingBag, Users, Plus, Pencil, Trash2, ChevronDown, X, BarChart3 } from "lucide-react";
import { goeyToast } from "goey-toast";

type Tab = "products" | "orders" | "users";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("nexus_token")}`,
});

export function AdminDashboard() {
  const { ready } = useAppState();
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "", category: "", imageUrl: "", isFeatured: false });

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/products", { headers: authHeaders() });
      if (res.ok) setProducts(await res.json());
    } catch (e) { console.error(e); }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders", { headers: authHeaders() });
      if (res.ok) setOrders(await res.json());
    } catch (e) { console.error(e); }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users", { headers: authHeaders() });
      if (res.ok) setUsers(await res.json());
    } catch (e) { console.error(e); }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/metrics", { headers: authHeaders() });
      if (res.ok) setMetrics(await res.json());
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProducts(), fetchOrders(), fetchUsers(), fetchMetrics()]).finally(() => setLoading(false));
  }, [fetchProducts, fetchOrders, fetchUsers, fetchMetrics]);

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", stock: "", category: "", imageUrl: "", isFeatured: false });
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description, price: String(p.price), stock: String(p.stock), category: p.category, imageUrl: p.imageUrl || "", isFeatured: p.isFeatured || false });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { ...form, price: Number(form.price), stock: Number(form.stock) };
    const url = editing ? `/api/admin/products/${editing._id}` : "/api/admin/products";
    const method = editing ? "PUT" : "POST";
    try {
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      if (res.ok) {
        goeyToast.success(editing ? "Product updated" : "Product created");
        resetForm();
        fetchProducts();
        fetchMetrics();
      } else {
        const d = await res.json();
        goeyToast.error(d.message || "Failed");
      }
    } catch { goeyToast.error("Network error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE", headers: authHeaders() });
      if (res.ok) { goeyToast.success("Product deleted"); fetchProducts(); fetchMetrics(); }
    } catch { goeyToast.error("Failed to delete"); }
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) { goeyToast.success(`Order ${status}`); fetchOrders(); }
    } catch { goeyToast.error("Failed to update status"); }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "products", label: "Products", icon: <Package className="h-4 w-4" /> },
    { key: "orders", label: "Orders", icon: <ShoppingBag className="h-4 w-4" /> },
    { key: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
  ];

  return (
    <section id="admin-home" className="relative isolate min-h-screen overflow-hidden rounded-b-[2rem] bg-[#111]">
      <LiquidRevealCanvas />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[rgba(17,17,17,0.5)] via-[rgba(17,17,17,0.8)] to-[rgba(17,17,17,0.95)]" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={ready ? { opacity: 0.1, y: 0 } : {}} transition={{ type: "spring", stiffness: 120, damping: 30, delay: 0.3 }} className="pointer-events-none absolute inset-x-0 top-[20vh] z-[1] select-none text-center text-[10rem] font-bold leading-none text-[#fff]">
        ADMIN
      </motion.div>

      <div className="shell relative z-20 flex flex-col gap-[2rem] px-[1.25rem] pb-[5rem] pt-[9rem] sm:px-[2rem] lg:min-h-[100lvh] lg:px-[2rem] lg:pb-[7rem] lg:pt-[11rem]">
        {/* Header */}
        <div className="flex flex-col gap-[1rem]">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={ready ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2, duration: 0.6 }}>
            <div className="inline-flex items-center gap-[0.5rem] text-[0.875rem] font-medium text-[rgba(255,255,255,0.7)]">
              <div className="h-[0.375rem] w-[0.375rem] rounded-[9999px] bg-[#fff]" />
              NexusCart Admin
            </div>
          </motion.div>
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={ready ? { y: 0, opacity: 1 } : {}} transition={{ delay: 0.3, duration: 0.8 }} className="max-w-[20ch] text-[2.5rem] font-semibold leading-[1.05] tracking-[-.02em] text-[#fff] sm:text-[3.5rem]">
            Store <span className="text-[rgba(255,255,255,0.5)]">Management</span>
          </motion.h1>
        </div>

        {/* Metrics cards */}
        {metrics && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={ready ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4, duration: 0.6 }} className="grid grid-cols-2 gap-[1rem] sm:grid-cols-4">
            {[
              { label: "Total Users", value: metrics.totalUsers ?? 0 },
              { label: "Total Products", value: metrics.totalProducts ?? 0 },
              { label: "Total Orders", value: metrics.totalOrders ?? 0 },
              { label: "Revenue", value: `$${(metrics.totalRevenue ?? 0).toFixed(2)}` },
            ].map((m, i) => (
              <div key={i} className="rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-[1.25rem] backdrop-blur-xl">
                <div className="text-[0.75rem] uppercase tracking-wider text-[rgba(255,255,255,0.4)]">{m.label}</div>
                <div className="mt-[0.5rem] text-[1.5rem] font-semibold text-[#fff]">{m.value}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={ready ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5, duration: 0.8 }} className="w-full max-w-[1200px]">
          <div className="mb-[1.5rem] flex items-center gap-[0.5rem] rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-[0.375rem] backdrop-blur-xl">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`flex flex-1 items-center justify-center gap-[0.5rem] rounded-[12px] py-[0.625rem] text-[0.875rem] font-medium transition-all ${tab === t.key ? "bg-[#fff] text-[#111]" : "text-[rgba(255,255,255,0.6)] hover:text-[#fff]"}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex h-[300px] items-center justify-center rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] backdrop-blur-xl">
              <div className="text-[rgba(255,255,255,0.5)] font-medium">Loading...</div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* PRODUCTS TAB */}
              {tab === "products" && (
                <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <div className="mb-[1rem] flex items-center justify-between">
                    <span className="text-[0.875rem] text-[rgba(255,255,255,0.5)]">{products.length} product{products.length !== 1 ? "s" : ""}</span>
                    <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-[0.5rem] rounded-[12px] bg-[#fff] px-[1rem] py-[0.5rem] text-[0.875rem] font-medium text-[#111] transition-transform hover:scale-[1.02] active:scale-[0.98]">
                      <Plus className="h-4 w-4" /> Add Product
                    </button>
                  </div>

                  {/* Product Form Modal */}
                  {showForm && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(0,0,0,0.6)] p-4 backdrop-blur-sm" onClick={resetForm}>
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-[32rem] overflow-hidden rounded-[2rem] bg-[#fff] p-[2rem] shadow-2xl">
                        <button onClick={resetForm} className="absolute right-[1rem] top-[1rem] grid h-[2rem] w-[2rem] place-items-center rounded-full bg-[rgba(0,0,0,0.05)] text-[rgba(0,0,0,0.5)] hover:bg-[rgba(0,0,0,0.1)]"><X className="h-4 w-4" /></button>
                        <h3 className="mb-[1.5rem] text-[1.25rem] font-semibold">{editing ? "Edit Product" : "New Product"}</h3>
                        <form onSubmit={handleSave} className="flex flex-col gap-[1rem]">
                          <input required placeholder="Product name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-[0.75rem] border border-[#e2e2e2] bg-[#f8f8f8] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none focus:border-[#111]" />
                          <textarea required placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-[0.75rem] border border-[#e2e2e2] bg-[#f8f8f8] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none focus:border-[#111] resize-none" />
                          <div className="grid grid-cols-2 gap-[1rem]">
                            <input required type="number" step="0.01" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full rounded-[0.75rem] border border-[#e2e2e2] bg-[#f8f8f8] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none focus:border-[#111]" />
                            <input required type="number" placeholder="Stock" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="w-full rounded-[0.75rem] border border-[#e2e2e2] bg-[#f8f8f8] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none focus:border-[#111]" />
                          </div>
                          <input required placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-[0.75rem] border border-[#e2e2e2] bg-[#f8f8f8] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none focus:border-[#111]" />
                          <input placeholder="Image URL" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="w-full rounded-[0.75rem] border border-[#e2e2e2] bg-[#f8f8f8] px-[1rem] py-[0.75rem] text-[0.875rem] outline-none focus:border-[#111]" />
                          <label className="flex items-center gap-[0.5rem] text-[0.875rem]">
                            <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} className="h-4 w-4" />
                            Featured product
                          </label>
                          <div className="flex justify-end gap-[0.75rem] pt-[0.5rem]">
                            <button type="button" onClick={resetForm} className="rounded-[0.75rem] px-[1rem] py-[0.625rem] text-[0.875rem] text-[rgba(0,0,0,0.5)] hover:text-[#111]">Cancel</button>
                            <button type="submit" className="rounded-[0.75rem] bg-[#111] px-[1.5rem] py-[0.625rem] text-[0.875rem] font-medium text-[#fff] hover:bg-[#333]">{editing ? "Update" : "Create"}</button>
                          </div>
                        </form>
                      </motion.div>
                    </div>
                  )}

                  {/* Products list */}
                  <div className="flex flex-col gap-[0.75rem]">
                    {products.length === 0 ? (
                      <div className="flex h-[200px] flex-col items-center justify-center rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] text-[rgba(255,255,255,0.5)]">No products yet. Add your first product!</div>
                    ) : products.map((p) => (
                      <div key={p._id} className="flex items-center gap-[1rem] rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-[1rem] backdrop-blur-xl transition-colors hover:bg-[rgba(255,255,255,0.06)]">
                        {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="h-[4rem] w-[4rem] rounded-[12px] object-cover" /> : <div className="grid h-[4rem] w-[4rem] place-items-center rounded-[12px] bg-[rgba(255,255,255,0.05)]"><Package className="h-5 w-5 text-[rgba(255,255,255,0.3)]" /></div>}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-[0.5rem]">
                            <span className="text-[1rem] font-medium text-[#fff] truncate">{p.name}</span>
                            {p.isFeatured && <span className="rounded-full bg-[rgba(255,255,255,0.1)] px-[0.5rem] py-[0.125rem] text-[0.65rem] font-medium text-[rgba(255,255,255,0.6)]">Featured</span>}
                          </div>
                          <div className="text-[0.75rem] text-[rgba(255,255,255,0.4)]">{p.category} — Stock: {p.stock}</div>
                        </div>
                        <div className="text-[1rem] font-semibold text-[#fff]">${Number(p.price).toFixed(2)}</div>
                        <div className="flex gap-[0.5rem]">
                          <button onClick={() => openEdit(p)} className="grid h-[2rem] w-[2rem] place-items-center rounded-[8px] text-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,255,255,0.1)] hover:text-[#fff]"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(p._id)} className="grid h-[2rem] w-[2rem] place-items-center rounded-[8px] text-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,0,0,0.1)] hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ORDERS TAB */}
              {tab === "orders" && (
                <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex flex-col gap-[0.75rem]">
                  {orders.length === 0 ? (
                    <div className="flex h-[200px] flex-col items-center justify-center rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] text-[rgba(255,255,255,0.5)]">No orders yet.</div>
                  ) : orders.map((o) => (
                    <div key={o._id} className="rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-[1.25rem] backdrop-blur-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[0.875rem] font-medium text-[#fff]">Order #{o._id.slice(-8)}</div>
                          <div className="text-[0.75rem] text-[rgba(255,255,255,0.4)]">{new Date(o.createdAt).toLocaleDateString()} — {o.items?.length ?? 0} item(s)</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[1rem] font-semibold text-[#fff]">${Number(o.totalAmount).toFixed(2)}</div>
                          <div className="relative">
                            <select value={o.status} onChange={e => handleStatusChange(o._id, e.target.value)} className="appearance-none rounded-[8px] border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.05)] px-[0.75rem] py-[0.25rem] pr-[1.5rem] text-[0.75rem] font-medium text-[rgba(255,255,255,0.8)] outline-none cursor-pointer">
                              {["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-[0.375rem] top-1/2 h-3 w-3 -translate-y-1/2 text-[rgba(255,255,255,0.4)]" />
                          </div>
                        </div>
                      </div>
                      {o.shippingAddress && (
                        <div className="mt-[0.75rem] border-t border-[rgba(255,255,255,0.08)] pt-[0.75rem] text-[0.75rem] text-[rgba(255,255,255,0.4)]">
                          {o.shippingAddress.street}, {o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.zipCode}
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}

              {/* USERS TAB */}
              {tab === "users" && (
                <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex flex-col gap-[0.75rem]">
                  {users.length === 0 ? (
                    <div className="flex h-[200px] flex-col items-center justify-center rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] text-[rgba(255,255,255,0.5)]">No users found.</div>
                  ) : users.map((u) => (
                    <div key={u._id} className="flex items-center justify-between rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-[1rem] backdrop-blur-xl">
                      <div className="flex items-center gap-[0.75rem]">
                        <div className="grid h-[2.5rem] w-[2.5rem] place-items-center rounded-full bg-[rgba(255,255,255,0.08)] text-[0.875rem] font-medium text-[#fff]">
                          {(u.name || u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[0.875rem] font-medium text-[#fff]">{u.name || "—"}</div>
                          <div className="text-[0.75rem] text-[rgba(255,255,255,0.4)]">{u.email}</div>
                        </div>
                      </div>
                      <span className={`rounded-full px-[0.75rem] py-[0.25rem] text-[0.7rem] font-medium ${u.role === "Admin" ? "bg-[rgba(255,255,255,0.15)] text-[#fff]" : "bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.5)]"}`}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </section>
  );
}
