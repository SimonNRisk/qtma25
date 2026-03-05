import type { Metadata } from "next";
import { Poppins, Playfair_Display } from "next/font/google";
import "./globals.css";
const poppins = Poppins({
  weight: ["400", "700", "800"],
  variable: "--font-poppins",
  subsets: ["latin"],
});
const playfair = Playfair_Display({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: "Astro – Create Content Differently",
  description: "AI-powered LinkedIn content generation and analytics platform",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${playfair.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
