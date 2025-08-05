// src/app/dashboard/compress-and-convert/[slug]/page.tsx
"use client";

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { FileUp, Download, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const allConverters = {
    // Image
    'jpeg-to-webp': { from: 'JPEG', to: 'WEBP', type: 'image' },
    'png-to-webp': { from: 'PNG', to: 'WEBP', type: 'image' },
    'jpeg-to-png': { from: 'JPEG', to: 'PNG', type: 'image' },
    'png-to-jpeg': { from: 'PNG', to: 'JPEG', type: 'image' },
    'webp-to-jpeg': { from: 'WEBP', to: 'JPEG', type: 'image' },
    'heic-to-jpeg': { from: 'HEIC', to: 'JPEG', type: 'image' },
    'image-compressor': { from: 'Image', to: 'Compressed Image', type: 'image' },
    'image-resizer': { from: 'Image', to: 'Resized Image', type: 'image' },

    // Video
    'mp4-to-webm': { from: 'MP4', to: 'WebM', type: 'video' },
    'mov-to-mp4': { from: 'MOV', to: 'MP4', type: 'video' },
    'webm-to-mp4': { from: 'WebM', to: 'MP4', type: 'video' },
    'video-compressor': { from: 'Video', to: 'Compressed Video', type: 'video' },

    // Document
    'pdf-to-word': { from: 'PDF', to: 'Word', type: 'document' },
    'word-to-pdf': { from: 'Word', to: 'PDF', type: 'document' },
    'pdf-to-jpeg': { from: 'PDF', to: 'JPEG', type: 'document' },
    'powerpoint-to-pdf': { from: 'PowerPoint', to: 'PDF', type: 'document' },
    'excel-to-pdf': { from: 'Excel', to: 'PDF', type: 'document' },
    
    // Audio
    'mp3-to-wav': { from: 'MP3', to: 'WAV', type: 'audio' },
    'wav-to-mp3': { from: 'WAV', to: 'MP3', type: 'audio' },
    'm4a-to-mp3': { from: 'M4A', to: 'MP3', type: 'audio' },
};

export default function ConverterPage() {
    const { toast } = useToast();
    const params = useParams();
    const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
    const converterInfo = (allConverters as any)[slug];

    const [files, setFiles] = useState<File[]>([]);
    const [isConverting, setIsConverting] = useState(false);
    const [convertedFile, setConvertedFile] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(Array.from(event.target.files));
        }
    };

    const handleConvert = async () => {
        if (files.length === 0) {
            toast({ title: "No files selected", description: "Please select a file to convert.", variant: "destructive" });
            return;
        }
        setIsConverting(true);
        setConvertedFile(null);

        // Simulate conversion process
        await new Promise(resolve => setTimeout(resolve, 2000));

        setIsConverting(false);
        setConvertedFile("https://placehold.co/600x400.png"); // Placeholder for converted file
        toast({ title: "Conversion Successful!", description: `${files[0].name} has been converted.` });
    };

    if (!converterInfo) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center">
                <h1 className="text-2xl font-bold">Converter not found</h1>
                <p className="text-muted-foreground">The requested file converter does not exist.</p>
                <Button asChild variant="link"><Link href="/dashboard/compress-and-convert">Go Back</Link></Button>
            </div>
        );
    }

    const title = slug.includes('-') ? slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Converter';

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
            <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-headline">{title}</CardTitle>
                    <CardDescription>Convert your {converterInfo.from} files to {converterInfo.to} with ease.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-8 space-y-6">
                    <label htmlFor="file-upload" className="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                        <FileUp className="h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">
                            {files.length > 0 ? `${files.length} file(s) selected` : 'Click or drag files here'}
                        </p>
                    </label>
                    <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} multiple />

                     {files.length > 0 && (
                        <div className="w-full text-sm text-center">
                            <p className="font-semibold">Selected file:</p>
                            <p className="text-muted-foreground">{files[0].name}</p>
                        </div>
                    )}
                    
                    <Button onClick={handleConvert} disabled={isConverting || files.length === 0} size="lg">
                        {isConverting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Converting...</>
                        ) : (
                            <>Convert to {converterInfo.to}</>
                        )}
                    </Button>
                    
                    {convertedFile && (
                        <div className="w-full pt-6 border-t text-center">
                            <h3 className="font-semibold mb-2">Conversion Complete!</h3>
                             <Button onClick={() => {}}>
                                <Download className="mr-2 h-4 w-4" />
                                Download File
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
