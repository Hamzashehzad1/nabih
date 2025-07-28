
// src/app/dashboard/visual-feedback/page.tsx
"use client";

import { useState, useRef, MouseEvent, useEffect } from 'react';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, MessageSquare, X, Send, Pin, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Comment {
    id: string;
    x: number; // percentage
    y: number; // percentage
    text: string;
    user: { name: string; avatar?: string };
    timestamp: string;
}

interface FeedbackImage {
    id: string;
    name: string;
    url: string; // data URL
    comments: Comment[];
}

export default function VisualFeedbackPage() {
    const { toast } = useToast();
    const [images, setImages] = useLocalStorage<FeedbackImage[]>("visual-feedback-images", []);
    const [activeImageId, setActiveImageId] = useLocalStorage<string | null>("visual-feedback-active-image", null);
    
    const [pendingComment, setPendingComment] = useState<{ x: number; y: number; text: string } | null>(null);
    const [newCommentText, setNewCommentText] = useState("");

    const imageContainerRef = useRef<HTMLDivElement>(null);
    const activeImage = images.find(img => img.id === activeImageId);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const newImage: FeedbackImage = {
                id: Date.now().toString(),
                name: file.name,
                url: e.target?.result as string,
                comments: [],
            };
            const newImages = [...images, newImage];
            setImages(newImages);
            setActiveImageId(newImage.id);
        };
        reader.readAsDataURL(file);
    };

    const handleImageClick = (e: MouseEvent<HTMLDivElement>) => {
        if (!imageContainerRef.current) return;
        
        // Prevent placing a new pin if a comment is already being written
        if (pendingComment) {
            toast({ title: "Finish your current comment first.", variant: "default" });
            return;
        }

        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        setPendingComment({ x, y, text: '' });
        setNewCommentText("");
    };

    const handlePostComment = () => {
        if (!pendingComment || !activeImageId || !newCommentText.trim()) return;

        const newComment: Comment = {
            id: Date.now().toString(),
            x: pendingComment.x,
            y: pendingComment.y,
            text: newCommentText,
            user: { name: "Designer" }, // Mock user for now
            timestamp: new Date().toISOString(),
        };

        const updatedImages = images.map(img => 
            img.id === activeImageId 
                ? { ...img, comments: [...img.comments, newComment] }
                : img
        );

        setImages(updatedImages);
        setPendingComment(null);
        setNewCommentText("");
    };
    
    const cancelNewComment = () => {
        setPendingComment(null);
        setNewCommentText("");
    }
    
    const deleteImage = (id: string) => {
        setImages(prev => prev.filter(img => img.id !== id));
        if (activeImageId === id) {
            setActiveImageId(null);
        }
        toast({ title: "Project Deleted" });
    }

    const renderCommentPin = (comment: Comment | { x: number; y: number }, index: number) => {
        const isPending = 'text' in comment && !('id' in comment);
        
        return (
            <div
                key={isPending ? 'pending' : (comment as Comment).id}
                className="absolute"
                style={{ left: `${comment.x}%`, top: `${comment.y}%`, transform: 'translate(-50%, -50%)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={cn(
                    "w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm ring-4 ring-background cursor-pointer transition-transform hover:scale-110",
                    isPending && "animate-pulse"
                )}>
                    {isPending ? <Pin className="h-4 w-4"/> : index + 1}
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-8rem)]">
            {/* Left Panel: Image list */}
            <Card className="lg:col-span-1 flex flex-col">
                <CardHeader>
                    <CardTitle>Feedback Projects</CardTitle>
                    <CardDescription>Upload or select a project to review.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <ScrollArea className="h-full">
                        <div className="space-y-2 pr-4">
                            {images.map(img => (
                                <div 
                                    key={img.id}
                                    onClick={() => { setActiveImageId(img.id); setPendingComment(null); }}
                                    className={cn(
                                        "p-2 rounded-lg cursor-pointer border-2 group flex justify-between items-center",
                                        activeImageId === img.id ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"
                                    )}
                                >
                                    <div>
                                        <p className="font-semibold truncate">{img.name}</p>
                                        <p className="text-sm text-muted-foreground">{img.comments.length} comments</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={(e) => {e.stopPropagation(); deleteImage(img.id)}}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter>
                     <Input id="image-upload" type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                     <Button asChild className="w-full">
                        <label htmlFor="image-upload">
                            <UploadCloud className="mr-2" /> Upload Image
                        </label>
                     </Button>
                </CardFooter>
            </Card>

            {/* Middle Panel: Image Viewer */}
            <div className="lg:col-span-2 bg-muted/50 rounded-lg flex items-center justify-center relative overflow-hidden">
                {activeImage ? (
                    <div 
                        ref={imageContainerRef}
                        className="relative w-full h-full cursor-crosshair"
                        onClick={handleImageClick}
                    >
                        <Image src={activeImage.url} alt={activeImage.name} layout="fill" objectFit="contain" />
                        {activeImage.comments.map((comment, index) => renderCommentPin(comment, index))}
                        {pendingComment && renderCommentPin(pendingComment, activeImage.comments.length)}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground p-4">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold">No project selected</h3>
                        <p>Upload or select a project from the left panel to start leaving feedback.</p>
                    </div>
                )}
            </div>

            {/* Right Panel: Comments List */}
            <Card className="lg:col-span-1 flex flex-col">
                <CardHeader>
                    <CardTitle>Comments</CardTitle>
                    <CardDescription>{activeImage ? activeImage.name : "No active project"}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                     <ScrollArea className="h-full">
                        <div className="space-y-4 pr-4">
                            {!activeImage && (
                                 <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <p>Select a project to see comments.</p>
                                 </div>
                            )}
                            {activeImage && activeImage.comments.length === 0 && !pendingComment && (
                                <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
                                    <p>No comments yet. Click the image to add one.</p>
                                </div>
                            )}
                            {activeImage?.comments.map((comment, index) => (
                                <div key={comment.id} className="flex gap-3">
                                     <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm mt-1">
                                        {index + 1}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-sm">{comment.user.name}</p>
                                        </div>
                                        <div className="p-2 bg-muted rounded-lg mt-1 text-sm">
                                            {comment.text}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {pendingComment && (
                                <div className="p-4 bg-primary/10 rounded-lg">
                                    <div className="flex gap-3">
                                         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm mt-1">
                                            <Pin className="h-4 w-4"/>
                                        </div>
                                        <div className="flex-grow">
                                             <p className="font-semibold text-sm">New Comment</p>
                                             <Textarea 
                                                placeholder="Leave your feedback..."
                                                value={newCommentText}
                                                onChange={(e) => setNewCommentText(e.target.value)}
                                                rows={3}
                                                className="mt-1"
                                                autoFocus
                                            />
                                            <div className="flex justify-end gap-2 mt-2">
                                                <Button variant="ghost" size="sm" onClick={cancelNewComment}>
                                                    Cancel
                                                </Button>
                                                <Button size="sm" onClick={handlePostComment} disabled={!newCommentText.trim()}>
                                                    <Send className="h-4 w-4 mr-2"/> Post
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                     </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
