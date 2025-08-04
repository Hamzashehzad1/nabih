
// src/app/dashboard/woocommerce-sync/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
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
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Loader2, Power, PowerOff, CheckCircle2, Package, Star, ShoppingCart, GitCompare, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const siteSchema = z.object({
    url: z.string().url("Please enter a valid URL."),
    consumerKey: z.string().min(1, "Consumer Key is required."),
    consumerSecret: z.string().min(1, "Consumer Secret is required."),
});

type SiteFormData = z.infer<typeof siteSchema>;

interface SyncLog {
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'error';
}

interface SyncedItem {
    id: string;
    type: 'Order' | 'Product' | 'Review';
    description: string;
}

export default function WooCommerceSyncPage() {
    const { toast } = useToast();
    const [siteA, setSiteA] = useLocalStorage<SiteFormData | null>('wc-sync-site-a', null);
    const [siteB, setSiteB] = useLocalStorage<SiteFormData | null>('wc-sync-site-b', null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [logs, setLogs] = useState<SyncLog[]>([]);
    const [syncedItems, setSyncedItems] = useState<SyncedItem[]>([]);
    const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const formA = useForm<SiteFormData>({ resolver: zodResolver(siteSchema), defaultValues: siteA || { url: '', consumerKey: '', consumerSecret: '' }});
    const formB = useForm<SiteFormData>({ resolver: zodResolver(siteSchema), defaultValues: siteB || { url: '', consumerKey: '', consumerSecret: '' }});
    
    const addLog = (message: string, type: SyncLog['type'] = 'info') => {
        setLogs(prev => [{ timestamp: new Date().toISOString(), message, type }, ...prev]);
    };
    
    const handleSaveSite = (site: 'A' | 'B', data: SiteFormData) => {
        if (site === 'A') setSiteA(data);
        else setSiteB(data);
        toast({ title: `Site ${site} Saved`, description: `Credentials for ${data.url} have been saved locally.` });
    };

    const performSync = async () => {
        if (!siteA || !siteB) {
            addLog("Both sites must be configured before syncing.", 'error');
            return;
        }
        addLog(`Starting sync between ${siteA.url} and ${siteB.url}`);
        
        // This is where you would call the real API endpoints
        // For now, we simulate the process
        await new Promise(res => setTimeout(res, 2000));
        
        const newItems: SyncedItem[] = [];
        const random = Math.random();
        
        if (random < 0.3) {
            newItems.push({ id: `ord_${Date.now()}`, type: 'Order', description: 'New order #12345 synced.' });
        } else if (random < 0.6) {
            newItems.push({ id: `prod_${Date.now()}`, type: 'Product', description: 'Product "Cool Widget" updated.' });
        } else {
             newItems.push({ id: `rev_${Date.now()}`, type: 'Review', description: 'New 5-star review for "Awesome Gadget".' });
        }

        setSyncedItems(prev => [...newItems, ...prev]);
        addLog(`Successfully synced ${newItems.length} item(s).`, 'success');
    };


    const startSyncing = () => {
        if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
        setIsSyncing(true);
        addLog("Sync process started. Will run every 5 minutes.", "success");
        performSync(); // Run immediately
        syncIntervalRef.current = setInterval(performSync, 5 * 60 * 1000); // 5 minutes
    };
    
    const stopSyncing = () => {
        if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
        setIsSyncing(false);
        addLog("Sync process stopped.", "info");
    };

    useEffect(() => {
        return () => {
            if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
        }
    }, []);

    const SiteForm = ({ form, siteLabel, onSave, isConnected }: { form: any, siteLabel: 'A' | 'B', onSave: (data: SiteFormData) => void, isConnected: boolean }) => (
        <Card className={cn(isConnected && "border-green-500")}>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Site {siteLabel}</span>
                    {isConnected && <Badge variant="default" className="bg-green-600">Connected</Badge>}
                </CardTitle>
                <CardDescription>Enter the WooCommerce details for site {siteLabel}.</CardDescription>
            </CardHeader>
            <CardContent as="form" onSubmit={form.handleSubmit(onSave)} className="space-y-4">
                 <div className="space-y-2">
                    <Label>Website URL</Label>
                    <Input {...form.register('url')} placeholder="https://site-a.com" />
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
                <Button type="submit" className="w-full">Save Site {siteLabel}</Button>
            </CardContent>
        </Card>
    );

    const getIconForType = (type: SyncedItem['type']) => {
        switch(type) {
            case 'Order': return <ShoppingCart className="h-4 w-4" />;
            case 'Product': return <Package className="h-4 w-4" />;
            case 'Review': return <Star className="h-4 w-4" />;
            default: return null;
        }
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-headline font-bold">WooCommerce Sync</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Connect two WooCommerce sites to sync products, orders, and reviews in near real-time.
                </p>
            </div>

            <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important Security Note</AlertTitle>
                <AlertDescription>
                   API keys are stored in your browser's local storage and are not sent to our servers. This is for demonstration purposes. For production use, a secure backend storage solution is required.
                </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <SiteForm form={formA} siteLabel="A" onSave={(data) => handleSaveSite('A', data)} isConnected={!!siteA} />
                <SiteForm form={formB} siteLabel="B" onSave={(data) => handleSaveSite('B', data)} isConnected={!!siteB} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Sync Control Panel</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 flex flex-col items-center justify-center gap-4 p-6 bg-muted/50 rounded-lg">
                        <div className={cn("w-24 h-24 rounded-full flex items-center justify-center transition-colors", isSyncing ? "bg-green-500/20 text-green-500" : "bg-destructive/20 text-destructive")}>
                           {isSyncing ? <Power className="h-12 w-12" /> : <PowerOff className="h-12 w-12"/>}
                        </div>
                         <h3 className="text-2xl font-bold font-headline">{isSyncing ? "SYNCING ACTIVE" : "SYNC INACTIVE"}</h3>
                         <p className="text-sm text-muted-foreground text-center">
                            {isSyncing ? "Data is being synced automatically every 5 minutes." : "Sync is currently stopped."}
                        </p>
                         <div className="flex gap-2">
                           <Button onClick={startSyncing} disabled={isSyncing || !siteA || !siteB}>
                                {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Power className="h-4 w-4 mr-2" />}
                                Start Sync
                            </Button>
                            <Button onClick={stopSyncing} disabled={!isSyncing} variant="destructive">
                                <PowerOff className="h-4 w-4 mr-2" />
                                Stop Sync
                            </Button>
                        </div>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <div>
                             <h3 className="font-semibold mb-2">Sync Log</h3>
                            <ScrollArea className="h-40 w-full rounded-md border bg-muted/50 p-4">
                                <div className="flex flex-col gap-1 text-sm font-mono">
                                    {logs.map((log, i) => (
                                        <p key={i} className={cn(
                                            log.type === 'error' && 'text-destructive',
                                            log.type === 'success' && 'text-green-500',
                                        )}>
                                            [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                                        </p>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Recently Synced Items</h3>
                             <ScrollArea className="h-40 w-full rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Description</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {syncedItems.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center text-muted-foreground">
                                                    No items synced yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {syncedItems.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <Badge variant="secondary" className="flex items-center gap-1.5 w-fit">
                                                        {getIconForType(item.type)} {item.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{item.description}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
