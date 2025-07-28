// src/app/dashboard/internal-linking/page.tsx
"use client";

import { useState } from "react";
import Link from 'next/link';
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, Loader2, Link as LinkIcon, Copy } from "lucide-react";

import { suggestInternalLinks, type SuggestInternalLinksOutput } from "@/ai/flows/suggest-internal-links";
import { fetchAllPublishedPosts, type WpPost } from "./actions";

interface WpSite {
  id: string;
  url: string;
  user: string;
  appPassword?: string;
}

export default function InternalLinkingPage() {
  const { toast } = useToast();
  const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestInternalLinksOutput['suggestions']>([]);
  
  const selectedSite = sites.find(s => s.id === selectedSiteId);

  const handleSuggestLinks = async () => {
    if (!selectedSite?.appPassword) {
      toast({ title: "Error", description: "WordPress credentials not found.", variant: "destructive" });
      return;
    }
    if (!postContent.trim()) {
        toast({ title: "Error", description: "Please paste your blog post content.", variant: "destructive" });
        return;
    }

    setIsLoading(true);
    setSuggestions([]);
    
    try {
      const { id: toastId } = toast({ title: "Fetching posts...", description: "Gathering a list of your existing articles." });
      const postsResult = await fetchAllPublishedPosts(selectedSite.url, selectedSite.user, selectedSite.appPassword);

      if (!postsResult.success) {
        throw new Error(postsResult.error);
      }
      
      toast({ id: toastId, title: "Analyzing content...", description: "AI is finding the best linking opportunities." });
      
      const aiResult = await suggestInternalLinks({
        postContent: postContent,
        existingPosts: postsResult.data.map(p => ({ title: p.title, url: p.url })),
      });
      
      setSuggestions(aiResult.suggestions);
      toast({ id: toastId, title: "Suggestions Ready!", description: `Found ${aiResult.suggestions.length} linking opportunities.` });
    
    } catch (error: any) {
      console.error("Error suggesting links:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
    });
  };

  const renderSiteSelection = () => (
    <Card>
      <CardHeader>
        <CardTitle>1. Select a Site</CardTitle>
        <CardDescription>Choose the WordPress site whose articles you want to link to.</CardDescription>
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
        <h1 className="text-3xl font-headline font-bold">AI Internal Link Suggester</h1>
        <p className="text-muted-foreground max-w-2xl">
          Improve your SEO by building a strong internal linking structure. Paste your new article content below, and the AI will suggest relevant links to your existing posts.
        </p>
      </div>
      
      {!selectedSiteId ? renderSiteSelection() : (
        <div className="grid gap-8 md:grid-cols-2 items-start">
          <Card>
            <CardHeader>
               <div className="flex justify-between items-center">
                 <div>
                    <CardTitle>New Article Content</CardTitle>
                    <CardDescription>Paste the full text of your new blog post here.</CardDescription>
                 </div>
                 <Button variant="outline" size="sm" onClick={() => setSelectedSiteId(null)}>Change Site</Button>
               </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Start pasting your article here..."
                className="h-96"
              />
              <Button onClick={handleSuggestLinks} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Suggestions...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Suggest Links
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Link Suggestions</CardTitle>
              <CardDescription>Here are the top internal linking opportunities identified by the AI.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 h-[500px] overflow-y-auto pr-2">
                {isLoading && (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2 p-4 border rounded-lg">
                      <Skeleton className="h-4 w-2/5" />
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-4 w-3/5" />
                    </div>
                  ))
                )}
                {!isLoading && suggestions.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <LinkIcon className="h-12 w-12" />
                    <p className="mt-4">Your suggestions will appear here.</p>
                  </div>
                )}
                {suggestions.map((suggestion, index) => (
                  <Alert key={index}>
                    <LinkIcon className="h-4 w-4" />
                    <AlertTitle className="font-semibold flex justify-between items-center">
                      <span>Anchor: "{suggestion.anchorText}"</span>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(suggestion.linkToUrl)}>
                          <Copy className="h-4 w-4"/>
                      </Button>
                    </AlertTitle>
                    <AlertDescription>
                      <p>
                        **Link to:** <a href={suggestion.linkToUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{suggestion.linkToUrl.split('/').slice(3).join('/')}</a>
                      </p>
                      <p className="mt-2 text-xs italic">**Reason:** {suggestion.reason}</p>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
