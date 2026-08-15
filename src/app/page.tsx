"use client";

import React from "react";
import { PageLoader } from "@/components/PageLoader";
import { Header, NavMenu } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { About, CreateBand, Portfolio, Services, Stats, Footer } from "@/components/Sections";
import { RequestModal } from "@/components/RequestModal";
import { AuthModal } from "@/components/AuthModal";

export default function Home() {
  return (
    <>
      <a 
        href="#main" 
        className="sr-only focus:not-sr-only focus:fixed focus:left-[1rem] focus:top-[1rem] focus:z-60 focus:rounded-[0.875rem] focus:bg-[var(--color-ink)] focus:p-[0.5rem_1rem] focus:text-[0.875rem] focus:text-[#fff]"
      >
        Skip to content
      </a>

      <PageLoader />
      <Header />
      <NavMenu />
      
      <main id="main" className="flex flex-col">
        <Hero />
        <About />
        <CreateBand />
        <Portfolio />
        <Services />
        <Stats />
      </main>
      
      <Footer />
      <RequestModal />
      <AuthModal />
    </>
  );
}
