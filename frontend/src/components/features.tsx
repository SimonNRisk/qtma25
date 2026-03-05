'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, FileText, PlayCircle, Layers } from 'lucide-react';
const features = [
  {
    id: 1,
    description: "Generate post ideas from trends, prompts, and repurposed content.",
    icon: <Pencil className="w-[18px] h-[18px]" strokeWidth={2.5} />,
    fullTitle: "Content Ideation",
    fullDescription: "Discover viral hooks, repurpose past posts, and generate thought prompts to quickly find new LinkedIn content ideas."
  },
  {
    id: 2,
    description: "Turn hooks into full posts written in your voice.",
    icon: <FileText className="w-[18px] h-[18px]" strokeWidth={2.5} />,
    fullTitle: "Post Creation",
    fullDescription: "Transform strong hooks into complete posts and plan multiple pieces of content in advance."
  },
  {
    id: 3,
    description: "Organize drafts, scheduled posts, and live content in one place.",
    icon: <PlayCircle className="w-[18px] h-[18px]" strokeWidth={2.5} />,
    fullTitle: "Content Execution",
    fullDescription: "Manage your entire posting workflow through a unified dashboard for drafts, queued posts, and published content."
  },
  {
    id: 4,
    description: "Track engagement and identify your top-performing posts.",
    icon: <Layers className="w-[18px] h-[18px]" strokeWidth={2.5} />,
    fullTitle: "Performance Analysis",
    fullDescription: "Monitor likes, views, and engagement to understand what content works and refine your posting strategy."
  }
];
export default function Features() {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const displayTitle = activeFeature !== null ? features[activeFeature].fullTitle : "Features";
  const displayDescription = activeFeature !== null ? features[activeFeature].fullDescription : "ASTRO does everything you think it does and more...";
  return (
    <section id="features" className="relative w-full bg-[#fdfdfd] text-[#4A4440] py-24 pb-48 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
      <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row gap-16 lg:gap-24 items-center">
        {/* Left Side: Dynamic Text */}
        <div className="flex-1 w-full flex flex-col justify-center min-h-[250px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature !== null ? activeFeature : 'default'}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <h2 className="font-poppins text-[48px] sm:text-[56px] lg:text-[64px] font-[800] leading-[1.1] mb-6 tracking-tight text-[#4A4440]">
                {displayTitle}
              </h2>
              <p className="font-mono text-[16px] sm:text-[18px] leading-[1.7] text-[#4A4440] opacity-80 max-w-[400px]">
                {displayDescription}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
        {/* Right Side: Grid of Tiles */}
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature, idx) => {
            const isActive = activeFeature === idx;
            return (
              <div
                key={feature.id}
                onClick={() => setActiveFeature(idx)}
                className={`cursor-pointer rounded-[32px] p-8 transition-all duration-300 flex flex-col aspect-square justify-between shadow-sm
                  ${isActive
                    ? 'bg-[#EAE8E2] border border-[#d1cec4] scale-[0.98]'
                    : 'bg-[#F2F1ED] border border-transparent hover:bg-[#EAE8E2] hover:-translate-y-1'
                  }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#5C5A55] flex items-center justify-center text-[#E0D5B5] shadow-sm">
                  {feature.icon}
                </div>
                <p className="text-[14.5px] font-medium leading-relaxed text-[#4A4440] max-w-[200px]">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
