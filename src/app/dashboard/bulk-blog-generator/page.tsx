
// src/app/dashboard/bulk-blog-generator/page.tsx
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, Loader2, Save, Files, CheckCircle2, XCircle, AlertTriangle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateBlogPost, GenerateBlogPostInput } from "@/ai/flows/generate-blog-post";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { createWpPost } from "../actions/wp-actions";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  titles: z.string().min(5, "Please enter at least one title."),
  seoKeywords: z.string().min(3, "Please provide at least one SEO keyword."),
  wordLength: z.number().min(100).max(2000),
  tone: z.string().min(1, "Please select a tone."),
  theme: z.string().min(3, "Please describe the article theme."),
  copywritingStyle: z.string().min(1, "Please select a copywriting style."),
});

type FormValues = z.infer<typeof formSchema>;

interface GeneratedPost {
  title: string;
  content: string;
  status: 'pending' | 'generating' | 'success' | 'error';
  error?: string;
}

interface WpSite {
    id: string;
    url: string;
    user: string;
    appPassword?: string;
}


export default function BulkBlogGeneratorPage() {
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const { toast } = useToast();
  const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<'draft' | 'publish'>('draft');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titles: "",
      seoKeywords: "",
      wordLength: 800,
      tone: "Informal",
      theme: "",
      copywritingStyle: "Neil Patel",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const titles = data.titles.split('\n').filter(t => t.trim() !== '');
    if (titles.length === 0) {
        toast({ title: "No titles provided", description: "Please enter at least one title per line.", variant: "destructive" });
        return;
    }

    setIsLoading(true);
    
    const initialPosts: GeneratedPost[] = titles.map(title => ({ title, content: '', status: 'pending' }));
    setGeneratedPosts(initialPosts);

    for (let i = 0; i < titles.length; i++) {
        const title = titles[i];
        
        setGeneratedPosts(prev => prev.map((p, index) => index === i ? { ...p, status: 'generating' } : p));
        
        try {
            const generationInput: GenerateBlogPostInput = {
                title,
                seoKeywords: data.seoKeywords,
                wordLength: data.wordLength,
                tone: data.tone,
                theme: data.theme,
                copywritingStyle: data.copywritingStyle,
            };
            const result = await generateBlogPost(generationInput);
            setGeneratedPosts(prev => prev.map((p, index) => index === i ? { ...p, status: 'success', content: result.blogPost } : p));
        } catch (error) {
            console.error(`Error generating post for "${title}":`, error);
            setGeneratedPosts(prev => prev.map((p, index) => index === i ? { ...p, status: 'error', error: "Failed to generate." } : p));
        }
    }
    
    setIsLoading(false);
    toast({ title: "Bulk Generation Complete", description: "All titles have been processed." });
  };

  const handlePostAllToWp = async () => {
    const postsToPublish = generatedPosts.filter(p => p.status === 'success');
    if(postsToPublish.length === 0) {
        toast({ title: "No posts to publish", description: "No posts were generated successfully.", variant: "destructive" });
        return;
    }
    const site = sites.find(s => s.id === selectedSiteId);
    if (!site) {
        toast({ title: "No site selected", description: "Please select a WordPress site to post to.", variant: "destructive" });
        return;
    }

    setIsPosting(true);
    
    let successCount = 0;
    for(const post of postsToPublish) {
        const result = await createWpPost(site, {
            title: post.title,
            content: post.content,
            status: publishStatus,
        });

        if (result.success) {
            successCount++;
        } else {
             toast({
                title: `Failed to Post "${post.title}"`,
                description: result.error,
                variant: "destructive",
            });
        }
    }
    
    setIsPosting(false);
    if (successCount > 0) {
        toast({ title: "Posting Complete!", description: `${successCount} new blog posts have been sent to your site.` });
    }
    setGeneratedPosts([]);
    form.reset();
  };


  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-headline font-bold">Bulk Blog Post Generator</h1>
            <p className="text-muted-foreground max-w-2xl">
                Generate multiple blog posts at once by entering a list of titles. The same settings will be applied to all titles.
            </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 items-start">
            <Card>
                <CardHeader>
                <CardTitle>Generation Settings</CardTitle>
                <CardDescription>Enter one post title per line. These settings will apply to all titles.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="titles"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Blog Post Titles (One Per Line)</FormLabel>
                            <FormControl>
                            <Textarea placeholder="10 Ways to Boost Your SEO in 2024\nA Beginner's Guide to Content Marketing" {...field} rows={6} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="seoKeywords"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>SEO Keywords</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., 'SEO, marketing, content strategy'" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="theme"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Article Theme</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., 'A guide for beginners'" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="wordLength"
                        render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                            <FormLabel>Word Length</FormLabel>
                            <span className="text-sm text-muted-foreground">{field.value} words</span>
                            </div>
                            <FormControl>
                            <Slider
                                min={100}
                                max={2000}
                                step={50}
                                value={[field.value]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                            />
                            </FormControl>
                        </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name="tone"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tone of Article</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a tone" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="Formal">Formal</SelectItem>
                                <SelectItem value="Informal">Informal</SelectItem>
                                <SelectItem value="Humorous">Humorous</SelectItem>
                                <SelectItem value="Authoritative">Authoritative</SelectItem>
                                </SelectContent>
                            </Select>
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="copywritingStyle"
                        render={({ field }) => (
                            <FormItem>
                            <div className="flex items-center gap-2">
                                <FormLabel>Copywriting Style</FormLabel>
                                <InfoTooltip info="The AI will mimic the writing style of the selected copywriter." />
                            </div>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a style" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="Neil Patel">Neil Patel</SelectItem>
                                <SelectItem value="Seth Godin">Seth Godin</SelectItem>
                                <SelectItem value="Joanna Wiebe">Joanna Wiebe</SelectItem>
                                </SelectContent>
                            </Select>
                            </FormItem>
                        )}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading || isPosting}>
                        {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                        ) : (
                        <>
                            <Files className="mr-2 h-4 w-4" />
                            Generate All Posts
                        </>
                        )}
                    </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Generated Content</CardTitle>
                    <CardDescription>Your AI-generated blog posts will appear here.</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="prose prose-sm dark:prose-invert prose-headings:font-headline max-w-none h-[700px] overflow-y-auto rounded-md border bg-muted/50 p-4">
                    {!isLoading && generatedPosts.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Bot className="h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">Generated posts will be displayed here.</p>
                    </div>
                    )}
                    {generatedPosts.length > 0 && (
                        <Accordion type="single" collapsible className="w-full">
                            {generatedPosts.map((post, index) => (
                                <AccordionItem value={`item-${index}`} key={index}>
                                    <AccordionTrigger>
                                        <div className="flex items-center gap-2 w-full">
                                            {post.status === 'pending' && <Loader2 className="h-4 w-4 text-muted-foreground" />}
                                            {post.status === 'generating' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                                            {post.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                            {post.status === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
                                            <span className="truncate">{post.title}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                    {post.status === 'success' ? (
                                        <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }} />
                                    ) : post.status === 'error' ? (
                                        <Alert variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertTitle>Generation Failed</AlertTitle>
                                            <AlertDescription>{post.error}</AlertDescription>
                                        </Alert>
                                    ) : (
                                        <p className="text-muted-foreground">Waiting to generate...</p>
                                    )}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </div>
                </CardContent>
                 {generatedPosts.some(p => p.status === 'success') && (
                    <CardFooter className="flex-col items-start gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <Select onValueChange={setSelectedSiteId}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select a site to post" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sites.map(site => (
                                        <SelectItem key={site.id} value={site.id}>{new URL(site.url).hostname}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             <div className="flex items-center space-x-2">
                                <Switch id="publish-status" checked={publishStatus === 'publish'} onCheckedChange={(checked) => setPublishStatus(checked ? 'publish' : 'draft')} />
                                <Label htmlFor="publish-status" className="capitalize">{publishStatus}</Label>
                            </div>
                        </div>
                        <Button onClick={handlePostAllToWp} disabled={isPosting || isLoading || !selectedSiteId}>
                            {isPosting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-4 w-4" />
                            )}
                            Post All to WordPress
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    </div>
  );
}
