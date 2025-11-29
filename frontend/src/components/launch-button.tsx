"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LaunchButton() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (pathname !== "/welcome") {
      setVisible(false)
      return
    }

    const hero = document.getElementById("hero")

    if (hero) {
      const observer = new IntersectionObserver(
        ([entry]) => setVisible(!entry.isIntersecting),
        {
          threshold: 0.2,
        }
      )

      observer.observe(hero)
      return () => observer.disconnect()
    }

    // Fallback if hero is not found
    const handleScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6)
    window.addEventListener("scroll", handleScroll)
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [pathname])

  if (pathname !== "/welcome") {
    return null
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
    >
      <Button
        asChild
        className="bg-[#8aa9b3] hover:bg-[#90b0bc] text-[#0c1a25] px-8 py-4 text-xl rounded-2xl shadow-xl border-none outline-none ring-0 focus-visible:ring-0"
      >
        <Link href="/login">Launch Astro</Link>
      </Button>
    </div>
  )
}
