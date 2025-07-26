import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Globe, Trash2 } from "lucide-react";

const connectedSites = [
  { name: "My Awesome Blog", url: "https://awesomeblog.com" },
  { name: "Tech Weekly", url: "https://techweekly.dev" },
  { name: "Foodie Adventures", url: "https://foodieadventures.net" },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure Content Forge to work your way.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Manage your API keys for third-party services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="gemini-key">Gemini API Key</Label>
            <Input id="gemini-key" type="password" placeholder="Enter your Gemini API key" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pexels-key">Pexels API Key</Label>
            <Input id="pexels-key" type="password" placeholder="Enter your Pexels API key" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unsplash-key">Unsplash API Key</Label>
            <Input id="unsplash-key" type="password" placeholder="Enter your Unsplash Access Key" />
          </div>
          <Button>Save API Keys</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Image Settings</CardTitle>
          <CardDescription>Choose the default format for generated images.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup defaultValue="jpeg" className="flex flex-col space-y-2">
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
          <CardDescription>Add a new WordPress site to publish your content to.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="wp-url">Website URL</Label>
            <Input id="wp-url" placeholder="https://yourblog.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wp-user">WordPress Username</Label>
            <Input id="wp-user" placeholder="Your WordPress username" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="wp-password">Application Password</Label>
              <InfoTooltip info="Generate an application password in your WordPress user profile under 'Application Passwords'." />
            </div>
            <Input id="wp-password" type="password" placeholder="Enter your application password" />
          </div>
          <Button>Connect Site</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected Sites</CardTitle>
          <CardDescription>Your currently connected WordPress sites.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connectedSites.map((site) => (
                <TableRow key={site.url}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    {site.name}
                  </TableCell>
                  <TableCell>
                    <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                      {site.url}
                    </a>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
