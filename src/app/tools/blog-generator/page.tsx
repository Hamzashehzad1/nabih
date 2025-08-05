
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BlogGeneratorLandingPage() {
  const painPoints = [
    "Struggling to write consistently for your blog.",
    "Spending 8+ hours on a single well-researched article.",
    "Facing writer's block when you need to be creative.",
    "Content costs are skyrocketing with freelancers or agencies."
  ];

  const benefits = [
    {
      title: "Publish Content 10x Faster",
      description: "Go from a simple title to a full-fledged, 1,000-word article in under two minutes. Stop writing from scratch and start editing and publishing."
    },
    {
      title: "Never Run Out of Words",
      description: "Overcome writer's block forever. Our AI takes your ideas and keywords and transforms them into structured, coherent, and engaging articles ready for your audience."
    },
    {
      title: "Built-in SEO Best Practices",
      description: "The AI is trained to write content that search engines love. It naturally incorporates keywords, uses proper heading structures, and creates reader-friendly paragraphs."
    },
     {
      title: "Match Your Brand's Voice",
      description: "Maintain brand consistency with ease. Choose from different tones and copywriting styles (like Neil Patel or Seth Godin) to ensure the generated content sounds like you."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
             AI Blog Post Generator for WordPress Agencies
            </h1>
            <p className="max-w-3xl mx-auto text-lg text-muted-foreground mb-8">
              Tired of the content grind? Our AI Blog Generator creates high-quality, SEO-optimized articles from just a title and a few keywords. Go from idea to published post in minutes, not days.
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard/blog-generator">
                Generate Your First Article FREE <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-20 bg-card/80">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-headline font-bold">Is This Your Content Workflow?</h2>
                <p className="text-muted-foreground mt-2 max-w-xl mx-auto">You know content is king, but the throne is exhausting to sit on.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {painPoints.map((point) => (
                     <Card key={point} className="glass-card text-center p-6">
                        <p className="font-semibold">{point}</p>
                    </Card>
                ))}
            </div>
             <p className="text-center text-lg mt-10">It's time to automate the heavy lifting. Focus on strategy, not on typing.</p>
          </div>
        </section>

        <section className="py-20">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <Image src="https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=1931&auto=format&fit=crop" alt="AI generating text on a screen" width={600} height={400} className="rounded-lg shadow-lg" data-ai-hint="AI writing" />
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">How It Works: Your 60-Second Article</h2>
                        <ol className="space-y-4 text-muted-foreground text-lg">
                            <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">1</span>
                                <div><span className="font-bold text-foreground">Provide a Title & Keywords:</span> Give the AI a topic and the main keywords you want to target.</div>
                            </li>
                             <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">2</span>
                                <div><span className="font-bold text-foreground">Set Your Parameters:</span> Choose your desired word count, tone of voice (e.g., formal, humorous), and even a famous copywriting style.</div>
                            </li>
                             <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">3</span>
                                <div><span className="font-bold text-foreground">Generate & Refine:</span> Click "Generate" and receive a complete article. Review, make minor edits, and it's ready to publish.</div>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </section>
        
        <section className="py-20 bg-card/80">
            <div className="container mx-auto px-4">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold">The Content Tool That Pays for Itself</h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">This isn't just about saving time. It's about enabling a content strategy that was previously out of reach.</p>
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
              Ready to Automate Your Blog?
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
             Stop spending days writing and start publishing content in minutes. See how powerful your content strategy can be when you have the right tool.
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard/blog-generator">
                Try the AI Blog Generator <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

    