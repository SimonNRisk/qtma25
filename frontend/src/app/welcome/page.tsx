import Hero from "@/components/hero"
import DemoVideo from "@/components/demo-video"
import Features from "@/components/features"
import Team from "@/components/team"

export default function Page() {
  return (
    <main className="min-h-screen">
      <Hero />
      <DemoVideo />
      <Features />
      <Team />
    </main>
  )
}