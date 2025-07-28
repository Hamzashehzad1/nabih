
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Skeleton } from './ui/skeleton';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

interface ApiKeys {
    gemini: string;
    pexels: string;
    unsplash: string;
}

interface PexelsImageProps {
    query: string;
    className?: string;
}

export function PexelsImage({ query, className }: PexelsImageProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [apiKeys] = useLocalStorage<ApiKeys>('api-keys', { gemini: '', pexels: '', unsplash: '' });

    useEffect(() => {
        // Reset state when query changes
        setImageUrl(null);
        setIsLoading(true);

        if (!query || !apiKeys.pexels) {
            setIsLoading(false);
            return;
        };

        const fetchImage = async () => {
            try {
                const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
                    headers: {
                        Authorization: apiKeys.pexels,
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch from Pexels API');
                }
                const data = await response.json();
                if (data.photos && data.photos.length > 0) {
                    setImageUrl(data.photos[0].src.large);
                }
            } catch (error) {
                console.error("Pexels fetch error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchImage();
    }, [query, apiKeys.pexels]);

    if (isLoading) {
        return <Skeleton className={cn("w-full aspect-[4/3] rounded-lg", className)} />;
    }

    if (!imageUrl) {
        return (
             <div className={cn("w-full aspect-[4/3] rounded-lg bg-muted flex items-center justify-center", className)}>
                <div className="flex flex-col items-center gap-1 text-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">No image found</p>
                    <p className="text-xs text-muted-foreground/70 px-2">({query})</p>
                </div>
            </div>
        )
    }

    return (
        <Image
            src={imageUrl}
            alt={query}
            width={400}
            height={300}
            className={cn("rounded-lg aspect-[4/3] object-cover bg-muted", className)}
        />
    );
}
