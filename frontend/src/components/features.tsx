'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const steps = [
  {
    number: '1',
    title: 'Ideation',
    description: 'Connect to LinkedIn, select curated hooks from trending posts and news.',
    image: '/images/linkedin-connection-dashboard.png',
  },
  {
    number: '2',
    title: 'Creation',
    description: 'Edit your post and plan future posts to automatically post trending updates.',
    image: '/ai-content-generation-interface.jpg',
  },
  {
    number: '3',
    title: 'Execution',
    description: 'Post to LinkedIn and watch interactions grow.',
    image: '/growth-metrics-dashboard.png',
  },
];

export default function Features() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            LinkedIn SEO in 3 steps
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            The easiest way to automate beautiful, SEO-optimized LinkedIn posts.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="flex flex-col"
            >
              <div className="bg-card rounded-2xl p-6 shadow-lg border border-border mb-6 aspect-video overflow-hidden flex items-center justify-center">
                <Image
                  src={step.image || '/placeholder.svg'}
                  alt={step.title}
                  width={600}
                  height={400}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-foreground mb-3 text-left">
                  <span className="text-muted-foreground mr-2">{step.number}</span>
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-left">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
