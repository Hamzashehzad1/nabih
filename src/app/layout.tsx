

import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Inter, Space_Grotesk } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  title: 'Nabih | AI Tools for Web Design, Development & SEO',
  description: 'The All-In-One Toolkit for Web Agencies & Creators. Use our AI landing page generator, WordPress admin branding tools, and client feedback solutions to streamline your workflow.',
  manifest: '/manifest.json',
  metadataBase: new URL('https://nabih.ai'), // Replace with your actual domain
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Nabih | AI Tools for Web Design, Development & SEO',
    description: 'The All-In-One Toolkit for Web Agencies & Creators. Use our AI landing page generator, WordPress admin branding tools, and client feedback solutions to streamline your workflow.',
    url: 'https://nabih.ai', // Replace with your actual domain
    siteName: 'Nabih',
    images: [
      {
        url: '/og-image.png', // Path to your OG image in the public folder
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nabih | AI Tools for Web Design, Development & SEO',
    description: 'The All-In-One Toolkit for Web Agencies & Creators. Use our AI landing page generator, WordPress admin branding tools, and client feedback solutions to streamline your workflow.',
    // site: '@yourtwitterhandle', // Replace with your Twitter handle
    // creator: '@yourtwitterhandle',
    images: ['/twitter-og-image.png'], // Path to your Twitter OG image
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'HnbU27o3ntDzMGLEgz1ubvIa1CC8KZEXgDaj9f95zSs',
  },
};

export const viewport: Viewport = {
  themeColor: 'hsl(228 6% 8%)',
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
          <link rel="canonical" href="https://nabih.ai" />
      </head>
      <body className={cn(inter.variable, spaceGrotesk.variable, "font-body antialiased")}>
        {children}
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  );
}
