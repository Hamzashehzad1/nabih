// src/app/dashboard/keyword-clustering/page.tsx
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Layers3, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { clusterKeywords, type ClusterKeywordsOutput } from "@/ai/flows/keyword-clustering";


const formSchema = z.object({
  keywords: z.string().min(10, "Please enter at least two keywords, one per line."),
});

type FormValues = z.infer<typeof formSchema>;


export default function KeywordClusteringPage() {
  const [generatedClusters, setGeneratedClusters] = useState<ClusterKeywordsOutput['clusters']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keywords: "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const keywords = data.keywords.split('\n').filter(k => k.trim() !== '');
    if (keywords.length < 2) {
      form.setError('keywords', { message: "Please enter at least two keywords." });
      return;
    }
    
    setIsLoading(true);
    setGeneratedClusters([]);
    try {
      const result = await clusterKeywords({ keywords });
      setGeneratedClusters(result.clusters);
    } catch (error) {
      console.error("Error clustering keywords:", error);
      toast({
        title: "Error",
        description: "Failed to cluster keywords. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="grid gap-8 md:grid-cols-2 items-start">
        <Card>
            <CardHeader>
            <CardTitle>AI Keyword Clustering</CardTitle>
            <CardDescription>Group a list of keywords into relevant, topical clusters to better plan your content strategy and site structure.</CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Keywords (One Per Line)</FormLabel>
                        <FormControl>
                        <Textarea placeholder="e.g.,\n'best running shoes'\n'how to start running'\n'marathon training plan'..." {...field} rows={10} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Clustering...
                    </>
                    ) : (
                    <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Cluster Keywords
                    </>
                    )}
                </Button>
                </form>
            </Form>
            </CardContent>
        </Card>

      <Card>
        <CardHeader>
            <CardTitle>Keyword Clusters</CardTitle>
            <CardDescription>Here are your keywords grouped by topic. Use these clusters to create pillar pages and topic-focused articles.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert prose-headings:font-headline max-w-none h-[600px] overflow-y-auto rounded-md border bg-muted/50 p-4">
            {isLoading && (
                <div className="space-y-4">
                    {Array.from({length: 3}).map((_, i) => (
                        <div key={i} className="space-y-2 p-3 rounded-lg border">
                             <Skeleton className="h-5 w-2/5" />
                             <div className="flex flex-wrap gap-2">
                                <Skeleton className="h-6 w-24" /><Skeleton className="h-6 w-28" /><Skeleton className="h-6 w-20" />
                             </div>
                        </div>
                    ))}
                </div>
            )}
            {!isLoading && generatedClusters.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                 <Layers3 className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Your keyword clusters will appear here.</p>
              </div>
            )}
            {generatedClusters.length > 0 && (
              <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                {generatedClusters.map((cluster, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="text-lg font-semibold capitalize">{cluster.clusterName}</AccordionTrigger>
                        <AccordionContent>
                           <div className="flex flex-wrap gap-2">
                            {cluster.keywords.map(keyword => (
                                <Badge key={keyword} variant="secondary">{keyword}</Badge>
                            ))}
                           </div>
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
