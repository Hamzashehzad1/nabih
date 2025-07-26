import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, FileText, ImageIcon, PlusCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

const stats = [
  { title: "Blogs Generated", value: "42", icon: <FileText className="h-6 w-6 text-muted-foreground" /> },
  { title: "Images Added", value: "128", icon: <ImageIcon className="h-6 w-6 text-muted-foreground" /> },
  { title: "Connected Sites", value: "3", icon: <Globe className="h-6 w-6 text-muted-foreground" /> },
];

const connectedSites = [
  { name: "My Awesome Blog", url: "https://awesomeblog.com", status: "Connected" },
  { name: "Tech Weekly", url: "https://techweekly.dev", status: "Connected" },
  { name: "Foodie Adventures", url: "https://foodieadventures.net", status: "Connected" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Welcome back, User!</h1>
        <p className="text-muted-foreground">Here's a snapshot of your content empire.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div >
            <CardTitle>Connected WordPress Sites</CardTitle>
            <p className="text-sm text-muted-foreground pt-1">Manage your sites or add a new one.</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/settings">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Site
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connectedSites.map((site) => (
                <TableRow key={site.url}>
                  <TableCell className="font-medium">{site.name}</TableCell>
                  <TableCell>
                    <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                      {site.url}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                      {site.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Manage</Button>
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
