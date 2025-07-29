
'use client';

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
import { Loader2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop/types';
import type { ImageSearchResult } from '@/app/dashboard/image-generator/actions';

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: ImageSearchResult | null;
  onCropComplete: ((croppedImageUrl: string, originalImage: ImageSearchResult) => void) | null;
}

const CROP_ASPECT = 1200 / 650;

/**
 * Creates a cropped image.
 * @param {string} url - The URL of the image to crop.
 * @param {Area} pixelCrop - The area to crop.
 * @returns {Promise<string>} A promise that resolves with the cropped image as a data URL.
 */
async function getCroppedImg(url: string, pixelCrop: Area): Promise<string> {
    const image = new Image();
    image.crossOrigin = 'anonymous'; 

    // Use proxy for external images
    if (url.startsWith('http')) {
      const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error('Failed to proxy image for cropping.');
      }
      const { base64 } = await response.json();
      image.src = base64;
    } else {
      image.src = url; // for data URIs
    }
    
    await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = (error) => reject(new Error('Image failed to load. Check browser console for CORS issues.'));
    });

    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Canvas is empty'));
                return;
            }
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result as string));
            reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.9); // Compress to JPEG with 90% quality
    });
}


export function ImageCropDialog({
  open,
  onOpenChange,
  image,
  onCropComplete,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropPixels = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels || !image || !onCropComplete) {
      return;
    }

    setIsCropping(true);
    try {
      const croppedImageUrl = await getCroppedImg(image.url, croppedAreaPixels);
      onCropComplete(croppedImageUrl, image);
    } catch (e) {
      console.error(e);
      // Handle error with a toast or message
    } finally {
      setIsCropping(false);
      onOpenChange(false); // Close dialog on completion
    }
  };

  // Reset state when dialog is closed or a new image is loaded
  if (!open && (crop.x !== 0 || crop.y !== 0 || zoom !== 1)) {
      setCrop({x: 0, y: 0});
      setZoom(1);
      setCroppedAreaPixels(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl h-[80vh] flex flex-col p-4">
        <DialogHeader>
          <DialogTitle>Crop Your Image</DialogTitle>
          <DialogDescription>
            Adjust the image to get the perfect shot. The crop area is fixed at a 1200x650 aspect ratio.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow relative bg-muted/50 rounded-md">
          {image && (
            <Cropper
              image={image.url.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(image.url)}` : image.url}
              crop={crop}
              zoom={zoom}
              aspect={CROP_ASPECT}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropPixels}
            />
          )}
        </div>

        <div className="flex-shrink-0 pt-4">
            <Label htmlFor="zoom-slider">Zoom</Label>
            <Slider
                id="zoom-slider"
                min={1}
                max={3}
                step={0.1}
                value={[zoom]}
                onValueChange={(val) => setZoom(val[0])}
            />
        </div>

        <DialogFooter className="flex-shrink-0 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCropping}>
            Cancel
          </Button>
          <Button onClick={handleCrop} disabled={isCropping}>
            {isCropping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crop & Save Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
