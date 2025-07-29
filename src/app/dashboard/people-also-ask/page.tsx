// src/app/dashboard/people-also-ask/page.tsx
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, HelpCircle, Sparkles, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";

import { getPeopleAlsoAsk } from "./actions";


const formSchema = z.object({
  keyword: z.string().min(2, "Please enter a keyword."),
});

type FormValues = z.infer<typeof formSchema>;


export default function PeopleAlsoAskPage() {
  const [paaQuestions, setPaaQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setPaaQuestions([]);
    try {
      const result = await getPeopleAlsoAsk(data.keyword);
      if (result.success) {
        setPaaQuestions(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("Error fetching PAA questions:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(paaQuestions.join('\n'));
    toast({
      title: "Copied!",
      description: "All questions have been copied to your clipboard.",
    });
  };

  return (
    <div className="grid gap-8 md:grid-cols-2 items-start">
        <Card>
            <CardHeader>
            <CardTitle>People Also Ask (PAA) Finder</CardTitle>
            <CardDescription>Enter a keyword to discover what questions users are asking on Google. This is a goldmine for content ideas.</CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="keyword"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Target Keyword</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., 'content marketing'" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching Google...
                    </>
                    ) : (
                    <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Find Questions
                    </>
                    )}
                </Button>
                </form>
            </Form>
            </CardContent>
        </Card>

      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Found Questions</CardTitle>
                {paaQuestions.length > 0 && (
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                        <Copy className="mr-2 h-4 w-4" /> Copy All
                    </Button>
                )}
            </div>
            <CardDescription>Here are the questions Google shows for your keyword. Use them as H2s in your articles!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none h-[400px] overflow-y-auto rounded-md border bg-muted/50 p-4">
            {isLoading && (
                <div className="space-y-2">
                    {Array.from({length: 4}).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                    ))}
                </div>
            )}
            {!isLoading && paaQuestions.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                 <HelpCircle className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Related questions will appear here.</p>
              </div>
            )}
            {paaQuestions.length > 0 && (
              <ul className="list-disc pl-5 space-y-2">
                {paaQuestions.map((question, index) => (
                    <li key={index} className="text-base">{question}</li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
