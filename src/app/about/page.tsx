
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Bot, LayoutDashboard, Settings, User, FileText, ImageIcon, LogOut, Library, Activity, Lightbulb, Paintbrush, Shield, TrendingDown, Link2, Files, Palette, LayoutTemplate, Smartphone, MessageSquareQuote, Receipt, HelpCircle, Type, Code2, Unlink, Layers3, Network, DownloadCloud, Crop, Users, GitCompare, Clock } from 'lucide-react';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NabihIcon } from '@/components/nabih-icon';
import { Card, CardContent } from '@/components/ui/card';
import Head from 'next/head';

const contentSuiteNav = [
    { href: "/tools/content-ideas", icon: <Lightbulb />, label: "Content Ideas" },
    { href: "/tools/blog-generator", icon: <FileText />, label: "Blog Generator" },
    { href: "/tools/bulk-blog-generator", icon: <Files />, label: "Bulk Blog Generator" },
    { href: "/tools/image-generator", icon: <ImageIcon />, label: "Image Generator" },
    { href: "/tools/brand-kit-generator", icon: <Palette />, label: "Brand Kit Generator" },
    { href: "/tools/wireframe-generator", icon: <LayoutTemplate />, label: "Wireframe Generator" },
    { href: "/tools/landing-page-generator", icon: <LayoutTemplate />, label: "Landing Page Generator" },
];

const siteManagementNav = [
    { href: "/dashboard/ai-chatbot", icon: <Bot />, label: "AI Chatbot" },
    { href: "/dashboard/website-audit", icon: <Activity />, label: "Website Audit" },
    { href: "/dashboard/advanced-media-library", icon: <Library />, label: "Media Library" },
    { href: "/dashboard/image-resizer", icon: <Crop />, label: "Image Resizer" },
    { href: "/dashboard/internal-linking", icon: <Link2 />, label: "Internal Linking" },
    { href: "/dashboard/stale-content", icon: <TrendingDown />, label: "Stale Content" },
    { href: "/dashboard/woocommerce-sync", icon: <GitCompare />, label: "WooCommerce Sync" },
    { href: "/dashboard/legal-generator", icon: <Shield />, label: "Legal Document Generator" },
];

const seoSuiteNav = [
    { href: "/dashboard/keyword-clustering", icon: <Layers3 />, label: "Keyword Clustering" },
    { href: "/dashboard/keyword-density-checker", icon: <Type />, label: "Keyword Density" },
    { href: "/dashboard/people-also-ask", icon: <HelpCircle />, label: "People Also Ask" },
    { href: "/dashboard/schema-markup-generator", icon: <Code2 />, label: "Schema Generator" },
    { href: "/dashboard/broken-link-checker", icon: <Unlink />, label: "Broken Link Checker" },
    { href: "/dashboard/sitemap-generator", icon: <Network />, label: "Sitemap Generator" },
];

const agencyToolkitNav = [
    { href: "/tools/lead-finder", icon: <Briefcase />, label: "Lead Finder" },
    { href: "/dashboard/invoice-generator", icon: <Receipt />, label: "Invoice Generator" },
    { href: "/dashboard/visual-feedback", icon: <MessageSquareQuote />, label: "Client Feedback Tool" },
    { href: "/dashboard/responsiveness-checker", icon: <Smartphone />, label: "Mockup Generator" },
    { href: "/tools/time-tracker", icon: <Clock />, label: "Time Tracking & Invoicing" },
    { href: "/dashboard/white-label", icon: <Paintbrush />, label: "WordPress Admin Branding" },
    { href: "/dashboard/woocommerce-scraper", icon: <DownloadCloud />, label: "Products Scraper" },
];

const conversionToolkitNav = [
    { href: "/dashboard/compress-and-convert", icon: <FileCog />, label: "Compress & Convert Images" },
];

const toolCategories = [
    { title: "Content Suite", tools: contentSuiteNav },
    { title: "SEO Suite", tools: seoSuiteNav },
    { title: "Site Management", tools: siteManagementNav },
    { title: "Compress & Convert", tools: conversionToolkitNav },
    { title: "Agency Toolkit", tools: agencyToolkitNav },
];


export default function AboutPage() {
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About Nabih",
    "description": "Learn about the mission and story behind Nabih, the all-in-one AI toolkit for web agencies and creators.",
    "url": "https://nabih.ai/about"
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
                We're on a Mission to End{' '}
                <span className="text-primary">Content Bottlenecks</span>.
              </h1>
              <p className="max-w-3xl mx-auto text-lg text-muted-foreground">
                We get it. You need to create more content to grow. But who has the time? Nabih was born from this exact frustration. We're a team of marketers, engineers, and AI enthusiasts dedicated to building tools that automate the grind, so you can focus on strategy.
              </p>
            </div>
          </section>

          <section className="py-20 bg-card/80">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">
                    Our Story: From Frustration to Innovation
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    It all started with a simple problem: our marketing agency was spending 80% of its time on content creation and only 20% on the high-impact strategies that actually moved the needle for clients. We knew there had to be a better way.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    What if we could leverage the power of AI not just to write, but to build an entire content workflow? From the initial idea to the final, illustrated, and published blog post on WordPress.
                  </p>
                  <p className="text-muted-foreground">
                    That "what if" became our obsession. After months of development, Nabih was born. It's the tool we always wished we had, and now we're sharing it with the world.
                  </p>
                </div>
                <div>
                  <Image
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                    alt="Team working together on a project"
                    width={600}
                    height={400}
                    className="rounded-lg shadow-lg"
                    data-ai-hint="team collaboration"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="py-20">
              <div className="container mx-auto px-4">
                  <Card className="glass-card overflow-hidden">
                      <div className="grid md:grid-cols-2 items-center">
                          <div className="p-8 md:p-12">
                              <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">The Genesis of <span className="text-primary">Nabih</span></h2>
                              <div className="space-y-4 text-muted-foreground">
                                  <p>
                                      Nabih wasn't born in a boardroom. It was forged in the trenches of freelance web development. After building over 200 websites—from achieving a 100% success score across 100 projects on Upwork to countless direct client deals—a pattern became painfully clear: content was the universal bottleneck.
                                  </p>
                                  <p>
                                      I saw brilliant designers and developers constantly waiting, their projects stalled by the slow, arduous process of content creation. I knew there had to be an <span className="text-foreground font-semibold">intelligent</span> solution.
                                  </p>
                                  <p>
                                      The name, Nabih, is an Arabic word meaning just that—intelligent. It's a nod to the smart, AI-powered core of our platform. But it's also something more personal. It's the nickname I've always called my wife. This project is a tribute to her inspiration and a testament to the idea that the best tools are built with heart.
                                  </p>
                              </div>
                          </div>
                          <div className="bg-primary/10 h-full flex items-center justify-center p-8 min-h-[300px] md:min-h-0">
                             <NabihIcon className="w-48 h-48 text-primary/80" />
                          </div>
                      </div>
                  </Card>
              </div>
          </section>

          <section className="py-20 bg-card/80">
            <div className="container mx-auto px-4">
              <Card className="glass-card">
                <CardContent className="p-8 md:p-12 grid md:grid-cols-3 gap-8 items-center">
                  <div className="md:col-span-1">
                    <Image
                      src="https://placehold.co/300x300.png"
                      data-ai-hint="founder photo"
                      alt="Hamza Shahzad, Founder & CEO of Nabih"
                      width={300}
                      height={300}
                      className="rounded-full aspect-square object-cover mx-auto shadow-lg border-4 border-primary/20"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <h2 className="text-2xl md:text-3xl font-headline font-bold mb-2">Meet the Guy Who Got Tired of Doing the Same WordPress Tasks 500 Times… So He Built a Robot to Do It Instead</h2>
                    <p className="font-semibold text-primary mb-4">Hamza Shahzad, Founder & CEO</p>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                      👋 Hey, I’m Hamza Shahzad — Founder & CEO of this powerhouse WordPress automation web app. After working on 500+ WordPress projects, scaling my agency, and managing a team that drinks more chai than water, I had one question:
                      </p>
                      <p className="font-semibold text-foreground italic">
                      Why the heck am I still uploading blog images manually in 2025?!
                      </p>
                      <p>
                      So, I did what every exhausted, overworked, tech-obsessed web developer dreams of… I built a tool that automates all the boring WordPress stuff. Now, clients, developers, and agency owners (like my past self) use this app to bulk publish blogs, upload & optimize images, scrape WooCommerce products, sync stores, audit websites, run SEO tools, generate mockups, check responsiveness — and still have time left to touch grass.
                      </p>
                       <p>
                      No more repetitive tasks. No more 97 open Chrome tabs. Just results. On autopilot.
                       </p>
                       <p>
                      If you’ve ever screamed at your screen while resizing product images or syncing WooCommerce sites across staging and live — I made this for you.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section id="tools" className="py-20">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-12">Explore Our Full Toolkit</h2>
              <div className="space-y-12">
                {toolCategories.map(category => (
                  <div key={category.title}>
                    <h3 className="text-2xl font-headline font-semibold text-center mb-6">{category.title}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {category.tools.map(tool => (
                        <Link href={tool.href} key={tool.label}>
                           <div className="flex items-center gap-3 p-3 rounded-md transition-colors hover:bg-primary/10">
                              <div className="text-primary">{tool.icon}</div>
                              <span className="font-medium">{tool.label}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="cta" className="py-20">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">
                Join Us on Our Journey
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
                Ready to see how Nabih can transform your workflow? Start creating smarter, not harder.
              </p>
              <Button asChild size="lg">
                <Link href="/signup">
                  Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
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
