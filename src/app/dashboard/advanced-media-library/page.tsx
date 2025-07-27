

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import Link from 'next/link';
import Image from 'next/image';
import { useIsMobile } from '@/hooks/use-mobile';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchWpMedia, updateWpMediaDetails, type WpMediaItem } from './actions';
import { Globe, Power, Image as ImageIcon, Loader2, ArrowUp, ArrowDown, ExternalLink, X, Settings2, Edit } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ImageOptimizeDialog } from '@/components/image-optimize-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WpSite {
  id: string;
  url: string;
  user: string;
  appPassword?: string;
}

type SortOrder = 'desc' | 'asc';

interface SortState {
    order: SortOrder;
}

interface EditableMediaDetails {
    alt: string;
    caption: string;
    description: string;
}

interface OptimizeDialogState {
    open: boolean;
    image: WpMediaItem | null;
}

function formatBytes(bytes: number, decimals = 2) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export default function AdvancedMediaLibraryPage() {
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    const [mediaItems, setMediaItems] = useState<WpMediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [sortState, setSortState] = useState<SortState>({ order: 'desc' });

    const [selectedMedia, setSelectedMedia] = useState<WpMediaItem | null>(null);
    const [editableDetails, setEditableDetails] = useState<EditableMediaDetails>({ alt: '', caption: '', description: '' });
    const [isUpdating, setIsUpdating] = useState(false);

    const [optimizeDialogState, setOptimizeDialogState] = useState<OptimizeDialogState>({ open: false, image: null });


    useEffect(() => {
        if (sites.length === 1 && !selectedSiteId) {
            setSelectedSiteId(sites[0].id);
        }
    }, [sites, selectedSiteId]);

    const selectedSite = sites.find(s => s.id === selectedSiteId);

    const handleFetchMedia = useCallback(async () => {
        if (!selectedSite?.appPassword) {
             setError("Application password not found for this site. Please add it in Settings.");
             return;
        }

        setIsLoading(true);
        setMediaItems([]);
        setError(null);
        
        const result = await fetchWpMedia(selectedSite.url, selectedSite.user, selectedSite.appPassword);

        if (result.success) {
            const sorted = [...result.data].sort((a, b) => {
                 if (sortState.order === 'asc') {
                    return a.filesize - b.filesize;
                }
                return b.filesize - a.filesize;
            });
            setMediaItems(sorted);
        } else {
            setError(result.error);
        }

        setIsLoading(false);
    }, [selectedSite, sortState.order]);
    
    useEffect(() => {
        if (selectedSite) {
            handleFetchMedia();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSite]);
    
    const handleSortChange = () => {
        const newOrder = sortState.order === 'desc' ? 'asc' : 'desc';
        setSortState({ order: newOrder });

        const sorted = [...mediaItems].sort((a, b) => {
            if (newOrder === 'asc') {
                return a.filesize - b.filesize;
            }
            return b.filesize - a.filesize;
        });
        setMediaItems(sorted);
    };

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
            // Optimistically update the local state
            setMediaItems(prevItems => prevItems.map(item =>
                item.id === selectedMedia.id ? { ...item, ...editableDetails } : item
            ));
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

        // Update the selected media item state first, which will re-render the edit panel
        setSelectedMedia(updatedMediaItem);
        
        // Then update the main media list
        setMediaItems(prevItems => prevItems.map(item =>
            item.id === selectedMedia.id ? updatedMediaItem : item
        ));
        
        toast({
            title: "Image Optimized!",
            description: "The image has been compressed locally. Save your changes to upload the new version to WordPress.",
        });
    };

    const renderEditPanelContent = () => {
        if (!selectedMedia) return null;
        
        return (
            <>
                <div className="relative">
                    <Image src={selectedMedia.fullUrl} alt={selectedMedia.filename} width={400} height={300} className="rounded-md object-contain w-full" />
                    <Button asChild size="icon" variant="secondary" className="absolute top-2 right-2">
                        <a href={selectedMedia.fullUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </Button>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setOptimizeDialogState({ open: true, image: selectedMedia })}>
                    <Settings2 className="mr-2 h-4 w-4" />
                    Optimize Image
                </Button>
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
            </>
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
        return (
            <>
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className={cn("lg:col-span-3", selectedMedia && !isMobile && "lg:col-span-2")}>
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Your WordPress Media</CardTitle>
                                    <CardDescription>
                                        Displaying the 100 most recent items from {new URL(selectedSite!.url).hostname}.
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
                                <div className="flex gap-2">
                                     <Button variant='secondary' size="sm" onClick={handleSortChange}>
                                        Size {sortState.order === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            
                            {isLoading && (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {Array.from({length: 10}).map((_, i) => (
                                        <Skeleton key={i} className="aspect-[4/5] rounded-lg" />
                                    ))}
                                </div>
                            )}

                            {!isLoading && error && (
                                <div className="text-center text-destructive p-8 border-dashed border-2 border-destructive/50 rounded-md">
                                    <h3 className="text-lg font-semibold">Failed to load media</h3>
                                    <p className="text-sm">{error}</p>
                                </div>
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
                                            <CardFooter className="p-2 flex-col items-start space-y-1.5">
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
                        </CardContent>
                    </Card>
                </div>
                {selectedMedia && !isMobile && (
                    <div className="lg:col-span-1 sticky top-4">
                       <Card>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>Edit Media</CardTitle>
                                        <CardDescription className="truncate max-w-xs">{selectedMedia.filename}</CardDescription>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedMedia(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {renderEditPanelContent()}
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={handleUpdateDetails} disabled={isUpdating}>
                                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                       </Card>
                    </div>
                )}
            </div>

            {isMobile && (
                 <Sheet open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
                    <SheetContent side="bottom" className="h-[90vh] flex flex-col">
                         <SheetHeader>
                            <SheetTitle>Edit Media</SheetTitle>
                            <SheetDescription className="truncate max-w-xs">
                                {selectedMedia?.filename}
                            </SheetDescription>
                        </SheetHeader>
                        <ScrollArea className="flex-grow">
                             <div className="space-y-4 p-4">
                                {renderEditPanelContent()}
                            </div>
                        </ScrollArea>
                        <SheetFooter className="p-4 border-t">
                            <Button className="w-full" onClick={handleUpdateDetails} disabled={isUpdating}>
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            )}
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

    
