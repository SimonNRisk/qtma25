import type { Metadata } from 'next';
import { Geist, Geist_Mono, Playfair_Display } from 'next/font/google';
import './globals.css';
import { ConditionalSidebar } from '@/components/ConditionalSidebar';
import { ConditionalLayout } from '@/components/ConditionalLayout';
import LaunchButton from '@/components/launch-button';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['italic', 'normal'],
});

export const metadata: Metadata = {
  title: 'Astro - Create LinkedIn Content Differently',
  description: 'Automatic LinkedIn SEO post generation powered by AI',
  icons: {
    icon: '/astro.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
      >
        <ConditionalSidebar />
        <ConditionalLayout>{children}</ConditionalLayout>
        <LaunchButton />
      </body>
    </html>
  );
}
