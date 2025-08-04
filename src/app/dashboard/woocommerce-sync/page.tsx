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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Loader2, Power, PowerOff, CheckCircle2, Package, Star, ShoppingCart, GitCompare, AlertTriangle, ArrowRight, Trash2, Edit, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { performSync, type SyncLog, type SyncedItem } from './actions';


const siteSchema = z.object({
    url: z.string().url("Please enter a valid URL."),
    consumerKey: z.string().min(1, "Consumer Key is required."),
    consumerSecret: z.string().min(1, "Consumer Secret is required."),
});

export type SiteFormData = z.infer<typeof siteSchema>;

const SiteForm = ({ form, siteLabel, onSave, isConnected }: { form: any, siteLabel: 'A (Source)' | 'B (Destination)', onSave: (data: SiteFormData) => void, isConnected: boolean }) => (
    <Card className={cn(isConnected && "border-green-500")}>
        <CardHeader>
            <CardTitle className="flex justify-between items-center">
                <span>Site {siteLabel}</span>
                {isConnected && <Badge variant="default" className="bg-green-600">Connected</Badge>}
            </CardTitle>
            <CardDescription>Enter the WooCommerce details for site {siteLabel.charAt(0)}.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
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
                <Button type="submit" className="w-full">Save Site {siteLabel.charAt(0)}</Button>
            </form>
        </CardContent>
    </Card>
);


export default function WooCommerceSyncPage() {
    const { toast } = useToast();
    const [siteA, setSiteA] = useLocalStorage<SiteFormData | null>('wc-sync-site-a', null);
    const [siteB, setSiteB] = useLocalStorage<SiteFormData | null>('wc-sync-site-b', null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [logs, setLogs] = useState<SyncLog[]>([]);
    const [syncedItems, setSyncedItems] = useState<SyncedItem[]>([]);
    
    const formA = useForm<SiteFormData>({ resolver: zodResolver(siteSchema), defaultValues: siteA || { url: '', consumerKey: '', consumerSecret: '' }});
    const formB = useForm<SiteFormData>({ resolver: zodResolver(siteSchema), defaultValues: siteB || { url: '', consumerKey: '', consumerSecret: '' }});
    
    useEffect(() => {
        formA.reset(siteA || { url: '', consumerKey: '', consumerSecret: '' });
    }, [siteA, formA]);

    useEffect(() => {
        formB.reset(siteB || { url: '', consumerKey: '', consumerSecret: '' });
    }, [siteB, formB]);

    const addLog = (message: string, type: SyncLog['type'] = 'info') => {
        setLogs(prev => [{ timestamp: new Date().toISOString(), message, type }, ...prev].slice(0, 100));
    };
    
    const handleSaveSite = (site: 'A' | 'B', data: SiteFormData) => {
        if (site === 'A') setSiteA(data);
        else setSiteB(data);
        toast({ title: `Site ${site} Saved`, description: `Credentials for ${data.url} have been saved locally.` });
    };

    const runSync = async () => {
        if (!siteA || !siteB) {
            addLog("Both sites must be configured before syncing.", 'error');
            return;
        }
        setIsSyncing(true);
        setLogs([]);
        setSyncedItems([]);
        addLog(`Starting sync from ${siteA.url} to ${siteB.url}`);
        const results = await performSync(siteA, siteB);
        
        results.logs.forEach(log => addLog(log.message, log.type));
        
        if (results.syncedItems.length > 0) {
            setSyncedItems(prev => [...results.syncedItems, ...prev].slice(0, 50));
            addLog(`Successfully synced ${results.syncedItems.length} item(s).`, 'success');
        } else {
             addLog("No items needed syncing in this cycle.", 'info');
        }
        setIsSyncing(false);
    };

    const getIconForType = (type: SyncedItem['type']) => {
        switch(type) {
            case 'Order': return <ShoppingCart className="h-4 w-4" />;
            case 'Product': return <Package className="h-4 w-4" />;
            case 'Review': return <Star className="h-4 w-4" />;
            default: return null;
        }
    }
    
     const getIconForAction = (action: SyncedItem['action']) => {
        switch(action) {
            case 'Created': return <PlusCircle className="h-4 w-4 text-green-500" />;
            case 'Updated': return <Edit className="h-4 w-4 text-blue-500" />;
            case 'Deleted': return <Trash2 className="h-4 w-4 text-destructive" />;
            default: return null;
        }
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-headline font-bold">WooCommerce Site Mirroring</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Keep a staging or secondary site perfectly in sync with your production site. This tool mirrors products, orders, and reviews from a source site (A) to a destination site (B).
                </p>
            </div>

            <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Directional Sync: A to B</AlertTitle>
                <AlertDescription>
                   This is a one-way sync. It will make Site B an exact copy of Site A by creating, updating, and **deleting** data on Site B. Any data on Site B that is not on Site A will be removed. Use with caution.
                </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <SiteForm form={formA} siteLabel="A (Source)" onSave={(data) => handleSaveSite('A', data)} isConnected={!!siteA} />
                <SiteForm form={formB} siteLabel="B (Destination)" onSave={(data) => handleSaveSite('B', data)} isConnected={!!siteB} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Sync Control Panel</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 flex flex-col items-center justify-center gap-4 p-6 bg-muted/50 rounded-lg">
                         <div className="text-center">
                             <h3 className="text-xl font-bold font-headline">One-Way Mirror Sync</h3>
                             <p className="text-sm text-muted-foreground">Site A <ArrowRight className="inline-block mx-2 h-4 w-4"/> Site B</p>
                        </div>
                        <Button onClick={runSync} disabled={isSyncing || !siteA || !siteB} size="lg">
                            {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <GitCompare className="h-4 w-4 mr-2" />}
                            {isSyncing ? 'Syncing...' : 'Run Sync Now'}
                        </Button>
                         <p className="text-xs text-muted-foreground text-center">
                           Click to perform a full one-time sync.
                        </p>
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
                                            log.type === 'delete' && 'text-amber-600',
                                            log.type === 'create' && 'text-blue-500',
                                            log.type === 'update' && 'text-purple-500',
                                        )}>
                                            [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                                        </p>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Sync Activity</h3>
                             <ScrollArea className="h-40 w-full rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Action</TableHead>
                                            <TableHead>Description</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {syncedItems.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                    No sync activity yet.
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
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        {getIconForAction(item.action)} {item.action}
                                                    </div>
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
