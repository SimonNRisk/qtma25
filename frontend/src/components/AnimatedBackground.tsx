import React from 'react';
import Image from 'next/image';
export default function AnimatedBackground() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none bg-[#fdfdfd] z-0">
            {/* Subtle Noise Texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.025] mix-blend-multiply z-20"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
                aria-hidden="true"
            />
            <div className="absolute top-1/2 right-[-30vw] w-[180vw] max-w-[3500px] h-[160vh] -translate-y-1/2 origin-center mix-blend-multiply filter blur-[40px] opacity-80 z-10">
                {/* Main large central blob */}
                <div className="absolute top-[-10%] right-[0%] w-[150vw] max-w-[2600px] aspect-square animate-[var(--animate-float1)]">
                    <Image
                        src="/assets/gradient_blob.png"
                        alt="Gradient blob layering"
                        fill
                        className="object-contain opacity-100"
                        priority
                    />
                </div>
                {/* Secondary overlapping blob to create depth */}
                <div className="absolute top-[0%] right-[20%] w-[130vw] max-w-[2200px] aspect-square animate-[var(--animate-float2)]">
                    <Image
                        src="/assets/gradient_blob.png"
                        alt="Gradient blob layering"
                        fill
                        className="object-contain opacity-90"
                        priority
                    />
                </div>
                {/* Third blob for edge morphing */}
                <div className="absolute top-[15%] right-[-10%] w-[110vw] max-w-[2000px] aspect-square animate-[var(--animate-float3)]">
                    <Image
                        src="/assets/gradient_blob.png"
                        alt="Gradient blob layering"
                        fill
                        className="object-contain opacity-70"
                        priority
                    />
                </div>
            </div>
            {/* Faint wispy curves on the right side */}
            <div className="absolute top-1/2 right-[-10vw] w-[140vw] max-w-[1500px] aspect-square -translate-y-1/2 opacity-40 z-10">
                <svg viewBox="0 0 1000 1000" className="w-full h-full stroke-[#aab9cb] fill-none animate-[var(--animate-spin-slow)]">
                    <g transform="translate(500, 500) rotate(-25) translate(-500, -500)">
                        <ellipse cx="500" cy="500" rx="350" ry="120" strokeWidth="0.5" className="opacity-90" />
                        <ellipse cx="500" cy="500" rx="500" ry="180" strokeWidth="0.5" className="opacity-70" />
                        <ellipse cx="500" cy="500" rx="650" ry="250" strokeWidth="0.5" className="opacity-40" />
                        <ellipse cx="500" cy="500" rx="800" ry="320" strokeWidth="0.3" className="opacity-20" />
                    </g>
                </svg>
            </div>
        </div>
    );
}
