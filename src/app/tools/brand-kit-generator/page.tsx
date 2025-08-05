
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Palette } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function BrandKitGeneratorLandingPage() {
  const painPoints = [
    "Struggling with 'designer's block' and not knowing where to start.",
    "Inconsistent branding across your website and social media.",
    "Spending hours picking colors and fonts that don't quite work.",
    "Lacking a professional visual identity that builds trust."
  ];

  const benefits = [
    {
      title: "Cohesive Branding in Minutes",
      description: "Stop the guesswork. Generate a complete brand identity, including a 5-color palette and font pairings, based on your business description and target audience."
    },
    {
      title: "Psychology-Backed Choices",
      description: "Our AI doesn't just pick random colors. It leverages color psychology to create a palette that resonates with your target audience and brand personality."
    },
    {
      title: "Jumpstart Your Design Process",
      description: "Get a professional foundation for your website's design. The generated kit includes theme suggestions and a UI/UX tip tailored to your project."
    },
     {
      title: "Create Stunning Moodboards",
      description: "Receive a curated list of 10 image search queries for Pexels and Unsplash to build a beautiful moodboard that perfectly captures your new brand aesthetic."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
              Instantly Generate a Complete Brand Identity with AI.
            </h1>
            <p className="max-w-3xl mx-auto text-lg text-muted-foreground mb-8">
              No design experience? No problem. Describe your business, and our AI will create a professional color palette, font combination, and visual style guide for your website in seconds.
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard/brand-kit-generator">
                Generate Your Brand Kit FREE <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-20 bg-card/80">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-headline font-bold">Sound Familiar?</h2>
                <p className="text-muted-foreground mt-2 max-w-xl mx-auto">You're trying to build a brand, but the design part is a frustrating roadblock.</p>
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
                        <Image src="https://images.unsplash.com/photo-1558655146-364adaf1fcc9?q=80&w=1964&auto=format&fit=crop" alt="Color swatches and design tools" width={600} height={400} className="rounded-lg shadow-lg" data-ai-hint="design color swatches" />
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">Your Intelligent Design Assistant</h2>
                        <ol className="space-y-4 text-muted-foreground text-lg">
                            <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">1</span>
                                <div><span className="font-bold text-foreground">Describe Your Brand:</span> Tell the AI about your business, website type, and target audience.</div>
                            </li>
                             <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">2</span>
                                <div><span className="font-bold text-foreground">Generate Your Kit:</span> Our AI analyzes your input and generates a complete brand kit.</div>
                            </li>
                             <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">3</span>
                                <div><span className="font-bold text-foreground">Apply & Build:</span> Use your new colors, fonts, and moodboard to create a stunning, professional website.</div>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </section>
        
        <section className="py-20 bg-card/80">
            <div className="container mx-auto px-4">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold">Design with Confidence</h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">This tool empowers you to make expert-level design choices, fast.</p>
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
              Ready to Build a Brand You're Proud Of?
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
             Stop stressing over design and let our AI build your brand's visual foundation in seconds.
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard/brand-kit-generator">
                Try the Brand Kit Generator <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

    