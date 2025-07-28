// src/app/dashboard/stale-content/page.tsx
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from 'next/link';
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { differenceInDays, parseISO } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Loader2, TrendingDown, ExternalLink } from "lucide-react";
import { fetchAllPublishedPostsWithModifiedDate, type WpPost } from "./actions";

interface WpSite {
  id: string;
  url: string;
  user: string;
  appPassword?: string;
}

export default function StaleContentPage() {
  const { toast } = useToast();
  const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<WpPost[]>([]);
  const [timeFilter, setTimeFilter] = useState<number>(365); // Default to 1 year
  
  const selectedSite = useMemo(() => sites.find(s => s.id === selectedSiteId), [sites, selectedSiteId]);

  const handleFetchPosts = useCallback(async () => {
    if (!selectedSite?.appPassword) {
      toast({ title: "Error", description: "WordPress credentials not found.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setPosts([]);
    
    try {
      const result = await fetchAllPublishedPostsWithModifiedDate(selectedSite.url, selectedSite.user, selectedSite.appPassword);
      if (result.success) {
        setPosts(result.data);
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to fetch posts.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [selectedSite, toast]);
  
  useEffect(() => {
    if (selectedSiteId) {
      handleFetchPosts();
    } else {
      setPosts([]);
    }
  }, [selectedSiteId, handleFetchPosts]);


  const filteredPosts = useMemo(() => {
    const now = new Date();
    return posts
      .map(post => ({
        ...post,
        daysSinceModified: differenceInDays(now, parseISO(post.lastModified)),
      }))
      .filter(post => post.daysSinceModified > timeFilter)
      .sort((a, b) => b.daysSinceModified - a.daysSinceModified);
  }, [posts, timeFilter]);

  const renderSiteSelection = () => (
    <Card>
      <CardHeader>
        <CardTitle>1. Select a Site</CardTitle>
        <CardDescription>Choose the WordPress site you want to scan for stale content.</CardDescription>
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
        <h1 className="text-3xl font-headline font-bold">Stale Content Finder</h1>
        <p className="text-muted-foreground max-w-2xl">
          Identify published articles that haven't been updated in a while. Refreshing old content is a great way to boost your SEO.
        </p>
      </div>
      
      {!selectedSiteId ? renderSiteSelection() : (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Stale Content Report</CardTitle>
                <CardDescription>Showing articles from {new URL(selectedSite!.url).hostname}</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                 <Select value={String(timeFilter)} onValueChange={(v) => setTimeFilter(Number(v))}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select time frame" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="180">Older than 6 months</SelectItem>
                      <SelectItem value="365">Older than 1 year</SelectItem>
                      <SelectItem value="730">Older than 2 years</SelectItem>
                    </SelectContent>
                  </Select>
                 <Button variant="outline" size="sm" onClick={() => setSelectedSiteId(null)}>Change Site</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
               </div>
            ) : filteredPosts.length === 0 ? (
                <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
                    <TrendingDown className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">No Stale Content Found!</h3>
                    <p className="mt-1 text-sm">Looks like all your content is fresh. Try a different time filter.</p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Post Title</TableHead>
                            <TableHead>Days Since Modified</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPosts.map(post => (
                            <TableRow key={post.id}>
                                <TableCell className="font-medium">{post.title}</TableCell>
                                <TableCell>{post.daysSinceModified}</TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="outline" size="sm">
                                        <a href={post.url} target="_blank" rel="noopener noreferrer">
                                            View Post <ExternalLink className="ml-2 h-4 w-4" />
                                        </a>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
