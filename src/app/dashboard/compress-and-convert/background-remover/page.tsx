// src/app/dashboard/compress-and-convert/background-remover/page.tsx
"use client";

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { FileUp, Download, Loader2, ArrowLeft, Image as ImageIcon, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Client } from "@gradio/client";

export default function BackgroundRemoverPage() {
    const { toast } = useToast();
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setOriginalFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setOriginalImage(reader.result as string);
                setProcessedImage(null); // Clear previous result
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveBackground = async () => {
        if (!originalFile) {
            toast({ title: "No image selected", description: "Please upload an image first.", variant: "destructive" });
            return;
        }
        setIsProcessing(true);
        setProcessedImage(null);

        try {
            const client = await Client.connect("not-lain/background-removal");
            const result = await client.predict("/image", { 
                image: new Blob([originalFile], { type: originalFile.type })
            });
            
            // The result structure from gradio might be nested. Inspect and adjust as needed.
            // @ts-ignore
            if (result.data && result.data.length > 0 && result.data[0].url) {
                 // @ts-ignore
                const imageUrl = result.data[0].url;
                
                // Gradio often returns a temporary URL. We need to fetch it and convert to a data URL to make it permanent.
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    setProcessedImage(reader.result as string);
                    toast({ title: "Success!", description: "Background removed successfully." });
                };
                reader.readAsDataURL(blob);

            } else {
                throw new Error("Invalid API response structure.");
            }

        } catch (error) {
            console.error("Background removal error:", error);
            toast({ title: "Processing Error", description: "Could not remove background. Please try another image.", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!processedImage) return;
        const link = document.createElement('a');
        link.href = processedImage;
        const originalName = originalFile?.name.split('.').slice(0, -1).join('.') || 'image';
        link.download = `${originalName}-no-bg.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            <div>
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/compress-and-convert">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to All Tools
                    </Link>
                </Button>
            </div>
            <Card className="max-w-4xl mx-auto">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-headline">AI Background Remover</CardTitle>
                    <CardDescription>Upload an image to automatically remove its background.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg h-80">
                           {originalImage ? (
                               <Image src={originalImage} alt="Original" width={300} height={300} className="max-h-full w-auto object-contain rounded-md" />
                           ) : (
                            <div className="text-center text-muted-foreground">
                                <ImageIcon className="h-16 w-16 mx-auto" />
                                <p className="mt-2">Upload an image to start</p>
                            </div>
                           )}
                        </div>
                         <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg h-80 bg-muted/50">
                           {isProcessing ? (
                                <div className="text-center text-muted-foreground">
                                    <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
                                    <p className="mt-2">Removing background...</p>
                                </div>
                           ) : processedImage ? (
                               <Image src={processedImage} alt="Processed" width={300} height={300} className="max-h-full w-auto object-contain rounded-md" />
                           ) : (
                                <div className="text-center text-muted-foreground">
                                    <Sparkles className="h-16 w-16 mx-auto" />
                                    <p className="mt-2">Processed image will appear here</p>
                                </div>
                           )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleFileChange}
                        />
                        <Button onClick={() => fileInputRef.current?.click()} size="lg" variant="outline">
                            <FileUp className="mr-2 h-5 w-5" /> Upload Image
                        </Button>
                        <Button onClick={handleRemoveBackground} disabled={!originalImage || isProcessing} size="lg">
                            <Scissors className="mr-2 h-5 w-5" /> Remove Background
                        </Button>
                         <Button onClick={handleDownload} disabled={!processedImage} size="lg" variant="secondary">
                            <Download className="mr-2 h-5 w-5" /> Download Result
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
