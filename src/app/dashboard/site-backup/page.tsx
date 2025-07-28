// src/app/dashboard/site-backup/page.tsx
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from 'next/link';
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Globe, Loader2, Database, AlertTriangle, Download, Trash2, History, PlusCircle } from "lucide-react";
import { fetchBackups, createBackup, restoreBackup, deleteBackup, type SiteBackup } from "./actions";

interface WpSite {
  id: string;
  url: string;
  user: string;
  appPassword?: string;
}

export default function SiteBackupPage() {
  const { toast } = useToast();
  const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isActionRunning, setIsActionRunning] = useState(false);
  const [actionProgress, setActionProgress] = useState(0);
  const [actionStatus, setActionStatus] = useState("");
  const [backups, setBackups] = useState<SiteBackup[]>([]);
  
  const selectedSite = useMemo(() => sites.find(s => s.id === selectedSiteId), [sites, selectedSiteId]);

  const handleFetchBackups = useCallback(async () => {
    if (!selectedSite?.appPassword) {
      toast({ title: "Error", description: "WordPress credentials not found.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const result = await fetchBackups(selectedSite.url, selectedSite.user, selectedSite.appPassword);
    if (result.success) {
      setBackups(result.data);
    } else {
      toast({title: "Error fetching backups", description: result.error, variant: 'destructive'});
    }
    setIsLoading(false);
  }, [selectedSite, toast]);
  
  useEffect(() => {
    if (selectedSiteId) {
      handleFetchBackups();
    } else {
      setBackups([]);
    }
  }, [selectedSiteId, handleFetchBackups]);

  const handleCreateBackup = async () => {
      if (!selectedSite?.appPassword) return;
      setIsActionRunning(true);
      setActionStatus("Starting backup...");
      
      const result = await createBackup(selectedSite.url, selectedSite.user, selectedSite.appPassword);
      
      if(result.success) {
          toast({title: "Backup In Progress", description: "Your site backup has started. This may take some time."});
          // Refresh backups to show the "in-progress" one
          handleFetchBackups();
      } else {
          toast({title: "Backup Failed to Start", description: result.error, variant: "destructive"});
      }

      setIsActionRunning(false);
      setActionStatus("");
  };
  
  const handleRestore = async (backupId: string) => {
      if (!selectedSite?.appPassword) return;
      setIsActionRunning(true);
      toast({title: "Restore Initialized", description: "Restoring your site. This may take several minutes."});
      const result = await restoreBackup(selectedSite.url, selectedSite.user, selectedSite.appPassword, backupId);
      setIsActionRunning(false);
      
      if(result.success) {
        toast({title: "Restore Complete!", description: "Your site has been restored to the selected backup."});
      } else {
        toast({title: "Restore Failed", description: result.error, variant: 'destructive'});
      }
  }

  const handleDelete = async (backupId: string) => {
      if (!selectedSite?.appPassword) return;
      const result = await deleteBackup(selectedSite.url, selectedSite.user, selectedSite.appPassword, backupId);
      if(result.success) {
        setBackups(prev => prev.filter(b => b.id !== backupId));
        toast({title: "Backup Deleted"});
      } else {
        toast({title: "Delete Failed", description: result.error, variant: 'destructive'});
      }
  }


  const renderSiteSelection = () => (
    <Card>
      <CardHeader>
        <CardTitle>1. Select a Site</CardTitle>
        <CardDescription>Choose the WordPress site you want to backup or restore.</CardDescription>
      </CardHeader>
      <CardContent>
        {sites.length === 0 ? (
          <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
            <Globe className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">Connect a Site to Begin</h3>
            <p className="mt-1 text-sm">Go to settings to connect your WordPress site.</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/dashboard/settings">Go to Settings</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sites.map(site => (
              <Card 
                key={site.id} 
                onClick={() => setSelectedSiteId(site.id)}
                className={cn("cursor-pointer hover:border-primary transition-colors", selectedSiteId === site.id && "border-primary ring-2 ring-primary")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    {new URL(site.url).hostname}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Site Backup & Restore</h1>
        <p className="text-muted-foreground max-w-2xl">
          Create full backups of your WordPress site, including files and database. Restore your site to a previous point in time with a single click.
        </p>
      </div>
      
      {!selectedSiteId ? renderSiteSelection() : (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Backups for: {new URL(selectedSite!.url).hostname}</CardTitle>
                <CardDescription>Manage your site backups below.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleCreateBackup} disabled={isActionRunning}>
                    {isActionRunning && actionProgress > 0 ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                    Create New Backup
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedSiteId(null)}>Change Site</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="warning" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Companion Plugin Required</AlertTitle>
                <AlertDescription>
                    This feature requires a custom backup plugin (e.g., UpdraftPlus with its REST API addon, or a custom-built solution) to be installed on your WordPress site to function correctly.
                </AlertDescription>
            </Alert>
             {isActionRunning && actionProgress > 0 && (
                 <div className="mb-4 space-y-2">
                    <p className="text-sm font-medium">{actionStatus}</p>
                    <Progress value={actionProgress} />
                 </div>
             )}
            {isLoading ? (
               <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
               </div>
            ) : backups.length === 0 && !isActionRunning ? (
                <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
                    <History className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">No Backups Found</h3>
                    <p className="mt-1 text-sm">Click "Create New Backup" to get started.</p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {backups.map(backup => (
                            <TableRow key={backup.id}>
                                <TableCell className="font-medium">
                                    {formatDistanceToNow(new Date(backup.date), { addSuffix: true })}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={backup.status === 'completed' ? 'default' : backup.status === 'in-progress' ? 'secondary' : 'destructive'}>
                                        {backup.status === 'in-progress' && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                        {backup.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{backup.size}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {backup.files} files, {backup.dbTables} tables
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                           <Button size="sm" variant="outline" disabled={isActionRunning || backup.status !== 'completed'}>
                                                <History className="mr-2 h-4 w-4"/>
                                                Restore
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Restoring a backup will overwrite your current site's files and database. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleRestore(backup.id)}>Yes, restore my site</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>

                                    <Button size="sm" variant="ghost" disabled={isActionRunning || backup.status !== 'completed'}>
                                        <Download className="mr-2 h-4 w-4"/>
                                        Download
                                    </Button>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="icon" variant="ghost" className="text-destructive" disabled={isActionRunning}>
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Backup?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the backup file. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(backup.id)} className={cn(buttonVariants({variant: 'destructive'}))}>Yes, delete it</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>

                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
