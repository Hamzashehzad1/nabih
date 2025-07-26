
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
  Globe,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import Image from 'next/image';
import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  getFeaturedImage,
  getSectionImage,
  fetchPostsFromWp,
  type WpPost,
} from './actions';
import { Label } from '@/components/ui/label';
import { useLocalStorage } from '@/hooks/use-local-storage';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface ImageState {
  featured: string | null;
  sections: { [key: string]: string | null };
}

interface Section {
  heading: string;
  paragraph: string;
}

interface WpSite {
  id: string;
  url: string;
  user: string;
  appPassword?: string; // App password should be stored securely
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
  const doc = domParser.parseFromString(
    html.replace(/<br\s*\/?>/gi, '\n'),
    'text/html'
  );

  const paragraphs = Array.from(doc.querySelectorAll('p'));
  const firstParagraph =
    paragraphs.length > 0 ? paragraphs[0].textContent || '' : '';

  const sections: Section[] = [];
  doc.querySelectorAll('h2, h3').forEach((header) => {
    let nextElement = header.nextElementSibling;
    let paragraphText = '';

    while (nextElement && nextElement.tagName.toLowerCase() === 'p') {
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
  const { toast } = useToast();
  const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);
  const [posts, setPosts] = useState<WpPost[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [images, setImages] = useLocalStorage<{ [postId: string]: ImageState }>(
    'post-images',
    {}
  );
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'pending'>('all');
  const [isFetchingPosts, setIsFetchingPosts] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  const handleFetchPosts = useCallback(async (page = 1, refresh = false) => {
    if (sites.length === 0) return;
    setIsFetchingPosts(true);
    if (refresh) {
      setPosts([]);
      setSelectedPostId(null);
      setFetchError(null);
      setHasMorePosts(true);
    }
    
    // In a real app, you might fetch from one site or all sites.
    // For this prototype, we'll fetch from the first connected site.
    const siteToFetch = sites[0];
    if (!siteToFetch.appPassword) {
      setFetchError("Application password not found for this site. Please add it in Settings.");
      setIsFetchingPosts(false);
      return;
    }
    
    const result = await fetchPostsFromWp(siteToFetch.url, siteToFetch.user, siteToFetch.appPassword, page);

    if (result.success) {
        if(result.data.length === 0){
            setHasMorePosts(false);
        } else {
            setPosts(prev => refresh ? result.data : [...prev, ...result.data]);
            setCurrentPage(page);
        }
    } else {
      setFetchError(result.error);
      toast({
        title: "Failed to Fetch Posts",
        description: result.error,
        variant: "destructive"
      })
    }
    setIsFetchingPosts(false);
  }, [sites, toast]);

  useEffect(() => {
    handleFetchPosts(1, true);
  }, [handleFetchPosts]);

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
    () =>
      selectedPost
        ? parseContent(selectedPost.content)
        : { firstParagraph: '', sections: [], requiredImages: 1 },
    [selectedPost]
  );

  const postDetailsMap = useMemo(() => {
    const map = new Map<
      string,
      { requiredImages: number; generatedCount: number }
    >();
    posts.forEach((post) => {
      const details = parseContent(post.content);
      const postImages = images[post.id] || {
        featured: null,
        sections: {},
      };
      const generatedCount =
        Object.values(postImages.sections).filter(Boolean).length +
        (postImages.featured ? 1 : 0);
      map.set(post.id, {
        requiredImages: details.requiredImages,
        generatedCount,
      });
    });
    return map;
  }, [posts, images]);

  const setPostImages = useCallback(
    (updater: (prev: ImageState) => ImageState) => {
      if (!selectedPostId) return;
      setImages((prev) => {
        const currentImages = prev[selectedPostId] || {
          featured: null,
          sections: {},
        };
        const newImages = updater(currentImages);
        return { ...prev, [selectedPostId]: newImages };
      });
    },
    [selectedPostId, setImages]
  );

  const generateImage = useCallback(
    async (type: 'featured' | 'section', heading?: string) => {
      if (!selectedPost) return;

      const setLoadingState = (isLoading: boolean) => {
        if (type === 'featured') {
          setLoading((prev) => ({ ...prev, featured: isLoading }));
        } else if (heading) {
          setLoading((prev) => ({
            ...prev,
            sections: { ...prev.sections, [heading]: isLoading },
          }));
        }
      };

      setLoadingState(true);

      let imageUrl;
      if (type === 'featured') {
        imageUrl = await getFeaturedImage(
          selectedPost.title,
          parsedContent.firstParagraph
        );
      } else if (heading) {
        const section = parsedContent.sections.find(
          (s) => s.heading === heading
        );
        if (section) {
          imageUrl = await getSectionImage(
            section.heading,
            section.paragraph
          );
        }
      }

      if (imageUrl) {
        if (type === 'featured') {
          setPostImages((prev) => ({ ...prev, featured: imageUrl }));
        } else if (heading) {
          setPostImages((prev) => ({
            ...prev,
            sections: { ...prev.sections, [heading]: imageUrl },
          }));
        }
      }

      setLoadingState(false);
    },
    [selectedPost, parsedContent, setPostImages]
  );

  const deleteImage = useCallback(
    (type: 'featured' | 'section', heading?: string) => {
      if (!selectedPostId) return { featured: null, sections: {} };
      setPostImages((prev) => {
        if (type === 'featured') {
          return { ...prev, featured: null };
        } else if (heading) {
          const newSections = { ...prev.sections };
          delete newSections[heading];
          return { ...prev, sections: newSections };
        }
        return prev;
      });
    },
    [selectedPostId, setPostImages]
  );

  const renderedContent = useMemo(() => {
    if (!selectedPost) return null;
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: selectedPost.content.replace(/\n/g, '<br />'),
        }}
      />
    );
  }, [selectedPost]);

  const filteredPosts = useMemo(() => {
    if (filter === 'all') return posts;
    if (filter === 'published') return posts.filter((p) => p.status === 'publish');
    if (filter === 'draft') return posts.filter((p) => p.status === 'draft' || p.status === 'pending');
    if (filter === 'pending') return posts.filter((p) => p.status === 'pending');
    return posts;
  }, [posts, filter]);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
             <div className="flex justify-between items-center">
                 <div>
                    <CardTitle>Your Blog Posts</CardTitle>
                    <CardDescription>
                      Select a post to manage its images.
                    </CardDescription>
                 </div>
                 <Button onClick={() => handleFetchPosts(1, true)} size="icon" variant="outline" disabled={isFetchingPosts}>
                    {isFetchingPosts && posts.length === 0 ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4" />}
                 </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as any)}
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="space-y-2 max-h-[600px] overflow-y-auto mt-4 p-1">
              {isFetchingPosts && posts.length === 0 && (
                <div className="text-center text-muted-foreground p-8">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                  <h3 className="mt-4 text-lg font-semibold">Fetching Posts...</h3>
                </div>
              )}
              {!isFetchingPosts && sites.length === 0 && (
                <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
                  <Globe className="mx-auto h-12 w-12" />
                  <h3 className="mt-4 text-lg font-semibold">
                    Connect a Site to Fetch Posts
                  </h3>
                  <p className="mt-1 text-sm">
                    Connect your WordPress site in settings to fetch your posts.
                  </p>
                  <Button asChild size="sm" className="mt-4">
                    <Link href="/dashboard/settings">Go to Settings</Link>
                  </Button>
                </div>
              )}
              {!isFetchingPosts && fetchError && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4"/>
                    <AlertTitle>Error Fetching Posts</AlertTitle>
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
              )}
              {!isFetchingPosts && !fetchError && filteredPosts.length > 0
                ? (
                    <>
                    {filteredPosts.map((post) => {
                        const postDetails = postDetailsMap.get(post.id) || {
                        requiredImages: 1,
                        generatedCount: 0,
                        };
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
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold truncate pr-2">
                                {post.title}
                                </h3>
                                <Badge
                                variant={
                                    post.status === 'publish'
                                    ? 'default'
                                    : 'secondary'
                                }
                                className="capitalize"
                                >
                                {post.status}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {new URL(post.siteUrl).hostname} - {post.date}
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
                                    (generatedCount / (requiredImages || 1)) * 100
                                }
                                />
                            </div>
                            </CardContent>
                        </Card>
                        );
                    })}
                    {hasMorePosts && (
                        <Button
                            variant="outline"
                            className="w-full mt-4"
                            onClick={() => handleFetchPosts(currentPage + 1)}
                            disabled={isFetchingPosts}
                        >
                            {isFetchingPosts ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Load More'}
                        </Button>
                    )}
                    </>
                )
                : !isFetchingPosts && !fetchError && sites.length > 0 && (
                    <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md mt-4">
                      <FileText className="mx-auto h-12 w-12" />
                      <h3 className="mt-4 text-lg font-semibold">
                        No Posts Found
                      </h3>
                      <p className="mt-1 text-sm">
                        No {filter} posts were found on the connected site.
                      </p>
                    </div>
                  )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="min-h-[780px]">
          <CardHeader>
            <CardTitle>{selectedPost?.title || 'Select a Post'}</CardTitle>
            <CardDescription>
              {selectedPost
                ? 'Add, replace, or remove images for this post.'
                : 'Please select a post from the list on the left.'}
            </CardDescription>
          </CardHeader>
          {selectedPost && (
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-semibold">
                    Featured Image
                  </Label>
                  {currentPostImages.featured ? (
                    <Card className="mt-2 p-4">
                      <div className="relative">
                        <Image
                          src={currentPostImages.featured}
                          width={600}
                          height={300}
                          alt="Featured Image"
                          className="rounded-md"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateImage('featured')}
                          >
                            {loading.featured ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Replace className="mr-2 h-4 w-4" />
                            )}
                            Replace
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteImage('featured')}
                          >
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
                      <Button
                        onClick={() => generateImage('featured')}
                        disabled={loading.featured}
                      >
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

                <div className="prose prose-sm dark:prose-invert prose-headings:font-headline max-w-none p-4 border rounded-md max-h-60 overflow-y-auto">
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
                            <Image
                              src={
                                currentPostImages.sections[section.heading]!
                              }
                              width={600}
                              height={300}
                              alt={section.heading}
                              className="rounded-md"
                            />
                            <div className="absolute top-2 right-2 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  generateImage('section', section.heading)
                                }
                                disabled={loading.sections[section.heading]}
                              >
                                {loading.sections[section.heading] ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Replace className="mr-2 h-4 w-4" />
                                )}
                                Replace
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  deleteImage('section', section.heading)
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ) : (
                        <Card className="mt-2 p-4 flex flex-col items-center justify-center text-center border-dashed min-h-[150px]">
                          <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              generateImage('section', section.heading)
                            }
                            disabled={loading.sections[section.heading]}
                          >
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
           {!selectedPost && (
             <CardContent>
                <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md min-h-[400px] flex flex-col justify-center items-center">
                    <FileText className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">
                        Select a Post
                    </h3>
                    <p className="mt-1 text-sm">
                        Please select a post from the list on the left to start adding images.
                    </p>
                </div>
             </CardContent>
           )}
        </Card>
      </div>
    </div>
  );
}
