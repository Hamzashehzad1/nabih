// src/app/dashboard/visual-feedback/page.tsx
"use client";

import { useState, useRef, MouseEvent, useEffect, useCallback } from 'react';
import Image from 'next/image';
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
import { UploadCloud, MessageSquare, X, Send, Pin, Trash2, ZoomIn, ZoomOut, Move, Pencil, Undo, Palette, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type CommentStatus = 'open' | 'in-progress' | 'resolved';
type AnnotationTool = 'comment' | 'draw';

interface Comment {
    id: string;
    x: number; // percentage
    y: number; // percentage
    text: string;
    user: { name: string; avatar?: string };
    timestamp: string;
    status: CommentStatus;
}

interface DrawingAction {
    id: string;
    color: string;
    points: { x: number; y: number }[];
}

interface FeedbackImage {
    id: string;
    name: string;
    url: string; // data URL
    comments: Comment[];
    drawings?: DrawingAction[];
}

const DRAW_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#A855F7', '#EC4899'];

export default function VisualFeedbackPage() {
    const { toast } = useToast();
    const [images, setImages] = useLocalStorage<FeedbackImage[]>("visual-feedback-images", []);
    const [activeImageId, setActiveImageId] = useLocalStorage<string | null>("visual-feedback-active-image", null);
    
    const [pendingComment, setPendingComment] = useState<{ x: number; y: number; text: string } | null>(null);
    const [newCommentText, setNewCommentText] = useState("");
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

    const imageContainerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const activeImage = images.find(img => img.id === activeImageId);

    // Tool & Annotation State
    const [activeTool, setActiveTool] = useState<AnnotationTool>('comment');
    const [drawColor, setDrawColor] = useState(DRAW_COLORS[0]);
    const [isDrawing, setIsDrawing] = useState(false);

    // Zoom & Pan State
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !activeImage) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        activeImage.drawings?.forEach(drawing => {
            ctx.strokeStyle = drawing.color;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            drawing.points.forEach((point, index) => {
                if (index === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            ctx.stroke();
        });
    }, [activeImage]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        const imageEl = imageContainerRef.current?.querySelector('img');
        if(canvas && imageEl) {
            canvas.width = imageEl.offsetWidth;
            canvas.height = imageEl.offsetHeight;
            redrawCanvas();
        }
    }, [activeImage, redrawCanvas]);


    useEffect(() => {
        // Reset zoom and pan when active image changes
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    }, [activeImageId]);

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
                drawings: [],
            };
            const newImages = [...images, newImage];
            setImages(newImages);
            setActiveImageId(newImage.id);
        };
        reader.readAsDataURL(file);
    };

    const getRelativeCoords = (e: MouseEvent<HTMLDivElement>) => {
        if (!imageContainerRef.current) return null;
        
        const rect = imageContainerRef.current.getBoundingClientRect();
        const containerX = e.clientX - rect.left;
        const containerY = e.clientY - rect.top;

        // Adjust coordinates based on pan and zoom
        const imageX = (containerX - position.x) / zoom;
        const imageY = (containerY - position.y) / zoom;
        
        const imageDimensions = imageContainerRef.current.querySelector('img');
        if (!imageDimensions) return null;
        
        const xPercent = (imageX / imageDimensions.offsetWidth) * 100;
        const yPercent = (imageY / imageDimensions.offsetHeight) * 100;

        return { x: imageX, y: imageY, xPercent, yPercent };
    }

    const handleImageClick = (e: MouseEvent<HTMLDivElement>) => {
        if (isPanning || activeTool !== 'comment') return;
        
        if (openPopoverId || pendingComment) return;

        const coords = getRelativeCoords(e);
        if(!coords) return;

        if (coords.xPercent < 0 || coords.xPercent > 100 || coords.yPercent < 0 || coords.yPercent > 100) return;

        setPendingComment({ x: coords.xPercent, y: coords.yPercent, text: '' });
        setNewCommentText("");
    };
    
    const handleCanvasMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        if (activeTool !== 'draw' || isPanning) return;
        
        setIsDrawing(true);
        const pos = getRelativeCoords(e as any);
        if (!pos) return;
        
        const newDrawing: DrawingAction = {
            id: Date.now().toString(),
            color: drawColor,
            points: [{ x: pos.x, y: pos.y }]
        };

        const updatedImages = images.map(img => 
            img.id === activeImageId 
                ? { ...img, drawings: [...(img.drawings || []), newDrawing] }
                : img
        );
        setImages(updatedImages);
    }

    const handleCanvasMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || activeTool !== 'draw' || isPanning) return;

        const pos = getRelativeCoords(e as any);
        if (!pos) return;

        const updatedImages = images.map(img => {
            if (img.id === activeImageId) {
                const lastDrawing = img.drawings?.[img.drawings.length - 1];
                if (lastDrawing) {
                    lastDrawing.points.push({ x: pos.x, y: pos.y });
                }
                return { ...img };
            }
            return img;
        });

        setImages(updatedImages);
        redrawCanvas();
    }
    
    const handleCanvasMouseUp = () => {
        setIsDrawing(false);
    }


    const handlePostComment = () => {
        if (!pendingComment || !activeImageId || !newCommentText.trim()) return;

        const newComment: Comment = {
            id: Date.now().toString(),
            x: pendingComment.x,
            y: pendingComment.y,
            text: newCommentText,
            user: { name: "Designer" },
            timestamp: new Date().toISOString(),
            status: 'open',
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

    const deleteImage = (id: string) => {
        setImages(prev => prev.filter(img => img.id !== id));
        if (activeImageId === id) {
            setActiveImageId(null);
        }
        toast({ title: "Project Deleted" });
    };

    const deleteComment = (commentId: string) => {
        if (!activeImageId) return;
        const updatedImages = images.map(img =>
            img.id === activeImageId
                ? { ...img, comments: img.comments.filter(c => c.id !== commentId) }
                : img
        );
        setImages(updatedImages);
        toast({ title: "Comment Deleted" });
    };

    const updateCommentStatus = (commentId: string, status: CommentStatus) => {
        if (!activeImageId) return;
        const updatedImages = images.map(img => 
            img.id === activeImageId
            ? { ...img, comments: img.comments.map(c => c.id === commentId ? {...c, status} : c) }
            : img
        );
        setImages(updatedImages);
        setOpenPopoverId(null);
    };

    const handlePanMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0 || activeTool === 'draw') return;
        e.preventDefault();
        setIsPanning(true);
        panStart.current = { 
            x: e.clientX, 
            y: e.clientY,
            posX: position.x,
            posY: position.y
        };
    };
    
    const handlePanMouseUp = (e: MouseEvent<HTMLDivElement>) => {
        setTimeout(() => setIsPanning(false), 50);
    };
    
    const handlePanMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!isPanning || activeTool === 'draw') return;
        e.preventDefault();
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        setPosition({
          x: panStart.current.posX + dx,
          y: panStart.current.posY + dy,
        });
    };
    
    const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const newZoom = e.deltaY > 0 ? zoom / zoomFactor : zoom * zoomFactor;
        setZoom(Math.max(0.2, Math.min(newZoom, 5)));
    };

    const undoLastDrawing = () => {
        if (!activeImageId) return;
        const updatedImages = images.map(img => {
            if (img.id === activeImageId && img.drawings?.length) {
                return { ...img, drawings: img.drawings.slice(0, -1) };
            }
            return img;
        });
        setImages(updatedImages);
        // We need to wait for state to update before redrawing
        setTimeout(redrawCanvas, 0);
    };

    const clearAllDrawings = () => {
         if (!activeImageId) return;
        const updatedImages = images.map(img =>
            img.id === activeImageId ? { ...img, drawings: [] } : img
        );
        setImages(updatedImages);
        setTimeout(redrawCanvas, 0);
    }
    
    const renderCommentPin = (comment: Omit<Comment, 'text'|'user'|'timestamp'|'status'> | {x: number; y: number}, index: number, isPending = false) => {
        const statusColor = !isPending ? {
            open: 'bg-red-500',
            'in-progress': 'bg-yellow-500',
            resolved: 'bg-green-500',
        }[ (comment as Comment).status] : 'bg-primary';

        return (
            <div
                className="absolute"
                style={{ left: `${comment.x}%`, top: `${comment.y}%` }}
                onClick={(e) => {e.stopPropagation()}}
            >
                <Popover open={isPending || openPopoverId === (comment as Comment).id} onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setOpenPopoverId(null);
                        if (isPending) setPendingComment(null);
                    }
                }}>
                    <PopoverTrigger asChild>
                        <div
                            className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm ring-4 ring-background cursor-pointer transition-transform hover:scale-110 -translate-x-1/2 -translate-y-1/2",
                                statusColor
                            )}
                            onClick={() => !isPending && setOpenPopoverId((comment as Comment).id)}
                        >
                            {isPending ? <Pin className="h-4 w-4"/> : index + 1}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="start" side="right" onOpenAutoFocus={(e) => e.preventDefault()}>
                        {isPending ? (
                            <div className="space-y-4">
                                <h4 className="font-medium leading-none">New Comment</h4>
                                <Textarea 
                                    placeholder="Leave your feedback..."
                                    value={newCommentText}
                                    onChange={(e) => setNewCommentText(e.target.value)}
                                    rows={4}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setPendingComment(null)}>Cancel</Button>
                                    <Button size="sm" onClick={handlePostComment} disabled={!newCommentText.trim()}>
                                        <Send className="h-4 w-4 mr-2"/> Post
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                     <Avatar className="h-8 w-8">
                                        <AvatarFallback>{(comment as Comment).user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">{(comment as Comment).user.name}</p>
                                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date((comment as Comment).timestamp), { addSuffix: true })}</p>
                                    </div>
                                </div>
                                <p className="text-sm">{(comment as Comment).text}</p>
                                 <div className="flex items-center gap-2 pt-2 border-t">
                                    <Select value={(comment as Comment).status} onValueChange={(status) => updateCommentStatus((comment as Comment).id, status as CommentStatus)}>
                                        <SelectTrigger className="flex-grow h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="in-progress">In Progress</SelectItem>
                                            <SelectItem value="resolved">Resolved</SelectItem>
                                        </SelectContent>
                                    </Select>
                                     <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => deleteComment((comment as Comment).id)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                 </div>
                            </div>
                        )}
                    </PopoverContent>
                </Popover>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8 h-[calc(100vh-8rem)]">
            <Card className="lg:col-span-1 flex flex-col">
                <CardHeader>
                    <CardTitle>Feedback Projects</CardTitle>
                    <CardDescription>Upload or select a project to review.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="space-y-2 pr-4">
                             {images.length === 0 && (
                                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                    <UploadCloud className="mx-auto h-12 w-12" />
                                    <h3 className="mt-4 font-semibold">No Projects Yet</h3>
                                    <p className="text-sm">Upload an image to start leaving feedback.</p>
                                </div>
                            )}
                            {images.map(img => (
                                <div 
                                    key={img.id}
                                    onClick={() => { setActiveImageId(img.id); setPendingComment(null); }}
                                    className={cn(
                                        "p-3 rounded-lg cursor-pointer border-2 group flex justify-between items-center",
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

            <Card className="lg:col-span-1 flex flex-col relative overflow-hidden">
                {activeImage && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-background p-1.5 rounded-lg shadow-md border flex items-center gap-1">
                       <Button variant={activeTool === 'comment' ? 'secondary' : 'ghost'} size="icon" onClick={() => setActiveTool('comment')} aria-label="Comment Tool">
                           <Pin className="h-5 w-5" />
                       </Button>
                       <Button variant={activeTool === 'draw' ? 'secondary' : 'ghost'} size="icon" onClick={() => setActiveTool('draw')} aria-label="Draw Tool">
                           <Pencil className="h-5 w-5" />
                       </Button>
                       <div className="w-px h-6 bg-border mx-1" />
                        {DRAW_COLORS.map(color => (
                            <button 
                                key={color}
                                onClick={() => setDrawColor(color)}
                                className={cn(
                                    "h-7 w-7 rounded-md transition-transform",
                                    activeTool === 'draw' && drawColor === color && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                                    activeTool !== 'draw' && "opacity-50 cursor-not-allowed"
                                )}
                                style={{backgroundColor: color}}
                                disabled={activeTool !== 'draw'}
                            />
                        ))}
                       <div className="w-px h-6 bg-border mx-1" />
                        <Button variant="ghost" size="icon" onClick={undoLastDrawing} disabled={!activeImage.drawings?.length} aria-label="Undo">
                           <Undo className="h-5 w-5" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={clearAllDrawings} disabled={!activeImage.drawings?.length} aria-label="Clear Drawings">
                           <Eraser className="h-5 w-5" />
                       </Button>
                    </div>
                )}
                 <CardHeader className="flex-row items-center justify-between z-0">
                     <div>
                        <CardTitle>Feedback Canvas</CardTitle>
                        <CardDescription>{activeImage ? activeImage.name : "Select a project"}</CardDescription>
                    </div>
                    {activeImage && (
                        <div className="flex items-center gap-2">
                             <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.2, z-0.2))}><ZoomOut /></Button>
                             <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(5, z+0.2))}><ZoomIn/></Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent 
                    className="flex-grow bg-muted/50 flex items-center justify-center p-0 relative overflow-hidden"
                    onWheel={handleWheelZoom}
                >
                    {activeImage ? (
                        <div 
                            ref={imageContainerRef}
                            className={cn(
                                "relative w-full h-full", 
                                activeTool === 'comment' ? 'cursor-copy' : 'cursor-default',
                                isPanning ? 'cursor-grabbing' : 'cursor-grab'
                            )}
                            onClick={handleImageClick}
                            onMouseDown={handlePanMouseDown}
                            onMouseMove={handlePanMouseMove}
                            onMouseUp={handlePanMouseUp}
                            onMouseLeave={handlePanMouseUp}
                        >
                            <div 
                                className="relative transition-transform"
                                style={{
                                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                                    width: '100%',
                                    height: '100%',
                                    transformOrigin: 'top left'
                                }}
                            >
                                <Image src={activeImage.url} alt={activeImage.name} layout="fill" objectFit="contain" className="pointer-events-none" />
                                 <canvas 
                                    ref={canvasRef} 
                                    className="absolute top-0 left-0 pointer-events-auto" 
                                    style={{
                                        cursor: activeTool === 'draw' ? 'crosshair' : 'default',
                                        pointerEvents: activeTool === 'draw' ? 'auto' : 'none'
                                    }}
                                    onMouseDown={handleCanvasMouseDown}
                                    onMouseMove={handleCanvasMouseMove}
                                    onMouseUp={handleCanvasMouseUp}
                                    onMouseLeave={handleCanvasMouseUp}
                                />
                                {activeImage.comments.map((comment, index) => renderCommentPin(comment, index))}
                                {pendingComment && renderCommentPin(pendingComment, activeImage.comments.length, true)}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground p-4">
                            <MessageSquare className="h-16 w-16 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">No project selected</h3>
                            <p>Select a project from the left panel to start leaving feedback.</p>
                        </div>
                    )}
                </CardContent>
                 <CardFooter className="justify-center z-0">
                    <p className="text-xs text-muted-foreground flex items-center gap-2"><Move className="h-4 w-4" /> Click and drag to pan. Use mouse wheel to zoom.</p>
                </CardFooter>
            </Card>
        </div>
    );
}
