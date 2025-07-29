// src/app/dashboard/sitemap-generator/page.tsx
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Loader2, Network, Download } from "lucide-react";

import { fetchAllUrls } from "./actions";

interface WpSite {
  id: string;
  url: string;
  user: string;
  appPassword?: string;
}

export default function SitemapGeneratorPage() {
  const { toast } = useToast();
  const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [sitemapContent, setSitemapContent] = useState<string>("");
  
  const selectedSite = useMemo(() => sites.find(s => s.id === selectedSiteId), [sites, selectedSiteId]);

  const handleGenerateSitemap = async () => {
    if (!selectedSite?.appPassword) {
      toast({ title: "Error", description: "WordPress credentials not found.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setSitemapContent("");
    
    try {
      const result = await fetchAllUrls(selectedSite.url, selectedSite.user, selectedSite.appPassword);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${result.data.map(item => `
  <url>
    <loc>${item.url}</loc>
    <lastmod>${new Date(item.modified).toISOString()}</lastmod>
  </url>`).join('')}
</urlset>`;
      
      setSitemapContent(xmlContent.trim());
      toast({ title: "Sitemap Generated", description: `Found ${result.data.length} URLs.` });
    
    } catch (error: any) {
      console.error("Error generating sitemap:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate sitemap. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSitemap = () => {
    if (!sitemapContent) return;
    const blob = new Blob([sitemapContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderSiteSelection = () => (
    <Card>
      <CardHeader>
        <CardTitle>1. Select a Site</CardTitle>
        <CardDescription>Choose the WordPress site to generate a sitemap for.</CardDescription>
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
        <h1 className="text-3xl font-headline font-bold">XML Sitemap Generator</h1>
        <p className="text-muted-foreground max-w-2xl">
          Generate a `sitemap.xml` file for your website by fetching all your public posts and pages.
        </p>
      </div>
      
      {!selectedSiteId ? renderSiteSelection() : (
        <Card>
            <CardHeader>
               <div className="flex justify-between items-center">
                 <div>
                    <CardTitle>Generate Sitemap</CardTitle>
                    <CardDescription>Click the button to fetch all URLs from {new URL(selectedSite!.url).hostname}.</CardDescription>
                 </div>
                 <Button variant="outline" size="sm" onClick={() => setSelectedSiteId(null)}>Change Site</Button>
               </div>
            </CardHeader>
            <CardContent>
              <Button onClick={handleGenerateSitemap} disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching URLs...</>
                ) : (
                  <><Network className="mr-2 h-4 w-4" /> Generate Sitemap</>
                )}
              </Button>
            </CardContent>
          
            {sitemapContent && (
              <>
                <CardHeader>
                  <CardTitle>Generated Sitemap</CardTitle>
                  <CardDescription>Copy the content or download the XML file.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    readOnly
                    value={sitemapContent}
                    className="h-96 font-mono text-xs"
                  />
                </CardContent>
                <CardFooter>
                  <Button onClick={downloadSitemap}>
                    <Download className="mr-2 h-4 w-4" /> Download sitemap.xml
                  </Button>
                </CardFooter>
              </>
            )}
        </Card>
      )}
    </div>
  );
}
