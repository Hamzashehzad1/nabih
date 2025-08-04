
// src/app/dashboard/job-post-analyzer/page.tsx
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Briefcase, Sparkles, AlertTriangle, Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { analyzeJobPost, type AnalyzeJobPostOutput } from "@/ai/flows/analyze-job-post";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";


const formSchema = z.object({
  jobDescription: z.string().min(100, "Job description should be at least 100 characters."),
});

type FormValues = z.infer<typeof formSchema>;


export default function JobPostAnalyzerPage() {
  const [analysisResult, setAnalysisResult] = useState<AnalyzeJobPostOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobDescription: "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeJobPost(data);
      setAnalysisResult(result);
    } catch (error) {
      console.error("Error analyzing job post:", error);
      toast({
        title: "Error",
        description: "Failed to analyze job post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getRiskColor = (risk: 'Low' | 'Medium' | 'High') => {
    switch(risk) {
      case 'Low': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'High': return 'bg-red-500';
    }
  }

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;
    
    const { jobQualityScore, competitionLevel, timeSensitivity, suggestedApproach, redFlags, smartProposalTips, overallRisk } = analysisResult;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Job Analysis Report</CardTitle>
                <CardDescription>Here is the AI-powered analysis of the job post.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <Card>
                        <CardHeader><CardTitle>Quality Score</CardTitle></CardHeader>
                        <CardContent><p className="text-4xl font-bold">{jobQualityScore}<span className="text-xl text-muted-foreground">/100</span></p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Competition</CardTitle></CardHeader>
                        <CardContent><p className="text-4xl font-bold">{competitionLevel}</p></CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Urgency</CardTitle></CardHeader>
                        <CardContent><p className="text-4xl font-bold">{timeSensitivity}</p></CardContent>
                    </Card>
                </div>
                
                 <div className="space-y-2">
                    <Label>Overall Risk</Label>
                    <div className="flex items-center gap-2">
                        <div className={cn("h-4 w-4 rounded-full", getRiskColor(overallRisk))} />
                        <p className="font-semibold">{overallRisk} Risk</p>
                    </div>
                </div>

                <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>Suggested Approach</AlertTitle>
                    <AlertDescription>{suggestedApproach}</AlertDescription>
                </Alert>

                 <div>
                    <h4 className="font-semibold mb-2">Smart Proposal Tips</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {smartProposalTips.map((tip, i) => <li key={i}>{tip}</li>)}
                    </ul>
                </div>
                
                {redFlags.length > 0 && (
                     <div>
                        <h4 className="font-semibold mb-2 text-destructive">Potential Red Flags</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-destructive/80">
                            {redFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
  }

  return (
     <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-headline font-bold">Job Post Analyzer</h1>
            <p className="text-muted-foreground max-w-2xl">
                Paste the text from a job description (from Upwork, LinkedIn, etc.) to get an AI-powered analysis of its quality, competition, and potential red flags.
            </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 items-start">
            <Card>
                <CardHeader>
                <CardTitle>Job Post Content</CardTitle>
                <CardDescription>Paste the full job description text below.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="jobDescription"
                        render={({ field }) => (
                        <FormItem>
                            <FormControl>
                            <Textarea placeholder="Paste job description here..." {...field} rows={20} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                        </>
                        ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Analyze Job Post
                        </>
                        )}
                    </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>

            <div>
                {isLoading ? (
                    <Card className="flex items-center justify-center h-96">
                        <div className="text-center space-y-2">
                           <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                           <p className="text-muted-foreground">AI is analyzing the job post...</p>
                        </div>
                    </Card>
                ) : analysisResult ? (
                    renderAnalysisResult()
                ) : (
                     <Card className="flex items-center justify-center h-96 border-dashed">
                        <div className="text-center text-muted-foreground">
                            <Briefcase className="h-12 w-12 mx-auto mb-4" />
                            <p>Your analysis report will appear here.</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
     </div>
  );
}
