// src/components/engagement-banner.tsx
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function EngagementBanner() {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className={cn(
                "glass-card flex items-center gap-4 p-4 rounded-xl shadow-lg transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-4",
                !isVisible && "animate-out fade-out-0 slide-out-to-bottom-4"
            )}>
                <Image
                    src="https://storage.googleapis.com/genkit-assets/hamza.jpeg"
                    alt="Hamza S"
                    width={64}
                    height={64}
                    className="rounded-full border-2 border-primary/50 object-cover"
                />
                <div className="flex-grow">
                    <h4 className="font-semibold font-headline text-lg text-white">A quick question from Hamza S.</h4>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        Tired of the content grind? Let's build your automated content engine, together. See how.
                    </p>
                </div>
                 <Button asChild variant="default" size="sm">
                    <Link href="/about">
                       My Method
                       <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setIsVisible(false)}>
                    <X className="h-5 w-5" />
                    <span className="sr-only">Dismiss</span>
                </Button>
            </div>
        </div>
    )
}
