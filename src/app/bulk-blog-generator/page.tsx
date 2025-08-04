
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function BulkBlogGeneratorLandingPage() {
  const painPoints = [
    "Drowning in your content calendar deadlines.",
    "Spending entire days writing just one or two articles.",
    "Onboarding new clients and needing to populate their blogs, fast.",
    "Needing to create topical clusters around a single keyword theme."
  ];

  const benefits = [
    {
      title: "Fill Your Content Calendar in Minutes",
      description: "Got a list of 5, 10, or 20 blog titles? Paste them in, set your parameters once, and let the AI write them all. Go from a year's worth of ideas to a library of drafts in a single afternoon."
    },
    {
      title: "Dominate Niches with Topic Clusters",
      description: "Easily create a comprehensive set of articles around your pillar keywords. Establish topical authority and improve your SEO by covering a subject from every angle, effortlessly."
    },
    {
      title: "Ensure Brand Voice Consistency",
      description: "The same tone, copywriting style, and theme are applied to every article in the batch. Perfect for maintaining a consistent brand voice across your entire content strategy or for your clients."
    },
     {
      title: "Scale Your Agency's Content Output",
      description: "Stop making content the bottleneck for client work. Onboard new clients and deliver a month's worth of content in a fraction of the time, freeing you up to focus on strategy and growth."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
              Turn a List of Titles into a Library of Articles.
            </h1>
            <p className="max-w-3xl mx-auto text-lg text-muted-foreground mb-8">
              Stop writing articles one by one. With the Bulk Blog Generator, you can transform an entire content strategy into ready-to-publish drafts in a single click. Your content pipeline, automated.
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard/bulk-blog-generator">
                Generate in Bulk FREE <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-20 bg-card/80">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-headline font-bold">The Definition of "Working Smarter"</h2>
                <p className="text-muted-foreground mt-2 max-w-xl mx-auto">If you've ever thought "there has to be a faster way to do this," you were right.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {painPoints.map((point) => (
                     <Card key={point} className="glass-card text-center p-6">
                        <p className="font-semibold">{point}</p>
                    </Card>
                ))}
            </div>
             <p className="text-center text-lg mt-10">Your time is best spent on strategy, not repetitive tasks. Automate the volume.</p>
          </div>
        </section>

        <section className="py-20">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <Image src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop" alt="Multiple documents being organized" width={600} height={400} className="rounded-lg shadow-lg" data-ai-hint="content strategy" />
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">Your Content Factory Awaits</h2>
                        <ol className="space-y-4 text-muted-foreground text-lg">
                            <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">1</span>
                                <div><span className="font-bold text-foreground">Paste Your Titles:</span> Add a list of blog post titles, with each title on a new line.</div>
                            </li>
                             <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">2</span>
                                <div><span className="font-bold text-foreground">Set Global Parameters:</span> Define the word count, tone, and keywords that will apply to every article in the batch.</div>
                            </li>
                             <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">3</span>
                                <div><span className="font-bold text-foreground">Generate & Review:</span> Click "Generate" and watch as each article is created. Review the results in an accordion and save them all.</div>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </section>
        
        <section className="py-20 bg-card/80">
            <div className="container mx-auto px-4">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold">Content at Scale is Your New Superpower</h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">This isn't just about speed. It's about unlocking new strategic possibilities.</p>
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
              Ready to Automate Your Entire Content Calendar?
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
             Stop the one-by-one grind. Start thinking in batches and see how fast you can scale your content operations.
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard/bulk-blog-generator">
                Try the Bulk Blog Generator <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
