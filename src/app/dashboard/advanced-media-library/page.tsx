

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import Link from 'next/link';
import Image from 'next/image';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInView } from 'react-intersection-observer';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchWpMedia, updateWpMediaDetails, type WpMediaItem } from './actions';
import { Globe, Power, Image as ImageIcon, Loader2, ArrowUp, ArrowDown, ExternalLink, X, Settings2, Edit, AlertCircle } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ImageOptimizeDialog } from '@/components/image-optimize-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface WpSite {
  id: string;
  url: string;
  user: string;
  appPassword?: string;
}

type SortOrder = 'desc' | 'asc' | null;

interface EditableMediaDetails {
    alt: string;
    caption: string;
    description: string;
}

interface OptimizeDialogState {
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


export default function AdvancedMediaLibraryPage() {
    const { toast, dismiss } = useToast();
    const isMobile = useIsMobile();
    const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    
    // State for displayed media
    const [mediaItems, setMediaItems] = useState<WpMediaItem[]>([]);
    
    // Cache for all media items from the site
    const allMediaCache = useRef<WpMediaItem[]>([]);
    const totalPages = useRef(1);
    const hasFetchedAll = useRef(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSorting, setIsSorting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [sortOrder, setSortOrder] = useState<SortOrder>(null);
    const [currentPage, setCurrentPage] = useState(1);
    
    const [selectedMedia, setSelectedMedia] = useState<WpMediaItem | null>(null);
    const [editableDetails, setEditableDetails] = useState<EditableMediaDetails>({ alt: '', caption: '', description: '' });
    const [isUpdating, setIsUpdating] = useState(false);

    const [optimizeDialogState, setOptimizeDialogState] = useState<OptimizeDialogState>({ open: false, image: null });
    
    const { ref: infiniteScrollRef, inView } = useInView({ threshold: 0.5 });


    useEffect(() => {
        if (sites.length === 1 && !selectedSiteId) {
            setSelectedSiteId(sites[0].id);
        }
    }, [sites, selectedSiteId]);

    const selectedSite = sites.find(s => s.id === selectedSiteId);

    const loadInitialMedia = useCallback(async () => {
        if (!selectedSite?.appPassword) return;

        setIsLoading(true);
        setError(null);
        allMediaCache.current = [];
        hasFetchedAll.current = false;
        
        const result = await fetchWpMedia(selectedSite.url, selectedSite.user, selectedSite.appPassword, 1, PAGE_SIZE);

        if (result.success) {
            allMediaCache.current = result.data;
            setMediaItems(result.data);
            totalPages.current = result.totalPages;
            setCurrentPage(1);
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    }, [selectedSite]);

    useEffect(() => {
        setMediaItems([]);
        allMediaCache.current = [];
        totalPages.current = 1;
        hasFetchedAll.current = false;
        setCurrentPage(1);
        setSortOrder(null);
        setError(null);
        if (selectedSite) {
            loadInitialMedia();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSite]);

    const loadMoreMedia = useCallback(async () => {
        if (isLoading || isSorting || isLoadingMore || currentPage >= totalPages.current) {
            return;
        }
        setIsLoadingMore(true);
        
        const nextPage = currentPage + 1;
        
        if (sortOrder && hasFetchedAll.current) {
            // If sorted and all data is present, just paginate from cache
            const nextItems = allMediaCache.current.slice(0, nextPage * PAGE_SIZE);
            setMediaItems(nextItems);
            setCurrentPage(nextPage);
        } else if (!sortOrder) {
            // Fetch next page from API if not sorting
            const result = await fetchWpMedia(selectedSite!.url, selectedSite!.user, selectedSite!.appPassword!, nextPage, PAGE_SIZE);
            if(result.success){
                const newItems = [...mediaItems, ...result.data];
                allMediaCache.current = newItems;
                setMediaItems(newItems);
                setCurrentPage(nextPage);
            } else {
                toast({ title: "Error", description: "Failed to load more media.", variant: "destructive" });
            }
        }
        setIsLoadingMore(false);

    }, [isLoading, isSorting, isLoadingMore, currentPage, sortOrder, selectedSite, toast, mediaItems]);
    
    useEffect(() => {
        if(inView) {
            loadMoreMedia();
        }
    }, [inView, loadMoreMedia]);


    const handleSort = useCallback(async () => {
        const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
        setSortOrder(newOrder);

        if (hasFetchedAll.current) {
            const sorted = [...allMediaCache.current].sort((a, b) => {
                if (newOrder === 'asc') return a.filesize - b.filesize;
                return b.filesize - a.filesize;
            });
            allMediaCache.current = sorted;
            setMediaItems(sorted.slice(0, currentPage * PAGE_SIZE));
            return;
        }

        setIsSorting(true);
        setError(null);
        const { id: toastId } = toast({ title: 'Fetching all media...', description: 'Sorting with current data and fetching the rest in the background.' });

        const currentData = [...allMediaCache.current];
        const sortedCurrent = currentData.sort((a, b) => {
            if (newOrder === 'asc') return a.filesize - b.filesize;
            return b.filesize - a.filesize;
        });
        setMediaItems(sortedCurrent.slice(0, PAGE_SIZE));
        setCurrentPage(1);

        try {
            if (!selectedSite?.appPassword) throw new Error("WordPress credentials not found.");

            for (let i = 2; i <= totalPages.current; i++) {
                const result = await fetchWpMedia(selectedSite.url, selectedSite.user, selectedSite.appPassword, i, PAGE_SIZE);
                if (result.success) {
                    allMediaCache.current.push(...result.data);
                    const progressivelySorted = [...allMediaCache.current].sort((a, b) => {
                         if (newOrder === 'asc') return a.filesize - b.filesize;
                         return b.filesize - a.filesize;
                    });
                    allMediaCache.current = progressivelySorted;
                    setMediaItems(progressivelySorted.slice(0, currentPage * PAGE_SIZE));
                } else {
                     console.warn(`A page fetch failed: ${result.error}`);
                }
            }
            
            hasFetchedAll.current = true;
            dismiss(toastId);
            toast({ title: "Sorting complete!", description: "All media has been fetched and sorted."});

        } catch (e: any) {
            setError(e.message || "Failed to fetch and sort media.");
            setSortOrder(null); 
        } finally {
            setIsSorting(false);
        }
    }, [sortOrder, selectedSite, toast, currentPage, dismiss]);
    
    
    const handleSelectMedia = (item: WpMediaItem) => {
        setSelectedMedia(item);
        setEditableDetails({
            alt: item.alt,
            caption: item.caption,
            description: item.description,
        });
    }
    
    const handleUpdateDetails = async () => {
        if (!selectedMedia || !selectedSite?.appPassword) return;

        setIsUpdating(true);
        const result = await updateWpMediaDetails(
            selectedSite.url,
            selectedSite.user,
            selectedSite.appPassword,
            selectedMedia.id,
            editableDetails
        );

        if (result.success) {
            toast({
                title: "Success",
                description: "Media details have been updated."
            });
            const updatedItem = { ...selectedMedia, ...editableDetails };
            
            setMediaItems(prevItems => prevItems.map(item => item.id === selectedMedia.id ? updatedItem : item ));
            if (allMediaCache.current.length > 0) {
                 allMediaCache.current = allMediaCache.current.map(item => item.id === selectedMedia.id ? updatedItem : item );
            }
            setSelectedMedia(null);

        } else {
            toast({
                title: "Error",
                description: `Failed to update media: ${result.error}`,
                variant: "destructive"
            });
        }
        setIsUpdating(false);
    };

    const handleOptimizedImageSave = (newImageData: { base64: string; size: number }) => {
        if (!selectedMedia) return;

        const updatedMediaItem: WpMediaItem = {
            ...selectedMedia,
            fullUrl: newImageData.base64,
            thumbnailUrl: newImageData.base64,
            filesize: newImageData.size,
        };

        setSelectedMedia(updatedMediaItem);
        setMediaItems(prevItems => prevItems.map(item => item.id === selectedMedia.id ? updatedMediaItem : item));
        if (allMediaCache.current.length > 0) {
            allMediaCache.current = allMediaCache.current.map(item => item.id === selectedMedia.id ? updatedMediaItem : item );
        }
        
        toast({
            title: "Image Optimized!",
            description: "The image has been compressed locally. Save your changes to upload the new version to WordPress.",
        });
    };

    const renderEditPanelContent = () => {
        if (!selectedMedia) return null;
        
        return (
            <div className="space-y-4">
                <div className="relative">
                    <Image src={selectedMedia.fullUrl} alt={selectedMedia.filename} width={400} height={300} className="rounded-md object-contain w-full" />
                    <Button asChild size="icon" variant="secondary" className="absolute top-2 right-2">
                        <a href={selectedMedia.fullUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </Button>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="alt-text">Alternative Text</Label>
                    <Input id="alt-text" value={editableDetails.alt} onChange={e => setEditableDetails({...editableDetails, alt: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="caption">Caption</Label>
                    <Textarea id="caption" value={editableDetails.caption} onChange={e => setEditableDetails({...editableDetails, caption: e.target.value})} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={editableDetails.description} onChange={e => setEditableDetails({...editableDetails, description: e.target.value})} />
                </div>
            </div>
        );
    }

    const renderSiteSelection = () => {
        if (sites.length === 0) {
            return (
                <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
                    <Globe className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">
                        Connect a Site to Begin
                    </h3>
                    <p className="mt-1 text-sm">
                        Go to settings to connect your WordPress site.
                    </p>
                    <Button asChild size="sm" className="mt-4">
                        <Link href="/dashboard/settings">Go to Settings</Link>
                    </Button>
                </div>
            );
        }

        return (
            <div>
                <h2 className="text-2xl font-headline font-bold mb-4">Select a Site to Manage</h2>
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
                            <CardContent>
                                <p className="text-sm text-muted-foreground truncate">{site.url}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }
    
    const renderMediaLibrary = () => {
        const showLoadMore = sortOrder 
            ? mediaItems.length < allMediaCache.current.length 
            : currentPage < totalPages.current;

        return (
            <>
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className={"lg:col-span-3"}>
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Your WordPress Media</CardTitle>
                                    <CardDescription>
                                        Displaying media items from {new URL(selectedSite!.url).hostname}.
                                    </CardDescription>
                                </div>
                                <Button onClick={() => setSelectedSiteId(null)} variant="outline">
                                    <Power className="mr-2 h-4 w-4" /> Change Site
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 mb-4">
                                <Label>Sort by:</Label>
                                <Button variant='secondary' size="sm" onClick={handleSort} disabled={isSorting}>
                                    {isSorting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Size'}
                                    {sortOrder === 'asc' && <ArrowUp className="ml-2 h-4 w-4" />}
                                    {sortOrder === 'desc' && <ArrowDown className="ml-2 h-4 w-4" />}
                                </Button>
                                {sortOrder && (
                                    <Button variant="ghost" size="sm" onClick={() => { setSortOrder(null); hasFetchedAll.current = false; loadInitialMedia(); }}>
                                        Reset Sort
                                    </Button>
                                )}
                            </div>
                            
                            {isLoading && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                       <Card key={i} className="overflow-hidden flex flex-col">
                                            <CardContent className="p-0 flex-grow">
                                                <Skeleton className="aspect-square w-full h-full" />
                                            </CardContent>
                                            <CardFooter className="p-2 flex-col items-start space-y-1.5">
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-4 w-1/2" />
                                            </CardFooter>
                                        </Card>
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
                                        <Card key={item.id} className="overflow-hidden flex flex-col">
                                            <CardContent className="p-0 flex-grow">
                                                <Image 
                                                    src={item.thumbnailUrl} 
                                                    alt={item.filename} 
                                                    width={300} 
                                                    height={300} 
                                                    className="aspect-square object-cover w-full h-full"
                                                />
                                            </CardContent>
                                            <CardFooter className="p-2 flex flex-col items-start space-y-1.5">
                                                <p className="text-xs font-medium truncate w-full">{item.filename}</p>
                                                <Badge variant={item.filesize > 500 * 1024 ? 'destructive' : 'outline'}>{formatBytes(item.filesize)}</Badge>
                                                <div className="grid grid-cols-2 gap-2 w-full pt-1">
                                                    <Button variant="outline" size="sm" onClick={() => handleSelectMedia(item)}>
                                                        <Edit className="h-3 w-3 mr-1"/>
                                                        Edit
                                                    </Button>
                                                    <Button variant="secondary" size="sm" onClick={() => setOptimizeDialogState({open: true, image: item})}>
                                                         <Settings2 className="h-3 w-3 mr-1"/>
                                                        Optimize
                                                    </Button>
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            )}
                             {showLoadMore && (
                                <div ref={infiniteScrollRef} className="flex justify-center items-center p-4 mt-4">
                                    {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    <span>Loading more...</span>
                                </div>
                             )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            </>
        );
    }

    return (
        <div className="space-y-8">
            <ImageOptimizeDialog 
                open={optimizeDialogState.open}
                onOpenChange={(open) => setOptimizeDialogState({ ...optimizeDialogState, open })}
                image={optimizeDialogState.image}
                onSave={handleOptimizedImageSave}
            />
            <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Media</DialogTitle>
                         <DialogDescription>
                            {selectedMedia?.filename}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {renderEditPanelContent()}
                    </div>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => setSelectedMedia(null)}>Cancel</Button>
                        <Button onClick={handleUpdateDetails} disabled={isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div>
                <h1 className="text-3xl font-headline font-bold">Advanced Media Library</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Here's the deal. Your media library isn't just a folder of images. It's a goldmine of untapped potential. Every image, every video, every asset is a chance to tell your story, drive conversions, and dominate your niche. Stop guessing. Start analyzing.
                </p>
            </div>

            {selectedSite ? renderMediaLibrary() : renderSiteSelection()}
        </div>
    );
}
