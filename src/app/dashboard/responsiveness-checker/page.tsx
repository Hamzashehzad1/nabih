
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Smartphone, Tablet, Laptop, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const devices = [
    // Mobile Devices
    { name: 'iPhone SE', width: '375px', height: '667px', icon: <Smartphone /> },
    { name: 'iPhone 12 Pro', width: '390px', height: '844px', icon: <Smartphone /> },
    { name: 'Pixel 7', width: '412px', height: '915px', icon: <Smartphone /> },
    { name: 'Samsung Galaxy S20 Ultra', width: '412px', height: '915px', icon: <Smartphone /> },
    // Tablet Devices
    { name: 'iPad Mini', width: '768px', height: '1024px', icon: <Tablet /> },
    { name: 'iPad Air', width: '820px', height: '1180px', icon: <Tablet /> },
    { name: 'Surface Pro 7', width: '912px', height: '1368px', icon: <Tablet /> },
    // Desktop Devices
    { name: 'Small Laptop', width: '1366px', height: '768px', icon: <Laptop /> },
    { name: 'Large Laptop/Desktop', width: '1920px', height: '1080px', icon: <Laptop /> },
    { name: 'Full Width', width: '100%', height: '100%', icon: <Laptop /> },
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
    
    const handleDeviceChange = (deviceName: string) => {
        const device = devices.find(d => d.name === deviceName);
        if(device) {
            setActiveDevice(device);
        }
    }

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
                       <Select value={activeDevice.name} onValueChange={handleDeviceChange}>
                            <SelectTrigger className="w-[280px]">
                                <SelectValue placeholder="Select a device" />
                            </SelectTrigger>
                            <SelectContent>
                                {devices.map(device => (
                                    <SelectItem key={device.name} value={device.name}>
                                        <div className="flex items-center gap-2">
                                            {device.icon}
                                            <span>{device.name} ({device.width === '100%' ? 'Full' : device.width.replace('px', '')}w)</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div 
                        className="mx-auto mt-6 bg-background p-2 border-4 border-foreground rounded-2xl shadow-lg transition-all duration-300 flex flex-col items-center" 
                        style={{ width: activeDevice.width === '100%' ? '100%' : `calc(${activeDevice.width} + 24px)`}}
                    >
                         <div className="bg-black text-white text-xs rounded-t-lg p-2 truncate text-center w-full">
                            {displayUrl || 'Enter a URL to begin'}
                        </div>
                        <div 
                            className="bg-muted transition-all duration-300 overflow-hidden w-full"
                            style={{height: activeDevice.width === '100%' ? '80vh' : activeDevice.height}}
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
