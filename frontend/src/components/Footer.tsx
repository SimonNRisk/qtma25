'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer
            id="contact"
            className="relative w-full bg-[#fdfdfd] text-[#4A4440] z-10 overflow-hidden pt-20"
        >
            {/* Contact Us Button */}
            <div className="relative z-30 flex justify-center w-full px-4 mb-20 pointer-events-auto">
                <motion.a
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
                    href="https://form.typeform.com/to/VMPJ1GsO"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative inline-flex items-center justify-center w-[90%] sm:w-[500px] px-8 py-6 text-lg sm:text-2xl font-[800] tracking-[0.15em] text-[#4A4440] rounded-[2.5rem] bg-gradient-to-b from-white/90 to-white/40 shadow-[0_8px_32px_0_rgba(74,68,64,0.1),inset_0_4px_16px_rgba(255,255,255,0.9)] border border-white/60 backdrop-blur-2xl hover:shadow-[0_16px_40px_0_rgba(74,68,64,0.15),inset_0_4px_20px_rgba(255,255,255,1)] hover:-translate-y-1 transition-all duration-300 active:scale-[0.98] overflow-hidden"
                >
                    {/* Liquid glass shine effect */}
                    <div className="absolute inset-0 block h-full w-full pointer-events-none overflow-hidden rounded-[2.5rem]">
                        <div className="absolute top-0 left-[-150%] h-full w-[100%] bg-gradient-to-r from-transparent via-white/80 to-transparent transform -skew-x-12 group-hover:left-[150%] transition-all duration-[1.5s] ease-in-out"></div>
                    </div>

                    <span className="relative z-10 flex items-center justify-center gap-3">
                        CONTACT US
                        <svg className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300 group-hover:translate-x-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </span>
                </motion.a>
            </div>

            {/* Wrapper for mascot + clipped text */}
            <div className="relative w-full">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, margin: "-30px" }}
                    transition={{ duration: 0.7, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
                    className="absolute z-20"
                    style={{
                        width: 'clamp(60px, 8vw, 150px)',
                        height: 'clamp(60px, 8vw, 150px)',
                        left: 'calc(50% - clamp(140px, 22vw, 420px) * 1.38)',
                        top: 'clamp(-44px, -6vw, -130px)',
                    }}
                >
                    <Image
                        src="/images/real wave.png"
                        alt="Astro Mascot"
                        fill
                        className="object-contain"
                    />
                </motion.div>

                {/* Large ASTRO text — clipped so only the top half shows */}
                <div className="relative w-full overflow-hidden" style={{ height: 'clamp(80px, 12vw, 220px)' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, margin: "-30px" }}
                        transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
                        className="w-full text-center select-none pointer-events-none"
                    >
                        <h2
                            className="font-poppins font-[900] uppercase leading-[1] tracking-tighter text-[#4A4440]"
                            style={{ fontSize: 'clamp(140px, 22vw, 420px)' }}
                        >
                            ASTRO
                        </h2>
                    </motion.div>
                </div>
            </div>
        </footer >
    );
}
