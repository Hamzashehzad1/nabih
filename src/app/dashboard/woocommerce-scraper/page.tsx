// src/app/dashboard/woocommerce-scraper/page.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DownloadCloud, Loader2, Sparkles, ServerCrash, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { scrapeWooCommerceSite } from './actions';
import type { ProductData } from './actions';

type ScrapeStatus = 'idle' | 'scraping' | 'complete' | 'error';

export default function WooCommerceScraperPage() {
    const { toast } = useToast();
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState<ScrapeStatus>('idle');
    const [results, setResults] = useState<{ products: ProductData[], csv: string, zip: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleScrape = async () => {
        if (!url) {
            toast({ title: "URL is required", variant: "destructive" });
            return;
        }

        setStatus('scraping');
        setResults(null);
        setError(null);

        try {
            const result = await scrapeWooCommerceSite(url);

            if (!result.success) {
                throw new Error(result.error);
            }
            
            setResults({
                products: result.data.products,
                csv: result.data.csv,
                zip: result.data.zip
            });
            setStatus('complete');
            toast({ title: "Scraping Complete!", description: `Found ${result.data.products.length} products.`});

        } catch (e: any) {
            setError(e.message || 'An unknown error occurred.');
            setStatus('error');
            toast({ title: "Scraping Failed", description: e.message, variant: 'destructive' });
        }
    };
    
    const downloadFile = (content: string, fileName: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadZip = (base64Data: string, fileName: string) => {
        const linkSource = `data:application/zip;base64,${base64Data}`;
        const downloadLink = document.createElement("a");
        downloadLink.href = linkSource;
        downloadLink.download = fileName;
        downloadLink.click();
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-headline font-bold">WooCommerce Product Scraper</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Enter a WooCommerce store URL to extract all product data into a compatible CSV and a zip file of images.
                </p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Scraper Input</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-grow space-y-2">
                        <Label htmlFor="url-input">WooCommerce Store URL</Label>
                        <Input 
                            id="url-input"
                            placeholder="https://www.example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            disabled={status === 'scraping'}
                        />
                    </div>
                    <div className="flex-shrink-0 self-end">
                        <Button onClick={handleScrape} disabled={status === 'scraping'}>
                            {status === 'scraping' ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Scraping...</>
                            ) : (
                                <><Sparkles className="mr-2 h-4 w-4"/> Start Scraping</>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {status === 'scraping' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Scraping in Progress...</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center">
                         <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                        <p className="text-muted-foreground">Please wait while we crawl the site. This may take a few minutes.</p>
                    </CardContent>
                </Card>
            )}

            {status === 'error' && (
                 <Alert variant="destructive">
                    <ServerCrash className="h-4 w-4" />
                    <AlertTitle>Scraping Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {status === 'complete' && results && (
                <Card>
                    <CardHeader>
                         <Alert variant="default" className="bg-primary/10 border-primary/20 text-primary">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <AlertTitle className="font-bold">Scraping Complete!</AlertTitle>
                            <AlertDescription className="text-primary/90">
                                Successfully extracted {results.products.length} products. You can now download the data.
                            </AlertDescription>
                        </Alert>
                    </CardHeader>
                    <CardContent className="flex gap-4">
                        <Button onClick={() => downloadFile(results.csv, 'woocommerce-products.csv', 'text/csv')}>
                            <DownloadCloud className="mr-2"/> Download Products CSV
                        </Button>
                         <Button onClick={() => downloadZip(results.zip, 'product-images.zip')} variant="secondary">
                            <DownloadCloud className="mr-2"/> Download Images (.zip)
                        </Button>
                    </CardContent>
                </Card>
            )}

        </div>
    );
}
