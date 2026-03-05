'use client';
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
const cards = [
    {
        id: 1,
        number: "001",
        title: "Ideation",
        description: "Connect your LinkedIn account to receive weekly, curated post hooks tailored to your tone and voice. These are generated from trending news, high-performing past posts, and your internal communication channels.",
        image: "/assets/idea.png",
        icon: "O",
        scale: 1.35,
        yOffset: 10,
        details: {
            metrics: [
                { value: "34", label: "TRENDING TOPICS" },
                { value: "12", label: "TOP PAST POSTS" },
                { value: "5", label: "INTERNAL CHANNELS" }
            ]
        }
    },
    {
        id: 2,
        number: "002",
        title: "Creation",
        description: "Turn selected hooks into ready-to-post content in under five seconds. Customize and refine each post using our AI Astro Agent to match your style perfectly.",
        image: "/assets/write.png",
        icon: "O",
        scale: 1,
        yOffset: -8,
    },
    {
        id: 3,
        number: "003",
        title: "Execution",
        description: "Draft, schedule, and publish your LinkedIn posts in one place. Track performance over time with clear analytics on impressions, reach, and engagement.",
        image: "/images/execution-mascot.png",
        icon: "O",
        scale: 1.15,
        yOffset: 15,
    }
];
export default function HowItWorks() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });
    return (
        <section
            id="how-it-works"
            ref={containerRef}
            className="relative min-h-screen bg-[#fdfdfd] text-[#4A4440] py-32 px-4 sm:px-6 lg:px-8 border-t-[12px] border-gray-300 overflow-hidden"
        >
            {/* "How it Works" Background Text */}
            <div className="absolute top-40 left-0 w-full overflow-hidden flex whitespace-nowrap opacity-[0.03] pointer-events-none select-none">
                <motion.div
                    className="flex font-poppins text-[150px] font-bold tracking-tighter"
                    style={{ x: useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]) }}
                >
                    <span className="mr-8">How it Works ⟳</span>
                    <span className="mr-8">How it Works ⟳</span>
                    <span className="mr-8">How it Works ⟳</span>
                    <span className="mr-8">How it Works ⟳</span>
                </motion.div>
            </div>
            <div className="max-w-7xl mx-auto relative z-10 pt-40">
                <div className="flex flex-col lg:flex-row justify-center gap-12 lg:gap-8">
                    {cards.map((card, index) => {
                        return (
                            <motion.div
                                key={card.id}
                                initial={{ y: 150, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: false, margin: "-100px" }}
                                transition={{ duration: 0.8, delay: index * 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
                                className="flex flex-col items-center w-full max-w-sm mt-24"
                            >
                                {/* Card Graphic Container */}
                                <div className="relative w-full mb-12">
                                    <div className="w-full aspect-[4/5] bg-[#5C5A55] rounded-[32px] p-6 text-[#E0D5B5] flex flex-col relative overflow-hidden shadow-2xl border border-white/10 group">
                                        <div className="absolute top-6 right-6 font-light text-2xl z-20 opacity-70 group-hover:opacity-100 transition-opacity">
                                            {card.icon}
                                        </div>

                                        {/* Character Image Inside Card */}
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            whileInView={{ y: 0, opacity: 1 }}
                                            transition={{ duration: 0.6, delay: (index * 0.2) + 0.3 }}
                                            className="relative w-full flex-1 flex items-center justify-center min-h-0 mb-6 pointer-events-none drop-shadow-[0_10px_10px_rgba(0,0,0,0.2)] z-10"
                                        >
                                            <div className="relative w-full h-full max-h-[180px]" style={{ transform: `scale(${card.scale || 1}) translateY(${card.yOffset || 0}px)` }}>
                                                <Image src={card.image} alt={card.title} fill className="object-contain" />
                                            </div>
                                        </motion.div>
                                        {card.id === 1 && (
                                            <div className="flex-none flex flex-col justify-end relative z-10 mt-auto">
                                                <div className="flex items-center gap-2 mb-6">
                                                    <div className="w-6 h-6 rounded bg-white flex items-center justify-center text-[#5C5A55] font-bold text-[10px]">in</div>
                                                    <div className="text-xs tracking-widest opacity-60 uppercase">Account Connected</div>
                                                </div>
                                                <h3 className="text-sm font-medium mb-4 text-white">Weekly Hooks Sourced</h3>
                                                <div className="space-y-3">
                                                    {card.details?.metrics?.map((metric, i) => (
                                                        <div key={i} className="flex items-center gap-3">
                                                            <div className="text-xl font-medium tracking-tight">⌖ {metric.value}</div>
                                                            <div className="text-[9px] uppercase tracking-widest opacity-70">{metric.label}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {card.id === 2 && (
                                            <div className="flex-none flex flex-col justify-end relative z-10 mt-auto">
                                                <div className="text-xs tracking-widest mb-6 opacity-60">[ GENERATING POST... ]</div>
                                                <div className="space-y-3">
                                                    <div className="h-2 bg-[#484642] rounded-full overflow-hidden w-full relative">
                                                        <motion.div
                                                            animate={{ x: ["-100%", "200%"] }}
                                                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                            className="absolute top-0 left-0 w-1/2 h-full bg-white/80 rounded-full"
                                                        />
                                                    </div>
                                                    <div className="h-2 bg-[#484642] rounded-full overflow-hidden w-[80%] relative">
                                                        <motion.div
                                                            animate={{ x: ["-100%", "200%"] }}
                                                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.2 }}
                                                            className="absolute top-0 left-0 w-1/2 h-full bg-white/80 rounded-full"
                                                        />
                                                    </div>
                                                    <div className="h-2 bg-[#484642] rounded-full overflow-hidden w-[60%] relative">
                                                        <motion.div
                                                            animate={{ x: ["-100%", "200%"] }}
                                                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.4 }}
                                                            className="absolute top-0 left-0 w-1/2 h-full bg-white/80 rounded-full"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mt-6 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                                                    <div className="text-[10px] uppercase tracking-widest opacity-80">Astro Agent Active</div>
                                                </div>
                                            </div>
                                        )}
                                        {card.id === 3 && (
                                            <div className="flex-none flex flex-col justify-end relative z-10 mt-auto">
                                                <div className="text-xs tracking-widest mb-6 opacity-60">[ ENGAGEMENT ANALYTICS ]</div>
                                                <div className="flex items-end gap-2 mb-6 h-20">
                                                    {[40, 70, 45, 90, 65, 80, 100].map((height, i) => (
                                                        <div key={i} className="flex-1 bg-[#484642] rounded-t-sm relative group overflow-hidden h-full">
                                                            <motion.div
                                                                initial={{ height: 0 }}
                                                                whileInView={{ height: `${height}%` }}
                                                                transition={{ duration: 1, delay: i * 0.1 }}
                                                                className="absolute bottom-0 w-full bg-white rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity"
                                                            ></motion.div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between items-center bg-[#484642] p-3 rounded-xl border border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                                        <div className="text-[10px] tracking-wider text-white">PUBLISHED</div>
                                                    </div>
                                                    <div className="text-[10px] opacity-60">OCT 24, 9:00 AM</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Connecting Line */}
                                <div className="h-12 border-l border-dashed border-[#4A4440]/30 mb-8"></div>
                                {/* Description Content */}
                                <div className="text-center w-full max-w-[300px]">
                                    <div className="font-mono text-sm tracking-[0.2em] opacity-60 mb-6">
                                        [ {card.number} ]
                                    </div>
                                    <h2 className="text-3xl font-medium tracking-tight mb-4 leading-tight">
                                        {card.title}
                                    </h2>
                                    <p className="text-[15px] leading-relaxed opacity-80">
                                        {card.description}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
