
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Inter, Space_Grotesk } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { headers } from 'next/headers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  title: 'Nabih | AI Toolkit for Web Agencies, Developers & SEO Pros',
  description: 'The All-In-One AI Toolkit for Web Agencies & Creators. Use our AI landing page generator, WordPress admin branding tools, client feedback solutions, and advanced SEO tools to streamline your workflow.',
  manifest: '/manifest.json',
  metadataBase: new URL('https://nabih.ai'), // Replace with your actual domain
  alternates: {
    // Canonical will be handled dynamically below
  },
  openGraph: {
    title: 'Nabih | AI Toolkit for Web Agencies, Developers & SEO Pros',
    description: 'The All-In-One AI Toolkit for Web Agencies & Creators. Use our AI landing page generator, WordPress admin branding tools, client feedback solutions, and advanced SEO tools to streamline your workflow.',
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
    title: 'Nabih | AI Toolkit for Web Agencies, Developers & SEO Pros',
    description: 'The All-In-One AI Toolkit for Web Agencies & Creators. Use our AI landing page generator, WordPress admin branding tools, client feedback solutions, and advanced SEO tools to streamline your workflow.',
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
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Nabih",
    "url": "https://nabih.ai",
    "logo": "https://nabih.ai/logo.png", // Replace with your actual logo URL
    "sameAs": [
      // Add your social media profiles here
      // "https://twitter.com/yourprofile",
      // "https://www.linkedin.com/company/yourprofile"
    ]
  };

  const heads = headers();
  const pathname = heads.get('next-url');
  const canonicalUrl = `https://nabih.ai${pathname}`;
  
  return (
    <html lang="en" className="dark">
      <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
          />
          <link rel="canonical" href={canonicalUrl} />
      </head>
      <body className={cn(inter.variable, spaceGrotesk.variable, "font-body antialiased")}>
        {children}
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  );
}
