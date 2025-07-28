// src/app/dashboard/plugin-management/page.tsx
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from 'next/link';
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Globe, Loader2, Puzzle, CheckCircle, AlertTriangle, ExternalLink, Download, MessageSquare, Power, LayoutGrid, Paintbrush, ShieldCheck, Database, RefreshCw, Upload, ToggleLeft, ToggleRight, Info, Eye } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { fetchPlugins, fetchThemes, togglePluginStatus, updatePlugin, activateTheme, updateTheme, type WpPlugin, type WpTheme } from "./actions";

interface WpSite {
  id: string;
  url: string;
  user: string;
  appPassword?: string;
}

export default function PluginManagementPage() {
  const { toast } = useToast();
  const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [plugins, setPlugins] = useState<WpPlugin[]>([]);
  const [themes, setThemes] = useState<WpTheme[]>([]);
  const [actionStates, setActionStates] = useState<{[key: string]: boolean}>({});
  
  const selectedSite = useMemo(() => sites.find(s => s.id === selectedSiteId), [sites, selectedSiteId]);

  const handleFetchData = useCallback(async () => {
    if (!selectedSite?.appPassword) {
      toast({ title: "Error", description: "WordPress credentials not found.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setPlugins([]);
    setThemes([]);
    
    try {
      const [pluginsResult, themesResult] = await Promise.all([
          fetchPlugins(selectedSite.url, selectedSite.user, selectedSite.appPassword),
          fetchThemes(selectedSite.url, selectedSite.user, selectedSite.appPassword)
      ]);

      if (pluginsResult.success) setPlugins(pluginsResult.data);
      else toast({ title: "Error fetching plugins", description: pluginsResult.error, variant: "destructive" });
      
      if (themesResult.success) setThemes(themesResult.data);
      else toast({ title: "Error fetching themes", description: themesResult.error, variant: "destructive" });

    } catch (error: any) {
      toast({ title: "Error", description: "Failed to fetch data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [selectedSite, toast]);
  
  useEffect(() => {
    if (selectedSiteId) {
      handleFetchData();
    } else {
      setPlugins([]);
      setThemes([]);
    }
  }, [selectedSiteId, handleFetchData]);

  const handleAction = async (action: 'togglePlugin' | 'updatePlugin' | 'activateTheme' | 'updateTheme', name: string, data?: any) => {
      if (!selectedSite?.appPassword) {
        toast({ title: "Error", description: "WordPress credentials not found.", variant: "destructive" });
        return;
      }
      setActionStates(prev => ({...prev, [name]: true}));
      
      let result;
      switch(action) {
          case 'togglePlugin':
              result = await togglePluginStatus(selectedSite.url, selectedSite.user, selectedSite.appPassword, name, data);
              if(result.success) {
                  toast({title: "Plugin status updated"});
                  handleFetchData(); // Refresh data
              } else {
                toast({title: "Error", description: result.error, variant: 'destructive'});
              }
              break;
          case 'updatePlugin':
              result = await updatePlugin(selectedSite.url, selectedSite.user, selectedSite.appPassword, name);
              if(result.success) {
                   toast({title: "Plugin update started"});
                   handleFetchData(); // Refresh data
              } else {
                 toast({title: "Error", description: result.error, variant: 'destructive'});
              }
              break;
          case 'activateTheme':
              result = await activateTheme(selectedSite.url, selectedSite.user, selectedSite.appPassword, name);
               if(result.success) {
                   toast({title: "Theme activated"});
                   handleFetchData(); // Refresh data
              } else {
                 toast({title: "Error", description: result.error, variant: 'destructive'});
              }
              break;
          case 'updateTheme':
              result = await updateTheme(selectedSite.url, selectedSite.user, selectedSite.appPassword, name);
               if(result.success) {
                   toast({title: "Theme update started"});
                   handleFetchData(); // Refresh data
              } else {
                 toast({title: "Error", description: result.error, variant: 'destructive'});
              }
              break;
      }
      
      setActionStates(prev => ({...prev, [name]: false}));
  };


  const renderSiteSelection = () => (
    <Card>
      <CardHeader>
        <CardTitle>1. Select a Site</CardTitle>
        <CardDescription>Choose the WordPress site you want to manage.</CardDescription>
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
        <h1 className="text-3xl font-headline font-bold">Plugin & Theme Management</h1>
        <p className="text-muted-foreground max-w-2xl">
          Remotely manage plugins and themes on your connected WordPress sites. Activate, deactivate, and update with a single click.
        </p>
      </div>
      
      {!selectedSiteId ? renderSiteSelection() : (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Manage: {new URL(selectedSite!.url).hostname}</CardTitle>
                <CardDescription>Perform actions on the plugins and themes installed on your site.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedSiteId(null)}>Change Site</Button>
            </div>
          </CardHeader>
          <CardContent>
             <Alert variant="warning" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Companion Plugin Required</AlertTitle>
                <AlertDescription>
                    This feature requires a custom companion plugin to be installed and activated on your WordPress site to function correctly.
                </AlertDescription>
            </Alert>
             {isLoading ? (
               <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
               </div>
            ) : (
                <Tabs defaultValue="plugins">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="plugins"><Puzzle className="mr-2 h-4 w-4"/> Plugins ({plugins.length})</TabsTrigger>
                        <TabsTrigger value="themes"><Paintbrush className="mr-2 h-4 w-4"/> Themes ({themes.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="plugins" className="mt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Plugin</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Version</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {plugins.map(plugin => (
                                    <TableRow key={plugin.name}>
                                        <TableCell>
                                            <p className="font-semibold">{plugin.name}</p>
                                            <p className="text-xs text-muted-foreground">by {plugin.author}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={plugin.status === 'active' ? 'default' : 'secondary'}>
                                                {plugin.status === 'active' ? <CheckCircle className="mr-1 h-3 w-3"/> : <Power className="mr-1 h-3 w-3"/>}
                                                {plugin.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{plugin.version}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {plugin.updateAvailable && (
                                                 <Button size="sm" variant="outline" onClick={() => handleAction('updatePlugin', plugin.plugin)} disabled={actionStates[plugin.name]}>
                                                    {actionStates[plugin.name] ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>}
                                                    Update to {plugin.updateVersion}
                                                </Button>
                                            )}
                                            <Button size="sm" onClick={() => handleAction('togglePlugin', plugin.plugin, plugin.status)} disabled={actionStates[plugin.name]}>
                                                {actionStates[plugin.name] && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                {plugin.status === 'active' ? 'Deactivate' : 'Activate'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TabsContent>
                    <TabsContent value="themes" className="mt-4">
                          <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Theme</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Version</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {themes.map(theme => (
                                    <TableRow key={theme.name}>
                                        <TableCell>
                                            <p className="font-semibold">{theme.name}</p>
                                            <p className="text-xs text-muted-foreground">by {theme.author}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={theme.status === 'active' ? 'default' : 'secondary'}>
                                                {theme.status === 'active' ? <CheckCircle className="mr-1 h-3 w-3"/> : <Power className="mr-1 h-3 w-3"/>}
                                                {theme.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{theme.version}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {theme.updateAvailable && (
                                                <Button size="sm" variant="outline" onClick={() => handleAction('updateTheme', theme.theme)} disabled={actionStates[theme.name]}>
                                                    {actionStates[theme.name] ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>}
                                                    Update to {theme.updateVersion}
                                                </Button>
                                            )}
                                            {theme.status === 'inactive' && (
                                                <Button size="sm" onClick={() => handleAction('activateTheme', theme.theme)} disabled={actionStates[theme.name]}>
                                                    {actionStates[theme.name] && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                    Activate
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TabsContent>
                </Tabs>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
