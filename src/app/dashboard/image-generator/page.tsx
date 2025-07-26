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
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState, useMemo } from 'react';
import {
  getFeaturedImageQuery,
  getSectionImageQuery,
} from './actions';
import { Label } from '@/components/ui/label';

// Mock data as the blog generation is not connected to a DB
const mockPosts = [
  {
    id: 1,
    title: '10 Ways to Boost Your SEO in 2024',
    status: 'Completed',
    date: '2024-05-20',
    content: `<h1>10 Ways to Boost Your SEO in 2024</h1>
    <p>Search engine optimization (SEO) is an ever-evolving field. To stay ahead of the curve, you need to adapt your strategy. Here are 10 ways to boost your SEO in 2024.</p>
    <h2>1. Focus on User Experience</h2><p>Google's algorithm increasingly prioritizes pages that offer a great user experience. This means fast load times, mobile-friendliness, and intuitive navigation are more important than ever.</p>
    <h2>2. Create High-Quality, Authoritative Content</h2><p>Content is still king. Focus on creating in-depth, well-researched articles that fully answer a user's query. This establishes your site as an authority in your niche.</p>`,
  },
  {
    id: 2,
    title: 'The Ultimate Guide to Content Marketing',
    status: 'Not Completed',
    date: '2024-05-18',
    content: `<h1>The Ultimate Guide to Content Marketing</h1>
    <p>Content marketing is a strategic marketing approach focused on creating and distributing valuable, relevant, and consistent content to attract and retain a clearly defined audience — and, ultimately, to drive profitable customer action.</p>
    <h2>Understanding Your Audience</h2>
    <p>Before you write a single word, you need to know who you're writing for. Creating audience personas can help you tailor your content to the right people. Think about their goals, challenges, and what they want to learn.</p>
    <h2>Keyword Research and SEO</h2>
    <p>Good content is useless if no one can find it. This is where keyword research comes in. Use tools to find what your audience is searching for and build your content around those topics. This will improve your ranking on search engines.</p>
    <h3>Long-tail vs. Short-tail Keywords</h3>
    <p>Long-tail keywords are more specific and usually have less competition. For example, instead of targeting "marketing," target "content marketing strategies for small business." You'll attract a more qualified audience.</p>`,
  },
  {
    id: 3,
    title: 'Getting Started with AI-Powered Writing',
    status: 'Draft',
    date: '2024-05-15',
    content: `<h1>Getting Started with AI-Powered Writing</h1><p>AI writing assistants are transforming how we create content. From brainstorming ideas to drafting entire articles, these tools can significantly speed up the writing process.</p><h2>Choosing the Right Tool</h2><p>There are many AI writing tools available, each with its own strengths. Consider factors like ease of use, output quality, and integration capabilities when making your choice.</p>`,
  },
  {
    id: 4,
    title: 'Why Your Business Needs a Blog',
    status: 'Published',
    date: '2024-05-10',
    content: `<h1>Why Your Business Needs a Blog</h1><p>A blog is one of the most powerful marketing tools for any business. It helps you attract organic traffic, build authority, and connect with your audience on a deeper level.</p><h2>Drive Traffic to Your Website</h2><p>Every blog post you publish is another indexed page on your website, which means another opportunity to show up in search engine results and drive traffic to your site.</p>`,
  },
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
  const [selectedPostId, setSelectedPostId] = useState(mockPosts[1].id);
  const [images, setImages] = useState<ImageState>({
    featured: null,
    sections: {},
  });
  const [loading, setLoading] = useState<{
    featured: boolean;
    sections: { [key: string]: boolean };
  }>({ featured: false, sections: {} });

  const selectedPost = useMemo(
    () => mockPosts.find((p) => p.id === selectedPostId)!,
    [selectedPostId]
  );
  const { firstParagraph, sections, requiredImages } = useMemo(
    () => parseContent(selectedPost.content),
    [selectedPost]
  );
  
  const generatedImagesCount = Object.values(images.sections).filter(Boolean).length + (images.featured ? 1 : 0);

  useEffect(() => {
    // Reset images when post changes
    setImages({ featured: null, sections: {} });
  }, [selectedPostId]);

  const generateImage = async (type: 'featured' | 'section', heading?: string) => {
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
              {mockPosts.map((post) => {
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
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{selectedPost.title}</CardTitle>
            <CardDescription>
              Add, replace, or remove images for this post.
            </CardDescription>
          </CardHeader>
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
        </Card>
      </div>
    </div>
  );
}
