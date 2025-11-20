'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaHome, FaArrowLeft } from 'react-icons/fa';

export default function NotFound() {
  const handleGoBack = () => {
    if (typeof window === 'undefined') return;
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.assign('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--login-bg-start)] via-[var(--login-bg-mid)] to-[var(--login-bg-end)] flex items-center justify-center relative p-8">
      <div className="w-full max-w-7xl flex justify-center items-center">
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <span className="text-6xl md:text-[12rem] font-bold text-white leading-none [text-shadow:0_0_40px_rgba(155,198,233,0.5)]">
            4
          </span>
          <div className="flex flex-col items-center gap-6">
            <Image src="/404.png" width={220} height={220} alt="Lost astronaut" priority />
            <p className="text-white text-base md:text-xl text-center leading-relaxed opacity-90">
              This Page Is Under Construction.
              <br />
              <span className="opacity-80">Come Back Soon!</span>
            </p>
          </div>
          <span className="text-6xl md:text-[12rem] font-bold text-white leading-none [text-shadow:0_0_40px_rgba(155,198,233,0.5)]">
            4
          </span>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 flex flex-col gap-4 z-10">
        <button
          type="button"
          onClick={handleGoBack}
          aria-label="Go Back"
          className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 border border-white/30 text-white flex items-center justify-center cursor-pointer transition-all duration-200 backdrop-blur-sm hover:bg-white/20 hover:border-white/50 hover:scale-105"
        >
          <FaArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <Link
          href="/"
          aria-label="Go Home"
          className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 border border-white/30 text-white flex items-center justify-center cursor-pointer transition-all duration-200 backdrop-blur-sm no-underline hover:bg-white/20 hover:border-white/50 hover:scale-105"
        >
          <FaHome className="w-5 h-5 md:w-6 md:h-6" />
        </Link>
      </div>
    </div>
  );
}
