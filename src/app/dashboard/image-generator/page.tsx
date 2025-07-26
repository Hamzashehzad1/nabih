
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
  Loader2,
  Trash2,
  Replace,
  FileText,
  Globe,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  generateAndSearch,
  fetchPostsFromWp,
  type WpPost,
  type ImageSearchResult,
} from './actions';
import { searchImages } from '@/ai/flows/search-images';
import { useLocalStorage } from '@/hooks/use-local-storage';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ImageSearchDialog } from '@/components/image-search-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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
  postId: string | null;
  heading?: string;
  initialQuery?: string;
  initialImages?: ImageSearchResult[];
}

interface PostDetails {
  firstParagraph: string;
  sections: Section[];
  requiredImages: number;
  generatedCount: number;
}


function parseContent(html: string): {
    firstParagraph: string;
    sections: Section[];
    initialImages: {
        featuredUrl: string | null;
        sectionImageUrls: { [key: string]: string };
    }
} {
  if (typeof window === 'undefined') {
    return { firstParagraph: '', sections: [], initialImages: { featuredUrl: null, sectionImageUrls: {} } };
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
  const sectionImageUrls: { [key: string]: string } = {};
  let featuredUrl: string | null = null;

  // Try to find a featured image (first image before any h2/h3)
  const allElements = Array.from(doc.body.children);
  const firstHeadingIndex = allElements.findIndex(el => el.tagName === 'H2' || el.tagName === 'H3');
  
  const contentBeforeHeadings = firstHeadingIndex === -1 ? allElements : allElements.slice(0, firstHeadingIndex);
  const firstImageElement = contentBeforeHeadings.find(el => el.tagName === 'IMG') as HTMLImageElement | undefined;
  if (firstImageElement) {
      featuredUrl = firstImageElement.src;
  }
  
  doc.querySelectorAll('h2, h3').forEach((header) => {
    const headingText = header.textContent || '';
    if (!headingText) return;

    let nextElement = header.nextElementSibling;
    let paragraphText = '';
    let imageSrc: string | null = null;

    // Find the next paragraph and image before the next heading
    while (nextElement && nextElement.tagName !== 'H2' && nextElement.tagName !== 'H3') {
        if (!paragraphText && nextElement.tagName === 'P') {
            paragraphText = nextElement.textContent || '';
        }
        if (!imageSrc && nextElement.tagName === 'IMG') {
            imageSrc = (nextElement as HTMLImageElement).src;
        }
        nextElement = nextElement.nextElementSibling;
    }
    
    if (headingText) {
        sections.push({
            heading: headingText,
            paragraph: paragraphText.trim(),
        });
        if (imageSrc) {
            sectionImageUrls[headingText] = imageSrc;
        }
    }
  });

  return { firstParagraph, sections, initialImages: { featuredUrl, sectionImageUrls } };
}

export default function ImageGeneratorPage() {
  const { toast } = useToast();
  const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);
  const [posts, setPosts] = useState<WpPost[]>([]);
  const [images, setImages] = useLocalStorage<{ [postId: string]: ImageState }>('post-images', {});
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'pending'>('all');
  const [isFetchingPosts, setIsFetchingPosts] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [dialogState, setDialogState] = useState<DialogState>({ open: false, type: null, postId: null });
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});

  const [postDetailsMap, setPostDetailsMap] = useState<Map<string, PostDetails>>(new Map());

  const processAndSetPostDetails = useCallback((post: WpPost) => {
    const { firstParagraph, sections, initialImages } = parseContent(post.content);

    // Initialize images from content if not already set in our state
    const existingPostImages = images[post.id] || { featured: null, sections: {} };
    let postImages = JSON.parse(JSON.stringify(existingPostImages)); // Deep copy
    let imagesUpdated = false;

    if (!postImages.featured && initialImages.featuredUrl) {
      postImages.featured = { url: initialImages.featuredUrl, alt: 'Existing featured image', photographer: 'From Post', photographerUrl: '#', source: 'Unsplash' };
      imagesUpdated = true;
    }
    sections.forEach(section => {
      if (!postImages.sections[section.heading] && initialImages.sectionImageUrls[section.heading]) {
        postImages.sections[section.heading] = { url: initialImages.sectionImageUrls[section.heading], alt: 'Existing section image', photographer: 'From Post', photographerUrl: '#', source: 'Unsplash' };
        imagesUpdated = true;
      }
    });

    if (imagesUpdated) {
        setImages(prevImages => ({...prevImages, [post.id]: postImages}));
    }

    const generatedCount =
      (postImages.featured ? 1 : 0) +
      Object.values(postImages.sections).filter(Boolean).length;

    setPostDetailsMap(prevMap => new Map(prevMap).set(post.id, {
      firstParagraph,
      sections,
      requiredImages: sections.length + 1,
      generatedCount,
    }));
  }, [images, setImages]);


  const handleFetchPosts = useCallback(async (page = 1, refresh = false) => {
    if (sites.length === 0) return;
    setIsFetchingPosts(true);
    if (refresh) {
      setPosts([]);
      setFetchError(null);
      setHasMorePosts(true);
      setPostDetailsMap(new Map());
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
            setPosts(prevPosts => refresh ? result.data : [...prevPosts, ...result.data]);
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
    // We only want to run this on initial load or when sites change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sites]);

  const handleOpenDialog = useCallback(async (postId: string, type: 'featured' | 'section', heading?: string) => {
    const post = posts.find(p => p.id === postId);
    const postDetails = postDetailsMap.get(postId);
    if (!post || !postDetails) return;

    const loadingKey = heading ? `${postId}-${heading}` : `${postId}-featured`;
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
    toast({ title: 'Generating Image Query & Searching...', description: 'The AI is finding the perfect image for you.' });
    
    let result: {query: string, images: ImageSearchResult[]} | null = null;
    if (type === 'featured') {
        result = await generateAndSearch({ title: post.title, paragraph: postDetails.firstParagraph, type: 'featured' });
    } else if (heading) {
        const section = postDetails.sections.find((s) => s.heading === heading);
        if (section) {
            result = await generateAndSearch({ title: section.heading, paragraph: section.paragraph, type: 'section' });
        }
    }

    if (result) {
        setDialogState({
            open: true,
            type: type,
            postId: postId,
            heading: heading,
            initialQuery: result.query,
            initialImages: result.images
        })
    } else {
        toast({ title: 'Error', description: 'Could not generate an image query.', variant: 'destructive'});
    }

    setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
  }, [posts, postDetailsMap, toast]);

  const handleSelectImage = (image: ImageSearchResult) => {
    const { postId, type, heading } = dialogState;
    if (!postId || !type) return;

    setImages((prev) => {
      const currentImages = prev[postId] || { featured: null, sections: {} };
      let newImages: ImageState;
      if (type === 'featured') {
        newImages = { ...currentImages, featured: image };
      } else if (heading) {
        newImages = { ...currentImages, sections: { ...currentImages.sections, [heading]: image } };
      } else {
        newImages = currentImages;
      }
      return { ...prev, [postId]: newImages };
    });

    const post = posts.find(p => p.id === postId);
    if (post) processAndSetPostDetails(post);

    toast({ title: 'Image Added!', description: `Image from ${image.source} by ${image.photographer}` });
    setDialogState({ open: false, type: null, postId: null });
  };

  const deleteImage = useCallback((postId: string, type: 'featured' | 'section', heading?: string) => {
      setImages((prev) => {
        const currentImages = prev[postId] || { featured: null, sections: {} };
        let newImages: ImageState;

        if (type === 'featured') {
          newImages = { ...currentImages, featured: null };
        } else if (heading) {
          const newSections = { ...currentImages.sections };
          delete newSections[heading];
          newImages = { ...currentImages, sections: newSections };
        } else {
          newImages = currentImages;
        }
        return { ...prev, [postId]: newImages };
      });
      const post = posts.find(p => p.id === postId);
      if (post) processAndSetPostDetails(post);
    },
    [setImages, posts, processAndSetPostDetails]
  );
  
  const filteredPosts = useMemo(() => {
    if (filter === 'all') return posts;
    if (filter === 'published') return posts.filter((p) => p.status === 'publish');
    if (filter === 'draft') return posts.filter((p) => p.status === 'draft' || p.status === 'pending');
    if (filter === 'pending') return posts.filter((p) => p.status === 'pending');
    return posts;
  }, [posts, filter]);

  const renderPostList = () => {
    if (isFetchingPosts && posts.length === 0) {
      return (
        <div className="text-center text-muted-foreground p-8">
          <Loader2 className="mx-auto h-12 w-12 animate-spin" />
          <h3 className="mt-4 text-lg font-semibold">Fetching Posts...</h3>
        </div>
      );
    }

    if (!isFetchingPosts && sites.length === 0) {
        return (
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
        );
    }
    
    if (!isFetchingPosts && fetchError) {
      return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4"/>
            <AlertTitle>Error Fetching Posts</AlertTitle>
            <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      );
    }
    
    if (!isFetchingPosts && !fetchError && filteredPosts.length === 0) {
      return (
        <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md mt-4">
          <FileText className="mx-auto h-12 w-12" />
          <h3 className="mt-4 text-lg font-semibold">
            No Posts Found
          </h3>
          <p className="mt-1 text-sm">
            No {filter !== 'all' ? filter : ''} posts were found on the connected site.
          </p>
        </div>
      );
    }

    return (
        <Accordion type="single" collapsible className="w-full" onValueChange={(value) => {
            if (value) {
                const post = posts.find(p => p.id === value);
                if (post && !postDetailsMap.has(post.id)) {
                    processAndSetPostDetails(post);
                }
            }
        }}>
            {filteredPosts.map(post => {
                const details = postDetailsMap.get(post.id);
                const postImages = images[post.id] || { featured: null, sections: {} };
                const loadingKeyFeatured = `${post.id}-featured`;
                const hasFeaturedImage = !!postImages.featured;

                return (
                    <AccordionItem value={post.id} key={post.id}>
                        <AccordionTrigger>
                            <div className="flex-grow text-left">
                                <div className="flex items-center gap-2">
                                     <Badge
                                        variant={post.status === 'publish' ? 'default' : 'secondary'}
                                        className="capitalize"
                                        >
                                        {post.status}
                                    </Badge>
                                    <h3 className="font-semibold truncate pr-2">{post.title}</h3>
                                </div>
                                {details ? (
                                    <div className="mt-2 pr-4">
                                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                                            <span>Image Progress</span>
                                            <span>
                                                {details.generatedCount}/{details.requiredImages}
                                            </span>
                                        </div>
                                        <Progress value={(details.generatedCount / (details.requiredImages || 1)) * 100} />
                                    </div>
                                ) : (
                                    <div className="mt-2 pr-4 text-xs text-muted-foreground">Click to load details...</div>
                                )}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           {!details ? <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin"/></div> : (
                             <Card className="bg-muted/50">
                               <CardContent className="p-4 space-y-6">
                                  {/* Featured Image Section */}
                                  <div className="p-4 border rounded-lg bg-background">
                                  <div className="flex items-center gap-2 mb-2">
                                      {hasFeaturedImage ? (
                                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                                      ) : (
                                          <XCircle className="h-5 w-5 text-destructive" />
                                      )}
                                      <h4 className="font-semibold text-lg">Featured Image</h4>
                                  </div>
  
                                  {postImages.featured ? (
                                      <div className="relative">
                                      <Image src={postImages.featured.url} width={600} height={300} alt={postImages.featured.alt} className="rounded-md aspect-[2/1] object-cover" />
                                      <div className="absolute top-2 right-2 flex gap-2 bg-black/50 p-1 rounded-md">
                                          <Button variant="outline" size="sm" onClick={() => handleOpenDialog(post.id, 'featured')} disabled={loadingStates[loadingKeyFeatured]}>
                                          {loadingStates[loadingKeyFeatured] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Replace className="mr-2 h-4 w-4" />} Replace
                                          </Button>
                                          <Button variant="destructive" size="sm" onClick={() => deleteImage(post.id, 'featured')}>
                                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                                          </Button>
                                      </div>
                                      </div>
                                  ) : (
                                      <Button onClick={() => handleOpenDialog(post.id, 'featured')} disabled={loadingStates[loadingKeyFeatured]}>
                                      {loadingStates[loadingKeyFeatured] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />} Add Featured Image
                                      </Button>
                                  )}
                                  </div>
                                  
                                  {/* Section Images Section */}
                                  {details.sections.length > 0 && (
                                  <div className="p-4 border rounded-lg bg-background">
                                       <h4 className="font-semibold text-lg mb-4">Section Images</h4>
                                      <div className="space-y-4">
                                      {details.sections.map(({ heading }) => {
                                          const image = postImages.sections[heading];
                                          const loadingKeySection = `${post.id}-${heading}`;
                                          return (
                                          <div key={heading} className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                                              <div className="flex items-center gap-2">
                                                  {image ? (
                                                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                  ) : (
                                                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                                                  )}
                                                  <p className="font-medium">{heading}</p>
                                              </div>
                                              {image ? (
                                              <div className="flex items-center gap-2">
                                                  <Image src={image.url} width={80} height={45} alt={image.alt} className="rounded-md aspect-video object-cover" />
                                                  <Button variant="outline" size="icon" onClick={() => handleOpenDialog(post.id, 'section', heading)} disabled={loadingStates[loadingKeySection]}>
                                                  {loadingStates[loadingKeySection] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Replace className="h-4 w-4" />}
                                                  </Button>
                                                  <Button variant="destructive" size="icon" onClick={() => deleteImage(post.id, 'section', heading)}>
                                                  <Trash2 className="h-4 w-4" />
                                                  </Button>
                                              </div>
                                              ) : (
                                              <Button variant="secondary" size="sm" onClick={() => handleOpenDialog(post.id, 'section', heading)} disabled={loadingStates[loadingKeySection]}>
                                                  {loadingStates[loadingKeySection] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />} Add Image
                                              </Button>
                                              )}
                                          </div>
                                          );
                                      })}
                                      </div>
                                  </div>
                                  )}
                               </CardContent>
                             </Card>
                           )}
                        </AccordionContent>
                    </AccordionItem>
                );
            })}
             {hasMorePosts && !isFetchingPosts && (
                <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => handleFetchPosts(currentPage + 1)}
                    disabled={isFetchingPosts}
                >
                    Load More
                </Button>
            )}
            {isFetchingPosts && posts.length > 0 && (
                 <div className="flex justify-center items-center p-4">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Loading more posts...
                 </div>
            )}
        </Accordion>
    );
  };

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
    <div className="space-y-8">
        <Card>
          <CardHeader>
             <div className="flex justify-between items-center">
                 <div>
                    <CardTitle>Image Generator</CardTitle>
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
            <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>
            </Tabs>
            {renderPostList()}
          </CardContent>
        </Card>
    </div>
    </>
  );
}
