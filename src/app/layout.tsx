import type { Metadata } from "next";
import { Onest } from "next/font/google";
import "./globals.css";
import { ScrollProvider } from "@/components/ScrollProvider";
import { AppStateProvider } from "@/components/Shared";

const onest = Onest({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NexusCart — Enterprise E-commerce Platform",
  description: "NexusCart is a highly scalable, microservices-based e-commerce platform built for modern businesses.",
  icons: {
    icon: "/Logo/Logo with out Text.png",
    apple: "/Logo/Logo with out Text.png",
  },
  openGraph: {
    images: [
      {
        url: "/Logo/Logo with Text.png",
        width: 1200,
        height: 630,
        alt: "NexusCart Logo",
      }
    ],
  },
};

export const viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={onest.variable}>
      <head>
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body className="antialiased">
        <ScrollProvider>
          <AppStateProvider>
            {children}
          </AppStateProvider>
        </ScrollProvider>
      </body>
    </html>
  );
}
