
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
import { Progress } from '@/components/ui/progress';
import {
  PlusCircle,
  ImageIcon,
  Loader2,
  Trash2,
  Replace,
  FileText,
} from 'lucide-react';
import Image from 'next/image';
import { useState, useMemo, useCallback } from 'react';
import {
  getFeaturedImageQuery,
  getSectionImageQuery,
} from './actions';
import { Label } from '@/components/ui/label';
import { useLocalStorage } from '@/hooks/use-local-storage';
import Link from 'next/link';

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

interface Section {
  heading: string;
  paragraph: string;
}

function parseContent(html: string): {
  firstParagraph: string;
  sections: Section[];
  requiredImages: number;
} {
  if (typeof window === 'undefined') {
    return { firstParagraph: '', sections: [], requiredImages: 1 };
  }
  const domParser = new window.DOMParser();
  const doc = domParser.parseFromString(html.replace(/<br\s*\/?>/gi, '\n'), 'text/html');
  
  const paragraphs = doc.querySelectorAll('p');
  const firstParagraph = paragraphs.length > 0 ? (paragraphs[0].textContent || '') : '';
  
  const sections: Section[] = [];
  doc.querySelectorAll('h2, h3').forEach((header) => {
    let nextElement = header.nextElementSibling;
    let paragraphText = '';
    
    // Concatenate all <p> tags until the next heading
    while (nextElement && (nextElement.tagName.toLowerCase() === 'p')) {
      paragraphText += (nextElement.textContent || '') + ' ';
      nextElement = nextElement.nextElementSibling;
    }

    if (header.textContent && paragraphText.trim()) {
      sections.push({
        heading: header.textContent,
        paragraph: paragraphText.trim(),
      });
    }
  });

  return { firstParagraph, sections, requiredImages: sections.length + 1 };
}


export default function ImageGeneratorPage() {
  const [posts] = useLocalStorage<BlogPost[]>('blog-posts', []);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [images, setImages] = useLocalStorage<{[postId: string]: ImageState}>('post-images', {});

  const [loading, setLoading] = useState<{
    featured: boolean;
    sections: { [key: string]: boolean };
  }>({ featured: false, sections: {} });

  const selectedPost = useMemo(
    () => posts.find((p) => p.id === selectedPostId),
    [selectedPostId, posts]
  );
  
  const currentPostImages = useMemo(() => {
    if (selectedPostId && images[selectedPostId]) {
      return images[selectedPostId];
    }
    return { featured: null, sections: {} };
  }, [selectedPostId, images]);


  const parsedContent = useMemo(
    () => (selectedPost ? parseContent(selectedPost.content) : { firstParagraph: '', sections: [], requiredImages: 1 }),
    [selectedPost]
  );
  
  const generatedImagesCount = Object.values(currentPostImages.sections).filter(Boolean).length + (currentPostImages.featured ? 1 : 0);

  const setPostImages = useCallback((updater: (prev: ImageState) => ImageState) => {
    if (!selectedPostId) return;
    setImages(prev => {
        const currentImages = prev[selectedPostId] || { featured: null, sections: {} };
        const newImages = updater(currentImages);
        return { ...prev, [selectedPostId]: newImages };
    });
  }, [selectedPostId, setImages]);

  const generateImage = useCallback(async (type: 'featured' | 'section', heading?: string) => {
    if (!selectedPost) return;

    if (type === 'featured') {
      setLoading(prev => ({ ...prev, featured: true }));
    } else if (heading) {
      setLoading(prev => ({ ...prev, sections: { ...prev.sections, [heading]: true } }));
    }

    let query;
    if (type === 'featured') {
      query = await getFeaturedImageQuery(selectedPost.title, parsedContent.firstParagraph);
    } else if (heading) {
      const section = parsedContent.sections.find(s => s.heading === heading);
      if (section) {
        query = await getSectionImageQuery(section.heading, section.paragraph);
      }
    }
    
    if (query) {
      const imageUrl = `https://source.unsplash.com/600x400/?${encodeURIComponent(query)}`;
      if (type === 'featured') {
        setPostImages(prev => ({ ...prev, featured: imageUrl }));
      } else if (heading) {
        setPostImages(prev => ({ ...prev, sections: { ...prev.sections, [heading]: imageUrl } }));
      }
    }

    if (type === 'featured') {
      setLoading(prev => ({ ...prev, featured: false }));
    } else if (heading) {
      setLoading(prev => ({ ...prev, sections: { ...prev.sections, [heading]: false } }));
    }
  }, [selectedPost, parsedContent, setPostImages]);
  
  const deleteImage = useCallback((type: 'featured' | 'section', heading?: string) => {
    if (type === 'featured') {
      setPostImages(prev => ({ ...prev, featured: null }));
    } else if (heading) {
      setPostImages(prev => {
        const newSections = { ...prev.sections };
        if (heading) {
          delete newSections[heading];
        }
        return { ...prev, sections: newSections };
      });
    }
  }, [setPostImages]);

  const renderedContent = useMemo(() => {
    if (!selectedPost) return null;
    return <div dangerouslySetInnerHTML={{ __html: selectedPost.content.replace(/\n/g, '<br />') }} />;
  }, [selectedPost]);

  const postDetailsMap = useMemo(() => {
    const map = new Map<string, { requiredImages: number, generatedCount: number }>();
    posts.forEach(post => {
      const details = parseContent(post.content);
      const postImages = images[post.id] || { featured: null, sections: {} };
      const generatedCount = Object.values(postImages.sections).filter(Boolean).length + (postImages.featured ? 1 : 0);
      map.set(post.id, { requiredImages: details.requiredImages, generatedCount });
    });
    return map;
  }, [posts, images]);

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
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {posts.length > 0 ? posts.map((post) => {
                const postDetails = postDetailsMap.get(post.id) || { requiredImages: 1, generatedCount: 0 };
                const { requiredImages, generatedCount } = postDetails;
                
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
                        {post.date} - {generatedCount === requiredImages ? "Completed" : "Not Completed"}
                      </p>
                      <div className="mt-2">
                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                          <span>Image Progress</span>
                          <span>
                            {generatedCount}/{requiredImages}
                          </span>
                        </div>
                        <Progress
                          value={
                            (generatedCount / requiredImages) * 100
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
                    <Button asChild size="sm" className="mt-4">
                        <Link href="/dashboard/blog-generator">Go to Blog Generator</Link>
                    </Button>
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
                  {currentPostImages.featured ? (
                    <Card className="mt-2 p-4">
                      <div className="relative">
                        <Image
                          src={currentPostImages.featured}
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
                  className="prose prose-sm dark:prose-invert prose-headings:font-headline max-w-none p-4 border rounded-md"
                >
                  {renderedContent}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Section Images</h3>
                  {parsedContent.sections.map((section) => (
                    <div key={section.heading}>
                      <Label className="font-medium">
                        Image for "{section.heading}"
                      </Label>
                      {currentPostImages.sections[section.heading] ? (
                         <Card className="mt-2 p-4">
                           <div className="relative">
                               <Image src={currentPostImages.sections[section.heading]!} width={600} height={300} alt={section.heading} className="rounded-md" unoptimized/>
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
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
