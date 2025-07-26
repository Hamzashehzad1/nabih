
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

interface ImageSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
  initialImages?: ImageSearchResult[];
  onSelectImage: (image: ImageSearchResult) => void;
  onSearch: (query: string) => Promise<ImageSearchResult[]>;
}

export function ImageSearchDialog({
  open,
  onOpenChange,
  initialQuery = '',
  initialImages = [],
  onSelectImage,
  onSearch,
}: ImageSearchDialogProps) {
  const [query, setQuery] = useState(initialQuery);
  const [images, setImages] = useState(initialImages);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setImages(initialImages);
      if (initialImages.length === 0 && initialQuery) {
          setIsLoading(true);
          onSearch(initialQuery).then(results => {
              setImages(results);
              setIsLoading(false);
          });
      }
    }
  }, [open, initialQuery, initialImages, onSearch]);

  const handleSearch = useCallback(async () => {
    if (!query) return;
    setIsLoading(true);
    setImages([]); // Clear previous images while new ones are loading
    const results = await onSearch(query);
    setImages(results);
    setIsLoading(false);
  }, [query, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-7xl h-[90vh] flex flex-col p-4">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Find the Perfect Image</DialogTitle>
          <DialogDescription>
            Use the AI-generated query below or create your own to search Pexels
            and Unsplash.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 flex-shrink-0">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., 'futuristic city skyline at night'"
          />
          <Button onClick={handleSearch} disabled={isLoading}>
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
                {isLoading && images.length === 0 && Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-[16/10] bg-muted rounded-md" />
                ))}
                {images.map((image) => (
                <div
                    key={image.url}
                    className="group relative cursor-pointer"
                    onClick={() => onSelectImage(image)}
                >
                    <Image
                    src={image.url}
                    alt={image.alt}
                    width={400}
                    height={250}
                    className="rounded-md object-cover aspect-[16/10] transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white font-bold">Select Image</p>
                    </div>
                    <Badge className="absolute top-2 left-2" variant={image.source === 'Pexels' ? 'default' : 'secondary'}>
                    {image.source}
                    </Badge>
                </div>
                ))}
            </div>
            {!isLoading && images.length === 0 && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No images found for this query.</p>
                </div>
            )}
            </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
