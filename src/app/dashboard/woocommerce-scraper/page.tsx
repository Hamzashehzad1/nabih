
// src/app/dashboard/woocommerce-scraper/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DownloadCloud, Loader2, Sparkles, ServerCrash, CheckCircle2, List, FileDown, Image as ImageIcon, Settings2, ChevronsUpDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { InfoTooltip } from '@/components/ui/info-tooltip';
import type { ProductData } from './actions';


type Platform = 'auto' | 'woocommerce' | 'shopify' | 'other';
type ScrapeStatus = 'idle' | 'scraping' | 'complete' | 'error';

interface SelectorConfig {
    productLink: string;
    title: string;
    price: string;
    salePrice: string;
    description: string;
    images: string;
    sku: string;
}

const defaultSelectors: SelectorConfig = {
    productLink: '.product a, .type-product a, .woocommerce-LoopProduct-link, a[href*="/product/"], a[href*="/products/"]',
    title: 'h1.product_title, .product_title, h1, [itemprop="name"], meta[property="og:title"]',
    price: '.price, .product-price, [itemprop="price"], meta[property="product:price:amount"]',
    salePrice: '.price ins, .sale-price',
    description: '#tab-description, .product-description, .woocommerce-product-details__short-description, [itemprop="description"], meta[name="description"], meta[property="og:description"]',
    images: '.woocommerce-product-gallery__image a, .product-images a, .product-gallery a, .product-image-slider img, .main-image img, meta[property^="og:image"]',
    sku: '.sku, [itemprop="sku"]',
}

const otherSelectors: SelectorConfig = {
    productLink: 'div.product-container a.product-image',
    title: 'h1.product_title',
    price: 'span.Price',
    salePrice: 'span.Price.salesprice',
    description: '.product-short-description',
    images: '.main-image .MagicZoom, #product-slider .slick-slide a',
    sku: '.product-sku-value',
}

export default function ProductScraperPage() {
    const { toast } = useToast();
    const [url, setUrl] = useState('');
    const [platform, setPlatform] = useState<Platform>('auto');
    const [selectors, setSelectors] = useState<SelectorConfig>(defaultSelectors);
    const [status, setStatus] = useState<ScrapeStatus>('idle');
    const [progressLog, setProgressLog] = useState<string[]>([]);
    const [scrapedProducts, setScrapedProducts] = useState<ProductData[]>([]);
    const [finalFiles, setFinalFiles] = useState<{ csv: string, zip: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);
    
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    useEffect(() => {
        if (platform === 'other') {
            setSelectors(otherSelectors);
        } else {
            setSelectors(defaultSelectors);
        }
    }, [platform]);

    const handleScrape = async () => {
        if (!url) {
            toast({ title: "URL is required", variant: "destructive" });
            return;
        }

        setStatus('scraping');
        setProgressLog([]);
        setScrapedProducts([]);
        setFinalFiles(null);
        setError(null);
        
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const params = new URLSearchParams({
            url: url,
            platform: platform,
            ...selectors
        });
        
        const eventSource = new EventSource(`/api/scrape-products?${params.toString()}`);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'progress') {
                    setProgressLog(prev => [...prev, data.message]);
                } else if (data.type === 'product') {
                    setScrapedProducts(prev => [...prev, data.product]);
                } else if (data.type === 'complete') {
                    setFinalFiles({ csv: data.csv, zip: data.zip });
                    setStatus('complete');
                    
                    setScrapedProducts(currentProducts => {
                        toast({ title: "Scraping Complete!", description: `Successfully extracted ${currentProducts.length} products.` });
                        return currentProducts;
                    });
                    
                    eventSource.close();
                } else if (data.type === 'error') {
                    setError(data.message);
                    setStatus('error');
                    eventSource.close();
                }
            } catch (e) {
                 console.error("Failed to parse event data:", event.data);
            }
        };

        eventSource.onerror = (err) => {
            if (status === 'scraping') {
                 setError("An error occurred while scraping. The connection was lost or the server failed. Please check the URL and try again.");
                 setStatus('error');
                 eventSource.close();
            }
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
                <h1 className="text-3xl font-headline font-bold">Products Scraper</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Enter a store URL to extract all product data into a compatible CSV and a zip file of images.
                </p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Scraper Input</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-grow space-y-2">
                            <Label htmlFor="url-input">Store URL</Label>
                            <Input 
                                id="url-input"
                                placeholder="https://www.example.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                disabled={status === 'scraping'}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="platform-select">Platform</Label>
                             <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)} disabled={status === 'scraping'}>
                                <SelectTrigger className="w-full sm:w-[180px]" id="platform-select">
                                    <SelectValue placeholder="Select platform" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">Auto-Detect</SelectItem>
                                    <SelectItem value="woocommerce">WooCommerce</SelectItem>
                                    <SelectItem value="shopify">Shopify</SelectItem>
                                    <SelectItem value="other">Other/Custom</SelectItem>
                                </SelectContent>
                            </Select>
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
                    </div>
                     <Collapsible>
                        <CollapsibleTrigger asChild>
                            <Button variant="link" className="p-0 h-auto text-sm">
                                <Settings2 className="mr-2 h-4 w-4"/>
                                Advanced: Custom Selectors
                                <ChevronsUpDown className="ml-1 h-4 w-4"/>
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4 space-y-4 p-4 border rounded-lg">
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.keys(selectors).map((key) => (
                                    <div key={key} className="space-y-1.5">
                                        <Label htmlFor={`selector-${key}`} className="text-xs capitalize flex items-center gap-1">
                                            {key.replace(/([A-Z])/g, ' $1')}
                                            <InfoTooltip info={`CSS selector for the ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}.`} />
                                        </Label>
                                        <Input
                                            id={`selector-${key}`}
                                            value={selectors[key as keyof SelectorConfig]}
                                            onChange={(e) => setSelectors(prev => ({...prev, [key]: e.target.value}))}
                                            className="text-xs h-8"
                                            disabled={status === 'scraping'}
                                        />
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setSelectors(defaultSelectors)}>Reset to Defaults</Button>
                        </CollapsibleContent>
                    </Collapsible>
                </CardContent>
            </Card>

            {(status === 'scraping' || scrapedProducts.length > 0 || status === 'complete') && (
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
                                        {scrapedProducts.map((p, index) => (
                                            <TableRow key={`${p.sku || p.name}-${index}`}>
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
                                <Button onClick={() => downloadFile(finalFiles.csv, 'products.csv', 'text/csv')}>
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
