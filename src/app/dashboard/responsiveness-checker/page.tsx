
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Smartphone, Tablet, Laptop, Globe } from 'lucide-react';

const devices = [
  { name: 'Mobile', width: '375px', height: '667px', icon: <Smartphone /> },
  { name: 'Tablet', width: '768px', height: '1024px', icon: <Tablet /> },
  { name: 'Desktop', width: '100%', height: '100%', icon: <Laptop /> },
];

export default function ResponsivenessCheckerPage() {
    const [url, setUrl] = useState('');
    const [displayUrl, setDisplayUrl] = useState('');
    const [activeDevice, setActiveDevice] = useState(devices[0]);

    const handleLoadUrl = () => {
        let finalUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            finalUrl = `https://${url}`;
        }
        setDisplayUrl(finalUrl);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-headline font-bold">Responsiveness Checker</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Enter a URL to see how it looks on different screen sizes. Note: Some sites may not load due to security policies (X-Frame-Options).
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-grow space-y-2">
                             <Label htmlFor="url-input">Website URL</Label>
                            <Input 
                                id="url-input"
                                placeholder="https://www.example.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLoadUrl()}
                            />
                        </div>
                        <div className="flex-shrink-0 self-end">
                            <Button onClick={handleLoadUrl}>Load Site</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center items-center gap-2 p-4 rounded-md bg-muted">
                       {devices.map(device => (
                            <Button 
                                key={device.name}
                                variant={activeDevice.name === device.name ? 'default' : 'outline'}
                                onClick={() => setActiveDevice(device)}
                                className="gap-2"
                            >
                                {device.icon}
                                <span>{device.name}</span>
                            </Button>
                       ))}
                    </div>

                    <div 
                        className="mx-auto mt-6 bg-background p-2 border-4 rounded-2xl shadow-lg transition-all duration-300" 
                        style={{ width: `calc(${activeDevice.width} + 16px)`}}
                    >
                         <div className="bg-black text-white text-xs rounded-t-lg p-2 truncate text-center">
                            {displayUrl || 'Enter a URL to begin'}
                        </div>
                        <div 
                            className="bg-muted transition-all duration-300 overflow-hidden"
                            style={{height: activeDevice.height}}
                        >
                        {displayUrl ? (
                            <iframe 
                                src={displayUrl} 
                                title="Website Preview"
                                className="w-full h-full border-0"
                            />
                        ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                <Globe className="h-16 w-16 mb-4" />
                                <p>Enter a URL to preview a website.</p>
                            </div>
                        )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
