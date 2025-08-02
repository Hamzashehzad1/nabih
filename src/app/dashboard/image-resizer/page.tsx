
// src/app/dashboard/image-resizer/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import Link from 'next/link';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchWpMedia, replaceWpMediaFile, WpMediaItem } from '@/app/dashboard/advanced-media-library/actions';
import { Globe, Power, Image as ImageIcon, Loader2, AlertCircle, CheckCircle2, XCircle, Replace, Crop } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface WpSite {
  id: string;
  url: string;
  user: string;
  appPassword?: string;
}

interface ResizeDialogState {
    open: boolean;
    image: WpMediaItem | null;
}

const PAGE_SIZE = 50;

function formatBytes(bytes: number, decimals = 2) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const ProxiedImage = ({ src, alt, ...props }: { src: string, alt: string, [key: string]: any }) => {
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isCancelled = false;
        async function loadImage() {
            setIsLoading(true);
            if (src.startsWith('data:')) {
                setImgSrc(src);
            } else if (src.startsWith('http')) {
                try {
                    const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(src)}`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch image proxy: ${response.statusText}`);
                    }
                    const { base64 } = await response.json();
                    if (!isCancelled) setImgSrc(base64);
                } catch (error) {
                    console.error("Failed to load proxied image:", error);
                     if (!isCancelled) setImgSrc(null);
                }
            } else {
                setImgSrc(src);
            }
            setIsLoading(false);
        }
        loadImage();
        return () => { isCancelled = true; };
    }, [src]);

    if (isLoading || !imgSrc) return <Skeleton className="w-full h-full" {...props} />;
    return <Image src={imgSrc} alt={alt} {...props} />;
};

const ResizeDialog = ({ state, setState, onComplete }: { state: ResizeDialogState, setState: (state: ResizeDialogState) => void, onComplete: () => void }) => {
    const { toast } = useToast();
    const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    
    const selectedSite = sites.find(s => s.id === localStorage.getItem('image-resizer-selected-site'));
    
    useEffect(() => {
        if (state.image) {
            setWidth(state.image.width);
            setHeight(state.image.height);
        }
    }, [state.image]);
    
    const handleResize = async () => {
        if (!state.image || !selectedSite?.appPassword) return;
        
        setIsLoading(true);
        try {
            const proxyResponse = await fetch(`/api/proxy-image?url=${encodeURIComponent(state.image.fullUrl)}`);
            if(!proxyResponse.ok) throw new Error('Failed to fetch original image');
            const { base64: originalBase64 } = await proxyResponse.json();

            const optimizeResponse = await fetch('/api/optimize-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: originalBase64,
                    format: state.image.mime_type.split('/')[1] || 'jpeg',
                    quality: 90, // Keep quality high, focus on resize
                    width,
                    height,
                }),
            });

            if (!optimizeResponse.ok) {
                const errorData = await optimizeResponse.json();
                throw new Error(errorData.error || 'Failed to resize image');
            }

            const resizedImage = await optimizeResponse.json();

            const replaceResult = await replaceWpMediaFile(selectedSite.url, selectedSite.user, selectedSite.appPassword, state.image, resizedImage);
            
            if (replaceResult.success) {
                toast({ title: 'Image Resized!', description: `${state.image.filename} has been updated.`});
                onComplete();
                setState({ open: false, image: null });
            } else {
                throw new Error(replaceResult.error);
            }

        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }
    
    if (!state.image) return null;

    return (
        <Dialog open={state.open} onOpenChange={(open) => setState({ ...state, open })}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Resize Image</DialogTitle>
                    <DialogDescription>{state.image.filename}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <ProxiedImage src={state.image.fullUrl} alt={state.image.alt} width={state.image.width} height={state.image.height} className="w-full h-auto object-contain rounded-md" />
                    <div className="text-center text-sm text-muted-foreground">Original Dimensions: {state.image.width} x {state.image.height}</div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="width">Width (px)</Label>
                            <Input id="width" type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="height">Height (px)</Label>
                            <Input id="height" type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setState({ open: false, image: null })}>Cancel</Button>
                    <Button onClick={handleResize} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Resize & Replace
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function ImageResizerPage() {
    const { toast } = useToast();
    const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);
    const [selectedSiteId, setSelectedSiteId] = useLocalStorage<string | null>('image-resizer-selected-site', null);
    
    const [mediaItems, setMediaItems] = useState<WpMediaItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [resizeDialogState, setResizeDialogState] = useState<ResizeDialogState>({ open: false, image: null });

    const { ref: infiniteScrollRef, inView } = useInView({ threshold: 0.5 });
    
    const selectedSite = sites.find(s => s.id === selectedSiteId);

    const loadInitialMedia = useCallback(async () => {
        if (!selectedSite?.appPassword) return;

        setIsLoading(true);
        setError(null);
        setMediaItems([]);
        
        const result = await fetchWpMedia(selectedSite.url, selectedSite.user, selectedSite.appPassword, 1, PAGE_SIZE);

        if (result.success) {
            setMediaItems(result.data);
            setCurrentPage(1);
            if (result.data.length < PAGE_SIZE || result.totalPages <= 1) {
                setHasMore(false);
            }
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    }, [selectedSite]);

    useEffect(() => {
        setMediaItems([]);
        setCurrentPage(1);
        setHasMore(true);
        setError(null);
        if (selectedSite) {
            loadInitialMedia();
        }
    }, [selectedSite, loadInitialMedia]);

    const loadMoreMedia = useCallback(async () => {
        if (isLoading || isLoadingMore || !hasMore || !selectedSite?.appPassword) return;
        setIsLoadingMore(true);
        
        const nextPage = currentPage + 1;
        const result = await fetchWpMedia(selectedSite.url, selectedSite.user, selectedSite.appPassword, nextPage, PAGE_SIZE);
        
        if(result.success){
            if (result.data.length === 0) {
                setHasMore(false);
            } else {
                setMediaItems(prev => [...prev, ...result.data]);
                setCurrentPage(nextPage);
            }
        } else {
            toast({ title: "Error", description: "Failed to load more media.", variant: "destructive" });
        }

        setIsLoadingMore(false);
    }, [isLoading, isLoadingMore, currentPage, hasMore, selectedSite, toast]);
    
    useEffect(() => {
        if(inView) {
            loadMoreMedia();
        }
    }, [inView, loadMoreMedia]);

    const handleSelectionChange = (id: number, checked: boolean) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if(checked) newSet.add(id);
            else newSet.delete(id);
            return newSet;
        });
    };
    
    const handleSelectAll = () => {
        if (selectedIds.size === mediaItems.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(mediaItems.map(item => item.id)));
        }
    };
    
    const renderSiteSelection = () => (
        <Card>
            <CardHeader>
                <CardTitle>Select a Site</CardTitle>
                <CardDescription>Choose the WordPress site whose media you want to resize.</CardDescription>
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
                                className="cursor-pointer hover:border-primary transition-colors"
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

    const renderMediaLibrary = () => {
        return (
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Your WordPress Media</CardTitle>
                            <CardDescription>
                                Displaying media from {new URL(selectedSite!.url).hostname}. Select an image to resize.
                            </CardDescription>
                        </div>
                        <Button onClick={() => setSelectedSiteId(null)} variant="outline">
                            <Power className="mr-2 h-4 w-4" /> Change Site
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                         <Button size="sm" onClick={handleSelectAll}>
                            {selectedIds.size === mediaItems.length ? 'Deselect All' : 'Select All'}
                        </Button>
                        <Button size="sm" disabled={selectedIds.size === 0}>
                            <Crop className="mr-2 h-4 w-4"/>
                            Bulk Resize Selected ({selectedIds.size})
                        </Button>
                         <p className="text-sm text-muted-foreground ml-auto">Bulk resizing coming soon!</p>
                    </div>
                    
                    {isLoading && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <Skeleton key={i} className="aspect-square w-full" />
                            ))}
                        </div>
                    )}
                    
                    {error && (
                        <Alert variant="destructive" className="mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {!isLoading && !error && mediaItems.length === 0 && (
                        <div className="text-center text-muted-foreground p-12 border-dashed border-2 rounded-md">
                            <ImageIcon className="mx-auto h-16 w-16" />
                            <h3 className="mt-4 text-lg font-semibold">No Media Found</h3>
                            <p className="mt-1 text-sm">
                                Your WordPress media library appears to be empty.
                            </p>
                        </div>
                    )}

                    {mediaItems.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {mediaItems.map(item => (
                                <Card key={item.id} className={cn("overflow-hidden flex flex-col group", selectedIds.has(item.id) && "ring-2 ring-primary")}>
                                    <CardContent className="p-0 flex-grow relative">
                                        <div className="absolute top-2 left-2 z-10 bg-background/80 rounded-sm p-1">
                                            <Checkbox
                                                checked={selectedIds.has(item.id)}
                                                onCheckedChange={(checked) => handleSelectionChange(item.id, !!checked)}
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                             <Button variant="secondary" onClick={() => setResizeDialogState({ open: true, image: item })}>
                                                <Crop className="h-4 w-4 mr-2"/>
                                                Resize
                                            </Button>
                                        </div>
                                        <ProxiedImage 
                                            src={item.thumbnailUrl} 
                                            alt={item.filename} 
                                            width={300} 
                                            height={300} 
                                            className="aspect-square object-cover w-full h-full"
                                        />
                                    </CardContent>
                                    <CardFooter className="p-2 flex flex-col items-start space-y-1.5">
                                        <p className="text-xs font-medium truncate w-full" title={item.filename}>{item.filename}</p>
                                        <p className="text-xs text-muted-foreground">{item.width} x {item.height}</p>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                     {hasMore && (
                        <div ref={infiniteScrollRef} className="flex justify-center items-center p-4 mt-4">
                            {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            <span>Loading more...</span>
                        </div>
                     )}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-8">
            <ResizeDialog state={resizeDialogState} setState={setResizeDialogState} onComplete={loadInitialMedia} />
            <div>
                <h1 className="text-3xl font-headline font-bold">Image Resizer</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Select images from your WordPress media library to resize them. This is crucial for improving your website's loading speed and Core Web Vitals.
                </p>
            </div>
            {selectedSite ? renderMediaLibrary() : renderSiteSelection()}
        </div>
    );
}
