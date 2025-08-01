// src/app/dashboard/visual-feedback/page.tsx
"use client";

import { useState, useRef, MouseEvent, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, MessageSquare, X, Send, Pin, Trash2, Globe, Code, Clipboard, AlertTriangle } from 'lucide-react';
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

const MOCK_TEAM: TeamMember[] = [
    { id: '1', name: 'Alex Johnson', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026707d'},
    { id: '2', name: 'Maria Garcia', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026708d'},
    { id: '3', name: 'Chen Wei', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026709d'},
]
const CURRENT_USER = MOCK_TEAM[0];


export default function VisualFeedbackPage() {
    const { toast } = useToast();
    const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    const [comments, setComments] = useLocalStorage<Comment[]>("visual-feedback-comments", []);

    const selectedSite = useMemo(() => sites.find(s => s.id === selectedSiteId), [sites, selectedSiteId]);

    const handleMessage = useCallback((event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
            // In a real app, you would check against the connected site's origin
            // For this demo, we can be more lenient or specific
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
        const siteOrigin = new URL(selectedSite.url).origin;
        return comments.filter(c => c.url.startsWith(siteOrigin));
    }, [comments, selectedSite]);


    const updateComment = (commentId: string, updates: Partial<Pick<Comment, 'status' | 'assignedTo'>>) => {
        setComments(prev => prev.map(c => c.id === commentId ? {...c, ...updates} : c));
    };

    const deleteComment = (commentId: string) => {
        setComments(prev => prev.filter(c => c.id !== commentId));
        toast({ title: "Comment Deleted" });
    };

    const embedCode = useMemo(() => {
        if (typeof window === 'undefined') return '';
        const scriptUrl = `${window.location.origin}/visual-feedback.js`;
        return `<script
  id="content-forge-feedback-tool"
  data-project-id="YOUR_PROJECT_ID"
  src="${scriptUrl}"
  defer
></script>`;
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
          title: "Copied to clipboard!",
        });
    };

    const renderInstallation = () => (
        <Card>
            <CardHeader>
                <CardTitle>Installation</CardTitle>
                <CardDescription>Add this script to your website's footer to enable the feedback tool.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>For Developers</AlertTitle>
                    <AlertDescription>
                        This tool works by injecting a script into the client's website. Add the following snippet before the closing `&lt;/body&gt;` tag.
                    </AlertDescription>
                </Alert>
                 <div className="relative bg-black text-white p-4 rounded-md font-mono text-sm">
                    <pre><code>{embedCode}</code></pre>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-white hover:bg-gray-700"
                        onClick={() => copyToClipboard(embedCode)}
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
                <CardTitle>Feedback for {selectedSite?.url}</CardTitle>
                <CardDescription>Comments submitted from your live website appear here.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                    {filteredComments.length === 0 ? (
                        <div className="text-center text-muted-foreground p-8">
                            <MessageSquare className="h-12 w-12 mx-auto" />
                            <p className="mt-4">No feedback yet for this site.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredComments.map(comment => (
                                <Card key={comment.id} className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10"><AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback></Avatar>
                                            <div>
                                                <p className="font-semibold">{comment.user.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    On <a href={comment.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">{comment.url.substring(selectedSite!.url.length) || "/"}</a> about <code className="text-xs bg-muted p-1 rounded-sm">{comment.elementPath}</code>
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
                                             <Select value={comment.status} onValueChange={(val) => updateComment(comment.id, { status: val as CommentStatus })}>
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