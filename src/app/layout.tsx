import type { Metadata } from "next";
import { Onest } from "next/font/google";
import "./globals.css";

const onest = Onest({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NexusCart — Buy and sell, beautifully.",
  description:
    "NexusCart is a multi-vendor e-commerce platform that brings shoppers and sellers together — branded storefronts, real-time order tracking, and secure checkout in one place.",
  icons: {
    icon: "/Logo/Logo%20with%20out%20Text.png",
  },
  openGraph: {
    title: "NexusCart — Buy and sell, beautifully.",
    description:
      "A multi-vendor e-commerce platform built for modern shoppers and sellers.",
    images: [
      {
        url: "/Logo/Logo%20with%20out%20Text.png",
        width: 1200,
        height: 630,
        alt: "NexusCart",
      },
    ],
  },
};

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${onest.variable} scroll-smooth`}>
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
