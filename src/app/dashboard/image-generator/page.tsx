
// src/app/dashboard/image-generator/page.tsx
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  ListFilter,
  Search,
  PlusCircle,
  ImageIcon,
  Loader2,
  Trash2,
  Replace,
  FileText,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState, useMemo } from 'react';
import {
  getFeaturedImageQuery,
  getSectionImageQuery,
} from './actions';
import { Label } from '@/components/ui/label';

// Mock data as the blog generation is not connected to a DB
const mockPosts: any[] = [
  // In a real app, this would be fetched from a database
];

interface ImageState {
  featured: string | null;
  sections: { [key: string]: string | null };
}

interface Section {
  heading: string;
  paragraph: string;
}

function parseContent(html: string): {
  firstParagraph: string;
  sections: Section[];
  requiredImages: number;
} {
  const domParser =
    typeof window !== 'undefined' ? new window.DOMParser() : null;
  if (!domParser)
    return { firstParagraph: '', sections: [], requiredImages: 1 };
  const doc = domParser.parseFromString(html, 'text/html');
  const firstParagraph = doc.querySelector('p')?.textContent || '';
  const sections: Section[] = [];
  doc.querySelectorAll('h2, h3').forEach((header) => {
    const paragraph = header.nextElementSibling;
    if (
      header.textContent &&
      paragraph &&
      paragraph.tagName.toLowerCase() === 'p'
    ) {
      sections.push({
        heading: header.textContent,
        paragraph: paragraph.textContent || '',
      });
    }
  });
  return { firstParagraph, sections, requiredImages: sections.length + 1 };
}

export default function ImageGeneratorPage() {
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [images, setImages] = useState<ImageState>({
    featured: null,
    sections: {},
  });
  const [loading, setLoading] = useState<{
    featured: boolean;
    sections: { [key: string]: boolean };
  }>({ featured: false, sections: {} });

  const selectedPost = useMemo(
    () => mockPosts.find((p) => p.id === selectedPostId),
    [selectedPostId]
  );
  
  const { firstParagraph, sections, requiredImages } = useMemo(
    () => (selectedPost ? parseContent(selectedPost.content) : { firstParagraph: '', sections: [], requiredImages: 1 }),
    [selectedPost]
  );
  
  const generatedImagesCount = Object.values(images.sections).filter(Boolean).length + (images.featured ? 1 : 0);

  useEffect(() => {
    // Reset images when post changes
    setImages({ featured: null, sections: {} });
  }, [selectedPostId]);

  const generateImage = async (type: 'featured' | 'section', heading?: string) => {
    if (!selectedPost) return;

    setLoading(prev => ({ ...prev, [type === 'featured' ? 'featured' : 'sections']: { ...prev.sections, ...(heading && {[heading]: true}) } }));
    
    let query;
    if (type === 'featured') {
      query = await getFeaturedImageQuery(selectedPost.title, firstParagraph);
    } else if (heading) {
      const section = sections.find(s => s.heading === heading);
      if (section) {
        query = await getSectionImageQuery(section.heading, section.paragraph);
      }
    }
    
    if (query) {
      // Using a placeholder service that generates images from a query
      const imageUrl = `https://source.unsplash.com/600x400/?${encodeURIComponent(query)}`;
      if (type === 'featured') {
        setImages(prev => ({ ...prev, featured: imageUrl }));
      } else if (heading) {
        setImages(prev => ({ ...prev, sections: { ...prev.sections, [heading]: imageUrl } }));
      }
    }

    setLoading(prev => ({ ...prev, [type === 'featured' ? 'featured' : 'sections']: { ...prev.sections, ...(heading && {[heading]: false}) } }));
  };
  
  const deleteImage = (type: 'featured' | 'section', heading?: string) => {
    if (type === 'featured') {
      setImages(prev => ({ ...prev, featured: null }));
    } else if (heading) {
      setImages(prev => {
        const newSections = { ...prev.sections };
        delete newSections[heading];
        return { ...prev, sections: newSections };
      });
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Your Blog Posts</CardTitle>
            <CardDescription>
              Select a post to manage its images.
            </CardDescription>
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
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="not-completed">Not Completed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {mockPosts.length > 0 ? mockPosts.map((post) => {
                const postDetails = parseContent(post.content);
                // This is a mock progress, in a real app this would be persisted
                const generatedCount = post.id === selectedPostId ? generatedImagesCount : 0;

                return (
                  <Card
                    key={post.id}
                    className={`cursor-pointer ${
                      post.id === selectedPostId
                        ? 'border-primary'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPostId(post.id)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate">{post.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {post.date} - {generatedCount === postDetails.requiredImages ? "Completed" : "Not Completed"}
                      </p>
                      <div className="mt-2">
                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                          <span>Image Progress</span>
                          <span>
                            {generatedCount}/{postDetails.requiredImages}
                          </span>
                        </div>
                        <Progress
                          value={
                            (generatedCount / postDetails.requiredImages) * 100
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              }) : (
                 <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
                   <FileText className="mx-auto h-12 w-12" />
                   <h3 className="mt-4 text-lg font-semibold">No Posts Yet</h3>
                   <p className="mt-1 text-sm">Create and save a post in the Blog Generator to see it here.</p>
                 </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="min-h-[780px]">
          <CardHeader>
            <CardTitle>{selectedPost?.title || "Select a Post"}</CardTitle>
            <CardDescription>
              {selectedPost ? "Add, replace, or remove images for this post." : "Please select a post from the list on the left."}
            </CardDescription>
          </CardHeader>
          {selectedPost && (
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-semibold">Featured Image</Label>
                  {images.featured ? (
                    <Card className="mt-2 p-4">
                      <div className="relative">
                        <Image
                          src={images.featured}
                          width={600}
                          height={300}
                          alt="Featured Image"
                          className="rounded-md"
                          unoptimized
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => generateImage('featured')}>
                            <Replace className="mr-2 h-4 w-4" /> Replace
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteImage('featured')}>
                             <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card className="mt-2 p-4 flex flex-col items-center justify-center text-center border-dashed min-h-[200px]">
                      <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                      <h3 className="font-semibold">No Featured Image</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Click below to generate and add one.
                      </p>
                      <Button onClick={() => generateImage('featured')} disabled={loading.featured}>
                        {loading.featured ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <PlusCircle className="mr-2 h-4 w-4" />
                        )}
                        Add Featured Image
                      </Button>
                    </Card>
                  )}
                </div>

                <div
                  className="prose prose-sm dark:prose-invert prose-headings:font-headline max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                />

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Section Images</h3>
                  {sections.map((section) => (
                    <div key={section.heading}>
                      <Label className="font-medium">
                        Image for "{section.heading}"
                      </Label>
                      {images.sections[section.heading] ? (
                         <Card className="mt-2 p-4">
                           <div className="relative">
                               <Image src={images.sections[section.heading]!} width={600} height={300} alt={section.heading} className="rounded-md" unoptimized/>
                               <div className="absolute top-2 right-2 flex gap-2">
                                   <Button variant="outline" size="sm" onClick={() => generateImage('section', section.heading)}>
                                      <Replace className="mr-2 h-4 w-4" /> Replace
                                    </Button>
                                   <Button variant="destructive" size="sm" onClick={() => deleteImage('section', section.heading)}>
                                     <Trash2 className="mr-2 h-4 w-4" /> Delete
                                   </Button>
                               </div>
                           </div>
                        </Card>
                      ) : (
                        <Card className="mt-2 p-4 flex flex-col items-center justify-center text-center border-dashed min-h-[150px]">
                          <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                          <Button variant="secondary" size="sm" onClick={() => generateImage('section', section.heading)} disabled={loading.sections[section.heading]}>
                            {loading.sections[section.heading] ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <PlusCircle className="mr-2 h-4 w-4" />
                            )}
                             Add Image
                          </Button>
                        </Card>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Button size="lg">Save Changes</Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
