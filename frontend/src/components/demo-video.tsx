"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

export default function DemoVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = async () => {
      try {
        await video.play()
      } catch {
        // Ignore play errors (e.g., if the browser blocks autoplay until in view)
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            handlePlay()
          } else {
            video.pause()
          }
        })
      },
      { threshold: 0.4 }
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="relative py-24 md:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          <div className="aspect-video bg-muted rounded-2xl shadow-2xl overflow-hidden border border-border">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              src="/images/Astro Demo.mp4"
              playsInline
              muted
              loop
              preload="metadata"
              poster="/images/astro-high-quality-20-281-29.png"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
