
// src/app/dashboard/lead-finder/page.tsx
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Briefcase, Sparkles, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { findLeads, FindLeadsInputSchema as formSchema, type FindLeadsOutput } from "@/ai/flows/find-leads";

type FormValues = z.infer<typeof formSchema>;


export default function LeadFinderPage() {
  const [generatedLeads, setGeneratedLeads] = useState<FindLeadsOutput['leads']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: "",
      location: "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedLeads([]);
    try {
      const result = await findLeads(data);
      setGeneratedLeads(result.leads);
    } catch (error) {
      console.error("Error finding leads:", error);
      toast({
        title: "Error",
        description: "Failed to find leads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-headline font-bold">AI Lead Finder</h1>
            <p className="text-muted-foreground max-w-2xl">
                Enter a business type and location to generate a list of potential leads. The AI will use its knowledge base to identify businesses and their likely websites.
            </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 items-start">
            <Card>
                <CardHeader>
                <CardTitle>Lead Generation Query</CardTitle>
                <CardDescription>Enter the type of business and location you are targeting.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="keyword"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Business Type / Keyword</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., 'Web Design Agency'" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., 'Dubai, UAE'" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Finding Leads...
                        </>
                        ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate Leads
                        </>
                        )}
                    </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Generated Leads</CardTitle>
                    <CardDescription>Here are the potential leads found by the AI. You can visit their websites to find contact information.</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="h-[500px] overflow-y-auto rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Business Name</TableHead>
                                <TableHead>Website</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isLoading && (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                </TableRow>
                            ))
                        )}
                        {!isLoading && generatedLeads.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="h-96 text-center">
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                        <Briefcase className="h-12 w-12" />
                                        <p className="mt-4">Your generated leads will appear here.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                        {generatedLeads.map((lead) => (
                            <TableRow key={lead.businessName}>
                                <TableCell className="font-medium">
                                    <p>{lead.businessName}</p>
                                    <p className="text-xs text-muted-foreground">{lead.description}</p>
                                </TableCell>
                                <TableCell>
                                    <a href={lead.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                        Visit Site <ExternalLink className="h-3 w-3" />
                                    </a>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
