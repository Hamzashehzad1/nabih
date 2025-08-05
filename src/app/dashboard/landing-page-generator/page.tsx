
// src/app/dashboard/landing-page-generator/page.tsx
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, Clipboard, Send } from "lucide-react";
import { z } from 'zod';
import Link from 'next/link';
import { useLocalStorage } from '@/hooks/use-local-storage';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { generateLandingPageAction, publishToWordPress, type WpSite } from "./actions";
import type { GenerateLandingPageInput } from "@/ai/flows/types/landing-page";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


// This client-side schema is for form validation only.
const clientFormSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  industry: z.string().min(1, "Industry is required"),
  audience: z.string().min(1, "Audience is required"),
  tone: z.string().min(1, "Tone is required"),
  goal: z.string().min(1, "Goal is required"),
  features: z.string().min(1, "Features are required"),
  testimonials: z.string().optional(),
  contactMethod: z.string().min(1, "Contact method is required"),
  heroText: z.string().optional(),
  style: z.string().optional(),
});

type FormValues = GenerateLandingPageInput;

export default function LandingPageGeneratorPage() {
  const [generatedHtml, setGeneratedHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      businessName: "Innovate Inc.",
      industry: "SaaS for project management",
      audience: "Small to medium-sized tech startups",
      tone: "Professional yet approachable",
      goal: "Get users to sign up for a free trial",
      features: "AI-powered task scheduling, Real-time collaboration, Customizable dashboards, Integration with Slack and Github",
      testimonials: "'Innovate Inc. boosted our productivity by 50%!' - CEO of TechCorp, 'The best PM tool on the market.' - Founder of DevZ",
      contactMethod: "Lead generation form",
      heroText: "The Future of Project Management is Here",
      style: "Modern, dark theme, with blue accents",
    },
  });
  
  const selectedSite = sites.find(site => site.id === selectedSiteId);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedHtml("");
    try {
      const result = await generateLandingPageAction(data);
      setGeneratedHtml(result.html);
      setPageTitle(data.businessName); // Set default page title
      toast({
        title: "Landing Page Generated!",
        description: "Your new landing page code is ready.",
      });
    } catch (error) {
      console.error("Error generating landing page:", error);
      toast({
        title: "Error",
        description: "Failed to generate landing page. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedHtml) return;
    navigator.clipboard.writeText(generatedHtml);
    toast({
      title: "Copied to clipboard!",
      description: "The HTML code has been copied.",
    });
  };
  
  const handlePublish = async () => {
      if (!selectedSite) {
          toast({ title: "No site selected", description: "Please select a WordPress site to publish to.", variant: "destructive" });
          return;
      }
      if (!pageTitle.trim()) {
           toast({ title: "Page title required", description: "Please enter a title for your new page.", variant: "destructive" });
          return;
      }
       if (!generatedHtml) {
           toast({ title: "No content to publish", description: "Please generate a landing page first.", variant: "destructive" });
          return;
      }
      setIsPublishing(true);
      
      try {
          const result = await publishToWordPress({
              site: selectedSite,
              title: pageTitle,
              content: generatedHtml
          });
          if(result.success) {
              toast({ title: "Published Successfully!", description: <a href={result.data.link} target="_blank" rel="noopener noreferrer" className="underline">View your new page here.</a> });
          } else {
              throw new Error(result.error);
          }
      } catch (error: any) {
          console.error("Error publishing page:", error);
          toast({ title: "Publishing Failed", description: error.message, variant: "destructive" });
      } finally {
          setIsPublishing(false);
      }
  };

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-headline font-bold">AI Landing Page Generator for Conversion</h1>
            <p className="text-muted-foreground max-w-2xl">
                Describe your business and goals, and let our AI tools for web design generate a complete, high-fidelity landing page with HTML and Tailwind CSS.
            </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 items-start">
            <Card>
                <CardHeader>
                    <CardTitle>Landing Page Details</CardTitle>
                    <CardDescription>Provide the AI with the necessary details to craft your page.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                             <FormField control={form.control} name="businessName" render={({ field }) => (
                                <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="industry" render={({ field }) => (
                                <FormItem><FormLabel>Industry / Niche</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="audience" render={({ field }) => (
                                <FormItem><FormLabel>Target Audience</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="tone" render={({ field }) => (
                                <FormItem><FormLabel>Brand Tone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                              <FormField control={form.control} name="goal" render={({ field }) => (
                                <FormItem><FormLabel>Primary Goal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="features" render={({ field }) => (
                                <FormItem><FormLabel>Features/Services (comma-separated)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                              <FormField control={form.control} name="contactMethod" render={({ field }) => (
                                <FormItem><FormLabel>Contact Method</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="heroText" render={({ field }) => (
                                <FormItem><FormLabel>Hero Text (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="testimonials" render={({ field }) => (
                                <FormItem><FormLabel>Testimonials (Optional, comma-separated)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="style" render={({ field }) => (
                                <FormItem><FormLabel>Color/Style Preference (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate Landing Page</>}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <div className="space-y-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Generated Code</CardTitle>
                            <CardDescription>The generated HTML and Tailwind CSS code will appear here.</CardDescription>
                        </div>
                        {generatedHtml && <Button variant="outline" size="icon" onClick={copyToClipboard}><Clipboard className="h-4 w-4" /></Button>}
                    </CardHeader>
                    <CardContent>
                        <div className="h-[600px] rounded-md border bg-muted/50">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : (
                                <Textarea
                                    readOnly
                                    value={generatedHtml || "Generated code will be displayed here."}
                                    className="h-full w-full resize-none font-mono text-xs bg-transparent border-none focus-visible:ring-0"
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>
                 {generatedHtml && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Publish to WordPress</CardTitle>
                            <CardDescription>Post the generated code as a new page on your connected site.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {sites.length === 0 ? (
                                <Alert>
                                    <AlertTitle>No WordPress Sites Connected</AlertTitle>
                                    <AlertDescription>
                                        You need to connect a WordPress site in the settings to publish pages.
                                        <Button asChild variant="link" className="p-0 h-auto ml-1"><Link href="/dashboard/settings">Go to Settings</Link></Button>
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="wp-site">Select Site</Label>
                                        <Select onValueChange={setSelectedSiteId}>
                                            <SelectTrigger id="wp-site">
                                                <SelectValue placeholder="Choose a site..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sites.map(site => (
                                                    <SelectItem key={site.id} value={site.id}>
                                                        {new URL(site.url).hostname}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="page-title">New Page Title</Label>
                                        <Input id="page-title" value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} />
                                    </div>
                                    <Button className="w-full" onClick={handlePublish} disabled={isPublishing || !selectedSite}>
                                        {isPublishing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Publishing...</> : <><Send className="mr-2 h-4 w-4" /> Publish as New Page</>}
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    </div>
  );
}
