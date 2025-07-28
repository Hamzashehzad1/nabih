
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, FileText, ImageIcon, PlusCircle, ArrowRight, Edit, Settings, Activity, Smartphone } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
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
  sections: { [key:string]: string | null };
}

interface WpSite {
    id: string;
    url: string;
    user: string;
}

export default function DashboardPage() {
    const [posts] = useLocalStorage<BlogPost[]>("blog-posts", []);
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
  
  const quickActions = [
      { title: "Create New Post", description: "Use the AI blog generator.", href: "/dashboard/blog-generator", icon: <PlusCircle/> },
      { title: "Generate Images", description: "Find or create images for posts.", href: "/dashboard/image-generator", icon: <ImageIcon/> },
      { title: "Audit a Website", description: "Check performance and SEO.", href: "/dashboard/website-audit", icon: <Activity/> },
      { title: "Test Responsiveness", description: "Check your site on mockups.", href: "/dashboard/responsiveness-checker", icon: <Smartphone/> },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Here's a snapshot of your content empire. Ready to create?</p>
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
      
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map(action => (
             <Card key={action.title} className="flex flex-col">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-md">
                           {action.icon}
                        </div>
                        <CardTitle className="text-lg">{action.title}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
                <div className="p-6 pt-0">
                    <Button asChild variant="outline" className="w-full">
                        <Link href={action.href}>
                            Go to Tool <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </Card>
          ))}
       </div>

       <Card>
        <CardHeader>
            <CardTitle>Recent Blog Posts</CardTitle>
            <CardDescription>Here are the latest posts you've saved locally.</CardDescription>
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
                {posts.slice(0, 5).map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>{post.date}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
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

    </div>
  );
}
