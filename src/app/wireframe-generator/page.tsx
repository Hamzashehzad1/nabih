
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function WireframeGeneratorLandingPage() {
  const painPoints = [
    "Staring at a blank canvas, unsure how to structure a page.",
    "Spending hours building basic layouts from scratch.",
    "Struggling to write compelling headlines and CTA copy.",
    "Lacking a clear, user-focused design direction."
  ];

  const benefits = [
    {
      title: "From Idea to Interactive Wireframe in Minutes",
      description: "Describe your website and its goals, and our AI will generate a complete, high-fidelity homepage wireframe with a professional layout, styling, and structure."
    },
    {
      title: "Conversion-Focused by Design",
      description: "Every wireframe includes conversion-focused copywriting in the style of Neil Patel, ensuring your key sections have persuasive headlines and calls-to-action."
    },
    {
      title: "UX Best Practices Built-In",
      description: "Get a layout designed with your target audience and primary goal in mind. Each wireframe comes with a UX rationale explaining the design choices."
    },
     {
      title: "Ready-to-Use HTML & CSS",
      description: "Receive a complete, responsive HTML file with embedded CSS. It's a production-ready starting point that developers can immediately build upon."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
              Generate High-Fidelity Wireframes with a Single Prompt.
            </h1>
            <p className="max-w-3xl mx-auto text-lg text-muted-foreground mb-8">
              Stop building from scratch. Our AI designer creates visually rich, interactive wireframes complete with copywriting and a full HTML structure. Go from concept to code in seconds.
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard/wireframe-generator">
                Generate Your First Wireframe <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-20 bg-card/80">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-headline font-bold">The Slowest Part of Any Project? The Beginning.</h2>
                <p className="text-muted-foreground mt-2 max-w-xl mx-auto">You have a great idea, but turning it into a tangible design is a major hurdle.</p>
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
                        <Image src="https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=2070&auto=format&fit=crop" alt="A designer working on a wireframe on a computer" width={600} height={400} className="rounded-lg shadow-lg" data-ai-hint="digital wireframe design" />
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">Your AI-Powered UI/UX Partner</h2>
                        <ol className="space-y-4 text-muted-foreground text-lg">
                            <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">1</span>
                                <div><span className="font-bold text-foreground">Describe Your Project:</span> Provide key details like your website type, target audience, and primary goal.</div>
                            </li>
                             <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">2</span>
                                <div><span className="font-bold text-foreground">Generate the Wireframe:</span> The AI generates a complete HTML page with embedded CSS, copywriting, and image placeholders.</div>
                            </li>
                             <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">3</span>
                                <div><span className="font-bold text-foreground">Review & Build:</span> Get a live preview, read the UX rationale, and copy the code to start building immediately.</div>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </section>
        
        <section className="py-20 bg-card/80">
            <div className="container mx-auto px-4">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold">Design Smarter, Not Harder</h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">This tool isn't just about speed; it's about giving you a professional, conversion-optimized starting point.</p>
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
              Ready to Design at the Speed of Thought?
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
             Stop letting the blank page win. Let our AI build your visual foundation so you can focus on what matters most.
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard/wireframe-generator">
                Try the AI Wireframe Generator <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
