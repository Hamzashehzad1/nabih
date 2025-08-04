// src/app/dashboard/woocommerce-sync/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Power, PowerOff, CheckCircle2, Package, Star, ShoppingCart, GitCompare, AlertTriangle, BadgePercent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { performSync, type SyncLog } from './actions';

const siteSchema = z.object({
    url: z.string().url("Please enter a valid URL."),
    consumerKey: z.string().min(1, "Consumer Key is required."),
    consumerSecret: z.string().min(1, "Consumer Secret is required."),
});

export type SiteFormData = z.infer<typeof siteSchema>;

const SiteForm = ({ form, onSave, isConnected, onClear, title, description, storageKey }: { form: any, onSave: (data: SiteFormData, key: string) => void, isConnected: boolean, onClear: () => void, title: string, description: string, storageKey: string }) => (
    <Card className={cn(isConnected && "border-green-500")}>
        <CardHeader>
            <CardTitle className="flex justify-between items-center">
                <span>{title}</span>
                {isConnected && <Badge variant="default" className="bg-green-600">Connected</Badge>}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={form.handleSubmit((data: SiteFormData) => onSave(data, storageKey))} className="space-y-4">
                <div className="space-y-2">
                    <Label>Website URL</Label>
                    <Input {...form.register('url')} placeholder="https://source-site.com" />
                    {form.formState.errors.url && <p className="text-xs text-destructive">{form.formState.errors.url.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Consumer Key</Label>
                    <Input {...form.register('consumerKey')} type="password" />
                    {form.formState.errors.consumerKey && <p className="text-xs text-destructive">{form.formState.errors.consumerKey.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Consumer Secret</Label>
                    <Input {...form.register('consumerSecret')} type="password" />
                    {form.formState.errors.consumerSecret && <p className="text-xs text-destructive">{form.formState.errors.consumerSecret.message}</p>}
                </div>
                <div className="flex gap-2">
                    <Button type="submit" className="flex-grow">Save Credentials</Button>
                    <Button type="button" variant="outline" onClick={onClear}>Clear</Button>
                </div>
            </form>
        </CardContent>
    </Card>
);

const dataTypesConfig = {
    products: { icon: Package, label: 'Products' },
    orders: { icon: ShoppingCart, label: 'Orders' },
    reviews: { icon: Star, label: 'Reviews' },
    coupons: { icon: BadgePercent, label: 'Coupons' },
};

export default function WooCommerceSyncPage() {
    const { toast } = useToast();
    const [sourceSite, setSourceSite] = useLocalStorage<SiteFormData | null>('wc-sync-source', null);
    const [destinationSite, setDestinationSite] = useLocalStorage<SiteFormData | null>('wc-sync-destination', null);
    
    const [isSyncing, setIsSyncing] = useState(false);
    const [logs, setLogs] = useState<SyncLog[]>([]);
    const [dataTypesToSync, setDataTypesToSync] = useState({
        products: true,
        orders: false,
        reviews: false,
        coupons: false,
    });

    const sourceForm = useForm<SiteFormData>({ resolver: zodResolver(siteSchema), defaultValues: sourceSite || undefined });
    const destForm = useForm<SiteFormData>({ resolver: zodResolver(siteSchema), defaultValues: destinationSite || undefined });

    useEffect(() => {
        sourceForm.reset(sourceSite || { url: '', consumerKey: '', consumerSecret: '' });
    }, [sourceSite, sourceForm]);
    
    useEffect(() => {
        destForm.reset(destinationSite || { url: '', consumerKey: '', consumerSecret: '' });
    }, [destinationSite, destForm]);
    
    const addLog = useCallback((message: string, type: SyncLog['type'] = 'info') => {
        setLogs(prev => [{ timestamp: new Date().toISOString(), message, type }, ...prev].slice(0, 100));
    }, []);

    const handleSaveSite = (data: SiteFormData, key: 'source' | 'destination') => {
        if (key === 'source') {
            setSourceSite(data);
        } else {
            setDestinationSite(data);
        }
        toast({ title: `${key === 'source' ? 'Source' : 'Destination'} Site Saved`, description: `Credentials for ${data.url} have been saved locally.` });
    };

    const runSync = async () => {
        if (!sourceSite || !destinationSite) {
            addLog("Source and Destination sites must be configured before syncing.", 'error');
            toast({title: "Configuration Missing", description: "Please save credentials for both source and destination sites.", variant: "destructive"})
            return;
        }
        
        setIsSyncing(true);
        setLogs([]);
        
        try {
            await performSync(sourceSite, destinationSite, dataTypesToSync, addLog);
        } catch (e: any) {
             addLog(`A critical error occurred: ${e.message}`, 'error');
        } finally {
            setIsSyncing(false);
            toast({title: "Sync Process Finished", description: "Check the logs for details."})
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-headline font-bold">WooCommerce Sync</h1>
                <p className="text-muted-foreground max-w-2xl">
                   Keep two WooCommerce stores in sync. This tool will make the destination site an exact mirror of the source site for the selected data types.
                </p>
            </div>
            
             <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>One-Way Mirroring Sync</AlertTitle>
                <AlertDescription>
                   This is a destructive operation. Any items (products, orders, etc.) on the Destination site that do not exist on the Source site will be **deleted**. Use with caution and always have backups.
                </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <SiteForm
                    form={sourceForm}
                    onSave={(data) => handleSaveSite(data, 'source')}
                    isConnected={!!sourceSite}
                    onClear={() => {
                        setSourceSite(null);
                        sourceForm.reset({ url: '', consumerKey: '', consumerSecret: '' });
                    }}
                    title="Site A (Source)"
                    description="The site you want to copy data FROM."
                    storageKey="source"
                />
                <SiteForm
                    form={destForm}
                    onSave={(data) => handleSaveSite(data, 'destination')}
                    isConnected={!!destinationSite}
                    onClear={() => {
                        setDestinationSite(null);
                        destForm.reset({ url: '', consumerKey: '', consumerSecret: '' });
                    }}
                    title="Site B (Destination)"
                    description="The site you want to copy data TO."
                    storageKey="destination"
                />
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Sync Control Panel</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-6">
                        <h3 className="font-semibold mb-2">Select Data to Sync</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           {Object.entries(dataTypesConfig).map(([key, {icon: Icon, label}]) => (
                               <div key={key} className="flex items-center space-x-2 p-3 border rounded-md">
                                   <Checkbox 
                                        id={key}
                                        checked={dataTypesToSync[key as keyof typeof dataTypesToSync]}
                                        onCheckedChange={(checked) => setDataTypesToSync(prev => ({...prev, [key]: !!checked}))}
                                    />
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                   <label htmlFor={key} className="text-sm font-medium leading-none">
                                       {label}
                                    </label>
                               </div>
                           ))}
                        </div>
                    </div>

                    <Button onClick={runSync} disabled={isSyncing || !sourceSite || !destinationSite} size="lg">
                        {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <GitCompare className="h-4 w-4 mr-2" />}
                        {isSyncing ? 'Syncing...' : 'Run Sync'}
                    </Button>

                     <div className="mt-6">
                        <h3 className="font-semibold mb-2">Sync Log</h3>
                        <ScrollArea className="h-64 w-full rounded-md border bg-muted/50 p-4">
                            <div className="flex flex-col-reverse gap-1 text-sm font-mono">
                                {logs.map((log, i) => (
                                    <p key={i} className={cn(
                                        log.type === 'error' && 'text-destructive',
                                        log.type === 'warn' && 'text-yellow-500',
                                        log.type === 'success' && 'text-green-500',
                                    )}>
                                        [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                                    </p>
                                ))}
                                {logs.length === 0 && <p className="text-muted-foreground">Sync logs will appear here...</p>}
                            </div>
                        </ScrollArea>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}