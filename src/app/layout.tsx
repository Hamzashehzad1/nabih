import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Inter, Space_Grotesk } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  title: 'Nabih | AI Content Toolkit for Agencies & Creators',
  description: 'The All-In-One Toolkit for Web Agencies & Creators. Generate blog posts, manage sites, and streamline workflows with AI.',
  manifest: '/manifest.json',
  metadataBase: new URL('https://nabih.ai'), // Replace with your actual domain
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Nabih | AI Content Toolkit for Agencies & Creators',
    description: 'The All-In-One Toolkit for Web Agencies & Creators. Generate blog posts, manage sites, and streamline workflows with AI.',
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
    title: 'Nabih | AI Content Toolkit for Agencies & Creators',
    description: 'The All-In-One Toolkit for Web Agencies & Creators. Generate blog posts, manage sites, and streamline workflows with AI.',
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
