
"use client";

import { useRef } from 'react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Search, Brush, Rocket, ShieldCheck, Zap, ArrowDownToLine } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';

export default function ChecklistPage() {
    const checklistRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const handleDownloadPdf = async () => {
        const checklistElement = checklistRef.current;
        if (!checklistElement) return;

        toast({ title: 'Generating PDF...', description: 'Please wait a moment.' });
        
        try {
            const canvas = await html2canvas(checklistElement, {
                scale: 2,
                backgroundColor: null,
            });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`wordpress-launch-checklist.pdf`);
            
            toast({ title: 'PDF Downloaded!', description: 'Your checklist has been successfully downloaded.' });

        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to generate PDF.', variant: 'destructive' });
        }
    };

    const checklistSections = [
        {
            icon: <Search className="h-6 w-6 text-primary" />,
            title: "Phase 1: Research & Planning",
            items: [
                "Define Target Audience & Niche",
                "Conduct Keyword Research (Identify primary & secondary keywords)",
                "Analyze Competitor Websites (Strengths & Weaknesses)",
                "Define Website Goals (e.g., lead generation, sales, portfolio)",
                "Plan Website Structure & Sitemap (Homepage, About, Services, Blog, Contact)",
                "Choose and Register a Domain Name",
                "Select a Reliable WordPress Hosting Provider"
            ]
        },
        {
            icon: <Brush className="h-6 w-6 text-primary" />,
            title: "Phase 2: Design & Branding",
            items: [
                "Create or Procure a Professional Logo",
                "Define a Consistent Brand Color Palette & Typography",
                "Choose a Lightweight, Responsive & Well-coded WordPress Theme (e.g., Astra, GeneratePress)",
                "Design a Clear & Intuitive Navigation Menu",
                "Plan Page Layouts with a Focus on User Experience (UX)",
                "Source High-Quality, Optimized Images",
                "Ensure a Strong Call-to-Action (CTA) on Key Pages"
            ]
        },
        {
            icon: <CheckSquare className="h-6 w-6 text-primary" />,
            title: "Phase 3: WordPress Setup & Development",
            items: [
                "Install WordPress on Your Hosting Account",
                "Set Permalinks to 'Post name' for SEO-friendly URLs",
                "Install Essential Plugins (SEO, Caching, Security, Backups, Contact Form)",
                "Configure General Settings (Site Title, Tagline, Timezone)",
                "Create Essential Pages (Home, About, Contact, Privacy Policy)",
                "Set Up Your Main Navigation Menu",
                "Add Your Logo and Favicon"
            ]
        },
        {
            icon: <Zap className="h-6 w-6 text-primary" />,
            title: "Phase 4: Performance Optimization",
            items: [
                "Install and Configure a Caching Plugin (e.g., WP Rocket, W3 Total Cache)",
                "Optimize Images Before Uploading (Compress & Resize)",
                "Choose a Host with Server-side Caching",
                "Minimize the Number of Plugins",
                "Use a Content Delivery Network (CDN)",
                "Enable Gzip Compression",
                "Minify CSS and JavaScript Files"
            ]
        },
        {
            icon: <ShieldCheck className="h-6 w-6 text-primary" />,
            title: "Phase 5: SEO & Security",
            items: [
                "Configure an SEO Plugin (e.g., Yoast SEO, Rank Math)",
                "Set Up Google Analytics and Google Search Console",
                "Create and Submit an XML Sitemap to Google",
                "Install a Security Plugin (e.g., Wordfence, Sucuri)",
                "Use Strong, Unique Passwords for Admin Accounts",
                "Enable SSL/HTTPS for Your Entire Site",
                "Schedule Regular Website Backups"
            ]
        },
        {
            icon: <Rocket className="h-6 w-6 text-primary" />,
            title: "Phase 6: Launch & Post-Launch",
            items: [
                "Proofread All Content for Typos and Errors",
                "Test Website on Multiple Devices & Browsers (Responsiveness)",
                "Check All Links to Ensure They Work",
                "Test Your Contact Form and Other Forms",
                "Announce Your New Website on Social Media and to Your Email List",
                "Monitor Website Uptime and Performance",
                "Begin a Consistent Content Creation Schedule (Blogging)"
            ]
        }
    ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-headline font-bold mb-4 tracking-tight">
              The Ultimate WordPress Website Launch Checklist
            </h1>
            <p className="text-lg text-muted-foreground">
              From initial idea to a high-performing, secure, and SEO-friendly website, this checklist covers every crucial step. Don't miss a thing.
            </p>
            <Button size="lg" className="mt-6" onClick={handleDownloadPdf}>
                <ArrowDownToLine className="mr-2 h-5 w-5" /> Download as PDF
            </Button>
          </div>

          <Card className="max-w-4xl mx-auto glass-card" ref={checklistRef}>
              <CardContent className="p-6 md:p-8">
                <Accordion type="multiple" defaultValue={["item-0"]} className="w-full">
                    {checklistSections.map((section, index) => (
                        <AccordionItem value={`item-${index}`} key={section.title}>
                            <AccordionTrigger className="text-xl md:text-2xl font-headline hover:no-underline">
                                <div className="flex items-center gap-4">
                                    {section.icon}
                                    {section.title}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-4 pl-4">
                                <ul className="space-y-3">
                                    {section.items.map(item => (
                                        <li key={item} className="flex items-start">
                                            <CheckSquare className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
              </CardContent>
          </Card>
          
        </div>
      </main>
      <Footer />
    </div>
  );
}