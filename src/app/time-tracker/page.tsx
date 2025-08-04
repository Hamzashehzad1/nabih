
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function TimeTrackerLandingPage() {
  const painPoints = [
    "Losing track of billable hours across projects.",
    "Struggling with messy spreadsheets for time logging.",
    "Clients questioning invoices due to unclear time logs.",
    "Forgetting what you worked on during a specific session."
  ];

  const benefits = [
    {
      title: "Accurate, One-Click Time Tracking",
      description: "Start and stop a timer with a single click. No more manually calculating hours or forgetting to log your time. Every second is accounted for."
    },
    {
      title: "Detailed Work Logs for Transparency",
      description: "For every time entry, add a task description and detailed notes about what you accomplished. Create a clear, undeniable record of your work."
    },
    {
      title: "Seamless Client & Freelancer Collaboration",
      description: "Both freelancers and clients can view the time log, ensuring everyone is on the same page. This transparency builds trust and simplifies the billing process."
    },
     {
      title: "Organize Your Workday",
      description: "Easily see how your time is distributed across different tasks and projects. Identify where your hours are going and optimize your workflow for maximum productivity."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
              Transparent Time Tracking for Agencies & Freelancers.
            </h1>
            <p className="max-w-3xl mx-auto text-lg text-muted-foreground mb-8">
              Stop guessing. Start tracking. Our advanced time tracker lets you log every billable minute with detailed notes, ensuring you and your clients are always on the same page.
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard/time-tracker">
                Start Tracking Time <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-20 bg-card/80">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-headline font-bold">Is Time Tracking Your Biggest Headache?</h2>
                <p className="text-muted-foreground mt-2 max-w-xl mx-auto">If you're still using spreadsheets or your memory to track hours, you're losing money and creating confusion.</p>
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
                        <Image src="https://images.unsplash.com/photo-1590402494811-8ffd29f17584?q=80&w=2070&auto=format&fit=crop" alt="A person looking at a clock and calendar" width={600} height={400} className="rounded-lg shadow-lg" data-ai-hint="time management" />
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">Simple to Use, Powerful Results</h2>
                        <ol className="space-y-4 text-muted-foreground text-lg">
                            <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">1</span>
                                <div><span className="font-bold text-foreground">Start the Timer:</span> Add a task description and click 'Start' to begin a new work session.</div>
                            </li>
                             <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">2</span>
                                <div><span className="font-bold text-foreground">Add Your Notes:</span> While the timer is running, jot down notes on what you're accomplishing.</div>
                            </li>
                             <li className="flex items-start gap-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">3</span>
                                <div><span className="font-bold text-foreground">Stop & Save:</span> When you're done, stop the timer. The entry is automatically saved to your log with the duration and notes.</div>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </section>
        
        <section className="py-20 bg-card/80">
            <div className="container mx-auto px-4">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold">Build Trust, Bill with Confidence</h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">This isn't just about time. It's about clarity, accountability, and professionalism.</p>
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
              Ready to Take Control of Your Time?
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
             Stop leaving money on the table. Start tracking your work accurately and build better client relationships today.
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard/time-tracker">
                Go to Time Tracker <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
