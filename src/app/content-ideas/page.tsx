
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContentIdeasLandingPage() {
  const painPoints = [
    "Spending hours brainstorming instead of writing.",
    "Staring at a blank page, waiting for inspiration.",
    "Running out of fresh ideas for your niche.",
    "Worrying if your topic will actually rank on Google."
  ];

  const benefits = [
    {
      title: "End Writer's Block for Good",
      description: "Stop waiting for inspiration to strike. Generate a list of 10, 20, or even 50+ blog post ideas in the time it takes to drink your coffee. Your content calendar will never be empty again."
    },
    {
      title: "Discover Untapped Keywords",
      description: "Our AI doesn't just give you topics; it finds the questions and keywords your audience is actually searching for. Uncover long-tail keywords and niche angles your competitors have missed."
    },
    {
      title: "Create Content That Ranks",
      description: "Every idea is crafted with SEO in mind. We provide catchy, SEO-friendly titles designed to grab attention in the search results and drive more organic traffic to your site."
    },
     {
      title: "Serve Your Audience Better",
      description: "Understand your audience's needs on a deeper level. The generated ideas are based on real search intent, ensuring you're creating content that provides value and solves problems."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
              The End of Writer's Block is Here.
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
              Are you tired of the content hamster wheel? Our AI-powered Content Idea Generator gives you an endless supply of high-potential, SEO-friendly blog topics in seconds. Stop brainstorming. Start creating.
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard/content-ideas">
                Generate Your First Ideas FREE <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-20 bg-card/80">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-headline font-bold">Sound Familiar?</h2>
                <p className="text-muted-foreground mt-2 max-w-xl mx-auto">You know you need to publish content consistently, but the brainstorming process is a soul-crushing grind.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {painPoints.map((point) => (
                     <Card key={point} className="glass-card text-center p-6">
                        <p className="font-semibold">{point}</p>
                    </Card>
                ))}
            </div>
             <p className="text-center text-lg mt-10">You're not alone. The hardest part of content marketing isn't the writing—it's knowing <span className="font-bold text-primary">what</span> to write about.</p>
          </div>
        </section>

        <section className="py-20">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <Image src="https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?q=80&w=2089&auto=format&fit=crop" alt="Code on a screen representing AI generation" width={600} height={400} className="rounded-lg shadow-lg" data-ai-hint="digital ideas" />
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">How It Works: 3 Simple Steps</h2>
                        <ol className="space-y-4 text-muted-foreground text-lg">
                            <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">1</span>
                                <div><span className="font-bold text-foreground">Enter Your Niche:</span> Tell our AI your topic or industry (e.g., "SaaS marketing," "vegan recipes," "home fitness").</div>
                            </li>
                             <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">2</span>
                                <div><span className="font-bold text-foreground">Define Your Audience:</span> Who are you writing for? (e.g., "startup founders," "busy moms," "beginners").</div>
                            </li>
                             <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">3</span>
                                <div><span className="font-bold text-foreground">Get Instant Ideas:</span> Click "Generate" and watch as a list of compelling, ready-to-write blog post titles and descriptions appear instantly.</div>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </section>
        
        <section className="py-20 bg-card/80">
            <div className="container mx-auto px-4">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold">Stop Guessing, Start Dominating Your Niche</h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">This isn't just another keyword tool. It's a strategic content compass built to make your life easier and your content more effective.</p>
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
              Ready to Fill Your Content Calendar?
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
             Your next viral blog post is just a click away. Stop the analysis paralysis and let our AI give you the topics your audience is craving.
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard/content-ideas">
                Generate Content Ideas Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
