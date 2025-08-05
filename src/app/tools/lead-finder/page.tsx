
// src/app/tools/lead-finder/page.tsx

"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Briefcase, Sparkles, ExternalLink, Mail, Phone, Download, ArrowRight } from "lucide-react";
import Head from 'next/head';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { findLeads, type FindLeadsOutput } from "@/ai/flows/find-leads";
import Image from "next/image";
import Link from "next/link";

const formSchema = z.object({
  keyword: z.string().min(2, "Please enter a business type or keyword."),
  location: z.string().min(2, "Please enter a location."),
});

type FormValues = z.infer<typeof formSchema>;

export default function LeadFinderLandingPage() {
    const [generatedLeads, setGeneratedLeads] = useState<FindLeadsOutput['leads']>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            keyword: "Web Design Agency",
            location: "Dubai, UAE",
        },
    });

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setIsLoading(true);
        setGeneratedLeads([]);
        try {
            const result = await findLeads({ ...data, numberOfLeads: 2 });
            setGeneratedLeads(result.leads);
        } catch (error) {
            console.error("Error finding leads:", error);
            toast({
                title: "Error",
                description: "Failed to find leads. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const painPoints = [
        "Are your sales reps spending more time on LinkedIn than on the phone?",
        "Is 'manual prospecting' a line item in your therapist bills?",
        "Tired of buying stale, outdated lead lists from 2007?",
        "Does your CRM look more like a digital ghost town than a sales pipeline?"
    ];

    const benefits = [
        {
          title: "Stop Prospecting. Start Selling.",
          description: "Seriously. Why are you paying smart people to do dumb work? Our AI does the soul-crushing grunt work of finding leads, so your sales team can focus on what they do best: closing deals. It's like giving them a cheat code for their quota."
        },
        {
          title: "Hyper-Target Any Niche, Anywhere.",
          description: "Need left-handed dog groomers in Antarctica? Or SaaS companies in Austin with over 50 employees? If they exist, our AI can probably find them. Stop fishing with a net; start hunting with a laser-guided spear."
        },
        {
          title: "Get Data That's Actually Useful.",
          description: "We don't just give you a name and a prayer. Our AI digs for the good stuff: website URLs, contact emails, and even phone numbers. It's the difference between a cold lead and a warm introduction."
        },
         {
          title: "Export and Go in Seconds",
          description: "Your leads are no good sitting in our app. With one click, export your entire list to a CSV and upload it directly to your CRM, email outreach tool, or dialer. Less data entry, more 'ka-ching'."
        }
    ];
    
    const pageSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "AI Lead Finder for Web Agencies",
        "applicationCategory": "Business",
        "operatingSystem": "Web",
        "description": "Find hyper-targeted leads for freelance web developers and agencies with their emails, websites, and phone numbers in seconds.",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    };
    
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Is this legal?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Our AI uses its publicly available knowledge base. We're not doing anything shady, just being really, really smart about finding information."
                }
            },
            {
                "@type": "Question",
                "name": "How accurate is the data?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "It's as accurate as an AI can be. It finds the most *likely* website and contact info. We always recommend a quick verification glance before you start your outreach."
                }
            },
            {
                "@type": "Question",
                "name": "Can I really find any type of business?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can certainly try! The more niche you get, the more creative the AI has to be. It's surprisingly good, but it's not a magician. (Although it's close)."
                }
            }
        ]
    };

    return (
    <>
        <Head>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
            />
             <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
        </Head>
        <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow">
            {/* Section 1: Hero */}
            <section className="py-20 text-center">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
                        Your Sales Team is Wasting 80% of Their Time.
                    </h1>
                    <p className="max-w-3xl mx-auto text-lg text-muted-foreground mb-8">
                        Stop paying smart people to do dumb work. Our AI finds hyper-targeted leads for freelance web developers with their emails, websites, and phone numbers in seconds. <span className="font-bold text-primary">Try it yourself below.</span>
                    </p>
                    
                    <Card className="max-w-3xl mx-auto text-left glass-card">
                        <CardHeader>
                            <CardTitle>AI Lead Finder - Demo</CardTitle>
                            <CardDescription>Get up to 2 free leads instantly. No credit card, no nonsense.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="keyword" render={({ field }) => (
                                            <FormItem><FormLabel>Business Type / Keyword</FormLabel><FormControl><Input placeholder="e.g., 'Web Design Agency'" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="location" render={({ field }) => (
                                            <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g., 'Dubai, UAE'" {...field} /></FormControl><FormMessage /></FormMessage>
                                        )} />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Digging for Gold...</> : <><Sparkles className="mr-2 h-4 w-4" /> Find 2 Free Leads</>}
                                    </Button>
                                </form>
                            </Form>
                            
                            {(isLoading || generatedLeads.length > 0) && (
                                <div className="mt-6">
                                    <h3 className="font-semibold mb-2">Results:</h3>
                                    <div className="h-48 overflow-y-auto rounded-md border">
                                        <Table>
                                            <TableHeader><TableRow><TableHead>Business</TableHead><TableHead>Contact</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                            {isLoading && Array.from({ length: 2 }).map((_, i) => (
                                                <TableRow key={i}><TableCell><Skeleton className="h-5 w-3/4" /></TableCell><TableCell><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                                            ))}
                                            {generatedLeads.map((lead) => (
                                                <TableRow key={lead.businessName}>
                                                    <TableCell className="font-medium"><p>{lead.businessName}</p><p className="text-xs text-muted-foreground">{lead.description}</p></TableCell>
                                                    <TableCell className="space-y-1">
                                                        <a href={lead.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm">Visit Site <ExternalLink className="h-3 w-3" /></a>
                                                        {lead.email && <a href={`mailto:${lead.email}`} className="text-muted-foreground hover:underline flex items-center gap-1 text-sm"><Mail className="h-3 w-3" /> {lead.email}</a> }
                                                        {lead.phoneNumber && <a href={`tel:${lead.phoneNumber}`} className="text-muted-foreground hover:underline flex items-center gap-1 text-sm"><Phone className="h-3 w-3" /> {lead.phoneNumber}</a> }
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    {generatedLeads.length > 0 && (
                                        <div className="text-center p-4 bg-primary/10 rounded-b-lg">
                                            <p className="font-bold">Want more leads like this?</p>
                                            <p className="text-sm text-muted-foreground mb-2">Sign up to generate unlimited leads and export them to CSV.</p>
                                            <Button asChild><Link href="/signup">Get Unlimited Leads <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Section 2: Pain Points */}
            <section className="py-20 bg-card/80">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold">Admit it. Your Prospecting Strategy is Broken.</h2>
                    <p className="text-muted-foreground mt-2 max-w-xl mx-auto">If any of these sound familiar, you're not alone. You're just doing it wrong.</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {painPoints.map((point) => (
                        <Card key={point} className="glass-card text-center p-6 border-dashed">
                            <p className="font-semibold text-lg">{point}</p>
                        </Card>
                    ))}
                </div>
            </div>
            </section>

            {/* Section 3: How it Works */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <Image src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop" alt="Person pointing at a screen with data" width={600} height={400} className="rounded-lg shadow-lg" data-ai-hint="sales data" />
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">The 60-Second Lead List</h2>
                            <p className="text-muted-foreground mb-6">You're three steps away from a pipeline that's actually full. It's so easy, you'll wonder why you ever did it any other way.</p>
                            <ol className="space-y-4 text-muted-foreground text-lg">
                                <li className="flex items-start gap-4">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">1</span>
                                    <div><span className="font-bold text-foreground">Tell The AI Who To Find:</span> Enter a keyword (like "plumbers") and a location (like "Miami"). Hit generate. That's it. Go get a coffee.</div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">2</span>
                                    <div><span className="font-bold text-foreground">Get Your Hit List:</span> The AI returns a clean list of businesses with their websites, emails, and phone numbers. No fluff, no filler, just actionable data.</div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">3</span>
                                    <div><span className="font-bold text-foreground">Export & Close Deals:</span> Download your list as a CSV and upload it straight to your sales tools. Now, go make some money.</div>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Section 4: Benefits */}
            <section className="py-20 bg-card/80">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-headline font-bold">Fire Your Prospector. Hire a Robot.</h2>
                        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">This isn't just a tool, it's a fundamental upgrade to your entire sales process. Here's how we make your life ridiculously easier.</p>
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

            {/* Section 5: Use Cases */}
            <section className="py-20">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-12">Who Can You Find? Pretty Much Anyone.</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 text-center glass-card">
                    <h3 className="font-semibold text-lg">For Local Service Businesses</h3>
                    <p className="text-muted-foreground text-sm mt-2">Find every roofer in Chicago, every electrician in Dallas, or every landscaper in your neighborhood.</p>
                    <code className="block bg-muted rounded-md p-2 mt-4 text-sm">"Plumbers in Houston, TX"</code>
                </Card>
                <Card className="p-6 text-center glass-card">
                    <h3 className="font-semibold text-lg">For B2B & SaaS Companies</h3>
                    <p className="text-muted-foreground text-sm mt-2">Target specific industries, from marketing agencies in New York to tech startups in Silicon Valley.</p>
                    <code className="block bg-muted rounded-md p-2 mt-4 text-sm">"SaaS companies in Austin"</code>
                </Card>
                <Card className="p-6 text-center glass-card">
                    <h3 className="font-semibold text-lg">For Global Outreach</h3>
                    <p className="text-muted-foreground text-sm mt-2">The world is your oyster. Find manufacturing companies in Germany or real estate agencies in Dubai.</p>
                    <code className="block bg-muted rounded-md p-2 mt-4 text-sm">"Real Estate Agencies in Dubai"</code>
                </Card>
                </div>
            </div>
            </section>
            
            {/* Section 6: Features Table */}
            <section className="py-20 bg-card/80">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold">All Killer, No Filler Data.</h2>
                    <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Here's a breakdown of the actionable intelligence you get with every search.</p>
                </div>
                <Card className="max-w-2xl mx-auto glass-card">
                    <Table>
                        <TableHeader><TableRow><TableHead>Data Point</TableHead><TableHead>Why It Matters</TableHead></TableRow></TableHeader>
                        <TableBody>
                            <TableRow><TableCell className="font-semibold">Business Name</TableCell><TableCell>So you know who you're actually talking to.</TableCell></TableRow>
                            <TableRow><TableCell className="font-semibold">Website URL</TableCell><TableCell>For checking out their business and finding more contact info.</TableCell></TableRow>
                            <TableRow><TableCell className="font-semibold">Contact Email</TableCell><TableCell>The golden ticket. Straight to their inbox.</TableCell></TableRow>
                            <TableRow><TableCell className="font-semibold">Phone Number</TableCell><TableCell>For those brave enough to still make phone calls.</TableCell></TableRow>
                            <TableRow><TableCell className="font-semibold">Description</TableCell><TableCell>A quick, one-sentence summary so you know what they do.</TableCell></TableRow>
                            <TableRow><TableCell className="font-semibold">CSV Export</TableCell><TableCell>To get your leads out of our app and into your workflow, fast.</TableCell></TableRow>
                        </TableBody>
                    </Table>
                </Card>
            </div>
            </section>

            {/* Section 7: Final CTA */}
            <section id="cta" className="py-20">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">
                Stop Reading. Start Closing.
                </h2>
                <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
                Your competitors are still scrolling through Google search results manually. You're smarter than that. Sign up now and fill your pipeline by tomorrow.
                </p>
                <Button asChild size="lg">
                <Link href="/signup">
                    Get Unlimited Leads Now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                </Button>
            </div>
            </section>

            {/* Section 8: FAQ */}
            <section className="py-20 bg-card/80">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-8">Your Excuses, Answered.</h2>
                    <dl className="space-y-4">
                        <Card className="glass-card p-4"><dt className="font-semibold">Is this legal?</dt><dd className="text-muted-foreground mt-1">Yes. Our AI uses its publicly available knowledge base. We're not doing anything shady, just being really, really smart about finding information.</dd></Card>
                        <Card className="glass-card p-4"><dt className="font-semibold">How accurate is the data?</dt><dd className="text-muted-foreground mt-1">It's as accurate as an AI can be. It finds the most *likely* website and contact info. We always recommend a quick verification glance before you start your outreach.</dd></Card>
                        <Card className="glass-card p-4"><dt className="font-semibold">Can I really find *any* type of business?</dt><dd className="text-muted-foreground mt-1">You can certainly try! The more niche you get, the more creative the AI has to be. It's surprisingly good, but it's not a magician. (Although it's close).</dd></Card>
                    </dl>
                </div>
            </section>
        </main>
        <Footer />
        </div>
    </>
    )
}
