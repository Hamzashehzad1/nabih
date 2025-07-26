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
import { useState, useMemo, useCallback, useEffect, Fragment } from 'react';
import {
  generateAndSearch,
  fetchPostsFromWp,
  type WpPost,
  type ImageSearchResult,
} from './actions';
import { searchImages } from '@/ai/flows/search-images';
import { Label } from '@/components/ui/label';
import { useLocalStorage } from '@/hooks/use-local-storage';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ImageSearchDialog } from '@/components/image-search-dialog';

interface ImageState {
  featured: ImageSearchResult | null;
  sections: { [key: string]: ImageSearchResult | null };
}

interface Section {
  heading: string;
  paragraph: string;
}

interface WpSite {
  id: string;
  url: string;
  user: string;
  appPassword?: string;
}

interface DialogState {
  open: boolean;
  type: 'featured' | 'section' | null;
  heading?: string;
  initialQuery?: string;
  initialImages?: ImageSearchResult[];
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

  let firstParagraph = '';
  const firstP = doc.querySelector('p');
  if (firstP) {
    firstParagraph = firstP.textContent || '';
  }
  
  const sections: Section[] = [];
  doc.querySelectorAll('h2, h3').forEach((header) => {
    let nextElement = header.nextElementSibling;
    let paragraphText = '';

    while(nextElement && nextElement.tagName.toLowerCase() !== 'p') {
      nextElement = nextElement.nextElementSibling;
    }

    if (nextElement && nextElement.tagName.toLowerCase() === 'p') {
      paragraphText = (nextElement.textContent || '') + ' ';
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
  const [dialogState, setDialogState] = useState<DialogState>({ open: false, type: null });

  const handleFetchPosts = useCallback(async (page = 1, refresh = false) => {
    if (sites.length === 0) return;
    setIsFetchingPosts(true);
    if (refresh) {
      setPosts([]);
      setSelectedPostId(null);
      setFetchError(null);
      setHasMorePosts(true);
    }
    
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
    if (sites.length > 0) {
      handleFetchPosts(1, true);
    }
  }, [sites, handleFetchPosts]);

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
  
  const handleOpenDialog = useCallback(async (type: 'featured' | 'section', heading?: string) => {
    if (!selectedPost) return;

    const setLoadingState = (isLoading: boolean) => {
        if (type === 'featured') {
            setLoading((prev) => ({ ...prev, featured: isLoading }));
        } else if (heading) {
            setLoading((prev) => ({...prev, sections: { ...prev.sections, [heading]: isLoading }}));
        }
    };

    setLoadingState(true);
    toast({ title: 'Generating Image Query & Searching...', description: 'The AI is finding the perfect image for you.' });
    
    let result: {query: string, images: ImageSearchResult[]} | null = null;
    if (type === 'featured') {
        result = await generateAndSearch({ title: selectedPost.title, paragraph: parsedContent.firstParagraph, type: 'featured' });
    } else if (heading) {
        const section = parsedContent.sections.find((s) => s.heading === heading);
        if (section) {
            result = await generateAndSearch({ title: section.heading, paragraph: section.paragraph, type: 'section' });
        }
    }

    if (result) {
        setDialogState({
            open: true,
            type: type,
            heading: heading,
            initialQuery: result.query,
            initialImages: result.images
        })
    } else {
        toast({ title: 'Error', description: 'Could not generate an image query.', variant: 'destructive'});
    }

    setLoadingState(false);
  }, [selectedPost, parsedContent, toast]);

  const handleSelectImage = (image: ImageSearchResult) => {
    if (!dialogState.type) return;
    
    if (dialogState.type === 'featured') {
        setPostImages((prev) => ({ ...prev, featured: image }));
    } else if (dialogState.heading) {
        setPostImages((prev) => ({...prev, sections: { ...prev.sections, [dialogState.heading!]: image }}));
    }
    toast({ title: 'Image Added!', description: `Image from ${image.source} by ${image.photographer}` });
    setDialogState({ open: false, type: null });
  };

  const deleteImage = useCallback(
    (type: 'featured' | 'section', heading?: string) => {
      if (!selectedPostId) return;
      setPostImages((prev) => {
        if (type === 'featured') {
          return { ...prev, featured: null };
        } else if (heading) {
          const newSections = { ...prev.sections };
          newSections[heading] = null;
          return { ...prev, sections: newSections };
        }
        return prev;
      });
    },
    [selectedPostId, setPostImages]
  );
  
  const renderedContent = useMemo(() => {
    if (!selectedPost) return null;
    if (typeof window === 'undefined') {
        return <div dangerouslySetInnerHTML={{ __html: selectedPost.content }} />;
    }
    
    const doc = new DOMParser().parseFromString(selectedPost.content, 'text/html');
    const nodes = Array.from(doc.body.childNodes);
    
    return <Fragment>
        {nodes.map((node, index) => {
            if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
                return null;
            }

            const isHeading = node.nodeName === 'H2' || node.nodeName === 'H3';
            const headingText = node.textContent || '';
            const outerHTML = (node as Element).outerHTML || node.textContent || '';
            const imageForSection = currentPostImages.sections[headingText];

            return (
                <div key={index}>
                <div dangerouslySetInnerHTML={{ __html: outerHTML }} />
                {isHeading && (
                    <div className="my-4">
                    {imageForSection ? (
                        <Card className="p-4">
                        <div className="relative">
                            <Image
                            src={imageForSection.url}
                            width={600}
                            height={300}
                            alt={imageForSection.alt}
                            className="rounded-md"
                            />
                            <div className="absolute top-2 right-2 flex gap-2 bg-black/50 p-1 rounded-md">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDialog('section', headingText)}
                                disabled={loading.sections[headingText]}
                            >
                                {loading.sections[headingText] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Replace className="mr-2 h-4 w-4" />}
                                Replace
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteImage('section', headingText)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                            </div>
                        </div>
                        </Card>
                    ) : (
                        <div className="text-center py-4">
                        <Button
                            variant="secondary"
                            onClick={() => handleOpenDialog('section', headingText)}
                            disabled={loading.sections[headingText]}
                        >
                            {loading.sections[headingText] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            Add Image for "{headingText}"
                        </Button>
                        </div>
                    )}
                    </div>
                )}
                </div>
            );
        })}
    </Fragment>;
  }, [selectedPost, currentPostImages.sections, loading.sections, handleOpenDialog, deleteImage]);


  const filteredPosts = useMemo(() => {
    if (filter === 'all') return posts;
    if (filter === 'published') return posts.filter((p) => p.status === 'publish');
    if (filter === 'draft') return posts.filter((p) => p.status === 'draft' || p.status === 'pending');
    if (filter === 'pending') return posts.filter((p) => p.status === 'pending');
    return posts;
  }, [posts, filter]);

  return (
    <>
    <ImageSearchDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState({ ...dialogState, open })}
        initialQuery={dialogState.initialQuery}
        initialImages={dialogState.initialImages}
        onSelectImage={handleSelectImage}
        onSearch={async (query) => {
            const result = await searchImages({ query });
            return result.images;
        }}
    />
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
                    <Fragment>
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
                    </Fragment>
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
                          src={currentPostImages.featured.url}
                          width={600}
                          height={300}
                          alt={currentPostImages.featured.alt}
                          className="rounded-md"
                        />
                        <div className="absolute top-2 right-2 flex gap-2 bg-black/50 p-1 rounded-md">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog('featured')}
                            disabled={loading.featured}
                          >
                            {loading.featured ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Replace className="mr-2 h-4 w-4" />}
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
                        onClick={() => handleOpenDialog('featured')}
                        disabled={loading.featured}
                      >
                        {loading.featured ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        Add Featured Image
                      </Button>
                    </Card>
                  )}
                </div>

                <div className="prose prose-sm dark:prose-invert prose-headings:font-headline max-w-none p-4 border rounded-md max-h-[400px] overflow-y-auto">
                    {renderedContent ? renderedContent : <p>Select a post to see the content.</p>}
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
    </>
  );
}
