
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import Link from 'next/link';
import Image from 'next/image';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchWpMedia, type WpMediaItem } from './actions';
import { Globe, Power, HardDrive, Image as ImageIcon, FileText, Loader2, ArrowDown, ArrowUp, ArrowDownUp } from "lucide-react";
import { Label } from '@/components/ui/label';

interface WpSite {
  id: string;
  url: string;
  user: string;
  appPassword?: string;
}

type SortOrder = 'default' | 'desc' | 'asc';

function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export default function AdvancedMediaLibraryPage() {
    const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    const [mediaItems, setMediaItems] = useState<WpMediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>('default');

    useEffect(() => {
        if (sites.length === 1 && !selectedSiteId) {
            setSelectedSiteId(sites[0].id);
        }
    }, [sites, selectedSiteId]);

    const selectedSite = useMemo(() => sites.find(s => s.id === selectedSiteId), [sites, selectedSiteId]);

    useEffect(() => {
        if (selectedSite?.appPassword) {
            const loadMedia = async () => {
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
            };
            loadMedia();
        } else if(selectedSite) {
             setError("Application password not found for this site. Please add it in Settings.");
        }
    }, [selectedSite]);
    
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
                            <Button variant={sortOrder === 'default' ? 'default' : 'outline'} onClick={() => setSortOrder('default')}>Default</Button>
                            <Button variant={sortOrder === 'desc' ? 'default' : 'outline'} onClick={() => setSortOrder('desc')}>
                               <ArrowUp className="mr-2 h-4 w-4" /> Size (Largest First)
                            </Button>
                            <Button variant={sortOrder === 'asc' ? 'default' : 'outline'} onClick={() => setSortOrder('asc')}>
                               <ArrowDown className="mr-2 h-4 w-4" /> Size (Smallest First)
                           </Button>
                        </div>
                    </div>
                     
                     {isLoading && (
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Preview</TableHead>
                                    <TableHead>Filename</TableHead>
                                    <TableHead>File Size</TableHead>
                                    <TableHead>Dimensions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({length: 5}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-16 w-16 rounded-md" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
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
                                        <TableHead className="w-[100px]">Preview</TableHead>
                                        <TableHead>Filename</TableHead>
                                        <TableHead>File Size</TableHead>
                                        <TableHead>Dimensions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedMediaItems.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Image src={item.thumbnailUrl} alt={item.filename} width={80} height={80} className="rounded-md object-cover aspect-square"/>
                                            </TableCell>
                                            <TableCell className="font-medium">{item.filename}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.filesize > 500 * 1024 ? 'destructive' : 'outline'}>{formatBytes(item.filesize)}</Badge>
                                            </TableCell>
                                            <TableCell>{item.width} x {item.height}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-8">
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
