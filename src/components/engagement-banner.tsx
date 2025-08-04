
// src/components/engagement-banner.tsx
"use client";

import { useState, useEffect } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { getAuth, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { app } from "@/lib/firebase";

const STORAGE_KEY = 'engagement-banner-views';

interface BannerViews {
    date: string;
    count: number;
}

export function EngagementBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [user, setUser] = useState<FirebaseUser | null>(null);

    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (user === null) { // Only show for logged-out users
            try {
                const storedViews = localStorage.getItem(STORAGE_KEY);
                const today = new Date().toISOString().split('T')[0];
                
                if (storedViews) {
                    const data: BannerViews = JSON.parse(storedViews);
                    if (data.date === today) {
                        if (data.count < 2) {
                            setIsVisible(true);
                        }
                    } else {
                        // Different day, reset
                        localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
                        setIsVisible(true);
                    }
                } else {
                    // First time seeing it
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
                    setIsVisible(true);
                }
            } catch (error) {
                console.error("Could not access localStorage for banner.", error);
                // Fallback for environments where localStorage is not available
                setIsVisible(true);
            }
        } else {
            // User is logged in, hide banner
            setIsVisible(false);
        }
    }, [user]);

    const handleDismiss = () => {
        setIsVisible(false);
        try {
            const storedViews = localStorage.getItem(STORAGE_KEY);
            const today = new Date().toISOString().split('T')[0];
             if (storedViews) {
                const data: BannerViews = JSON.parse(storedViews);
                if (data.date === today) {
                    data.count += 1;
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                } else {
                     localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 1 }));
                }
            } else {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 1 }));
            }
        } catch(error) {
             console.error("Could not access localStorage for banner.", error);
        }
    };


    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className={cn(
                "glass-card flex items-center gap-4 p-4 rounded-xl shadow-lg transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-4",
                !isVisible && "animate-out fade-out-0 slide-out-to-bottom-4"
            )}>
                <div className="flex-grow">
                    <h4 className="font-semibold font-headline text-lg text-white">Still using 17 tabs for one project?</h4>
                    <p className="text-sm text-muted-foreground max-w-sm">
                       I got tired of juggling 17 apps per project, so I built this. It's the all-in-one AI toolkit for web pros who prefer building empires to managing chaos.
                    </p>
                </div>
                 <Button asChild variant="default" size="sm">
                    <Link href="/#features">
                       See the All-in-One
                       <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0" onClick={handleDismiss}>
                    <X className="h-5 w-5" />
                    <span className="sr-only">Dismiss</span>
                </Button>
            </div>
        </div>
    )
}
