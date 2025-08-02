
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent, CardDescription as CardDescriptionComponent } from '@/components/ui/card';
import { AlertTriangle, Loader2, Move, Replace, Save, Wand2 } from 'lucide-react';
import { WpMediaItem, replaceWpMediaFile, uploadWpMedia } from '@/app/dashboard/advanced-media-library/actions';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';

type ImageFormat = 'jpeg' | 'png' | 'webp';
type UploadAction = 'replace' | 'saveAsCopy' | null;

interface WpSite {
  id: string;
  url: string;
  user: string;
  appPassword?: string;
}

interface ImageOptimizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: WpMediaItem | null;
  onComplete: () => void;
  site: WpSite | undefined;
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
    format: ImageFormat,
    quality: number,
    width?: number,
    height?: number,
): Promise<{ base64: string; size: number }> {
    const response = await fetch('/api/optimize-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64, format, quality, width, height }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to optimize image on server' }));
        throw new Error(errorData.error);
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
  onComplete,
  site
}: ImageOptimizeDialogProps) {
  const [format, setFormat] = useState<ImageFormat>('jpeg');
  const [quality, setQuality] = useState(85);
  const [dimensions, setDimensions] = useState<{width?: number, height?: number}>({width: undefined, height: undefined});
  const [isLoading, setIsLoading] = useState(false);
  const [uploadAction, setUploadAction] = useState<UploadAction>(null);
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
        let result = await generateServerPreview(originalImageBase64, format, quality, dimensions.width, dimensions.height);
        setPreview(result);
    } catch(err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : "Could not generate image preview.";
        toast({ title: "Preview Error", description: errorMessage, variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  }, [image, format, quality, originalImageBase64, dimensions, toast]);
  
  useEffect(() => {
    if (open && image) {
      setIsLoading(true);
      setOriginalImageBase64(null);
      setPreview(null);
      setFormat('jpeg');
      setQuality(85);
      setDimensions({ width: image.width, height: image.height });
      setZoom(1);
      setPosition({x: 0, y: 0});
      setUploadAction(null);

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
        handleGeneratePreview();
    }
  }, [originalImageBase64, open, image, handleGeneratePreview]);

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

  const handleSave = async (action: 'replace' | 'saveAsCopy') => {
    if (!preview || !image || !site?.appPassword) {
        toast({ title: "Error", description: "Cannot save, missing required data.", variant: "destructive" });
        return;
    }
    setUploadAction(action);

    if (action === 'replace') {
        const result = await replaceWpMediaFile(site.url, site.user, site.appPassword, image, preview);
        if (result.success) {
            toast({ title: "Success", description: "Original image has been replaced." });
            onComplete();
            onOpenChange(false);
        } else {
            toast({ title: "Replacement Failed", description: result.error, variant: "destructive" });
        }
    } else { // saveAsCopy
        const originalFilename = image.filename.substring(0, image.filename.lastIndexOf('.'));
        const newFilename = `${originalFilename}-optimized.${format}`;
        
        const result = await uploadWpMedia(site.url, site.user, site.appPassword, {
            base64: preview.base64,
            filename: newFilename,
            alt: image.alt,
            caption: image.caption,
            description: image.description,
            mimeType: `image/${format}`
        });

        if (result.success) {
            toast({ title: "Success", description: "Optimized copy saved as a new image." });
            onComplete();
            onOpenChange(false);
        } else {
            toast({ title: "Save Failed", description: result.error, variant: "destructive" });
        }
    }

    setUploadAction(null);
  };
  
  const originalSize = useMemo(() => image ? image.filesize : 0, [image]);
  const sizeReduction = useMemo(() => {
      if (!originalSize || !preview?.size) return 0;
      if (originalSize === 0) return 0; 
      const reduction = ((originalSize - preview.size) / originalSize) * 100;
       if(image?.filename.endsWith('.png') && format === 'png' && reduction < 0){
          return 0;
      }
      return reduction;
  }, [originalSize, preview, image, format]);

  const isUploading = !!uploadAction;

  const imageTransform = {
      transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
      transformOrigin: 'top left',
  };

  const renderControls = () => (
    <>
      <Card>
          <CardHeader><CardTitle>Optimization Controls</CardTitle></CardHeader>
          <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="space-y-2 w-1/2">
                    <Label htmlFor="width">Width</Label>
                    <Input id="width" type="number" placeholder="Original" value={dimensions.width || ''} onChange={e => setDimensions(d => ({...d, width: e.target.value ? parseInt(e.target.value) : undefined}))}/>
                </div>
                 <div className="space-y-2 w-1/2">
                    <Label htmlFor="height">Height</Label>
                    <Input id="height" type="number" placeholder="Original" value={dimensions.height || ''} onChange={e => setDimensions(d => ({...d, height: e.target.value ? parseInt(e.target.value) : undefined}))}/>
                </div>
              </div>
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
                          setPosition({x: 0, y: 0});
                      }}
                      min={1}
                      max={5}
                      step={0.1}
                  />
              </div>
              <Button onClick={handleGeneratePreview} disabled={isLoading} className="w-full">
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                )}
                 Generate Preview
              </Button>
          </CardContent>
      </Card>
    </>
  );

  const renderSaveOptions = () => (
    <Card>
      <CardHeader>
        <CardTitle>Save to WordPress</CardTitle>
        <CardDescriptionComponent>How would you like to save the optimized image?</CardDescriptionComponent>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            These actions will modify your WordPress media library directly. This cannot be undone.
          </AlertDescription>
        </Alert>
        <div className="flex flex-col gap-2">
            <Button
                onClick={() => handleSave('replace')}
                disabled={isUploading}
            >
                {uploadAction === 'replace' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <div className="text-left">
                    <p className="font-semibold">Replace Original</p>
                    <p className="text-xs font-normal">Overwrite the original file. Keeps the same URL.</p>
                </div>
            </Button>
             <Button
                onClick={() => handleSave('saveAsCopy')}
                disabled={isUploading}
                variant="secondary"
            >
                {uploadAction === 'saveAsCopy' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <div className="text-left">
                    <p className="font-semibold">Save as Optimized Copy</p>
                    <p className="text-xs font-normal">Upload as a new file (e.g., image-optimized.jpg).</p>
                </div>
            </Button>
        </div>
      </CardContent>
    </Card>
  );

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
                        <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={imageTransform}
                        >
                            <Image
                                src={originalImageBase64}
                                alt="Original"
                                width={image.width}
                                height={image.height}
                                className="max-w-full max-h-full object-contain pointer-events-none"
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
                        <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={imageTransform}
                        >
                            <Image
                                src={preview.base64}
                                alt="Preview"
                                width={dimensions.width || image.width}
                                height={dimensions.height || image.height}
                                className="max-w-full max-h-full object-contain pointer-events-none"
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
             {renderControls()}
            {preview && (
              <Card>
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p
                      className={cn(
                        "text-4xl font-bold",
                        sizeReduction >= 0 ? "text-green-500" : "text-red-500"
                      )}
                    >
                      {sizeReduction >= 0
                        ? `-${sizeReduction.toFixed(1)}%`
                        : `+${Math.abs(sizeReduction).toFixed(1)}%`}
                    </p>
                    <p className="text-muted-foreground">
                      reduction in file size
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
             {preview && renderSaveOptions()}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
