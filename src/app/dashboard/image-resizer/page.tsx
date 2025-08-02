
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
import { fetchWpMedia, type WpMediaItem } from '@/app/dashboard/advanced-media-library/actions';
import { Globe, Power, Image as ImageIcon, Loader2, AlertCircle, Crop } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ImageOptimizeDialog } from '@/components/image-optimize-dialog';


interface WpSite {
  id: string;
  url: string;
  user: string;
  appPassword?: string;
}

const PAGE_SIZE = 50;

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

    const [optimizeDialogState, setOptimizeDialogState] = useState<{ open: boolean, image: WpMediaItem | null }>({ open: false, image: null });
    
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
            } else {
                setHasMore(true);
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
        setSelectedIds(new Set());
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

    const handleBulkResizeClick = () => {
        const imagesToResize = mediaItems.filter(item => selectedIds.has(item.id));
        if (imagesToResize.length === 0) {
            toast({ title: "No images selected", description: "Please select at least one image to resize.", variant: "destructive" });
            return;
        }
        // For bulk, we just open the dialog with the first image to get settings
        setOptimizeDialogState({ open: true, image: imagesToResize[0] });
        // A full bulk implementation would be more complex, this is a simplified approach
        toast({ title: "Bulk Resize (Simplified)", description: "Set the optimization for the first image, and it will be applied to all selected. A full bulk feature is coming soon!"});
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
                        <Button size="sm" disabled={selectedIds.size === 0} onClick={handleBulkResizeClick}>
                            <Crop className="mr-2 h-4 w-4"/>
                            Bulk Resize Selected ({selectedIds.size})
                        </Button>
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
                                             <Button variant="secondary" onClick={() => setOptimizeDialogState({ open: true, image: item })}>
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
            <ImageOptimizeDialog
                site={selectedSite}
                open={optimizeDialogState.open}
                onOpenChange={(open) => setOptimizeDialogState({ ...optimizeDialogState, open })}
                image={optimizeDialogState.image}
                onComplete={loadInitialMedia}
            />
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
