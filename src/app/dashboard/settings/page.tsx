

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Globe, Trash2, Loader2 } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ApiKeys {
    gemini: string;
    pexels: string;
    unsplash: string;
}

interface WpSite {
    id: string;
    url: string;
    user: string;
    appPassword?: string;
}

export default function SettingsPage() {
    const { toast } = useToast();
    const [apiKeys, setApiKeys] = useLocalStorage<ApiKeys>('api-keys', { gemini: '', pexels: '', unsplash: '' });
    const [imageFormat, setImageFormat] = useLocalStorage<string>('image-format', 'jpeg');
    const [sites, setSites] = useLocalStorage<WpSite[]>('wp-sites', []);

    const [currentApiKeys, setCurrentApiKeys] = useState<ApiKeys>(apiKeys);
    const [newSiteUrl, setNewSiteUrl] = useState('');
    const [newSiteUser, setNewSiteUser] = useState('');
    const [newSitePassword, setNewSitePassword] = useState('');

    const [isSavingKeys, setIsSavingKeys] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);


    const handleSaveApiKeys = () => {
        setIsSavingKeys(true);
        setTimeout(() => {
            setApiKeys(currentApiKeys);
            setIsSavingKeys(false);
            toast({ title: 'API Keys Saved', description: 'Your API keys have been saved locally.' });
        }, 1000);
    };

    const handleConnectSite = () => {
        if (!newSiteUrl || !newSiteUser || !newSitePassword) {
            toast({ title: 'Missing Fields', description: 'Please fill all website fields.', variant: 'destructive'});
            return;
        }
        setIsConnecting(true);
        setTimeout(() => {
            const newSite: WpSite = {
                id: new Date().toISOString(),
                url: newSiteUrl,
                user: newSiteUser,
                appPassword: newSitePassword, // Storing password in local storage is not secure for production
            };
            setSites([...sites, newSite]);
            setIsConnecting(false);
            setNewSiteUrl('');
            setNewSiteUser('');
            setNewSitePassword(''); // Clear password field after adding
            toast({ title: 'Site Connected', description: `${newSite.url} has been connected.` });
        }, 1500);
    };
    
    const handleDeleteSite = (id: string) => {
        setSites(sites.filter(site => site.id !== id));
        toast({ title: 'Site Removed', description: 'The WordPress site connection has been removed.' });
    };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure Nabih to work your way. Settings are saved to your browser.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Manage your API keys for third-party services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="gemini-key">Gemini API Key</Label>
            <Input id="gemini-key" type="password" placeholder="Enter your Gemini API key" value={currentApiKeys.gemini} onChange={(e) => setCurrentApiKeys({...currentApiKeys, gemini: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pexels-key">Pexels API Key</Label>
            <Input id="pexels-key" type="password" placeholder="Enter your Pexels API key" value={currentApiKeys.pexels} onChange={(e) => setCurrentApiKeys({...currentApiKeys, pexels: e.target.value})}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unsplash-key">Unsplash API Key</Label>
            <Input id="unsplash-key" type="password" placeholder="Enter your Unsplash Access Key" value={currentApiKeys.unsplash} onChange={(e) => setCurrentApiKeys({...currentApiKeys, unsplash: e.target.value})}/>
          </div>
          <Button onClick={handleSaveApiKeys} disabled={isSavingKeys}>
            {isSavingKeys && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save API Keys
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Image Settings</CardTitle>
          <CardDescription>Choose the default format for generated images.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={imageFormat} onValueChange={setImageFormat} className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="jpeg" id="jpeg" />
              <Label htmlFor="jpeg">JPEG</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="png" id="png" />
              <Label htmlFor="png">PNG</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="webp" id="webp" />
              <Label htmlFor="webp">WebP</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Connect WordPress Site</CardTitle>
          <CardDescription>Add a new WordPress site to publish your content to. Storing passwords here is insecure; this is for prototype purposes only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="wp-url">Website URL</Label>
            <Input id="wp-url" placeholder="https://yourblog.com" value={newSiteUrl} onChange={(e) => setNewSiteUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wp-user">WordPress Username</Label>
            <Input id="wp-user" placeholder="Your WordPress username" value={newSiteUser} onChange={(e) => setNewSiteUser(e.target.value)}/>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="wp-password">Application Password</Label>
              <InfoTooltip info="Generate an application password in your WordPress user profile under 'Application Passwords'." />
            </div>
            <Input id="wp-password" type="password" placeholder="Enter your application password" value={newSitePassword} onChange={(e) => setNewSitePassword(e.target.value)}/>
          </div>
          <Button onClick={handleConnectSite} disabled={isConnecting}>
            {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect Site
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected Sites</CardTitle>
          <CardDescription>Your currently connected WordPress sites.</CardDescription>
        </CardHeader>
        <CardContent>
            {sites.length > 0 ? (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Site URL</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {sites.map((site) => (
                        <TableRow key={site.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                                {site.url}
                            </a>
                        </TableCell>
                        <TableCell>{site.user}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteSite(site.id)}>
                            <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
                    <p>You haven't connected any WordPress sites yet.</p>
                </div>
            )}
        </CardContent>
      </Card>

    </div>
  );
}
