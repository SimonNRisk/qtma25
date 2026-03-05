'use client';
import HowItWorks from "@/components/HowItWorks";
import AnimatedBackground from "@/components/AnimatedBackground";
import Features from "@/components/Features";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import DemoVideo from "@/components/demo-video";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
export default function Home() {
  const { scrollY } = useScroll();
  const navOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const navY = useTransform(scrollY, [0, 300], [0, 50]);
  const pointerEvents = useTransform(scrollY, [0, 300], ["auto", "none"]);
  return (
    <main className="relative min-h-screen flex flex-col font-sans overflow-hidden bg-[#fdfdfd] text-[#4A4440]">
      {/* Landing Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center">
        <AnimatedBackground />
        {/* Centered Content */}
        <div className="relative z-20 flex flex-col items-center justify-center">
          {/* Faint sub-logo above main text */}
          <div className="absolute top-[-25%] left-4 sm:left-6 md:left-6 lg:left-8 z-30 opacity-80 pointer-events-none">
            <div className="relative w-40 h-16 sm:w-56 sm:h-20 shrink-0">
              <Image
                src="/assets/astrologo.png"
                alt="Astro Logo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </div>
          <h1 className="flex flex-col justify-center items-center gap-1 px-6 text-center">
            <span className="font-poppins font-[800] text-[40px] sm:text-[60px] md:text-[80px] lg:text-[100px] leading-[1] tracking-wide uppercase">
              CREATE CONTENT
            </span>
            <span className="font-playfair italic font-medium text-[40px] sm:text-[60px] md:text-[80px] lg:text-[100px] leading-[1]">
              Differently
            </span>
          </h1>
        </div>
      </div>
      <HowItWorks />
      {/* Video Demo Section */}
      <DemoVideo />
      <Features />
      <FAQ />
      <Footer />
      {/* Floating Bottom Navigation */}
      <motion.nav
        className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-50"
        style={{
          opacity: navOpacity,
          y: navY,
          pointerEvents: pointerEvents as any
        }}
      >
        <div className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 rounded-[40px] border-[3px] border-gray-700/50 bg-white/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
          {/* Left Icon */}
          <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/70 shadow-sm shrink-0">
            <div className="relative w-5 h-5 md:w-6 md:h-6 opacity-80">
              <Image
                src="/assets/new_logo.png"
                alt="Nav Icon"
                fill
                className="object-contain"
              />
            </div>
          </div>
          {/* Center Links (Hidden on small screens) */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-10 text-[15px] font-medium tracking-tight text-gray-700">
            <a href="#how-it-works" className="hover:text-black transition-colors relative group">
              How It Works
              <span className="absolute -right-2 -top-0.5 text-black opacity-0 group-hover:opacity-100 transition-opacity text-xs">&bull;</span>
            </a>
            <span className="text-gray-300">|</span>
            <a href="#features" className="hover:text-black transition-colors relative group">
              Features
              <span className="absolute -right-2 -top-0.5 text-black opacity-0 group-hover:opacity-100 transition-opacity text-xs">&bull;</span>
            </a>
            <span className="text-gray-300">|</span>
            <a href="#faq" className="hover:text-black transition-colors relative group">
              FAQ
              <span className="absolute -right-2 -top-0.5 text-black opacity-0 group-hover:opacity-100 transition-opacity text-xs">&bull;</span>
            </a>
            <span className="text-gray-300">|</span>
            <a href="#contact" className="hover:text-black transition-colors relative group">
              Contact
              <span className="absolute -right-2 -top-0.5 text-black opacity-0 group-hover:opacity-100 transition-opacity text-xs">&bull;</span>
            </a>
          </div>
          {/* Right Action Button */}
          <Link href="/onboarding" className="flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 rounded-full bg-[#f1f1f1] hover:bg-white text-[#4A4440] font-medium text-[14px] md:text-[15px] transition-all border border-transparent hover:border-gray-200 shadow-sm">
            <span className="text-lg leading-none">+</span>
            Launch
          </Link>
        </div>
      </motion.nav>
    </main>
  );
}
