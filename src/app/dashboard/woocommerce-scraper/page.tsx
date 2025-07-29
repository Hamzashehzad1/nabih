// src/app/dashboard/woocommerce-scraper/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DownloadCloud, Loader2, Sparkles, ServerCrash, CheckCircle2, List, FileDown, Image as ImageIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProductData } from './actions';

type ScrapeStatus = 'idle' | 'scraping' | 'complete' | 'error';

export default function WooCommerceScraperPage() {
    const { toast } = useToast();
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState<ScrapeStatus>('idle');
    const [progressLog, setProgressLog] = useState<string[]>([]);
    const [scrapedProducts, setScrapedProducts] = useState<ProductData[]>([]);
    const [finalFiles, setFinalFiles] = useState<{ csv: string, zip: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        // Clean up the event source when the component unmounts
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    const handleScrape = async () => {
        if (!url) {
            toast({ title: "URL is required", variant: "destructive" });
            return;
        }

        // Reset state for a new scrape
        setStatus('scraping');
        setProgressLog([]);
        setScrapedProducts([]);
        setFinalFiles(null);
        setError(null);
        
        // Close any existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const eventSource = new EventSource(`/api/scrape-woocommerce?url=${encodeURIComponent(url)}`);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'progress') {
                setProgressLog(prev => [...prev, data.message]);
            } else if (data.type === 'product') {
                setScrapedProducts(prev => [...prev, data.product]);
            } else if (data.type === 'complete') {
                setFinalFiles({ csv: data.csv, zip: data.zip });
                setStatus('complete');
                toast({ title: "Scraping Complete!", description: `Found ${scrapedProducts.length} products.`});
                eventSource.close();
            }
        };

        eventSource.onerror = (err) => {
            console.error("EventSource failed:", err);
            setError("An error occurred while scraping. The connection was lost or the server failed. Please check the URL and try again.");
            setStatus('error');
            eventSource.close();
        };
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

            {(status === 'scraping' || scrapedProducts.length > 0) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Live Scraping Results</CardTitle>
                        <CardDescription>
                            {status === 'scraping' ? 'The tool is actively crawling the site. See progress below.' : 'Scraping has completed.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><List/> Progress Log</h3>
                            <ScrollArea className="h-72 w-full rounded-md border bg-muted/50 p-4">
                               <div className="flex flex-col gap-1 text-sm font-mono">
                                {progressLog.map((log, i) => <p key={i}>{log}</p>)}
                                {status === 'scraping' && <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> <span>Working...</span></div>}
                               </div>
                            </ScrollArea>
                        </div>
                         <div>
                            <h3 className="font-semibold mb-2">Found Products ({scrapedProducts.length})</h3>
                            <ScrollArea className="h-72 w-full rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Price</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {scrapedProducts.map(p => (
                                            <TableRow key={p.sku || p.name}>
                                                <TableCell className="font-medium">{p.name}</TableCell>
                                                <TableCell>{p.regularPrice}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    </CardContent>
                     {status === 'complete' && finalFiles && (
                         <CardFooter className="flex-col items-start gap-4">
                            <Alert variant="default" className="bg-primary/10 border-primary/20 text-primary">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                <AlertTitle className="font-bold">Scraping Complete!</AlertTitle>
                                <AlertDescription className="text-primary/90">
                                    Successfully extracted {scrapedProducts.length} products. You can now download the data.
                                </AlertDescription>
                            </Alert>
                             <div className="flex gap-4">
                                <Button onClick={() => downloadFile(finalFiles.csv, 'woocommerce-products.csv', 'text/csv')}>
                                    <FileDown className="mr-2"/> Download Products CSV
                                </Button>
                                <Button onClick={() => downloadZip(finalFiles.zip, 'product-images.zip')} variant="secondary">
                                    <ImageIcon className="mr-2"/> Download Images (.zip)
                                </Button>
                            </div>
                        </CardFooter>
                    )}
                </Card>
            )}

            {status === 'error' && (
                 <Alert variant="destructive">
                    <ServerCrash className="h-4 w-4" />
                    <AlertTitle>Scraping Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

        </div>
    );
}
