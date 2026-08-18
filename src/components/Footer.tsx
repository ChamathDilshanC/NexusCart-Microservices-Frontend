import Link from "next/link";

const QUICK_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "About us", href: "#" },
  { label: "FAQ", href: "#" },
  { label: "Contact us", href: "mailto:support@nexuscart.tech" },
];

const LEGAL_LINKS = [
  { label: "Terms of service", href: "#" },
  { label: "Privacy policy", href: "#" },
  { label: "Cookie policy", href: "#" },
];

const SOCIAL_LINKS = [
  { label: "Facebook", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "Twitter", href: "#" },
  { label: "Youtube", href: "#" },
];

export function Footer() {
  return (
    <footer className="print:hidden border-t border-white/5 bg-black">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr_1fr] gap-10">
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <img
                src="/Logo/Logo%20with%20out%20Text.png"
                alt="NexusCart"
                className="h-7 w-7 object-contain"
              />
              <span className="text-base font-semibold tracking-tight text-white">NexusCart</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              123 Marina Walk, Level 4
              <br />
              Colombo 03, Western Province
              <br />
              Sri Lanka
            </p>
            <div className="mt-5 flex flex-col gap-2 text-sm">
              <div>
                <span className="text-gray-600">Phone number</span>
                <p className="text-gray-300">+94 11 234 5678</p>
              </div>
              <div>
                <span className="text-gray-600">Email</span>
                <p className="text-gray-300">support@nexuscart.tech</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Quick links</h3>
            <ul className="flex flex-col gap-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Social</h3>
            <ul className="flex flex-col gap-3">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Legal</h3>
            <ul className="flex flex-col gap-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} NexusCart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
