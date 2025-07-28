
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Skeleton } from './ui/skeleton';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface ApiKeys {
    gemini: string;
    pexels: string;
    unsplash: string;
}

export function PexelsImage({ query }: { query: string }) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [apiKeys] = useLocalStorage<ApiKeys>('api-keys', { gemini: '', pexels: '', unsplash: '' });

    useEffect(() => {
        if (!query || !apiKeys.pexels) {
            setIsLoading(false);
            return;
        };

        const fetchImage = async () => {
            setIsLoading(true);
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
                    setImageUrl(data.photos[0].src.medium);
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
        return <Skeleton className="w-full aspect-[4/3] rounded-lg" />;
    }

    if (!imageUrl) {
        return (
             <div className="w-full aspect-[4/3] rounded-lg bg-muted flex items-center justify-center">
                <p className="text-xs text-muted-foreground text-center">No image found or API key missing</p>
            </div>
        )
    }

    return (
        <Image
            src={imageUrl}
            alt={query}
            width={400}
            height={300}
            className="rounded-lg aspect-[4/3] object-cover bg-muted"
        />
    );
}
