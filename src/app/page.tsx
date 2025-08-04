
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Bot, CheckCircle2, Star, Download, Mail, LayoutDashboard, Settings, User, FileText, ImageIcon, LogOut, Library, Activity, Lightbulb, Paintbrush, Shield, TrendingDown, Link2, Files, Palette, LayoutTemplate, Smartphone, MessageSquareQuote, Receipt, HelpCircle, Type, Code2, Unlink, Layers3, Network, DownloadCloud, Crop, Users, GitCompare, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Input } from '@/components/ui/input';

const contentSuiteNav = [
    { href: "/content-ideas", icon: <Lightbulb />, label: "Content Ideas" },
    { href: "/blog-generator", icon: <FileText />, label: "Blog Generator" },
    { href: "/bulk-blog-generator", icon: <Files />, label: "Bulk Blog Generator" },
    { href: "/image-generator", icon: <ImageIcon />, label: "Image Generator" },
    { href: "/brand-kit-generator", icon: <Palette />, label: "Brand Kit Generator" },
    { href: "/wireframe-generator", icon: <LayoutTemplate />, label: "Wireframe Generator" },
];

const siteManagementNav = [
    { href: "/dashboard/ai-chatbot", icon: <Bot />, label: "AI Chatbot" },
    { href: "/dashboard/website-audit", icon: <Activity />, label: "Website Audit" },
    { href: "/dashboard/advanced-media-library", icon: <Library />, label: "Media Library" },
    { href: "/dashboard/image-resizer", icon: <Crop />, label: "Image Resizer" },
    { href: "/dashboard/internal-linking", icon: <Link2 />, label: "Internal Linking" },
    { href: "/dashboard/stale-content", icon: <TrendingDown />, label: "Stale Content" },
    { href: "/dashboard/woocommerce-sync", icon: <GitCompare />, label: "WooCommerce Sync" },
    { href: "/dashboard/legal-generator", icon: <Shield />, label: "Legal Generator" },
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
    { href: "/dashboard/invoice-generator", icon: <Receipt />, label: "Invoice Generator" },
    { href: "/dashboard/visual-feedback", icon: <MessageSquareQuote />, label: "Visual Feedback" },
    { href: "/dashboard/responsiveness-checker", icon: <Smartphone />, label: "Mockup Generator" },
    { href: "/time-tracker", icon: <Clock />, label: "Time Tracker" },
    { href: "/dashboard/white-label", icon: <Paintbrush />, label: "White-Label" },
    { href: "/dashboard/woocommerce-scraper", icon: <DownloadCloud />, label: "Products Scraper" },
];

const toolCategories = [
    { title: "Content Suite", tools: contentSuiteNav },
    { title: "SEO Suite", tools: seoSuiteNav },
    { title: "Site Management", tools: siteManagementNav },
    { title: "Agency Toolkit", tools: agencyToolkitNav },
];


export default function Home() {
  const features = [
    {
      icon: <Bot className="w-8 h-8 text-primary" />,
      title: 'Scale Content Creation',
      description:
        'From single blog posts to bulk generation, create SEO-optimized articles in minutes. The perfect tool for agencies and marketing teams.',
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 256 256"
          className="w-8 h-8 text-primary"
        >
          <rect width="256" height="256" fill="none" />
          <path
            d="M88,134.9,172,50.9a20,20,0,0,1,28.3,28.3L116.3,163.2a12,12,0,0,1-17,0L54.9,118.9a20,20,0,0,1,28.3-28.3Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="16"
          />
          <path
            d="M195.9,116.3,216,136.4V200a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V64a8,8,0,0,1,8-8h63.6l20.1,20.1"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="16"
          />
        </svg>
      ),
      title: 'Streamline Client Workflow',
      description:
        'Use the visual feedback tool to get client approval on designs, then generate invoices to bill for your work, all in one place.',
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 256 256"
          className="w-8 h-8 text-primary"
        >
          <rect width="256" height="256" fill="none" />
          <path
            d="M128,128h88a8,8,0,0,1,8,8v80a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h80a8,8,0,0,1,8,8v88Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="16"
          />
          <line
            x1="128"
            y1="128"
            x2="176"
            y2="80"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="16"
          />
        </svg>
      ),
      title: 'Manage WordPress Sites',
      description:
        'Connect your client sites to audit performance, manage media, find stale content, and deploy an AI chatbot with ease.',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah L.',
      title: 'Content Marketer',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
      review:
        "Nabih has revolutionized my workflow. I'm producing 5x the content without sacrificing quality. The AI is scarily good at matching my tone.",
    },
    {
      name: 'Mike R.',
      title: 'Indie Hacker',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d',
      review:
        "As a solo founder, I wear many hats. Nabih is my secret weapon for SEO. It's like having a dedicated content team for the price of a coffee.",
    },
    {
      name: 'Jenna K.',
      title: 'Agency Owner',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d',
      review:
        "The WordPress integration is seamless. We can now manage and publish content for all our clients from one dashboard. It's a massive time-saver.",
    },
  ];

  const pricingTiers = [
    {
      name: 'Free',
      price: '$0',
      period: '/ month',
      description: 'For individuals starting out.',
      features: [
        '3 Blog Posts/month',
        '10 Image Generations/month',
        '1 Connected WordPress Site',
      ],
      cta: 'Start for Free',
      variant: 'secondary' as const,
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/ month',
      description: 'For professionals and small teams.',
      features: [
        'Unlimited Blog Posts',
        'Unlimited Image Generations',
        '5 Connected WordPress Sites',
        'Priority Support',
      ],
      cta: 'Get Started',
      variant: 'default' as const,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large teams and agencies.',
      features: [
        'Everything in Pro',
        'Unlimited WordPress Sites',
        'Dedicated Account Manager',
        'API Access',
      ],
      cta: 'Contact Us',
      variant: 'secondary' as const,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <section id="hero" className="py-20 md:py-24 text-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              Your All-In-One Toolkit for{' '}
              <span className="text-primary brightness-125">Web Agencies & Creators.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
              Stop juggling dozens of apps. Nabih is the ultimate AI-powered platform to write content, manage websites, and streamline client workflows.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/signup">
                  Launch Command Center <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="#features">Explore Modules</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-12">
              The Last Content Tool You'll Ever Need
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="glass-card text-center transition-all duration-300 hover:border-primary/50 hover:-translate-y-2">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 p-3 rounded-lg w-fit">
                        {feature.icon}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-xl font-headline font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="tools" className="py-20 bg-card/80">
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

        <section id="lead-magnet" className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Image
                  src="https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=2070&auto=format&fit=crop"
                  alt="Person writing on a checklist"
                  width={600}
                  height={500}
                  className="rounded-lg shadow-lg"
                  data-ai-hint="checklist document"
                />
              </div>
              <div className="max-w-lg">
                <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">
                  Don't Know Where to Start? We've Got You.
                </h2>
                <p className="text-muted-foreground mb-6 text-lg">
                  Building a WordPress site that actually gets results can be overwhelming. SEO, design, performance, security... where do you even begin? We've distilled the entire process into one ultimate checklist.
                </p>
                <Card className="glass-card">
                  <CardContent className="pt-6">
                    <p className="font-semibold mb-4">Get your FREE copy of the Ultimate WordPress Website Checklist:</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-grow">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input type="email" placeholder="you@agency.com" className="pl-10" />
                        </div>
                        <Button asChild>
                          <Link href="/checklist">
                            Download Now <Download className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
        
        <section id="testimonials" className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-12">
              Don't Just Take Our Word For It
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="glass-card flex flex-col">
                  <CardContent className="pt-6 flex-grow">
                    <div className="flex items-center mb-4">
                      <Avatar className="h-12 w-12 mr-4 border-2 border-primary/50">
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                      </div>
                    </div>
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-muted-foreground">{testimonial.review}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="max-w-xl mx-auto text-lg text-muted-foreground text-center mb-12">
              Choose the plan that's right for you. Start for free, no credit card required.
            </p>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {pricingTiers.map((tier) => (
                <Card key={tier.name} className={`glass-card flex flex-col transition-all duration-300 ${tier.name === 'Pro' ? 'border-primary shadow-lg shadow-primary/20 scale-105' : 'hover:border-primary/30'}`}>
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl">{tier.name}</CardTitle>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground ml-1">{tier.period}</span>
                    </div>
                    <p className="text-muted-foreground pt-2">{tier.description}</p>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-center">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Button asChild className="w-full" variant={tier.variant}>
                      <Link href={tier.cta === 'Contact Us' ? '/contact' : '/signup'}>{tier.cta}</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        <section id="cta" className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">
              Ready to Supercharge Your Content?
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
              Join thousands of creators who are building their empires with Nabih. Your first few posts are on us.
            </p>
            <Button asChild size="lg">
              <Link href="/signup">
                Claim Your Free Account Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
