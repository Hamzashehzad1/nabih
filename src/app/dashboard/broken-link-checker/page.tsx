// src/app/dashboard/broken-link-checker/page.tsx
"use client";

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Globe, Loader2, Unlink, CheckCircle2, AlertTriangle, ExternalLink, ShieldQuestion } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import { checkLinks, type LinkStatus } from "./actions";

interface WpSite {
  id: string;
  url: string;
  user: string;
  appPassword?: string;
}

export default function BrokenLinkCheckerPage() {
  const { toast } = useToast();
  const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ checked: 0, total: 0 });
  const [linkResults, setLinkResults] = useState<LinkStatus[]>([]);
  
  const selectedSite = useMemo(() => sites.find(s => s.id === selectedSiteId), [sites, selectedSiteId]);

  const handleStartScan = async () => {
    if (!selectedSite?.appPassword) {
      toast({ title: "Error", description: "WordPress credentials not found.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setLinkResults([]);
    setProgress({ checked: 0, total: 0 });
    
    try {
        const { id: toastId } = toast({ title: "Starting Scan...", description: "Fetching all site content." });
        
        await checkLinks(
            selectedSite.url,
            selectedSite.user,
            selectedSite.appPassword,
            (statusUpdate) => {
                setLinkResults(prev => [...prev, statusUpdate]);
                setProgress(prev => ({...prev, checked: prev.checked + 1}));
            },
            (totalLinks) => {
                 setProgress(prev => ({...prev, total: totalLinks}));
                 toast({ id: toastId, title: "Scanning...", description: `Found ${totalLinks} links to check.` });
            }
        );
        
      toast({ id: toastId, title: "Scan Complete!", description: `Checked all links.` });
    
    } catch (error: any) {
      console.error("Error checking links:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to run link scan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) return <Badge variant="default" className="bg-green-500 hover:bg-green-600">{status} OK</Badge>;
    if (status >= 300 && status < 400) return <Badge variant="secondary">{status} Redirect</Badge>;
    if (status >= 400) return <Badge variant="destructive">{status} Error</Badge>;
    return <Badge variant="outline">{status} Unknown</Badge>;
  }

  const renderSiteSelection = () => (
    <Card>
      <CardHeader>
        <CardTitle>1. Select a Site</CardTitle>
        <CardDescription>Choose the WordPress site you want to scan for broken links.</CardDescription>
      </CardHeader>
      <CardContent>
        {sites.length === 0 ? (
          <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
            <Globe className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">Connect a Site to Begin</h3>
            <p className="mt-1 text-sm">Go to settings to connect your WordPress site.</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/dashboard/settings">Go to Settings</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sites.map(site => (
              <Card 
                key={site.id} 
                onClick={() => setSelectedSiteId(site.id)}
                className={cn("cursor-pointer hover:border-primary transition-colors", selectedSiteId === site.id && "border-primary ring-2 ring-primary")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    {new URL(site.url).hostname}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Broken Link Checker</h1>
        <p className="text-muted-foreground max-w-2xl">
          Scan your entire WordPress site to find and fix broken links that hurt your SEO and user experience.
        </p>
      </div>
      
      {!selectedSiteId ? renderSiteSelection() : (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Scan Site for Broken Links</CardTitle>
                <CardDescription>Scanning {new URL(selectedSite!.url).hostname}. This may take a few minutes.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedSiteId(null)}>Change Site</Button>
            </div>
          </CardHeader>
          <CardContent>
            {!isLoading && linkResults.length === 0 && (
                 <Button onClick={handleStartScan} disabled={isLoading}>
                    <Unlink className="mr-2 h-4 w-4" /> Start Scan
                </Button>
            )}
            {isLoading && (
                <div className="space-y-2">
                    <Progress value={progress.total > 0 ? (progress.checked / progress.total) * 100 : 0} />
                    <p className="text-sm text-muted-foreground text-center">
                        Checked {progress.checked} of {progress.total} links...
                    </p>
                </div>
            )}
            
            {linkResults.length > 0 && (
                <>
                <div className="my-4">
                    <Button onClick={handleStartScan} disabled={isLoading}>
                        <Unlink className="mr-2 h-4 w-4" /> Re-Scan
                    </Button>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Linked URL</TableHead>
                            <TableHead>Found On</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {linkResults.filter(l => l.status !== 200).map((link, i) => (
                            <TableRow key={i}>
                                <TableCell className="font-medium truncate max-w-xs">
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                        {link.url} <ExternalLink className="h-3 w-3" />
                                    </a>
                                </TableCell>
                                <TableCell>
                                     <a href={link.foundOnUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                        {link.foundOnTitle} <ExternalLink className="h-3 w-3" />
                                    </a>
                                </TableCell>
                                <TableCell className="text-center">{getStatusBadge(link.status)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}