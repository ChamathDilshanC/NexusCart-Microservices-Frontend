"use client";

import React, { useEffect, useRef, useState } from "react";
import { Menu, X, Plus, Star, Package, ArrowRight } from "lucide-react";

const HERO_VIDEO =
  "https://cdn.sceneai.art/Hero%20Section%20Video/50b4f304-cdca-4e12-8735-580d225834be.mp4";
const STOREFRONT_VIDEO =
  "https://cdn.sceneai.art/Hero%20Section%20Video/1bcc8fa3-37f6-4c53-8591-0347e4c7f8ac.mp4";
const TRACKING_VIDEO =
  "https://cdn.sceneai.art/Hero%20Section%20Video/736fd4a0-70ac-4f44-9633-55769ead6aca.mp4";

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

/* ---------------------------------- FadeInUp ---------------------------------- */

function FadeInUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------------------------------- Logo ---------------------------------- */

function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <img
      src="/Logo/Logo%20with%20out%20Text.png"
      alt="NexusCart"
      className={`${className} object-contain`}
    />
  );
}

/* ---------------------------------- Navbar ---------------------------------- */

const NAV_LINKS = [
  { label: "About", href: "about" },
  { label: "Features", href: "features" },
  { label: "FAQ", href: "faq" },
  { label: "Contact", href: "contact" },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setMobileOpen(false);
    scrollToId(id);
  };

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/80 backdrop-blur-md border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative flex items-center justify-between h-20">
          <a
            href="#about"
            onClick={(e) => handleNavClick(e, "about")}
            className="flex items-center gap-2.5 shrink-0"
          >
            <BrandMark className="h-8 w-8" />
            <span className="text-lg font-semibold tracking-tight text-white">
              NexusCart
            </span>
          </a>

          <div className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={`#${l.href}`}
                onClick={(e) => handleNavClick(e, l.href)}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:block">
            <a
              href="/shop"
              className="bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-5 py-2.5 rounded-full border border-white/5 transition-colors"
            >
              Get started
            </a>
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 pb-6 flex flex-col gap-4 bg-black/95 backdrop-blur-md border-b border-white/5">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={`#${l.href}`}
              onClick={(e) => handleNavClick(e, l.href)}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a
            href="/shop"
            className="bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-5 py-2.5 rounded-full border border-white/5 text-center transition-colors"
          >
            Get started
          </a>
        </div>
      </div>
    </nav>
  );
}

/* ---------------------------------- Marquee ---------------------------------- */

function IconDiamond() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="6" y="6" width="12" height="12" rx="2" transform="rotate(45 12 12)" />
    </svg>
  );
}
function IconHex() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5" strokeLinejoin="round" />
    </svg>
  );
}
function IconSquare() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="4" width="16" height="16" rx="4" />
    </svg>
  );
}
function IconOrbit() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconTriangle() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="12,4 21,20 3,20" strokeLinejoin="round" />
    </svg>
  );
}

const TECH_STACK: { name: string; icon: React.ReactNode }[] = [
  { name: "Next.js", icon: <IconDiamond /> },
  { name: "Node.js", icon: <IconHex /> },
  { name: "TypeScript", icon: <IconSquare /> },
  { name: "MongoDB", icon: <IconOrbit /> },
  { name: "Azure Cloud", icon: <IconTriangle /> },
];

function Marquee() {
  const items = Array(4).fill(TECH_STACK).flat();
  return (
    <div className="w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div className="flex w-max animate-[marquee_30s_linear_infinite]">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 flex-shrink-0 px-8 text-gray-500">
            {item.icon}
            <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- Hero ---------------------------------- */

function Hero() {
  return (
    <section
      id="about"
      className="min-h-screen flex flex-col items-center justify-center pt-32 pb-20 relative z-0 px-6"
    >
      <video
        className="absolute inset-0 -z-10 w-full h-full object-cover min-w-full min-h-full opacity-90"
        src={HERO_VIDEO}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/30 via-transparent to-black" />

      <FadeInUp>
        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300 mb-8 backdrop-blur-sm">
          ✨ Introducing Vendor Storefronts
        </span>
      </FadeInUp>

      <FadeInUp delay={100}>
        <h1 className="text-5xl md:text-7xl font-medium tracking-tight mb-6 text-center text-white">
          The commerce platform
          <br />
          built for <span className="font-serif italic font-normal">growth.</span>
        </h1>
      </FadeInUp>

      <FadeInUp delay={200}>
        <p className="text-[16px] text-gray-400 max-w-2xl text-center mb-10">
          NexusCart brings shoppers and sellers together on one fast, secure platform —
          from storefront setup to doorstep delivery.
        </p>
      </FadeInUp>

      <FadeInUp delay={300}>
        <div className="flex flex-row items-center gap-4">
          <a
            href="/shop"
            className="bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors"
          >
            Get started
          </a>
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              scrollToId("features");
            }}
            className="bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-6 py-3 rounded-full border border-white/5 transition-colors"
          >
            Learn more
          </a>
        </div>
      </FadeInUp>

      <FadeInUp delay={400} className="w-full">
        <p className="text-sm text-gray-500 font-medium mb-8 text-center mt-24">
          Powered by modern technology
        </p>
        <Marquee />
      </FadeInUp>
    </section>
  );
}

/* ---------------------------------- Feature: Storefronts ---------------------------------- */

const STORE_CHIPS = ["Electronics", "Fashion", "Home & Living"];

function FeatureStorefronts() {
  return (
    <section
      id="features"
      className="grid lg:grid-cols-2 gap-16 py-24 px-6 max-w-7xl mx-auto items-center"
    >
      <FadeInUp>
        <div>
          <span className="text-sm font-medium text-yellow-400 mb-4 inline-block">
            ✨ Vendor storefronts
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold mb-6 tracking-tight text-white">
            Where sellers build their own storefront.
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Approved vendors get a branded storefront with a custom theme, banners,
            and social links — everything they need to start selling in minutes,
            no separate website required.
          </p>
          <a
            href="/shop"
            className="inline-block bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors"
          >
            Get started
          </a>
        </div>
      </FadeInUp>

      <FadeInUp delay={150}>
        <div className="rounded-3xl overflow-hidden p-8 border border-white/10 relative min-h-[420px] flex items-center">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src={STOREFRONT_VIDEO}
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="absolute inset-0 bg-black/20" />

          <div className="relative w-full bg-[#1C1C1E]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4 overflow-x-auto">
              {STORE_CHIPS.map((c) => (
                <span
                  key={c}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300"
                >
                  {c}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 bg-black/40 rounded-xl p-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-sm font-semibold text-white shrink-0">
                UT
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Urban Threads</p>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  4.9 · Approved seller
                </div>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-full bg-white text-black font-medium shrink-0">
                Follow
              </span>
            </div>

            <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-3">
              <span className="text-sm text-gray-400 flex-1 truncate">
                nexuscart.com/store/urban-threads
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
            </div>
          </div>
        </div>
      </FadeInUp>
    </section>
  );
}

/* ---------------------------------- Feature: Order Tracking ---------------------------------- */

const ORDER_STEPS = ["Pending", "Paid", "Shipped", "Delivered"];

function FeatureTracking() {
  return (
    <section className="grid lg:grid-cols-2 gap-16 py-24 px-6 max-w-7xl mx-auto items-center">
      <FadeInUp className="order-2 lg:order-1">
        <div className="rounded-3xl overflow-hidden p-8 border border-white/10 relative min-h-[420px] flex items-center">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src={TRACKING_VIDEO}
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="absolute inset-0 bg-black/20" />

          <div className="relative w-full bg-[#1C1C1E]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Order #NC-48213</p>
                <p className="text-xs text-gray-500">11:06 AM · Chris</p>
              </div>
            </div>

            <div className="flex items-center mb-4">
              {ORDER_STEPS.map((step, i) => (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        i <= 2 ? "bg-emerald-400" : "bg-white/15"
                      }`}
                    />
                    <span className="text-[10px] text-gray-500 whitespace-nowrap">
                      {step}
                    </span>
                  </div>
                  {i < ORDER_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-px mx-1 mb-4 ${
                        i < 2 ? "bg-emerald-400/60" : "bg-white/10"
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="space-y-2 text-sm text-gray-400 border-t border-white/10 pt-3">
              <p>
                Wireless Headphones <span className="text-gray-600">× 1</span>
              </p>
              <p>Shipped via NexusCart Logistics</p>
              <p className="text-emerald-400">Estimated delivery: Aug 20</p>
            </div>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp delay={150} className="order-1 lg:order-2">
        <div>
          <span className="text-sm font-medium text-emerald-400 mb-4 inline-block">
            ✨ Order tracking
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold mb-6 tracking-tight text-white">
            Know exactly where your order is, every step.
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            From checkout to your doorstep, track every order in real time —
            Pending, Paid, Shipped, and Delivered — with instant status updates
            along the way.
          </p>
          <a
            href="/shop"
            className="inline-block bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors"
          >
            Get started
          </a>
        </div>
      </FadeInUp>
    </section>
  );
}

/* ---------------------------------- FAQ ---------------------------------- */

const FAQS = [
  {
    q: "Is my payment information secure?",
    a: "Yes. Every transaction runs through an encrypted payment pipeline and is logged with a clear status — Pending, Completed, Failed, or Refunded — so you always know where your money is.",
  },
  {
    q: "How do I track my order?",
    a: "Once your order is placed, you can follow it through every stage — Pending, Paid, Shipped, and Delivered — directly from your account, with status updates at each step.",
  },
  {
    q: "Can I sell on NexusCart?",
    a: "Absolutely. Apply to become a vendor, and once approved you'll get your own branded storefront with a custom theme, banners, and social links to start selling right away.",
  },
  {
    q: "What is your return and refund policy?",
    a: "If something isn't right, refunds are processed back to your original payment method and reflected in your order status within a few business days.",
  },
  {
    q: "How do I verify my account?",
    a: "We send a one-time verification code to your email during sign-up, and you can also log in instantly with Google — no passwords to remember.",
  },
];

function FAQItem({ q, a, isLast }: { q: string; a: string; isLast: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={isLast ? "" : "border-b border-white/10"}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 py-6 px-6 text-left"
        aria-expanded={open}
      >
        <span className="text-base text-white font-medium">{q}</span>
        <Plus
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${
            open ? "rotate-45" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-gray-400 text-sm pb-6 px-6">{a}</p>
        </div>
      </div>
    </div>
  );
}

function FAQ() {
  return (
    <section id="faq" className="py-32 px-6 max-w-3xl mx-auto">
      <FadeInUp>
        <h2 className="text-4xl md:text-5xl font-semibold text-center mb-12 text-white">
          We've got answers
        </h2>
      </FadeInUp>
      <FadeInUp delay={100}>
        <div className="border border-white/10 rounded-xl bg-transparent">
          {FAQS.map((item, i) => (
            <FAQItem key={item.q} q={item.q} a={item.a} isLast={i === FAQS.length - 1} />
          ))}
        </div>
      </FadeInUp>
    </section>
  );
}

/* ---------------------------------- Footer ---------------------------------- */

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-white mb-4">{title}</h4>
      <ul className="flex flex-col gap-3">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  return (
    <footer id="contact" className="relative z-0 pt-32 pb-10 px-6 border-t border-white/5">
      <video
        className="absolute inset-0 -z-10 w-full h-full object-cover opacity-40"
        src={HERO_VIDEO}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black via-black/60 to-black" />

      <FadeInUp>
        <h2 className="text-4xl md:text-5xl font-medium text-center tracking-tight text-white">
          Ready to launch your <span className="font-serif italic font-normal">store?</span>
        </h2>
      </FadeInUp>

      <FadeInUp delay={100}>
        <div className="flex flex-row items-center justify-center gap-4 mt-8 mb-32">
          <a
            href="/shop"
            className="bg-white hover:bg-gray-200 text-black text-sm font-medium px-6 py-3 rounded-full transition-colors"
          >
            Get started
          </a>
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              scrollToId("features");
            }}
            className="bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-6 py-3 rounded-full border border-white/5 transition-colors"
          >
            Learn more
          </a>
        </div>
      </FadeInUp>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto mb-24">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <BrandMark className="h-7 w-7" />
            <span className="text-xl font-bold text-white">NexusCart</span>
          </div>
          <p className="text-sm text-gray-400">
            Shopping and selling, unified in one platform.
          </p>
        </div>

        <FooterCol
          title="Product"
          links={[
            { label: "Shop", href: "/shop" },
            { label: "Sell on NexusCart", href: "/business" },
            { label: "Track order", href: "/profile" },
            { label: "Contact", href: "#contact" },
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            { label: "Terms of service", href: "/terms" },
            { label: "Privacy policy", href: "/privacy" },
            { label: "404", href: "/not-found" },
          ]}
        />
        <FooterCol
          title="Connect"
          links={[
            { label: "Instagram", href: "#" },
            { label: "Facebook", href: "#" },
            { label: "WhatsApp", href: "#" },
            { label: "Twitter / X", href: "#" },
          ]}
        />
      </div>

      <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-xs text-gray-500 border-t border-white/5 pt-8 max-w-7xl mx-auto">
        <span>© 2026 NexusCart. All rights reserved</span>
        <span className="hidden md:inline">·</span>
        <span>
          by <span className="text-gray-300">ChamathDilshanC</span>
        </span>
        <span className="hidden md:inline">·</span>
        <span>
          Powered by <span className="text-gray-300">Next.js</span>
        </span>
      </div>
    </footer>
  );
}

/* ---------------------------------- Page ---------------------------------- */

export default function LandingPage() {
  return (
    <main className="bg-black text-white min-h-screen">
      <Navbar />
      <Hero />
      <FeatureStorefronts />
      <FeatureTracking />
      <FAQ />
      <Footer />
    </main>
  );
}
