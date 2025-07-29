

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import Link from 'next/link';
import Image from 'next/image';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInView } from 'react-intersection-observer';
import JSZip from 'jszip';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchWpMedia, updateWpMediaDetails, type WpMediaItem } from './actions';
import { Globe, Power, Image as ImageIcon, Loader2, ArrowUp, ArrowDown, ExternalLink, Settings2, Edit, AlertCircle, CloudUpload, CheckCircle2, XCircle, Download, Square } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ImageOptimizeDialog } from '@/components/image-optimize-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';

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

type CloudProvider = 'gdrive' | 'dropbox' | 'zip';

interface BackupState {
    provider: CloudProvider;
    itemsToBackup: WpMediaItem[];
    progress: { [key: number]: { status: 'pending' | 'uploading' | 'success' | 'error', message: string } };
    overallProgress: number;
    isBackingUp: boolean;
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
                    if (!isCancelled) {
                        setImgSrc(base64);
                    }
                } catch (error) {
                    console.error("Failed to load proxied image:", error);
                     if (!isCancelled) {
                        setImgSrc(null); // Set to null on error
                    }
                }
            } else {
                setImgSrc(src);
            }
            setIsLoading(false);
        }

        loadImage();

        return () => {
            isCancelled = true;
        };
    }, [src]);

    if (isLoading || !imgSrc) {
        return <Skeleton className="w-full h-full" {...props} />;
    }

    return <Image src={imgSrc} alt={alt} {...props} />;
};


export default function AdvancedMediaLibraryPage() {
    const { toast, dismiss } = useToast();
    const isMobile = useIsMobile();
    const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    
    // State for displayed media
    const [mediaItems, setMediaItems] = useState<WpMediaItem[]>([]);
    
    // Cache for all media items from the site
    const allMediaCache = useRef<WpMediaItem[]>([]);
    const hasFetchedAll = useRef(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSorting, setIsSorting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [sortOrder, setSortOrder] = useState<SortOrder>(null);
    const [currentPage, setCurrentPage] = useState(1);
    
    const [selectedMedia, setSelectedMedia] = useState<WpMediaItem | null>(null);
    const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
    const [editableDetails, setEditableDetails] = useState<EditableMediaDetails>({ alt: '', caption: '', description: '' });
    const [isUpdating, setIsUpdating] = useState(false);

    const [optimizeDialogState, setOptimizeDialogState] = useState<OptimizeDialogState>({ open: false, image: null });
    
    // Backup and Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
    const [backupState, setBackupState] = useState<BackupState>({
        provider: 'zip',
        itemsToBackup: [],
        progress: {},
        overallProgress: 0,
        isBackingUp: false,
    });

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
        setMediaItems([]);
        allMediaCache.current = [];
        hasFetchedAll.current = false;
        
        const result = await fetchWpMedia(selectedSite.url, selectedSite.user, selectedSite.appPassword, 1, PAGE_SIZE);

        if (result.success) {
            allMediaCache.current = result.data;
            setMediaItems(result.data);
            setCurrentPage(1);
            if (result.data.length < PAGE_SIZE || result.totalPages <= 1) {
                hasFetchedAll.current = true;
            }
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    }, [selectedSite]);

    useEffect(() => {
        setMediaItems([]);
        allMediaCache.current = [];
        hasFetchedAll.current = false;
        setCurrentPage(1);
        setSortOrder(null);
        setError(null);
        setIsSelectionMode(false);
        setSelectedIds(new Set());
        if (selectedSite) {
            loadInitialMedia();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSite]);

    const loadMoreMedia = useCallback(async () => {
        if (isLoading || isSorting || isLoadingMore || hasFetchedAll.current || !selectedSite?.appPassword) {
            return;
        }
        setIsLoadingMore(true);
        
        const nextPage = currentPage + 1;
        
        if (sortOrder) {
            // If sorted, we've already fetched everything. Just paginate from cache.
            const nextItems = allMediaCache.current.slice(0, nextPage * PAGE_SIZE);
            setMediaItems(nextItems);
            setCurrentPage(nextPage);
            setIsLoadingMore(false);
            if(nextItems.length >= allMediaCache.current.length){
                hasFetchedAll.current = true;
            }
            return;
        }
        
        // Fetch next page from API if not sorting
        const result = await fetchWpMedia(selectedSite.url, selectedSite.user, selectedSite.appPassword, nextPage, PAGE_SIZE);
        if(result.success){
            if (result.data.length === 0) {
                hasFetchedAll.current = true;
            } else {
                const newItems = [...allMediaCache.current, ...result.data];
                allMediaCache.current = newItems;
                setMediaItems(newItems);
                setCurrentPage(nextPage);
            }
        } else {
            toast({ title: "Error", description: "Failed to load more media.", variant: "destructive" });
        }

        setIsLoadingMore(false);

    }, [isLoading, isSorting, isLoadingMore, currentPage, sortOrder, selectedSite, toast]);
    
    useEffect(() => {
        if(inView) {
            loadMoreMedia();
        }
    }, [inView, loadMoreMedia]);


    const handleSort = useCallback(async () => {
        const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
        setSortOrder(newOrder);
        setIsSorting(true);
        setError(null);

        if (!selectedSite?.appPassword) {
            setError("WordPress credentials not found.");
            setIsSorting(false);
            return;
        }

        const { id: toastId } = toast({ title: 'Sorting media...', description: 'Fetching all media items. This may take a moment.' });
        
        try {
            // If we have already fetched everything, sort from cache.
            if (hasFetchedAll.current) {
                const sorted = [...allMediaCache.current].sort((a, b) => {
                    if (newOrder === 'asc') return a.filesize - b.filesize;
                    return b.filesize - a.filesize;
                });
                allMediaCache.current = sorted;
                setMediaItems(sorted.slice(0, PAGE_SIZE));
                setCurrentPage(1);
                setIsSorting(false);
                dismiss(toastId);
                toast({ title: "Sort Complete", description: "Media sorted by size." });
                return;
            }

            // Fetch the first page to get total pages and initial data
            const firstPageResult = await fetchWpMedia(selectedSite.url, selectedSite.user, selectedSite.appPassword, 1, PAGE_SIZE);

            if (!firstPageResult.success) {
                throw new Error(firstPageResult.error);
            }

            let allFetchedMedia = firstPageResult.data;
            const totalPages = firstPageResult.totalPages;

            // If there are more pages, fetch them in parallel
            if (totalPages > 1) {
                const pagePromises = [];
                for (let page = 2; page <= totalPages; page++) {
                    pagePromises.push(fetchWpMedia(selectedSite.url, selectedSite.user, selectedSite.appPassword, page, PAGE_SIZE));
                }
                const results = await Promise.all(pagePromises);
                
                for (const result of results) {
                    if (result.success) {
                        allFetchedMedia.push(...result.data);
                    } else {
                        // Log or handle partial failures if necessary
                        console.warn(`Failed to fetch page: ${result.error}`);
                    }
                }
            }

            // Once all media is fetched, sort it
            const sorted = allFetchedMedia.sort((a, b) => {
                if (newOrder === 'asc') return a.filesize - b.filesize;
                return b.filesize - a.filesize;
            });

            allMediaCache.current = sorted;
            setMediaItems(sorted.slice(0, PAGE_SIZE));
            setCurrentPage(1);
            hasFetchedAll.current = true;
            
            dismiss(toastId);
            toast({ title: "Sorting complete!", description: `All ${sorted.length} media items have been fetched and sorted.`});

        } catch (e: any) {
            setError(e.message || "Failed to fetch and sort media.");
            setSortOrder(null); 
            dismiss(toastId);
            toast({ title: "Error", description: "Could not complete sorting.", variant: "destructive" });
        } finally {
            setIsSorting(false);
        }
    }, [sortOrder, selectedSite, toast, dismiss]);
    
    
    const handleSelectMedia = (item: WpMediaItem) => {
        setSelectedMedia(item);
        setEditableDetails({
            alt: item.alt,
            caption: item.caption,
            description: item.description,
        });
        setIsEditPanelOpen(true);
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
            setIsEditPanelOpen(false);
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

    const handleOptimizeComplete = () => {
        loadInitialMedia(); // Refresh data from WP
    };
    
    const handleSelectionChange = (id: number, checked: boolean) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if(checked) {
                newSet.add(id);
            } else {
                newSet.delete(id);
            }
            return newSet;
        });
    };
    
    const handleSelectAll = () => {
        setSelectedIds(new Set(mediaItems.map(item => item.id)));
    };

    const handleClearSelection = () => {
        setSelectedIds(new Set());
    };
    
    const handleOpenBackupDialog = (items: WpMediaItem[]) => {
        if(items.length === 0) {
            toast({title: "No items selected", description: "Please select at least one media item to back up.", variant: "destructive"});
            return;
        }
        setBackupState({
            provider: 'zip',
            itemsToBackup: items,
            progress: items.reduce((acc, item) => ({...acc, [item.id]: {status: 'pending', message: 'Waiting...'}}), {}),
            overallProgress: 0,
            isBackingUp: false,
        });
        setIsBackupDialogOpen(true);
    };
    
    const startBackup = async () => {
        setBackupState(prev => ({...prev, isBackingUp: true}));
        
        const { itemsToBackup, provider } = backupState;
        
        if (provider === 'zip') {
            const zip = new JSZip();
            let completed = 0;

            for (const item of itemsToBackup) {
                setBackupState(prev => ({...prev, progress: {...prev.progress, [item.id]: {status: 'uploading', message: 'Downloading...'}}}));
                try {
                    const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(item.fullUrl)}`);
                    if (!response.ok) throw new Error('Failed to proxy image');

                    const { base64 } = await response.json();
                    const blob = await (await fetch(base64)).blob();
                    zip.file(item.filename, blob);
                    
                    setBackupState(prev => ({...prev, progress: {...prev.progress, [item.id]: { status: 'success', message: 'Zipped' }}}));
                } catch (e) {
                     setBackupState(prev => ({...prev, progress: {...prev.progress, [item.id]: { status: 'error', message: 'Download failed' }}}));
                }
                completed++;
                setBackupState(prev => ({...prev, overallProgress: (completed / itemsToBackup.length) * 100 }));
            }

            toast({ title: 'Zipping complete', description: 'Generating your download...' });
            
            const zipBlob = await zip.generateAsync({type:"blob"});
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `media-backup.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            setBackupState(prev => ({...prev, isBackingUp: false}));
            toast({ title: 'Download Started', description: 'Your zip file is downloading.' });
            return;
        }

        let completed = 0;

        for (const item of itemsToBackup) {
            setBackupState(prev => ({...prev, progress: {...prev.progress, [item.id]: {status: 'uploading', message: 'In progress...'}}}));
            
            // const result = await backupMediaToCloud(item, provider);
            
            // setBackupState(prev => ({...prev, progress: {...prev.progress, [item.id]: {
            //     status: result.success ? 'success' : 'error',
            //     message: result.success ? 'Backed up!' : result.error,
            // }}}));

            completed++;
            setBackupState(prev => ({...prev, overallProgress: (completed / itemsToBackup.length) * 100 }));
        }

        setBackupState(prev => ({...prev, isBackingUp: false}));
        toast({title: "Backup Complete", description: `Finished backing up ${itemsToBackup.length} items.`});
    };

    const renderEditPanelContent = () => {
        if (!selectedMedia) return null;
        
        return (
            <div className="space-y-4">
                <div className="relative">
                    <ProxiedImage src={selectedMedia.fullUrl} alt={selectedMedia.filename} width={400} height={300} className="rounded-md object-contain w-full" />
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
        const showLoadMore = !hasFetchedAll.current;
        const selectedItems = mediaItems.filter(item => selectedIds.has(item.id));

        return (
            <>
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
                                {isSelectionMode ? (
                                    <>
                                        <Button size="sm" onClick={() => handleOpenBackupDialog(selectedItems)} disabled={selectedIds.size === 0}>
                                            <CloudUpload className="mr-2 h-4 w-4" /> Backup Selected ({selectedIds.size})
                                        </Button>
                                        <Button size="sm" variant="secondary" onClick={() => handleOpenBackupDialog(allMediaCache.current)}>
                                            Backup All ({allMediaCache.current.length})
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={handleSelectAll}>Select All</Button>
                                        <Button size="sm" variant="ghost" onClick={handleClearSelection}>Clear Selection</Button>
                                        <Button size="sm" variant="outline" onClick={() => {setIsSelectionMode(false); setSelectedIds(new Set())}}>Cancel</Button>
                                    </>
                                ) : (
                                    <>
                                    <Label>Tools:</Label>
                                    <Button variant='outline' size="sm" onClick={() => setIsSelectionMode(true)}>
                                       <Square className="mr-2 h-4 w-4" /> Select for Backup
                                    </Button>
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
                                    </>
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
                                        <Card key={item.id} className={cn("overflow-hidden flex flex-col", selectedIds.has(item.id) && "ring-2 ring-primary")}>
                                            <CardContent className="p-0 flex-grow relative">
                                                {isSelectionMode && (
                                                    <div className="absolute top-2 left-2 z-10 bg-background/80 rounded-sm p-1">
                                                        <Checkbox
                                                            checked={selectedIds.has(item.id)}
                                                            onCheckedChange={(checked) => handleSelectionChange(item.id, !!checked)}
                                                            aria-label={`Select ${item.filename}`}
                                                        />
                                                    </div>
                                                )}
                                                <ProxiedImage 
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
            </>
        );
    }

    const backupButtonDisabled = backupState.isBackingUp || backupState.overallProgress > 0;

    return (
        <div className="space-y-8">
            <ImageOptimizeDialog 
                open={optimizeDialogState.open}
                onOpenChange={(open) => setOptimizeDialogState({ ...optimizeDialogState, open })}
                image={optimizeDialogState.image}
                onComplete={handleOptimizeComplete}
                site={selectedSite}
            />
            <Dialog open={isEditPanelOpen} onOpenChange={setIsEditPanelOpen}>
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
                         <Button variant="outline" onClick={() => setIsEditPanelOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateDetails} disabled={isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Backup Media</DialogTitle>
                        <DialogDescription>
                            Choose your destination and start the backup.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        <div>
                            <Label className="font-semibold">Destination</Label>
                             <RadioGroup 
                                value={backupState.provider} 
                                onValueChange={(value) => setBackupState(prev => ({...prev, provider: value as CloudProvider}))}
                                className="mt-2 grid grid-cols-1 gap-2"
                                disabled={backupState.isBackingUp}
                            >
                                <Label htmlFor="gdrive" className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 has-[:disabled]:opacity-50 has-[:disabled]:cursor-not-allowed">
                                    <div className="flex items-center gap-4">
                                        <RadioGroupItem value="gdrive" id="gdrive" disabled />
                                        <CloudUpload className="h-6 w-6" />
                                        <span className="font-semibold">Google Drive</span>
                                    </div>
                                    <Badge variant="outline">Coming Soon</Badge>
                                </Label>
                                <Label htmlFor="dropbox" className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 has-[:disabled]:opacity-50 has-[:disabled]:cursor-not-allowed">
                                    <div className="flex items-center gap-4">
                                        <RadioGroupItem value="dropbox" id="dropbox" disabled />
                                        <CloudUpload className="h-6 w-6" />
                                        <span className="font-semibold">Dropbox</span>
                                    </div>
                                    <Badge variant="outline">Coming Soon</Badge>
                                </Label>
                                 <Label htmlFor="zip" className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    <div className="flex items-center gap-4">
                                         <RadioGroupItem value="zip" id="zip"/>
                                        <Download className="h-6 w-6" />
                                        <span className="font-semibold">Download as Zip</span>
                                    </div>
                                </Label>
                            </RadioGroup>
                        </div>
                        <div>
                            <Label className="font-semibold">Progress</Label>
                            <div className="mt-2 space-y-2">
                                <Progress value={backupState.overallProgress} className="w-full" />
                                <ScrollArea className="h-64 w-full rounded-md border p-4">
                                    <div className="space-y-3">
                                    {backupState.itemsToBackup.map(item => (
                                        <div key={item.id} className="flex justify-between items-center text-sm">
                                            <p className="truncate pr-4">{item.filename}</p>
                                            <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
                                                {backupState.progress[item.id]?.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />}
                                                {backupState.progress[item.id]?.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin" />}
                                                {backupState.progress[item.id]?.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                                {backupState.progress[item.id]?.status === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
                                                <span className="w-24 text-right">{backupState.progress[item.id]?.message}</span>
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => setIsBackupDialogOpen(false)} disabled={backupState.isBackingUp}>
                             {backupState.overallProgress === 100 ? 'Close' : 'Cancel'}
                        </Button>
                        <Button onClick={startBackup} disabled={backupButtonDisabled}>
                           {backupState.isBackingUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           {backupState.provider === 'zip' 
                               ? (backupState.isBackingUp ? 'Zipping...' : 'Download Zip') 
                               : (backupState.isBackingUp ? 'Backing up...' : 'Start Backup')
                           }
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
