
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ImageGeneratorLandingPage() {
  const painPoints = [
    "Searching stock photo sites for hours.",
    "Using generic images that don't match your content.",
    "Struggling to find high-quality, relevant visuals.",
    "Worrying about image licensing and attribution."
  ];

  const benefits = [
    {
      title: "Context-Aware Image Suggestions",
      description: "Our AI reads your blog post and generates highly specific search queries for featured and section images, ensuring every visual is perfectly on-topic."
    },
    {
      title: "One-Click Stock Photo Search",
      description: "Instantly search Pexels, Unsplash, and Wikimedia Commons with AI-generated queries. No more manual searching across multiple sites."
    },
    {
      title: "In-App Cropping & Optimization",
      description: "Found the perfect image? Crop it to the ideal 1200x650 blog post aspect ratio and optimize its size, all without leaving the app."
    },
     {
      title: "Seamless WordPress Integration",
      description: "Insert your chosen and optimized images directly into your WordPress posts as a featured image or a section image with a single click."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
              Illustrate Your Blog Posts in Seconds, Not Hours.
            </h1>
            <p className="max-w-3xl mx-auto text-lg text-muted-foreground mb-8">
              Finding the right images for your blog is a painful chore. Our AI Image Generator analyzes your content, suggests the perfect visuals, and inserts them into your WordPress posts.
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard/image-generator">
                Automate Your Imagery <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-20 bg-card/80">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-headline font-bold">The Worst Part of Blogging is Finding Images.</h2>
                <p className="text-muted-foreground mt-2 max-w-xl mx-auto">We've all been there. Your article is perfect, but now you have to find visuals.</p>
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
                        <Image src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop" alt="A gallery of images on a screen" width={600} height={400} className="rounded-lg shadow-lg" data-ai-hint="digital image gallery" />
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">The End-to-End Image Workflow</h2>
                        <ol className="space-y-4 text-muted-foreground text-lg">
                            <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">1</span>
                                <div><span className="font-bold text-foreground">Fetch Your Posts:</span> Connect your WordPress site and select the post you want to add images to.</div>
                            </li>
                             <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">2</span>
                                <div><span className="font-bold text-foreground">AI-Powered Suggestions:</span> Our AI analyzes the title and each section (H2s/H3s) to generate perfect image search queries.</div>
                            </li>
                             <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">3</span>
                                <div><span className="font-bold text-foreground">Find, Crop & Publish:</span> Find the perfect image from stock sites, crop it to the right dimensions, and publish it to your post with one click.</div>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </section>
        
        <section className="py-20 bg-card/80">
            <div className="container mx-auto px-4">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold">More Than Just a Search Tool</h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">This workflow is designed to save you time and make your content more visually compelling.</p>
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
              Ready to Create Visually Stunning Content?
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
             Stop wasting time on manual image searches. Let our AI-powered tool find and place the perfect visuals for your content.
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard/image-generator">
                Try the AI Image Generator <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
