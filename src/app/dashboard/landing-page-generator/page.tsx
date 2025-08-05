
// src/app/dashboard/landing-page-generator/page.tsx
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, Clipboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { generateLandingPage } from "@/ai/flows/generate-landing-page";
import { GenerateLandingPageInputSchema, type GenerateLandingPageInput } from "@/ai/flows/types/landing-page";

type FormValues = GenerateLandingPageInput;

export default function LandingPageGeneratorPage() {
  const [generatedHtml, setGeneratedHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(GenerateLandingPageInputSchema),
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

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedHtml("");
    try {
      const result = await generateLandingPage(data);
      setGeneratedHtml(result.html);
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

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-headline font-bold">AI Landing Page Generator</h1>
            <p className="text-muted-foreground max-w-2xl">
                Describe your business and goals, and let the AI generate a complete, high-fidelity landing page with HTML and Tailwind CSS.
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
        </div>
    </div>
  );
}
