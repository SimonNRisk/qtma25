"use client"

import { motion } from "framer-motion"
import Image from "next/image"

const teamMembers = [
  {
    name: "Nicole Steiner",
    role: "Product Manager",
    image: "/images/team/1st.png",
  },
  {
    name: "Brian Yau",
    role: "Sr. Business Analyst",
    image: "/images/team/2nd.png",
  },
  {
    name: "Simon Risk",
    role: "Sr. Developer",
    image: "/images/team/3rd.png",
  },
  {
    name: "Hana Brissenden",
    role: "Sr. UI/UX Designer",
    image: "/images/team/4th.png",
  },
  {
    name: "Kayne Lee",
    role: "Developer",
    image: "/images/team/5th.png",
  },
  {
    name: "Amanda Cao",
    role: "UI/UX Designer",
    image: "/images/team/6th.png",
  },
  {
    name: "Julia Bartman",
    role: "Business Analyst",
    image: "/images/team/7th.png",
  },
  {
    name: "Dylan Atwal",
    role: "Business Analyst",
    image: "/images/team/8th.png",
  },
  {
    name: "Kevin Valencia",
    role: "Developer",
    image: "/images/team/9th.png",
  },
  {
    name: "Udula Abeykoon",
    role: "Jr. Developer",
    image: "/images/team/10th.png",
  },
]

export default function Team() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-16 text-center"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Meet the Team</h2>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-10 gap-y-12 max-w-6xl mx-auto">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative w-32 h-40 md:w-40 md:h-52 overflow-hidden">
                    <Image
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
