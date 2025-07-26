import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ListFilter, Search, PlusCircle, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

const mockPosts = [
  { id: 1, title: "10 Ways to Boost Your SEO in 2024", status: "Completed", date: "2024-05-20", images: 5, requiredImages: 5 },
  { id: 2, title: "The Ultimate Guide to Content Marketing", status: "Not Completed", date: "2024-05-18", images: 2, requiredImages: 6 },
  { id: 3, title: "Getting Started with AI-Powered Writing", status: "Draft", date: "2024-05-15", images: 0, requiredImages: 4 },
  { id: 4, title: "Why Your Business Needs a Blog", status: "Published", date: "2024-05-10", images: 3, requiredImages: 3 },
];

const mockPostContent = `
<h1>The Ultimate Guide to Content Marketing</h1>
<p>Content marketing is a strategic marketing approach focused on creating and distributing valuable, relevant, and consistent content to attract and retain a clearly defined audience — and, ultimately, to drive profitable customer action.</p>
<h2>Understanding Your Audience</h2>
<p>Before you write a single word, you need to know who you're writing for. Creating audience personas can help you tailor your content to the right people. Think about their goals, challenges, and what they want to learn.</p>
<h2>Keyword Research and SEO</h2>
<p>Good content is useless if no one can find it. This is where keyword research comes in. Use tools to find what your audience is searching for and build your content around those topics. This will improve your ranking on search engines.</p>
<h3>Long-tail vs. Short-tail Keywords</h3>
<p>Long-tail keywords are more specific and usually have less competition. For example, instead of targeting "marketing," target "content marketing strategies for small business." You'll attract a more qualified audience.</p>
`;

export default function ImageGeneratorPage() {
  const selectedPost = mockPosts[1];
  const selectedPostContentHtml = mockPostContent;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Your Blog Posts</CardTitle>
            <CardDescription>Select a post to manage its images.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search posts..." className="pl-8" />
              </div>
              <Select defaultValue="not-completed">
                <SelectTrigger className="w-[180px]">
                  <ListFilter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-completed">Not Completed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {mockPosts.map(post => (
                <Card key={post.id} className={`cursor-pointer ${post.id === selectedPost.id ? 'border-primary' : 'hover:border-primary/50'}`}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{post.title}</h3>
                    <p className="text-sm text-muted-foreground">{post.date} - {post.status}</p>
                    <div className="mt-2">
                      <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                        <span>Image Progress</span>
                        <span>{post.images}/{post.requiredImages}</span>
                      </div>
                      <Progress value={(post.images / post.requiredImages) * 100} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{selectedPost.title}</CardTitle>
            <CardDescription>Add, replace, or remove images for this post.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label className="text-lg font-semibold">Featured Image</Label>
                <Card className="mt-2 p-4 flex flex-col items-center justify-center text-center border-dashed min-h-[200px]">
                  <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="font-semibold">No Featured Image</h3>
                  <p className="text-sm text-muted-foreground mb-4">Click below to generate and add one.</p>
                  <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Featured Image</Button>
                </Card>
              </div>

              <div className="prose prose-sm dark:prose-invert prose-headings:font-headline max-w-none">
                <div dangerouslySetInnerHTML={{ __html: selectedPostContentHtml }} />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Section Images</h3>
                 <div>
                    <Label className="font-medium">Image for "Understanding Your Audience"</Label>
                     <Card className="mt-2 p-4 flex flex-col items-center justify-center text-center border-dashed min-h-[150px]">
                        <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                        <Button variant="secondary" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Image</Button>
                     </Card>
                 </div>
                 <div>
                    <Label className="font-medium">Image for "Keyword Research and SEO"</Label>
                     <Card className="mt-2 p-4">
                        <div className="relative">
                            <Image src="https://placehold.co/600x300.png" width={600} height={300} alt="SEO" className="rounded-md" data-ai-hint="keyword research"/>
                            <div className="absolute top-2 right-2 flex gap-2">
                                <Button variant="outline" size="sm">Replace</Button>
                                <Button variant="destructive" size="sm">Delete</Button>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">Image by Author via Pexels</p>
                     </Card>
                 </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button size="lg">Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
