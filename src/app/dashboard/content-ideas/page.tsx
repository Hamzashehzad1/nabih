// src/app/dashboard/content-ideas/page.tsx
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Lightbulb, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { generateContentIdeas, GenerateContentIdeasInput, type GenerateContentIdeasOutput } from "@/ai/flows/generate-content-ideas";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";


const formSchema = z.object({
  niche: z.string().min(3, "Please describe the niche."),
  targetAudience: z.string().min(3, "Please describe the target audience."),
});

type FormValues = z.infer<typeof formSchema>;


export default function ContentIdeasPage() {
  const [generatedIdeas, setGeneratedIdeas] = useState<GenerateContentIdeasOutput['ideas']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      niche: "",
      targetAudience: "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedIdeas([]);
    try {
      const result = await generateContentIdeas(data as GenerateContentIdeasInput);
      setGeneratedIdeas(result.ideas);
    } catch (error) {
      console.error("Error generating content ideas:", error);
      toast({
        title: "Error",
        description: "Failed to generate ideas. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="grid gap-8 md:grid-cols-2 items-start">
        <div>
            <Card>
                <CardHeader>
                <CardTitle>Content Idea Generator</CardTitle>
                <CardDescription>Never run out of blog ideas again. Enter a niche and target audience to get a list of fresh, relevant topics.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="niche"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Niche / Topic</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., 'Organic gardening for beginners'" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="targetAudience"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Target Audience</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., 'City dwellers with small balconies'" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                        ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate Ideas
                        </>
                        )}
                    </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
        </div>

      <Card>
        <CardHeader>
            <CardTitle>Generated Ideas</CardTitle>
            <CardDescription>Here are some AI-generated ideas to kickstart your content creation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert prose-headings:font-headline max-w-none h-[600px] overflow-y-auto rounded-md border bg-muted/50 p-4">
            {isLoading && (
                <div className="space-y-4">
                    {Array.from({length: 5}).map((_, i) => (
                        <div key={i} className="space-y-2">
                             <Skeleton className="h-4 w-4/5" />
                             <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-2/3" />
                        </div>
                    ))}
                </div>
            )}
            {!isLoading && generatedIdeas.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                 <Lightbulb className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Your generated ideas will appear here.</p>
              </div>
            )}
            {generatedIdeas.length > 0 && (
              <Accordion type="single" collapsible className="w-full">
                {generatedIdeas.map((idea, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger>{idea.title}</AccordionTrigger>
                        <AccordionContent>
                           <p className="text-muted-foreground">{idea.description}</p>
                        </AccordionContent>
                    </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
