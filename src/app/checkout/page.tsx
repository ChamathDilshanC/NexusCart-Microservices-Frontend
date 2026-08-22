"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  CreditCard,
  Truck,
  Wallet,
  AlertCircle,
  RefreshCw,
  Loader2,
  ImageOff,
  ChevronDown,
  Search,
} from "lucide-react";
import PhoneNumberInput, { type Country, getCountries, getCountryCallingCode } from "react-phone-number-input/input";
import phoneInputFlags from "react-phone-number-input/flags";
import phoneInputCountryNames from "react-phone-number-input/locale/en.json";
import { AppHeader } from "@/components/AppHeader";
import { useCart } from "@/components/providers/CartProvider";
import { useAppState } from "@/components/providers/AppStateProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { apiFetch, ApiError } from "@/lib/api";

/* ------------------------------- Types ------------------------------- */

type PaymentMethod = "Credit / Debit Card" | "Cash on Delivery" | "Digital Wallet";

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface OrderRecord {
  _id: string;
  totalAmount: number;
  [key: string]: unknown;
}

interface OrderResponse {
  message: string;
  order: OrderRecord;
}

// The PayHere checkout payload payment-service builds — includes the
// security hash, so this is POSTed straight to PayHere's hosted payment
// page via a hidden auto-submitting form rather than through apiFetch.
interface PayHerePaymentData {
  sandbox: boolean;
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  amount: string;
  currency: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash: string;
}

function redirectToPayHere(paymentData: PayHerePaymentData) {
  const gatewayUrl = paymentData.sandbox
    ? "https://sandbox.payhere.lk/pay/checkout"
    : "https://www.payhere.lk/pay/checkout";

  const form = document.createElement("form");
  form.method = "POST";
  form.action = gatewayUrl;
  for (const [key, value] of Object.entries(paymentData)) {
    if (key === "sandbox" || value === undefined || value === null) continue;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: "Credit / Debit Card", label: "Credit / Debit Card", icon: <CreditCard className="w-4 h-4" /> },
  { value: "Cash on Delivery", label: "Cash on Delivery", icon: <Truck className="w-4 h-4" /> },
  { value: "Digital Wallet", label: "Digital Wallet", icon: <Wallet className="w-4 h-4" /> },
];

// react-phone-number-input's built-in country dropdown is a native OS
// <select> — can't be restyled to match the dark theme, no search, and its
// options only show the country name with no calling code. Below builds a
// fully custom picker instead, paired with the library's headless number
// input (react-phone-number-input/input, no built-in select of its own).

const ALL_COUNTRIES = getCountries();

// "(+code)" appended to every label — lets you tell similarly-named
// countries apart and confirm the calling code before picking one.
const PHONE_INPUT_LABELS: Record<string, string> = { ...phoneInputCountryNames };
for (const country of ALL_COUNTRIES) {
  const name = (phoneInputCountryNames as Record<string, string>)[country];
  if (name) PHONE_INPUT_LABELS[country] = `${name} (+${getCountryCallingCode(country)})`;
}

function PhoneCountrySelect({
  value,
  onChange,
  disabled,
}: {
  value?: Country;
  onChange: (country: Country) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setSearch("");
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_COUNTRIES;
    return ALL_COUNTRIES.filter((c) => {
      const label = (phoneInputCountryNames as Record<string, string>)[c] || c;
      return label.toLowerCase().includes(q) || c.toLowerCase().includes(q) || getCountryCallingCode(c).includes(q);
    });
  }, [search]);

  const SelectedFlag = value ? phoneInputFlags[value] : undefined;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label="Select country code"
        className="flex items-center gap-1.5 h-full px-3 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors disabled:opacity-50"
      >
        <span className="w-6 h-4 rounded-sm overflow-hidden shrink-0 flex items-center justify-center bg-white/10">
          {SelectedFlag && <SelectedFlag title={value ? PHONE_INPUT_LABELS[value] || value : ""} />}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-72 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="relative p-2 border-b border-white/10">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or code..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30"
            />
          </div>
          <div className="max-h-64 overflow-y-auto nexus-country-scroll">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-gray-500">No countries match.</div>
            ) : (
              filtered.map((c) => {
                const Flag = phoneInputFlags[c];
                const label = PHONE_INPUT_LABELS[c] || c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      onChange(c);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors ${
                      c === value ? "bg-white/10 text-white" : "text-gray-300"
                    }`}
                  >
                    <span className="w-6 h-4 rounded-sm overflow-hidden shrink-0 flex items-center justify-center bg-white/10">
                      {Flag && <Flag title={label} />}
                    </span>
                    <span className="truncate">{label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Page -------------------------------- */

export default function CheckoutPage() {
  const router = useRouter();
  const toast = useToast();
  const { formatPrice, selectedCurrency, exchangeRate } = useCurrency();
  const { items, subtotal, clear } = useCart();
  const { currentUser, isAuthInitialized } = useAppState();

  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState(phoneInputCountryNames.LK || "Sri Lanka");
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [phoneCountry, setPhoneCountry] = useState<Country>("LK");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Credit / Debit Card");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  // Auth gate: bounce unauthenticated users to sign-in once we know auth state.
  useEffect(() => {
    if (isAuthInitialized && !currentUser) {
      router.replace("/auth?view=login");
    }
  }, [isAuthInitialized, currentUser, router]);

  // Card / Digital Wallet both go through PayHere's hosted checkout page
  // (which itself offers card entry plus local wallets) — get the signed
  // payload from payment-service, then hand the browser off to PayHere.
  // Cart is intentionally NOT cleared here: the browser is about to leave
  // the site entirely, and the payment could still fail or be cancelled
  // once there — clearing happens on the /payment/success return instead.
  const runPayment = async (orderId: string, amount: number) => {
    try {
      const nameParts = (currentUser?.name || "Customer").trim().split(/\s+/);
      const firstName = nameParts[0] || "Customer";
      const lastName = nameParts.slice(1).join(" ") || firstName;

      const paymentData = await apiFetch<PayHerePaymentData>("/payments/initiate", {
        method: "POST",
        body: {
          orderId,
          amount,
          customer: {
            firstName,
            lastName,
            email: currentUser?.email,
            phone,
            address: street,
            city,
          },
        },
      });
      redirectToPayHere(paymentData);
    } catch (err) {
      setPaymentFailed(true);
      toast.error(err instanceof ApiError ? err.message : "Could not start payment. Please try again.");
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!street.trim() || !city.trim() || !state.trim() || !zipCode.trim() || !country.trim() || !phone) {
      setFormError("Please fill in all shipping fields.");
      return;
    }

    setSubmitting(true);
    try {
      const shippingAddress: ShippingAddress = {
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        country: country.trim(),
      };
      const orderItems = items.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        imageUrl: i.imageUrl,
      }));

      const res = await apiFetch<OrderResponse>("/orders", {
        method: "POST",
        body: {
          items: orderItems,
          shippingAddress,
          customerEmail: currentUser?.email,
          customerName: currentUser?.name,
          customerPhone: phone,
          currency: selectedCurrency,
          exchangeRate,
        },
      });

      const createdOrder = res.order;
      setOrder(createdOrder);

      if (paymentMethod === "Cash on Delivery") {
        // No gateway involved — order stays PENDING until paid on delivery.
        clear();
        setSucceeded(true);
        setSubmitting(false);
        toast.success("Order placed! Pay when your order is delivered.");
        router.push("/profile");
        return;
      }

      // Immediately attempt payment as one continuous checkout step.
      await runPayment(createdOrder._id, createdOrder.totalAmount);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to place order. Please try again.");
      setSubmitting(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!order) return;
    setSubmitting(true);
    setPaymentFailed(false);
    await runPayment(order._id, order.totalAmount);
  };

  if (!isAuthInitialized || (isAuthInitialized && !currentUser)) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-6 py-24 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
        </div>
      </div>
    );
  }

  const showEmptyCart = items.length === 0 && !order && !succeeded;

  return (
    <div className="min-h-screen bg-black text-white">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-8">Checkout</h1>

        {showEmptyCart ? (
          <div className="flex flex-col items-center justify-center text-center py-24 bg-[#111113] border border-white/10 rounded-2xl">
            <div className="grid place-items-center h-16 w-16 rounded-full bg-white/5 mb-6">
              <ImageOff className="w-7 h-7 text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Your cart is empty</h2>
            <p className="text-gray-500 text-sm mb-8">Add some products before checking out.</p>
            <Link
              href="/shop"
              className="bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 flex flex-col gap-6">
              {paymentFailed && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-red-300">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <h2 className="text-base font-semibold">Payment couldn't start</h2>
                  </div>
                  <p className="text-sm text-red-300/80">
                    Your order was created, but we couldn't reach the payment gateway. Your order is
                    saved — you can retry the same order below.
                  </p>
                  <button
                    onClick={handleRetryPayment}
                    disabled={submitting}
                    className="self-start flex items-center gap-2 bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" /> Retry payment
                      </>
                    )}
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="bg-[#111113] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <h2 className="text-base font-semibold text-white">Shipping address</h2>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Street address</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      disabled={!!order}
                      placeholder="123 Main St"
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-colors w-full disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Phone number</label>
                    <div className="flex gap-2">
                      <PhoneCountrySelect
                        value={phoneCountry}
                        disabled={!!order}
                        onChange={(selectedCountry) => {
                          setPhoneCountry(selectedCountry);
                          const name = (phoneInputCountryNames as Record<string, string>)[selectedCountry];
                          if (name) setCountry(name);
                        }}
                      />
                      <PhoneNumberInput
                        international
                        country={phoneCountry}
                        value={phone}
                        onChange={setPhone}
                        disabled={!!order}
                        placeholder="77 123 4567"
                        className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-colors disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={!!order}
                        placeholder="New York"
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-colors w-full disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">State / Province</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        disabled={!!order}
                        placeholder="NY"
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-colors w-full disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">ZIP / Postal code</label>
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        disabled={!!order}
                        placeholder="10001"
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-colors w-full disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">Country</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        disabled={!!order}
                        placeholder="United States"
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-colors w-full disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-[#111113] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                  <h2 className="text-base font-semibold text-white">Payment method</h2>
                  <div className="flex flex-col gap-2">
                    {PAYMENT_METHODS.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                          paymentMethod === opt.value
                            ? "border-white/30 bg-white/5"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={opt.value}
                          checked={paymentMethod === opt.value}
                          onChange={() => setPaymentMethod(opt.value)}
                          className="accent-white w-4 h-4"
                        />
                        <span className="text-gray-400">{opt.icon}</span>
                        <span className="text-sm text-white">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl px-4 py-3">
                    {formError}
                  </div>
                )}

                {!order && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Placing order...
                      </>
                    ) : (
                      "Place Order"
                    )}
                  </button>
                )}
              </form>
            </div>

            <div className="lg:sticky lg:top-24">
              <div className="bg-[#111113] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-white">Order Summary</h2>

                <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden shrink-0 bg-white/5">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageOff className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                        <span className="absolute -top-1.5 -right-1.5 grid place-items-center h-4 min-w-4 px-1 rounded-full bg-white text-black text-[10px] font-semibold">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{item.name}</p>
                      </div>
                      <p className="text-xs text-gray-400 shrink-0">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2 text-sm pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span className="text-white">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Shipping</span>
                    <span className="text-white">{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                  </div>
                  {subtotal < 50 && <p className="text-xs text-gray-500">Free shipping on orders over $50</p>}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-sm font-semibold text-white">Total</span>
                  <span className="text-lg font-semibold text-white">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .nexus-country-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
        }
        .nexus-country-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .nexus-country-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .nexus-country-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.15);
          border-radius: 9999px;
        }
        .nexus-country-scroll::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </div>
  );
}
