
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, Loader2, Move } from 'lucide-react';
import { WpMediaItem } from '@/app/dashboard/advanced-media-library/actions';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ImageFormat = 'jpeg' | 'png' | 'webp';

interface ImageOptimizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: WpMediaItem | null;
  onSave: (data: { base64: string; size: number }) => void;
}

async function fetchImageAsBase64(imageUrl: string): Promise<string> {
    const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
    if (!response.ok) {
        throw new Error('Failed to proxy image');
    }
    const { base64 } = await response.json();
    return base64;
}

async function generateServerPreview(
    base64: string,
    format: 'png',
    quality: number
): Promise<{ base64: string; size: number }> {
    const response = await fetch('/api/optimize-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64, format, quality }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to optimize image on server' }));
        throw new Error(errorData.error);
    }

    return await response.json();
}

async function generateClientPreview(
    base64: string,
    format: 'jpeg' | 'webp',
    quality: number,
): Promise<{ base64: string, size: number }> {
    const image = new window.Image();
    image.src = base64;
    await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = (err) => reject(new Error('Image failed to load for preview. Check CORS policy.'));
    });

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    ctx.drawImage(image, 0, 0);
    
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    return reject(new Error('Canvas toBlob failed'));
                }
                const reader = new FileReader();
                reader.onloadend = () => {
                    const newBase64 = reader.result as string;
                    resolve({ base64: newBase64, size: blob.size });
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            },
            `image/${format}`,
            quality / 100
        );
    });
}


function formatBytes(bytes: number, decimals = 2) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export function ImageOptimizeDialog({
  open,
  onOpenChange,
  image,
  onSave,
}: ImageOptimizeDialogProps) {
  const [format, setFormat] = useState<ImageFormat>('jpeg');
  const [quality, setQuality] = useState(85);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<{ base64: string; size: number } | null>(null);
  const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [isPanning, setIsPanning] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const panStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  

  const handleGeneratePreview = useCallback(async () => {
    if (!originalImageBase64 || !image) return;
    setIsLoading(true);
    setPreview(null);
    try {
        let result;
        if (format === 'png') {
            result = await generateServerPreview(originalImageBase64, format, quality);
        } else {
            result = await generateClientPreview(originalImageBase64, format, quality);
        }
        setPreview(result);
    } catch(err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : "Could not generate image preview.";
        toast({ title: "Preview Error", description: errorMessage, variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  }, [image, format, quality, originalImageBase64, toast]);
  
  useEffect(() => {
    if (open && image) {
      setIsLoading(true);
      setOriginalImageBase64(null);
      setPreview(null);
      setFormat('jpeg');
      setQuality(85);
      setZoom(1);
      setPosition({x: 0, y: 0});

      fetchImageAsBase64(image.fullUrl)
        .then(base64 => {
            setOriginalImageBase64(base64);
        })
        .catch(err => {
            console.error(err);
            toast({ title: "Image Load Error", description: "Could not load the original image from your site.", variant: "destructive"});
            setIsLoading(false);
        });
    }
  }, [open, image, toast]);
  
  useEffect(() => {
    if (open && image && originalImageBase64) {
        const handler = setTimeout(() => {
            handleGeneratePreview();
        }, 500); 
        return () => clearTimeout(handler);
    }
  }, [quality, format, open, image, originalImageBase64, handleGeneratePreview]);

 const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsPanning(true);
    panStart.current = { 
        x: e.clientX, 
        y: e.clientY,
        posX: position.x,
        posY: position.y
    };
  };
  
  const handleMouseUp = () => setIsPanning(false);
  const handleMouseLeave = () => setIsPanning(false);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPosition({
      x: panStart.current.posX + dx,
      y: panStart.current.posY + dy,
    });
  };

  const handleSave = () => {
    if (preview) {
      onSave(preview);
      onOpenChange(false);
    }
  };
  
  const originalSize = useMemo(() => image ? image.filesize : 0, [image]);
  const sizeReduction = useMemo(() => {
      if (!originalSize || !preview?.size) return 0;
      if (originalSize === 0) return 0; 
      const reduction = ((originalSize - preview.size) / preview.size) * 100;
       if(image?.filename.endsWith('.png') && format === 'png' && reduction < 0){
          return 0;
      }
      return reduction;
  }, [originalSize, preview, image, format]);

  const isSaveDisabled = !preview || isLoading || (format === 'png' && image?.filename.endsWith('.png'));

  const imageTransform = {
      transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl h-[90vh] flex flex-col p-4">
        <DialogHeader>
          <DialogTitle>Optimize Image</DialogTitle>
          <DialogDescription>
            Adjust format and quality to reduce file size. Inspect the changes in the preview.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow min-h-0">
          <div className="md:col-span-2 grid grid-cols-2 gap-4 min-h-0">
            <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-center">Original ({formatBytes(originalSize)})</h3>
                <div 
                    className={cn(
                        "flex-grow bg-muted/50 rounded-md overflow-hidden relative",
                        isPanning ? "cursor-grabbing" : "cursor-grab"
                    )}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                >
                    {(!originalImageBase64 && isLoading) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p className="ml-2">Loading original...</p>
                        </div>
                    )}
                     {originalImageBase64 && image && (
                        <div className="absolute inset-0 flex items-center justify-center p-2">
                            <Image
                                src={originalImageBase64}
                                alt="Original"
                                width={image.width}
                                height={image.height}
                                className="transition-transform duration-100 ease-linear origin-center pointer-events-none max-w-full max-h-full object-contain"
                                style={imageTransform}
                            />
                        </div>
                    )}
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-center">
                    Preview ({preview ? formatBytes(preview.size) : '...'})
                </h3>
                <div 
                     className={cn(
                        "flex-grow bg-muted/50 rounded-md overflow-hidden relative",
                        isPanning ? "cursor-grabbing" : "cursor-grab"
                    )}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                >
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    )}
                    {preview && image && (
                        <div className="absolute inset-0 flex items-center justify-center p-2">
                            <Image
                                src={preview.base64}
                                alt="Preview"
                                width={image.width}
                                height={image.height}
                                className="transition-transform duration-100 ease-linear origin-center pointer-events-none max-w-full max-h-full object-contain"
                                style={imageTransform}
                            />
                        </div>
                    )}
                </div>
            </div>
          </div>
          
          <div className="md:col-span-1 flex flex-col gap-6">
            <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Move className="h-4 w-4" />
              Click and drag to pan images
            </div>
            <Card>
                <CardHeader><CardTitle>Optimization Controls</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Output Format</Label>
                        <Select value={format} onValueChange={(v) => setFormat(v as ImageFormat)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="jpeg">JPEG</SelectItem>
                                <SelectItem value="png">PNG</SelectItem>
                                <SelectItem value="webp">WebP</SelectItem>
                            </SelectContent>
                        </Select>
                         {format === 'png' && (
                             <Alert variant="warning" className="p-2 text-xs h-auto mt-2">
                                <AlertDescription className="ml-2">
                                    For PNGs, consider converting to WebP for better compression. In-browser PNG optimization is not supported.
                                </AlertDescription>
                            </Alert>
                         )}
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Quality</Label>
                            <span className="text-sm font-medium">{quality}%</span>
                        </div>
                        <Slider 
                            value={[quality]} 
                            onValueChange={([val]) => setQuality(val)}
                            min={0}
                            max={100}
                            step={1}
                            disabled={format === 'png'}
                        />
                         {quality < 80 && format !== 'png' && (
                            <Alert variant="warning" className="p-2 text-xs h-auto mt-2">
                                <div className="flex items-center">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription className="ml-2">
                                        Low quality may result in visual artifacts.
                                    </AlertDescription>
                                </div>
                            </Alert>
                        )}
                    </div>
                     <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Zoom</Label>
                            <span className="text-sm font-medium">{zoom.toFixed(1)}x</span>
                        </div>
                        <Slider 
                            value={[zoom]} 
                            onValueChange={([val]) => {
                                setZoom(val);
                                // Optional: Reset pan on zoom for simplicity
                                setPosition({x: 0, y: 0});
                            }}
                            min={1}
                            max={5}
                            step={0.1}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Results</CardTitle></CardHeader>
                <CardContent>
                    {preview ? (
                        <div className="text-center">
                            <p className={cn("text-4xl font-bold", sizeReduction >= 0 ? 'text-green-500' : 'text-red-500')}>
                                {sizeReduction > 0 ? `-${sizeReduction.toFixed(1)}%` : '0%'}
                            </p>
                            <p className="text-muted-foreground">reduction in file size</p>
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground">Adjust quality to see size reduction.</p>
                    )}
                </CardContent>
            </Card>
            
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaveDisabled}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Optimized Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
