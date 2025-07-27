
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';
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

async function generatePreview(
    base64: string,
    format: ImageFormat,
    quality: number,
): Promise<{ base64: string; size: number }> {
    const response = await fetch('/api/optimize-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64, format, quality }),
    });

    if (!response.ok) {
        throw new Error('Failed to optimize image');
    }

    return await response.json();
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
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<{ base64: string; size: number } | null>(null);
  const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGeneratePreview = useCallback(async () => {
    if (!originalImageBase64 || !image) return;
    setIsLoading(true);
    try {
        const result = await generatePreview(originalImageBase64, format, quality);
        setPreview(result);
    } catch(err) {
        console.error(err);
        toast({ title: "Preview Error", description: "Could not generate image preview.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  }, [image, format, quality, originalImageBase64, toast]);
  
  useEffect(() => {
    if (open && image) {
      setIsLoading(true);
      setOriginalImageBase64(null);
      setPreview(null);
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
  
  // Re-generate preview when quality or format changes, or when the original image is loaded
  useEffect(() => {
    if (open && image && originalImageBase64) {
        const handler = setTimeout(() => {
            handleGeneratePreview();
        }, 500); // Debounce to avoid excessive re-renders
        return () => clearTimeout(handler);
    }
  }, [quality, format, open, image, originalImageBase64, handleGeneratePreview]);

  
  const handleSave = () => {
    if (preview) {
      onSave(preview);
      onOpenChange(false);
    }
  };
  
  const originalSize = useMemo(() => image ? image.filesize : 0, [image]);
  const sizeReduction = useMemo(() => {
      if (!originalSize || !preview?.size) return 0;
      if (originalSize === 0) return 0; // Avoid division by zero
      return ((originalSize - preview.size) / originalSize) * 100;
  }, [originalSize, preview]);

  const isSaveDisabled = !preview || isLoading || (format === 'png' && preview.size >= originalSize);

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
          {/* Previews */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4 min-h-0">
            {/* Original */}
            <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-center">Original ({formatBytes(originalSize)})</h3>
                <div className="flex-grow bg-muted/50 rounded-md overflow-hidden relative">
                    {(!originalImageBase64 && isLoading) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p className="ml-2">Loading original...</p>
                        </div>
                    )}
                    {originalImageBase64 && (
                        <div className="w-full h-full overflow-auto p-2">
                            <Image 
                                src={originalImageBase64} 
                                alt="Original" 
                                width={image!.width} 
                                height={image!.height} 
                                className="transition-transform duration-300 origin-top-left"
                                style={{ transform: `scale(${zoom})`}}
                            />
                        </div>
                    )}
                </div>
            </div>
            {/* Compressed */}
            <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-center">
                    Preview ({preview ? formatBytes(preview.size) : '...'})
                </h3>
                <div className="flex-grow bg-muted/50 rounded-md overflow-hidden relative">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    )}
                    {preview && (
                         <div className="w-full h-full overflow-auto p-2">
                            <Image 
                                src={preview.base64} 
                                alt="Preview" 
                                width={image?.width || 500} 
                                height={image?.height || 500} 
                                className="transition-transform duration-300 origin-top-left"
                                style={{ transform: `scale(${zoom})`}}
                            />
                        </div>
                    )}
                </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="md:col-span-1 flex flex-col gap-6">
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
                        />
                         {quality < 80 && (
                            <Alert variant="warning" className="p-2 text-xs">
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
                            onValueChange={([val]) => setZoom(val)}
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
                                {sizeReduction.toFixed(1)}%
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
