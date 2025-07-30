
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import type { ImageSearchResult } from '@/app/dashboard/image-generator/actions';
import { Skeleton } from './ui/skeleton';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';


interface ImageSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQueryGenerated?: (query: string, images: ImageSearchResult[]) => void;
  onSelectImage: (image: ImageSearchResult) => void;
  onSearch: (query: string, page: number) => Promise<ImageSearchResult[]>;
}

export function ImageSearchDialog({
  open,
  onOpenChange,
  onQueryGenerated,
  onSelectImage,
  onSearch,
}: ImageSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<ImageSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  const loadMoreImages = useCallback(async () => {
    if (isLoadingMore || !hasMore || !query) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;
    const results = await onSearch(query, nextPage);
    
    if (results.length === 0) {
      setHasMore(false);
    }
    
    setImages(prev => [...prev, ...results]);
    setPage(nextPage);
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, query, page, onSearch]);
  
  useEffect(() => {
    if (inView) {
      loadMoreImages();
    }
  }, [inView, loadMoreImages]);

  const handleSearch = useCallback(async () => {
    if (!query) return;
    setPage(1);
    setImages([]);
    setHasMore(true);
    setIsLoading(true);
    
    const results = await onSearch(query, 1);
    if (results.length === 0) {
      setHasMore(false);
    }
    setImages(results);
    setIsLoading(false);
  }, [query, onSearch]);

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setQuery('');
      setImages([]);
      setPage(1);
      setHasMore(true);
      setIsLoading(false);
      
      // If there's a callback for query generation, it means we should show loading
      if(onQueryGenerated) {
          setIsLoading(true);
      }
    }
  }, [open, onQueryGenerated]);

  useEffect(() => {
    if (onQueryGenerated) {
        onQueryGenerated(query, images);
    }
  }, [query, images, onQueryGenerated]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const getBadgeVariant = (source: 'Pexels' | 'Unsplash' | 'Wikimedia') => {
      switch(source) {
          case 'Pexels': return 'default';
          case 'Unsplash': return 'secondary';
          case 'Wikimedia': return 'outline';
          default: return 'default';
      }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-7xl h-[90vh] flex flex-col p-4">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Find the Perfect Image</DialogTitle>
          <DialogDescription>
            Use the AI-generated query below or create your own to search Pexels, Unsplash, and Wikimedia.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 flex-shrink-0">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="AI query will appear here... or type your own"
          />
          <Button onClick={() => handleSearch()} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Search
          </Button>
        </div>
        <div className="flex-grow mt-4 border rounded-md overflow-hidden">
            <ScrollArea className="h-full">
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(isLoading && images.length === 0) && Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="aspect-[16/10] bg-muted rounded-md" />
                        <Skeleton className="h-4 w-3/4 bg-muted" />
                    </div>
                ))}
                {images.map((image) => (
                <div
                    key={image.url + Math.random()}
                    className="group cursor-pointer"
                    onClick={() => onSelectImage(image)}
                >
                    <div className="relative overflow-hidden rounded-md">
                        <Image
                        src={image.url}
                        alt={image.alt || 'Search result image'}
                        width={400}
                        height={250}
                        className="object-cover aspect-[16/10] transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white font-bold">Select Image</p>
                        </div>
                        <Badge className={cn("absolute top-2 left-2")} variant={getBadgeVariant(image.source)}>
                            {image.source}
                        </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground truncate" title={image.alt || 'Untitled'}>
                        {image.alt || 'Untitled'}
                    </p>
                </div>
                ))}
            </div>
             {hasMore && images.length > 0 && (
                 <div ref={ref} className="flex justify-center items-center p-4">
                    {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 </div>
            )}
            {!isLoading && images.length === 0 && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>{query ? 'No images found for this query.' : 'Search for an image to begin.'}</p>
                </div>
            )}
            </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
