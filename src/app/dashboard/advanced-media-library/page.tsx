
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import Link from 'next/link';
import Image from 'next/image';
import { useIsMobile } from '@/hooks/use-mobile';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchWpMedia, updateWpMediaDetails, type WpMediaItem } from './actions';
import { Globe, Power, Image as ImageIcon, Loader2, ArrowUp, ArrowDown, ExternalLink, X, Settings2 } from "lucide-react";
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

type SortOrder = 'default' | 'desc' | 'asc';

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
    const [sortOrder, setSortOrder] = useState<SortOrder>('default');

    const [selectedMedia, setSelectedMedia] = useState<WpMediaItem | null>(null);
    const [editableDetails, setEditableDetails] = useState<EditableMediaDetails>({ alt: '', caption: '', description: '' });
    const [isUpdating, setIsUpdating] = useState(false);

    const [optimizeDialogState, setOptimizeDialogState] = useState<OptimizeDialogState>({ open: false, image: null });


    useEffect(() => {
        if (sites.length === 1 && !selectedSiteId) {
            setSelectedSiteId(sites[0].id);
        }
    }, [sites, selectedSiteId]);

    const selectedSite = useMemo(() => sites.find(s => s.id === selectedSiteId), [sites, selectedSiteId]);

    const handleFetchMedia = useCallback(async () => {
        if (!selectedSite?.appPassword) {
             setError("Application password not found for this site. Please add it in Settings.");
             return;
        }
        setIsLoading(true);
        setError(null);
        setMediaItems([]);
        const result = await fetchWpMedia(selectedSite.url, selectedSite.user, selectedSite.appPassword);
        if (result.success) {
            setMediaItems(result.data);
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    }, [selectedSite]);
    
    useEffect(() => {
        if (selectedSite) {
            handleFetchMedia();
        }
    }, [selectedSite, handleFetchMedia]);
    
    const sortedMediaItems = useMemo(() => {
        const sorted = [...mediaItems];
        if (sortOrder === 'desc') {
            return sorted.sort((a, b) => b.filesize - a.filesize);
        }
        if (sortOrder === 'asc') {
            return sorted.sort((a, b) => a.filesize - b.filesize);
        }
        return sorted; // 'default' order
    }, [mediaItems, sortOrder]);

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
                                        All media from {new URL(selectedSite!.url).hostname} will appear here.
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
                                    <Button variant={sortOrder === 'default' ? 'default' : 'outline'} size="sm" onClick={() => setSortOrder('default')}>Default</Button>
                                    <Button variant={sortOrder === 'desc' ? 'default' : 'outline'} size="sm" onClick={() => setSortOrder('desc')}>
                                        <ArrowUp className="mr-2 h-4 w-4" /> Size (Largest First)
                                    </Button>
                                    <Button variant={sortOrder === 'asc' ? 'default' : 'outline'} size="sm" onClick={() => setSortOrder('asc')}>
                                        <ArrowDown className="mr-2 h-4 w-4" /> Size (Smallest First)
                                    </Button>
                                </div>
                            </div>
                            
                            {isLoading && (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[80px]">Preview</TableHead>
                                            <TableHead>Filename</TableHead>
                                            <TableHead>File Size</TableHead>
                                            <TableHead>Dimensions</TableHead>
                                            <TableHead className="w-[120px]">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Array.from({length: 5}).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-16 w-16 rounded-md" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}

                            {!isLoading && error && (
                                <div className="text-center text-destructive p-8 border-dashed border-2 border-destructive/50 rounded-md">
                                    <h3 className="text-lg font-semibold">Failed to load media</h3>
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}

                            {!isLoading && !error && sortedMediaItems.length === 0 && (
                                <div className="text-center text-muted-foreground p-12 border-dashed border-2 rounded-md">
                                    <ImageIcon className="mx-auto h-16 w-16" />
                                    <h3 className="mt-4 text-lg font-semibold">No Media Found</h3>
                                    <p className="mt-1 text-sm">
                                        Your WordPress media library appears to be empty.
                                    </p>
                                </div>
                            )}

                            {!isLoading && !error && sortedMediaItems.length > 0 && (
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[80px]">Preview</TableHead>
                                                <TableHead>Filename</TableHead>
                                                <TableHead>File Size</TableHead>
                                                <TableHead>Dimensions</TableHead>
                                                <TableHead className="w-[120px]">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sortedMediaItems.map(item => (
                                                <TableRow key={item.id} className={cn(selectedMedia?.id === item.id && 'bg-muted/50')}>
                                                    <TableCell>
                                                        <Image src={item.thumbnailUrl} alt={item.filename} width={64} height={64} className="rounded-md object-cover aspect-square"/>
                                                    </TableCell>
                                                    <TableCell className="font-medium max-w-[300px] break-words">{item.filename}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={item.filesize > 500 * 1024 ? 'destructive' : 'outline'}>{formatBytes(item.filesize)}</Badge>
                                                    </TableCell>
                                                    <TableCell>{item.width} x {item.height}</TableCell>
                                                    <TableCell>
                                                        <Button variant="outline" size="sm" onClick={() => handleSelectMedia(item)}>Select</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
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
