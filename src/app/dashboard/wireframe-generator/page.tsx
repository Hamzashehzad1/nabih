
// src/app/dashboard/wireframe-generator/page.tsx
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, LayoutTemplate, Clipboard, Info, BookOpen, Image as ImageIcon } from "lucide-react";
import * as cheerio from 'cheerio';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { generateWireframe, type GenerateWireframeOutput, type GenerateWireframeInput } from "@/ai/flows/generate-wireframe";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PexelsImage } from "@/components/pexels-image";


const formSchema = z.object({
  websiteName: z.string().min(2, "Website name is required."),
  websiteType: z.string().min(1, "Please select a website type."),
  targetAudience: z.string().min(10, "Please describe your target audience."),
  primaryGoal: z.string().min(10, "Please describe the website's primary goal."),
  pagesRequired: z.string().min(3, "Please list at least one page (e.g., Home)."),
  layoutPreferences: z.string().optional(),
  specialSections: z.string().optional(),
  brandColors: z.string().optional(),
  fonts: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const WireframePreview = ({ htmlContent, imageQueries }: { htmlContent: string, imageQueries: GenerateWireframeOutput['imageQueries'] }) => {
    if (typeof window === 'undefined') {
        return <iframe srcDoc={htmlContent} className="w-full h-full" title="Wireframe Preview" />;
    }
    
    const $ = cheerio.load(htmlContent);
    const queryMap = new Map(imageQueries.map(q => [q.id, q.query]));

    $('img[data-ai-hint]').each((i, el) => {
        const hint = $(el).attr('data-ai-hint');
        if (hint && queryMap.has(hint)) {
             $(el).attr('data-pexels-query', queryMap.get(hint) as string);
        }
    });

    const modifiedHtml = $.html();
    
    // This is a bit of a hack to get React components into an iframe.
    // In a real-world, more robust app, you might use a different approach
    // like a web component or postMessage API.
    // For this prototype, we'll mount the images after the iframe loads.
    const iframeRef = (iframe: HTMLIFrameElement | null) => {
        if (iframe) {
            iframe.srcdoc = modifiedHtml;
            iframe.onload = () => {
                const doc = iframe.contentWindow?.document;
                if(doc) {
                    const react_dom_client = require('react-dom/client');
                    doc.querySelectorAll('img[data-pexels-query]').forEach(imgEl => {
                        const query = imgEl.getAttribute('data-pexels-query');
                        if (query) {
                           const container = doc.createElement('div');
                           imgEl.parentNode?.replaceChild(container, imgEl);
                           const root = react_dom_client.createRoot(container);
                           const pexelsImageElement = <PexelsImage query={query} className="w-full h-full object-cover" />;
                           root.render(pexelsImageElement);
                        }
                    });
                }
            };
        }
    };


    return <iframe ref={iframeRef} className="w-full h-full" title="Wireframe Preview" />;
};


export default function WireframeGeneratorPage() {
  const [generatedWireframe, setGeneratedWireframe] = useState<GenerateWireframeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      websiteName: "",
      websiteType: "Blog",
      targetAudience: "",
      primaryGoal: "",
      pagesRequired: "Home, About, Services, Contact, Blog",
      layoutPreferences: "",
      specialSections: "",
      brandColors: "",
      fonts: "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedWireframe(null);
    try {
      const result = await generateWireframe({ ...data, pageToGenerate: 'Home' } as GenerateWireframeInput);
      setGeneratedWireframe(result);
    } catch (error) {
      console.error("Error generating wireframe:", error);
      toast({
        title: "Error",
        description: "Failed to generate wireframe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
      description: "The wireframe HTML has been copied.",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">AI High-Fidelity Wireframe Generator</h1>
        <p className="text-muted-foreground max-w-2xl">
          Describe your website, and let AI generate a visually-rich homepage wireframe, complete with UX recommendations, copywriting, and dynamic images.
        </p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Homepage Details</CardTitle>
            <CardDescription>Fill in the details below to generate your homepage wireframe.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="websiteName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website Name</FormLabel>
                    <FormControl><Input placeholder="e.g., CreativA" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="websiteType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Blog">Blog</SelectItem>
                            <SelectItem value="Portfolio">Portfolio</SelectItem>
                            <SelectItem value="eCommerce">eCommerce</SelectItem>
                            <SelectItem value="Service-based">Service-based</SelectItem>
                            <SelectItem value="Landing Page">Landing Page</SelectItem>
                            <SelectItem value="SaaS">SaaS</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="targetAudience" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <FormControl><Textarea placeholder="e.g., Young professionals, B2B, students" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="primaryGoal" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Goal of the Website</FormLabel>
                    <FormControl><Textarea placeholder="e.g., Sell products, showcase work, generate leads" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <LayoutTemplate className="mr-2 h-4 w-4" />
                      Generate Homepage Wireframe
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Homepage</CardTitle>
            <CardDescription>Your AI-generated wireframe and assets will appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-[600px] text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">AI is designing your website structure...</p>
              </div>
            )}
            {!isLoading && !generatedWireframe && (
              <div className="flex flex-col items-center justify-center h-[600px] text-center border-2 border-dashed rounded-lg">
                <LayoutTemplate className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Your generated wireframe will be previewed here.</p>
              </div>
            )}
            {generatedWireframe && (
                <Tabs defaultValue="preview" className="w-full">
                    <div className="flex justify-between items-center mb-2">
                        <TabsList>
                            <TabsTrigger value="preview">Preview</TabsTrigger>
                            <TabsTrigger value="reasoning">UX Reasoning</TabsTrigger>
                            <TabsTrigger value="copy">Copywriting</TabsTrigger>
                            <TabsTrigger value="code">Code</TabsTrigger>
                        </TabsList>
                         <Button variant="outline" size="sm" onClick={() => copyToClipboard(generatedWireframe.wireframeHtml)}>
                            <Clipboard className="mr-2 h-4 w-4"/>
                            Copy Code
                        </Button>
                    </div>
                    <TabsContent value="preview" className="h-[600px] border rounded-md overflow-hidden bg-white">
                        <WireframePreview htmlContent={generatedWireframe.wireframeHtml} imageQueries={generatedWireframe.imageQueries} />
                    </TabsContent>
                    <TabsContent value="reasoning" className="h-[600px] border rounded-md p-4 overflow-y-auto">
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>UX/UI Rationale</AlertTitle>
                            <AlertDescription className="prose prose-sm dark:prose-invert max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: generatedWireframe.explanation.replace(/\n/g, '<br />') }}/>
                            </AlertDescription>
                        </Alert>
                    </TabsContent>
                     <TabsContent value="copy" className="h-[600px] border rounded-md p-4 overflow-y-auto">
                        <Alert>
                            <BookOpen className="h-4 w-4" />
                            <AlertTitle>AI Copy (Neil Patel Style)</AlertTitle>
                            <AlertDescription className="prose prose-sm dark:prose-invert max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: generatedWireframe.copywriting.replace(/\n/g, '<br />') }}/>
                            </AlertDescription>
                        </Alert>
                    </TabsContent>
                    <TabsContent value="code" className="h-[600px] relative">
                         <pre className="h-full w-full overflow-auto rounded-md bg-black text-white p-4 font-mono text-xs">
                           <code>{generatedWireframe.wireframeHtml}</code>
                        </pre>
                    </TabsContent>
                </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
