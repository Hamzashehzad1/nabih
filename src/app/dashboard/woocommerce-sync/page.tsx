
// src/app/dashboard/woocommerce-sync/page.tsx
"use client";

import { useState, useEffect } from 'react';
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
import { Loader2, Power, PowerOff, CheckCircle2, Package, Star, ShoppingCart, Download, AlertTriangle, FileText, BadgePercent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportWooCommerceData, type ExportLog, type ExportResult } from './actions';


const siteSchema = z.object({
    url: z.string().url("Please enter a valid URL."),
    consumerKey: z.string().min(1, "Consumer Key is required."),
    consumerSecret: z.string().min(1, "Consumer Secret is required."),
});

export type SiteFormData = z.infer<typeof siteSchema>;

const SiteForm = ({ form, onSave, isConnected, onClear }: { form: any, onSave: (data: SiteFormData) => void, isConnected: boolean, onClear: () => void }) => (
    <Card className={cn(isConnected && "border-green-500")}>
        <CardHeader>
            <CardTitle className="flex justify-between items-center">
                <span>Source Site</span>
                {isConnected && <Badge variant="default" className="bg-green-600">Connected</Badge>}
            </CardTitle>
            <CardDescription>Enter the WooCommerce details for the site you want to export data from.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
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


export default function WooCommerceExporterPage() {
    const { toast } = useToast();
    const [sourceSite, setSourceSite] = useLocalStorage<SiteFormData | null>('wc-exporter-source', null);
    const [isExporting, setIsExporting] = useState(false);
    const [logs, setLogs] = useState<ExportLog[]>([]);
    const [exportedFiles, setExportedFiles] = useState<ExportResult['data'] | null>(null);
    const [dataTypes, setDataTypes] = useState({
        products: true,
        orders: true,
        reviews: true,
        coupons: true,
    });
    
    const form = useForm<SiteFormData>({ resolver: zodResolver(siteSchema), defaultValues: sourceSite || { url: '', consumerKey: '', consumerSecret: '' }});
    
    useEffect(() => {
        form.reset(sourceSite || { url: '', consumerKey: '', consumerSecret: '' });
    }, [sourceSite, form]);

    const addLog = (message: string, type: ExportLog['type'] = 'info') => {
        setLogs(prev => [{ timestamp: new Date().toISOString(), message, type }, ...prev].slice(0, 100));
    };
    
    const handleSaveSite = (data: SiteFormData) => {
        setSourceSite(data);
        toast({ title: "Source Site Saved", description: `Credentials for ${data.url} have been saved locally.` });
    };

    const runExport = async () => {
        if (!sourceSite) {
            addLog("Source site must be configured before exporting.", 'error');
            return;
        }
        setIsExporting(true);
        setLogs([]);
        setExportedFiles(null);
        addLog(`Starting export from ${sourceSite.url}`);
        const results = await exportWooCommerceData(sourceSite, dataTypes);
        
        results.logs.forEach(log => addLog(log.message, log.type));
        
        setExportedFiles(results.data);
        setIsExporting(false);
    };

    const downloadFile = (content: string | undefined, filename: string) => {
        if (!content) {
            toast({ title: 'No data to download', variant: 'destructive' });
            return;
        }
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-headline font-bold">WooCommerce Exporter</h1>
                <p className="text-muted-foreground max-w-2xl">
                   Export your products, orders, reviews, and coupons into an import-ready CSV format. Perfect for migrations or creating backups.
                </p>
            </div>

            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>How It Works</AlertTitle>
                <AlertDescription>
                   This tool fetches all public data for the selected types from your source site via the WooCommerce API and formats it into CSV files. You can then use these files with the native WooCommerce CSV importers on another site.
                </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-6">
                    <SiteForm 
                        form={form} 
                        onSave={handleSaveSite} 
                        isConnected={!!sourceSite} 
                        onClear={() => {
                            setSourceSite(null);
                            form.reset({ url: '', consumerKey: '', consumerSecret: '' });
                            toast({title: "Site Cleared"});
                        }}
                    />
                    <Card>
                        <CardHeader>
                            <CardTitle>Export Options</CardTitle>
                            <CardDescription>Select the data you wish to export.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                           {Object.keys(dataTypes).map(key => (
                               <div key={key} className="flex items-center space-x-2">
                                   <Checkbox 
                                        id={key}
                                        checked={dataTypes[key as keyof typeof dataTypes]}
                                        onCheckedChange={(checked) => setDataTypes(prev => ({...prev, [key]: !!checked}))}
                                    />
                                   <label htmlFor={key} className="text-sm font-medium capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                       {key}
                                    </label>
                               </div>
                           ))}
                        </CardContent>
                    </Card>
                </div>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Export Control Panel</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={runExport} disabled={isExporting || !sourceSite} size="lg">
                            {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Download className="h-4 w-4 mr-2" />}
                            {isExporting ? 'Exporting Data...' : 'Start Export'}
                        </Button>

                         <div className="mt-6 space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Export Log</h3>
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

                           {exportedFiles && (
                                <div>
                                    <h3 className="font-semibold mb-2">Downloads</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                       {exportedFiles.products && <Button variant="outline" onClick={() => downloadFile(exportedFiles.products, 'products.csv')}><Package className="mr-2"/> Products CSV</Button>}
                                       {exportedFiles.orders && <Button variant="outline" onClick={() => downloadFile(exportedFiles.orders, 'orders.csv')}><ShoppingCart className="mr-2"/> Orders CSV</Button>}
                                       {exportedFiles.reviews && <Button variant="outline" onClick={() => downloadFile(exportedFiles.reviews, 'reviews.csv')}><Star className="mr-2"/> Reviews CSV</Button>}
                                       {exportedFiles.coupons && <Button variant="outline" onClick={() => downloadFile(exportedFiles.coupons, 'coupons.csv')}><BadgePercent className="mr-2"/> Coupons CSV</Button>}
                                    </div>
                                </div>
                           )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
