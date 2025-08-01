// src/app/dashboard/visual-feedback/page.tsx
"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Trash2, Globe, Clipboard, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type CommentStatus = 'open' | 'in-progress' | 'resolved' | 'rejected';

interface TeamMember {
    id: string;
    name: string;
    avatar?: string;
}

interface Reply {
    id: string;
    user: TeamMember;
    text: string;
    timestamp: string;
}

interface Comment {
    id: string;
    text: string;
    user: TeamMember;
    timestamp: string;
    status: CommentStatus;
    assignedTo?: TeamMember;
    replies?: Reply[];
    elementPath: string; // CSS selector for the element
    url: string;
}

interface WpSite {
  id: string;
  url: string;
  user: string;
  appPassword?: string;
}

const CURRENT_USER: TeamMember = { id: '1', name: 'User' };

export default function VisualFeedbackPage() {
    const { toast } = useToast();
    const [sites] = useLocalStorage<WpSite[]>("wp-sites", []);
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    const [comments, setComments] = useLocalStorage<Comment[]>("visual-feedback-comments", []);

    const selectedSite = useMemo(() => sites.find(s => s.id === selectedSiteId), [sites, selectedSiteId]);

    const handleMessage = useCallback((event: MessageEvent) => {
        if (typeof event.data !== 'object' || !event.data.type) {
            return;
        }

        const { type, payload } = event.data;

        if (type === 'new-feedback-comment' && selectedSiteId) {
            const newComment: Comment = {
                id: Date.now().toString(),
                text: payload.comment,
                elementPath: payload.path,
                url: payload.url,
                user: CURRENT_USER, 
                timestamp: new Date().toISOString(),
                status: 'open',
                replies: [],
            };

            setComments(prev => [...prev, newComment]);
            toast({ title: "New Feedback Received!", description: `From: ${payload.url}`});
        }
    }, [setComments, toast, selectedSiteId]);

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [handleMessage]);

    const filteredComments = useMemo(() => {
        if (!selectedSite) return [];
        try {
            const siteOrigin = new URL(selectedSite.url).origin;
            return comments.filter(c => {
                try {
                    return new URL(c.url).origin === siteOrigin;
                } catch (e) {
                    return false;
                }
            });
        } catch (e) {
            return [];
        }
    }, [comments, selectedSite]);


    const updateCommentStatus = (commentId: string, status: CommentStatus) => {
        setComments(prev => prev.map(c => c.id === commentId ? {...c, status } : c));
    };

    const deleteComment = (commentId: string) => {
        setComments(prev => prev.filter(c => c.id !== commentId));
        toast({ title: "Comment Deleted" });
    };

    const embedScriptTag = useMemo(() => {
        if (typeof window === 'undefined') return '';
        const scriptUrl = `${window.location.origin}/visual-feedback.js`;
        // Note: The data-project-id is a placeholder for future multi-project functionality
        return `<script id="content-forge-feedback-tool" data-project-id="YOUR_PROJECT_ID" src="${scriptUrl}" defer></script>`;
    }, []);

    const phpSnippet = useMemo(() => {
        return `
// Add Content Forge Visual Feedback Tool
add_action('wp_footer', function() {
    echo '${embedScriptTag.replace(/'/g, "\\'") }';
});
`.trim();
    }, [embedScriptTag]);

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        toast({
          title: "Copied to clipboard!",
          description: `The ${type} has been copied.`
        });
    };

    const renderInstallation = () => (
        <Card>
            <CardHeader>
                <CardTitle>Installation Instructions</CardTitle>
                <CardDescription>Add the following PHP snippet to your theme's `functions.php` file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>How to Install</AlertTitle>
                    <AlertDescription>
                        Copy this PHP code and paste it at the end of the `functions.php` file of your active WordPress theme. This will securely add the feedback tool script to every page of the site.
                    </AlertDescription>
                </Alert>
                 <div className="relative bg-black text-white p-4 rounded-md font-mono text-sm">
                    <pre><code>{phpSnippet}</code></pre>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-white hover:bg-gray-700"
                        onClick={() => copyToClipboard(phpSnippet, "PHP snippet")}
                    >
                        <Clipboard className="h-4 w-4"/>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    const renderFeedbackList = () => (
         <Card>
            <CardHeader>
                <CardTitle>Feedback Inbox</CardTitle>
                <CardDescription>
                    {selectedSite ? `Showing comments for ${new URL(selectedSite.url).hostname}` : 'Select a site to view comments.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                    {filteredComments.length === 0 ? (
                        <div className="text-center text-muted-foreground p-8">
                            <MessageSquare className="h-12 w-12 mx-auto" />
                            <p className="mt-4">No feedback yet for this site.</p>
                            <p className="text-sm">Install the script on the website to begin receiving comments.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredComments.map(comment => (
                                <Card key={comment.id} className="p-4 bg-muted/50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="font-semibold">{comment.user.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    On <a href={comment.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">{comment.url.substring(new URL(selectedSite!.url).origin.length) || "/"}</a> about <code className="text-xs bg-muted p-1 rounded-sm">{comment.elementPath}</code>
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteComment(comment.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                    <p className="my-3 text-sm">{comment.text}</p>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</p>
                                        <div className="flex items-center gap-2">
                                             <Select value={comment.status} onValueChange={(val) => updateCommentStatus(comment.id, val as CommentStatus)}>
                                                <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="open">Open</SelectItem>
                                                    <SelectItem value="in-progress">In Progress</SelectItem>
                                                    <SelectItem value="resolved">Resolved</SelectItem>
                                                    <SelectItem value="rejected">Rejected</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-8">
             <div>
                <h1 className="text-3xl font-headline font-bold">Live Visual Feedback</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Give your clients a magic button to leave feedback directly on their website. No more messy screenshots or confusing emails.
                </p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Select a Site</CardTitle>
                    <CardDescription>Choose the website you want to view feedback for.</CardDescription>
                </CardHeader>
                <CardContent>
                     {sites.length === 0 ? (
                        <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
                            <Globe className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-semibold">Connect a Site to Begin</h3>
                            <p className="mt-1 text-sm">Go to settings to connect your WordPress site.</p>
                            <Button asChild size="sm" className="mt-4">
                                <Link href="/dashboard/settings">Go to Settings</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sites.map(site => (
                                <Card 
                                    key={site.id} 
                                    onClick={() => setSelectedSiteId(site.id)}
                                    className={cn("cursor-pointer hover:border-primary transition-colors", selectedSiteId === site.id && "border-primary ring-2 ring-primary")}
                                >
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Globe className="h-5 w-5 text-primary" />
                                            {new URL(site.url).hostname}
                                        </CardTitle>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedSiteId && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {renderFeedbackList()}
                    {renderInstallation()}
                </div>
            )}
        </div>
    );
}
