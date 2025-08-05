// src/app/dashboard/compress-and-convert/page.tsx
"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileImage, Film, FileText, Music, ArrowRight } from 'lucide-react';

const converters = [
    // Image Converters
    { slug: 'jpeg-to-webp', title: 'JPEG to WEBP', category: 'Image' },
    { slug: 'png-to-webp', title: 'PNG to WEBP', category: 'Image' },
    { slug: 'jpeg-to-png', title: 'JPEG to PNG', category: 'Image' },
    { slug: 'png-to-jpeg', title: 'PNG to JPEG', category: 'Image' },
    { slug: 'webp-to-jpeg', title: 'WEBP to JPEG', category: 'Image' },
    { slug: 'heic-to-jpeg', title: 'HEIC to JPEG', category: 'Image' },
    { slug: 'image-compressor', title: 'Image Compressor', category: 'Image' },
    { slug: 'image-resizer', title: 'Image Resizer', category: 'Image' },

    // Video Converters
    { slug: 'mp4-to-webm', title: 'MP4 to WebM', category: 'Video' },
    { slug: 'mov-to-mp4', title: 'MOV to MP4', category: 'Video' },
    { slug: 'webm-to-mp4', title: 'WebM to MP4', category: 'Video' },
    { slug: 'video-compressor', title: 'Video Compressor', category: 'Video' },

    // Document Converters
    { slug: 'pdf-to-word', title: 'PDF to Word', category: 'Document' },
    { slug: 'word-to-pdf', title: 'Word to PDF', category: 'Document' },
    { slug: 'pdf-to-jpeg', title: 'PDF to JPEG', category: 'Document' },
    { slug: 'powerpoint-to-pdf', title: 'PowerPoint to PDF', category: 'Document' },
    { slug: 'excel-to-pdf', title: 'Excel to PDF', category: 'Document' },
    
    // Audio Converters
    { slug: 'mp3-to-wav', title: 'MP3 to WAV', category: 'Audio' },
    { slug: 'wav-to-mp3', title: 'WAV to MP3', category: 'Audio' },
    { slug: 'm4a-to-mp3', title: 'M4A to MP3', category: 'Audio' },
];

const categories = [
    { name: 'Image', icon: <FileImage className="h-6 w-6 text-primary" /> },
    { name: 'Video', icon: <Film className="h-6 w-6 text-primary" /> },
    { name: 'Document', icon: <FileText className="h-6 w-6 text-primary" /> },
    { name: 'Audio', icon: <Music className="h-6 w-6 text-primary" /> },
];

export default function CompressAndConvertPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-headline font-bold">Compress & Convert Tools</h1>
                <p className="text-muted-foreground max-w-2xl">
                    A suite of tools to convert and optimize your media files for any use case.
                </p>
            </div>

            <div className="space-y-12">
                {categories.map(category => (
                    <div key={category.name}>
                        <div className="flex items-center gap-3 mb-4">
                            {category.icon}
                            <h2 className="text-2xl font-headline font-semibold">{category.name} Converters</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {converters.filter(c => c.category === category.name).map(tool => (
                                <Link key={tool.slug} href={`/dashboard/compress-and-convert/${tool.slug}`}>
                                    <Card className="hover:border-primary hover:shadow-lg transition-all group">
                                        <CardContent className="pt-6">
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold">{tool.title}</p>
                                                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
