
// src/app/dashboard/lead-finder/page.tsx
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Briefcase, Sparkles, ExternalLink, Mail, Phone, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { findLeads, type FindLeadsOutput } from "@/ai/flows/find-leads";

const formSchema = z.object({
  keyword: z.string().min(2, "Please enter a business type or keyword."),
  location: z.string().min(2, "Please enter a location."),
  numberOfLeads: z.coerce.number().min(1, "Please enter a number").max(50, "Please enter a number less than 50"),
});

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
      numberOfLeads: 10,
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

  const convertToCSV = (data: FindLeadsOutput['leads']): string => {
    const headers = ['Business Name', 'Description', 'Website', 'Email', 'Phone Number'];
    const rows = data.map(lead => [
        `"${lead.businessName.replace(/"/g, '""')}"`,
        `"${lead.description.replace(/"/g, '""')}"`,
        lead.websiteUrl,
        lead.email || '',
        lead.phoneNumber || ''
    ]);
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

  const handleExport = () => {
    if (generatedLeads.length === 0) {
        toast({ title: 'No leads to export', variant: 'destructive' });
        return;
    }
    const csvData = convertToCSV(generatedLeads);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
        URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = `leads-${form.getValues('keyword').replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Exported!', description: 'Your leads are downloading as a CSV file.' });
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
                        
                         <div className="flex gap-4">
                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                <FormItem className="flex-grow">
                                    <FormLabel>Location</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g., 'Dubai, UAE'" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="numberOfLeads"
                                render={({ field }) => (
                                <FormItem className="w-24">
                                    <FormLabel># of Leads</FormLabel>
                                    <FormControl>
                                    <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>

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
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Generated Leads</CardTitle>
                        <CardDescription>Here are the potential leads found by the AI. You can visit their websites to find contact information.</CardDescription>
                    </div>
                     <Button variant="outline" size="sm" onClick={handleExport} disabled={generatedLeads.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Export as CSV
                    </Button>
                </CardHeader>
                <CardContent>
                <div className="h-[500px] overflow-y-auto rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Business Name</TableHead>
                                <TableHead>Contact</TableHead>
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
                                <TableCell className="space-y-1">
                                     <a href={lead.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm">
                                        Visit Site <ExternalLink className="h-3 w-3" />
                                    </a>
                                     {lead.email ? (
                                        <a href={`mailto:${lead.email}`} className="text-muted-foreground hover:underline flex items-center gap-1 text-sm">
                                            <Mail className="h-3 w-3" /> {lead.email}
                                        </a>
                                    ) : null }
                                     {lead.phoneNumber ? (
                                        <a href={`tel:${lead.phoneNumber}`} className="text-muted-foreground hover:underline flex items-center gap-1 text-sm">
                                            <Phone className="h-3 w-3" /> {lead.phoneNumber}
                                        </a>
                                    ) : null }
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

