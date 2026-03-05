'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
const faqs = [
    {
        question: "Does this post directly to LinkedIn?",
        answer: "If LinkedIn scheduling is enabled in your plan, you can schedule and publish posts from inside the dashboard. If not, you can still generate, organize, and export posts to publish manually on LinkedIn."
    },
    {
        question: "How can I tell which posts are actually working?",
        answer: "The Performance Tracking section monitors engagement metrics such as likes, views, and comments. This helps you identify which topics and formats perform best so you can refine future posts accordingly."
    },
    {
        question: "How does the platform find “Trending Stories” or hooks?",
        answer: "The platform analyzes trending content patterns and extracts hook structures that perform well in your niche. These patterns are then surfaced as suggestions so you can quickly generate posts that follow formats already proven to attract engagement."
    },
    {
        question: "Can I repurpose my existing posts instead of starting from scratch?",
        answer: "Yes. You can paste a previous post into the Post Repurposer, and the system will generate new angles, hooks, and variations from that content. This helps you reuse ideas while keeping your feed fresh."
    }
];
export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };
    return (
        <section id="faq" className="relative w-full bg-[#fdfdfd] text-[#4A4440] py-24 pb-48 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">
                <div className="lg:w-1/3 flex flex-col">
                    <h2 className="font-poppins text-[48px] sm:text-[56px] font-[800] leading-[1.1] tracking-tight mb-4 text-[#4A4440]">
                        FAQs
                    </h2>
                    <p className="font-mono text-[14px] opacity-70">
                        FAQ about integrations.
                    </p>
                </div>
                {/* Right Side: Accordion */}
                <div className="lg:w-2/3 flex flex-col">
                    <div className="border-t border-gray-300 w-full"></div>
                    {faqs.map((faq, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <div key={index} className="border-b border-gray-300 w-full">
                                <button
                                    onClick={() => toggleFAQ(index)}
                                    className="w-full py-6 flex items-center justify-between text-left group transition-colors"
                                >
                                    <span className="font-poppins text-[20px] sm:text-[22px] font-medium text-[#4A4440]">
                                        {faq.question}
                                    </span>
                                    <div
                                        className={`ml-4 shrink-0 w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
                                    >
                                        <Plus className="w-4 h-4 text-[#4A4440] opacity-70" strokeWidth={1.5} />
                                    </div>
                                </button>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            className="overflow-hidden"
                                        >
                                            <p className="pb-8 text-[#4A4440] opacity-80 leading-relaxed font-sans text-[16px] max-w-2xl">
                                                {faq.answer}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
