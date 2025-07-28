
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
    { name: 'iPhone SE', width: '375px', height: '667px', type: 'smartphone' },
    { name: 'iPhone 12 Pro', width: '390px', height: '844px', type: 'smartphone' },
    { name: 'Pixel 7', width: '412px', height: '915px', type: 'smartphone' },
    { name: 'iPad Mini', width: '768px', height: '1024px', type: 'tablet' },
    { name: 'iPad Air', width: '820px', height: '1180px', type: 'tablet' },
    { name: 'Laptop', width: '1366px', height: '768px', type: 'laptop' },
    { name: 'Large Desktop', width: '1920px', height: '1080px', type: 'laptop' },
];

export default function WebsiteMockupPage() {
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
    
    const getIconForDevice = (type: string) => {
        switch(type) {
            case 'smartphone': return <Smartphone />;
            case 'tablet': return <Tablet />;
            case 'laptop': return <Laptop />;
            default: return <Globe />;
        }
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-headline font-bold">Website Mockup Generator</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Enter a URL to see how it looks inside different device mockups. Note: Some sites may not load due to security policies (X-Frame-Options).
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
                <CardContent className="bg-muted/50 rounded-lg p-8 flex justify-center items-center min-h-[600px]">
                    <div className="flex flex-col items-center gap-8">
                       <Select value={activeDevice.name} onValueChange={handleDeviceChange}>
                            <SelectTrigger className="w-[280px]">
                                <SelectValue placeholder="Select a device" />
                            </SelectTrigger>
                            <SelectContent>
                                {devices.map(device => (
                                    <SelectItem key={device.name} value={device.name}>
                                        <div className="flex items-center gap-2">
                                            {getIconForDevice(device.type)}
                                            <span>{device.name} ({device.width} x {device.height})</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                         <div className={cn("device-mockup", `device-${activeDevice.type}`)} style={{ width: activeDevice.width, height: activeDevice.height }}>
                            <div className="device-frame">
                                {displayUrl ? (
                                    <iframe 
                                        src={displayUrl} 
                                        title="Website Preview"
                                        className="device-screen"
                                        scrolling="no"
                                    />
                                ) : (
                                     <div className="device-screen flex flex-col items-center justify-center text-muted-foreground bg-background">
                                        <Globe className="h-16 w-16 mb-4" />
                                        <p>Enter a URL to preview a website.</p>
                                    </div>
                                )}
                            </div>
                            <div className="device-stripe"></div>
                            <div className="device-header"></div>
                            <div className="device-sensors"></div>
                            <div className="device-btns"></div>
                            <div className="device-power"></div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
