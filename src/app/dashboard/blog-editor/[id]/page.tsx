
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  date: string;
}

export default function BlogEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [posts, setPosts] = useLocalStorage<BlogPost[]>("blog-posts", []);
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    const postToEdit = posts.find((p) => p.id === id);
    if (postToEdit) {
      setPost(postToEdit);
      setTitle(postToEdit.title);
      setContent(postToEdit.content);
    } else {
        // Optionally handle case where post is not found
        toast({
            title: "Post not found",
            description: "Could not find the post you were looking for.",
            variant: "destructive"
        })
        router.push('/dashboard');
    }
  }, [id, posts, router, toast]);

  const handleSave = () => {
    if (!post) return;
    setIsSaving(true);
    
    // Simulate save operation
    setTimeout(() => {
        const updatedPost = { ...post, title, content };
        const updatedPosts = posts.map((p) => (p.id === id ? updatedPost : p));
        setPosts(updatedPosts);
        setIsSaving(false);
        toast({
            title: "Post Saved",
            description: "Your changes have been saved successfully."
        });
    }, 1000);
  };

  if (!post) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <div>
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Button>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Edit Blog Post</CardTitle>
          <CardDescription>Make changes to your post below. Changes are saved locally.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Post Title</Label>
            <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Post Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] prose prose-sm dark:prose-invert"
            />
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
