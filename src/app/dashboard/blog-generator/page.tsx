
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, Clipboard, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { generateBlogPost, GenerateBlogPostInput } from "@/ai/flows/generate-blog-post";
import { useLocalStorage } from "@/hooks/use-local-storage";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  seoKeywords: z.string().min(3, "Please provide at least one SEO keyword."),
  wordLength: z.number().min(100).max(2000),
  tone: z.string().min(1, "Please select a tone."),
  theme: z.string().min(3, "Please describe the article theme."),
  copywritingStyle: z.string().min(1, "Please select a copywriting style."),
});

type FormValues = z.infer<typeof formSchema>;

interface BlogPost {
    id: string;
    title: string;
    content: string;
    date: string;
}

export default function BlogGeneratorPage() {
  const [generatedPost, setGeneratedPost] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [posts, setPosts] = useLocalStorage<BlogPost[]>("blog-posts", []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      seoKeywords: "",
      wordLength: 800,
      tone: "Informal",
      theme: "",
      copywritingStyle: "Neil Patel",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedPost("");
    setGeneratedTitle("");
    try {
      const result = await generateBlogPost(data as GenerateBlogPostInput);
      setGeneratedPost(result.blogPost);
      setGeneratedTitle(data.title);
    } catch (error) {
      console.error("Error generating blog post:", error);
      toast({
        title: "Error",
        description: "Failed to generate blog post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = () => {
    if (!generatedPost) return;
    navigator.clipboard.writeText(generatedPost);
    toast({
      title: "Copied to clipboard!",
      description: "The blog post has been copied to your clipboard.",
    });
  };

  const handleSavePost = async () => {
    if (!generatedPost || !generatedTitle) return;
    setIsSaving(true);
    
    // Simulate a save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newPost: BlogPost = {
        id: new Date().toISOString(),
        title: generatedTitle,
        content: generatedPost,
        date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }),
    };

    setPosts([...posts, newPost]);

    setIsSaving(false);
    toast({
      title: "Post Saved!",
      description: "Your new blog post has been saved locally.",
    });
    // Clear the generated post to prevent re-saving
    setGeneratedPost("");
    setGeneratedTitle("");
  };


  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Blog Post Generator</CardTitle>
          <CardDescription>Fill in the details below to generate a new blog post with AI.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blog Post Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., '10 Ways to Boost Your SEO in 2024'" {...field} />
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

              <Button type="submit" className="w-full" disabled={isLoading || isSaving}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Bot className="mr-2 h-4 w-4" />
                    Generate Post
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Generated Content</CardTitle>
            <CardDescription>Your AI-generated blog post will appear here.</CardDescription>
          </div>
          {generatedPost && (
            <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={copyToClipboard} aria-label="Copy to clipboard">
                    <Clipboard className="h-4 w-4" />
                </Button>
                <Button onClick={handleSavePost} disabled={isSaving || isLoading}>
                    {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Post
                </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert prose-headings:font-headline max-w-none h-[600px] overflow-y-auto rounded-md border bg-muted/50 p-4">
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">AI is writing, please wait...</p>
              </div>
            )}
            {!isLoading && !generatedPost && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                 <Bot className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Your generated content will be displayed here.</p>
              </div>
            )}
            {generatedPost && (
              <div dangerouslySetInnerHTML={{ __html: generatedPost.replace(/\n/g, '<br />') }} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
