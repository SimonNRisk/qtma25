'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useRef } from 'react';

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const circleOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative min-h-screen flex flex-col overflow-hidden bg-background"
    >
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ opacity: circleOpacity }}
      >
        {/* Top right blue glow - moves in a circular pattern */}
        <motion.div
          className="absolute w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(137, 180, 216, 0.5) 0%, rgba(137, 180, 216, 0.3) 25%, rgba(137, 180, 216, 0.1) 50%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          initial={{ x: '60%', y: '-30%' }}
          animate={{
            x: ['60%', '70%', '60%', '50%', '60%'],
            y: ['-30%', '-20%', '-10%', '-20%', '-30%'],
            scale: [1, 1.1, 1.05, 1.15, 1],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
        />

        {/* Bottom left blue glow - moves in opposite pattern */}
        <motion.div
          className="absolute w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(137, 180, 216, 0.5) 0%, rgba(137, 180, 216, 0.3) 25%, rgba(137, 180, 216, 0.1) 50%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          initial={{ x: '-30%', y: '60%' }}
          animate={{
            x: ['-30%', '-40%', '-30%', '-20%', '-30%'],
            y: ['60%', '70%', '80%', '70%', '60%'],
            scale: [1.1, 1, 1.1, 1.05, 1.1],
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      {/* Soft fade to merge hero into page background */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 sm:h-40 bg-gradient-to-b from-transparent via-background/70 to-background" />

      <div className="relative z-10 flex-1 flex items-center justify-center container mx-auto px-4">
        <div className="text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12"
          >
            <h1 className="whitespace-nowrap text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold text-foreground leading-tight flex items-end gap-3 justify-center">
              <span className="relative inline-block pt-12">
                <Image
                  src="/images/astro-high-quality-20-281-29.png"
                  alt="Astro"
                  width={200}
                  height={60}
                  className="absolute -top-1 left-20 -translate-x-[60%] h-12 w-auto"
                />
                <span className="relative z-10">CREATE</span>
              </span>
              <span className="relative z-10">CONTENT</span>
              <span className="font-serif italic relative z-10 text-[var(--astro-sky)]">
                Differently.
              </span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Button
              asChild
              size="lg"
              className="group bg-astro-button-base hover:bg-astro-button-hover text-astro-text-dark px-16 py-6 text-2xl rounded-2xl transition-all duration-300 hover:scale-105 shadow-2xl border-none outline-none ring-0 focus-visible:ring-0"
            >
              <Link href="/login">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="mr-4 h-10 w-10 transform rotate-[30deg] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:translate-x-[9px] group-hover:rotate-90"
                  fill="currentColor"
                >
                  <path d="M0 0h24v24H0z" fill="none"></path>
                  <path d="M5 13c0-5.088 2.903-9.436 7-11.182C16.097 3.564 19 7.912 19 13c0 .823-.076 1.626-.22 2.403l1.94 1.832a.5.5 0 0 1 .095.603l-2.495 4.575a.5.5 0 0 1-.793.114l-2.234-2.234a1 1 0 0 0-.707-.293H9.414a1 1 0 0 0-.707.293l-2.234 2.234a.5.5 0 0 1-.793-.114l-2.495-4.575a.5.5 0 0 1 .095-.603l1.94-1.832C5.077 14.626 5 13.823 5 13zm1.476 6.696l.817-.817A3 3 0 0 1 9.414 18h5.172a3 3 0 0 1 2.121.879l.817.817.982-1.8-1.1-1.04a2 2 0 0 1-.593-1.82c.124-.664.187-1.345.187-2.036 0-3.87-1.995-7.3-5-8.96C8.995 5.7 7 9.13 7 13c0 .691.063 1.372.187 2.037a2 2 0 0 1-.593 1.82l-1.1 1.039.982 1.8zM12 13a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"></path>
                </svg>
                <span className="transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:translate-x-[10px]">
                  Launch
                </span>
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
