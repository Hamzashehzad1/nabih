
// src/app/tools/landing-page-generator/page.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Head from 'next/head';

export default function LandingPageGeneratorLanding() {
  const painPoints = [
    "Staring at a blank page, wasting hours on design.",
    "Struggling to write copy that actually converts.",
    "Building pages that aren't mobile-responsive.",
    "Lacking a clear, user-focused design direction."
  ];

  const benefits = [
    {
      title: "From Prompt to Published in Minutes",
      description: "Describe your business, audience, and goals. Our AI generates a complete, high-fidelity landing page with professional layout, styling, and structure."
    },
    {
      title: "Conversion-Focused by Default",
      description: "Every generated page includes persuasive copywriting, clear calls-to-action, and a structure designed to guide visitors towards your primary goal."
    },
    {
      title: "Fully Responsive, Ready-to-Use Code",
      description: "Receive a single HTML file with embedded Tailwind CSS. It's clean, semantic, and perfectly responsive, ready for developers to use immediately."
    },
     {
      title: "Launch & Test Ideas Faster Than Ever",
      description: "Stop letting design be the bottleneck. Spin up beautiful, functional landing pages for new products, services, or marketing campaigns in a fraction of the time."
    }
  ];
  
  const pageSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "AI Landing Page Generator for Conversion",
      "applicationCategory": "Developer",
      "operatingSystem": "Web",
      "description": "Generate high-converting, mobile-responsive landing pages with professional copy and HTML/Tailwind CSS code from a single prompt.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
  };

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
        />
      </Head>
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow">
          <section className="py-20 text-center">
            <div className="container mx-auto px-4">
              <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
                AI Landing Page Generator for Higher Conversions.
              </h1>
              <p className="max-w-3xl mx-auto text-lg text-muted-foreground mb-8">
                Stop building from scratch. Our AI designer creates visually rich, conversion-focused landing pages complete with copywriting and a full HTML structure. Go from concept to code in seconds.
              </p>
              <Button asChild size="lg">
                <Link href="/dashboard/landing-page-generator">
                  Generate Your First Landing Page <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </section>

          <section className="py-20 bg-card/80">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-headline font-bold">Sound Familiar?</h2>
                  <p className="text-muted-foreground mt-2 max-w-xl mx-auto">You have a great idea, but turning it into a polished landing page is a time-consuming roadblock.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {painPoints.map((point) => (
                      <Card key={point} className="glass-card text-center p-6">
                          <p className="font-semibold">{point}</p>
                      </Card>
                  ))}
              </div>
            </div>
          </section>

          <section className="py-20">
              <div className="container mx-auto px-4">
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                      <div>
                          <Image src="https://images.unsplash.com/photo-1559028006-44d08a09e13b?q=80&w=1974&auto=format&fit=crop" alt="A designer working on a landing page on a computer" width={600} height={400} className="rounded-lg shadow-lg" data-ai-hint="landing page design" />
                      </div>
                      <div>
                          <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">Your AI-Powered Web Designer</h2>
                          <ol className="space-y-4 text-muted-foreground text-lg">
                              <li className="flex items-start gap-4">
                                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">1</span>
                                  <div><span className="font-bold text-foreground">Describe Your Project:</span> Provide key details like your website type, target audience, brand tone, and primary goal.</div>
                              </li>
                              <li className="flex items-start gap-4">
                                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">2</span>
                                  <div><span className="font-bold text-foreground">Generate the Page:</span> The AI generates a complete HTML file with embedded Tailwind CSS, persuasive copy, and relevant image placeholders.</div>
                              </li>
                              <li className="flex items-start gap-4">
                                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">3</span>
                                  <div><span className="font-bold text-foreground">Copy, Paste & Launch:</span> Get the full HTML code, ready to be deployed or handed off to a developer for further customization.</div>
                              </li>
                          </ol>
                      </div>
                  </div>
              </div>
          </section>
          
          <section className="py-20 bg-card/80">
              <div className="container mx-auto px-4">
                  <div className="text-center mb-12">
                      <h2 className="text-3xl md:text-4xl font-headline font-bold">Design at the Speed of Thought</h2>
                      <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">This tool is about more than just speed; it's about giving you a professional, conversion-optimized starting point, instantly.</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                      {benefits.map(benefit => (
                          <Card key={benefit.title} className="glass-card p-6">
                              <h3 className="text-xl font-headline font-semibold mb-2">{benefit.title}</h3>
                              <p className="text-muted-foreground">{benefit.description}</p>
                          </Card>
                      ))}
                  </div>
              </div>
          </section>

          <section id="cta" className="py-20">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">
                Ready to Launch Pages Faster?
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
              Stop letting the blank page win. Let our AI build your visual foundation so you can focus on growing your business.
              </p>
              <Button asChild size="lg">
                <Link href="/dashboard/landing-page-generator">
                  Try the AI Landing Page Generator <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
