
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, FileText, ImageIcon, PlusCircle, RefreshCw, Edit } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useMemo } from "react";


interface BlogPost {
  id: string;
  title: string;
  content: string;
  date: string;
}

interface ImageState {
  featured: string | null;
  sections: { [key: string]: string | null };
}

interface WpSite {
    id: string;
    url: string;
    user: string;
}

export default function DashboardPage() {
    const [posts] = useLocalStorage<BlogPost[]>('blog-posts', []);
    const [images] = useLocalStorage<{[postId: string]: ImageState}>('post-images', {});
    const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);

    const totalImages = useMemo(() => {
        return Object.values(images).reduce((acc, postImages) => {
            const featuredCount = postImages.featured ? 1 : 0;
            const sectionCount = Object.values(postImages.sections).filter(Boolean).length;
            return acc + featuredCount + sectionCount;
        }, 0);
    }, [images]);

  const stats = [
    { title: "Blogs Generated", value: posts.length, icon: <FileText className="h-6 w-6 text-muted-foreground" /> },
    { title: "Images Added", value: totalImages, icon: <ImageIcon className="h-6 w-6 text-muted-foreground" /> },
    { title: "Connected Sites", value: sites.length, icon: <Globe className="h-6 w-6 text-muted-foreground" /> },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Welcome back!</h1>
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
            <CardTitle>Generated Blog Posts</CardTitle>
            <p className="text-sm text-muted-foreground pt-1">Here are the posts you've created.</p>
          </div>
           <Button asChild>
            <Link href="/dashboard/blog-generator">
              <PlusCircle className="mr-2 h-4 w-4" /> New Post
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {posts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post: any) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>{post.date}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/blog-editor/${post.id}`}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
              <FileText className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">No Posts Generated Yet</h3>
              <p className="mt-1 text-sm">Head over to the Blog Generator to create your first post.</p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/dashboard/blog-generator">Go to Blog Generator</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div >
            <CardTitle>Connected WordPress Sites</CardTitle>
            <p className="text-sm text-muted-foreground pt-1">Manage your sites or add a new one.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
                <RefreshCw className="mr-2 h-4 w-4" /> Sync from WordPress
            </Button>
            <Button asChild>
                <Link href="/dashboard/settings">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Site
                </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sites.length > 0 ? (
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
                {sites.map((site: any) => (
                  <TableRow key={site.url}>
                    <TableCell className="font-medium">{new URL(site.url).hostname}</TableCell>
                    <TableCell>
                      <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                        {site.url}
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                        Connected
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/dashboard/settings">Manage</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
              <Globe className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">No Connected Sites</h3>
              <p className="mt-1 text-sm">Connect your WordPress site in the settings page to publish your content directly.</p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/dashboard/settings">Go to Settings</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
