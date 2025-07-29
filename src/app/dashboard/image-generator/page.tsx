
// src/app/dashboard/image-generator/page.tsx
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
  Save,
  Send,
  Power
} from 'lucide-react';
import Image from 'next/image';
import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  generateAndSearch,
  fetchPostsFromWp,
  updatePostOnWp,
  uploadImageToWp,
  type WpPost,
  type ImageSearchResult,
} from './actions';
import { searchImages } from '@/ai/flows/search-images';
import { useLocalStorage } from '@/hooks/use-local-storage';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ImageSearchDialog } from '@/components/image-search-dialog';
import { ImageCropDialog } from '@/components/image-crop-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/ui/info-tooltip';


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
  url:string;
  user: string;
  appPassword?: string;
}

interface SearchDialogState {
  open: boolean;
  type: 'featured' | 'section' | null;
  postId: string | null;
  heading?: string;
  initialQuery?: string;
  initialImages?: ImageSearchResult[];
}

interface CropDialogState {
    open: boolean;
    image: ImageSearchResult | null;
    onCropComplete: ((croppedImageUrl: string, originalImage: ImageSearchResult) => void) | null;
}

interface PostDetails {
  firstParagraph: string;
  sections: Section[];
  requiredImages: number;
  generatedCount: number;
}

interface UpdateStatus {
    isUpdating: boolean;
    postId: string | null;
    type: 'draft' | 'publish' | null;
}

function getBase64Size(base64: string): number {
    if (!base64) return 0;
    const stringLength = base64.length - base64.indexOf(',');
    const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812;
    return Math.round(sizeInBytes / 1024); // Size in KB
}

function constructPostHtml(originalContent: string, postImages: ImageState): string {
    if (typeof window === 'undefined') return originalContent;

    const domParser = new window.DOMParser();
    const doc = domParser.parseFromString(originalContent.replace(/<br\s*\/?>/gi, '\n'), 'text/html');

    const createFigure = (image: ImageSearchResult) => {
      const figure = doc.createElement('figure');
      figure.className = "wp-block-image size-large content-forge-image"; 
      const img = doc.createElement('img');
      img.src = image.url;
      img.alt = image.alt || '';
      figure.appendChild(img);
      
      const figcaption = doc.createElement('figcaption');
      figcaption.innerHTML = `Photo by <a href="${image.photographerUrl}" target="_blank" rel="noopener noreferrer">${image.photographer}</a> on <a href="https://www.${image.source.toLowerCase()}.com" target="_blank" rel="noopener noreferrer">${image.source}</a>`;
      figure.appendChild(figcaption);
      return figure;
    };

    const body = doc.body;

    // Remove only images previously added by this tool to avoid duplicates
    doc.querySelectorAll('.content-forge-image').forEach(el => el.remove());
    
    // Attempt to remove the WordPress featured image if it was added by WP a certain way
    const featuredImage = body.querySelector('figure.wp-block-image.size-full > img.wp-image-113');
    featuredImage?.closest('figure')?.remove();
    
    const firstParagraphEl = body.querySelector('p');

    if (postImages.featured) {
        const figure = createFigure(postImages.featured);
        if (firstParagraphEl) {
            firstParagraphEl.parentNode?.insertBefore(figure, firstParagraphEl.nextSibling);
        } else {
            body.insertBefore(figure, body.firstChild);
        }
    }
    
    const headings = Array.from(doc.querySelectorAll('h2, h3'));
    
    for (const headingElement of headings) {
        const headingText = headingElement.textContent?.trim() || '';
        const image = postImages.sections[headingText];

        if (image) {
            const figure = createFigure(image);
            headingElement.parentNode?.insertBefore(figure, headingElement.nextSibling);
        }
    }
    
    return doc.body.innerHTML;
}


function parseContent(post: WpPost): {
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
    post.content.replace(/<br\s*\/?>/gi, '\n'),
    'text/html'
  );

  let firstParagraph = '';
  const firstP = doc.querySelector('p');
  if (firstP) {
    firstParagraph = firstP.textContent || '';
  }

  const sections: Section[] = [];
  const sectionImageUrls: { [key: string]: string } = {};

  // Find featured image (official one or one we inserted)
  let featuredUrl = post.featuredImageUrl || null;
  if (!featuredUrl && firstP) {
      let nextElement = firstP.nextElementSibling;
      // The featured image is typically the first image after the first paragraph.
      if (nextElement && (nextElement.tagName === 'FIGURE' || nextElement.classList.contains('wp-block-image'))) {
          const img = nextElement.querySelector('img');
          if (img) {
              featuredUrl = img.src;
          }
      }
  }
  
  doc.querySelectorAll('h2, h3').forEach((header) => {
    const headingText = header.textContent?.trim() || '';
    if (!headingText) return;

    let paragraphText = '';
    
    let currentElementForP = header.nextElementSibling;
    while(currentElementForP && !['H2', 'H3'].includes(currentElementForP.tagName)) {
        if (currentElementForP.tagName === 'P' && !paragraphText) {
            paragraphText = currentElementForP.textContent || '';
            break; 
        }
        currentElementForP = currentElementForP.nextElementSibling;
    }

    let nextElement = header.nextElementSibling;
    let imageSrc: string | null = null;
    let foundImage = false;
    // Look for an image between this heading and the next one
    while (nextElement && !['H2', 'H3'].includes(nextElement.tagName) && !foundImage) {
        let img = null;
        if (nextElement.tagName === 'FIGURE' || nextElement.classList.contains('wp-block-image')) {
            img = nextElement.querySelector('img');
        } else if (nextElement.tagName === 'IMG') {
            img = nextElement;
        }

        if (img) {
            imageSrc = (img as HTMLImageElement).src;
            foundImage = true;
        }
        
        nextElement = nextElement.nextElementSibling;
    }
    
    sections.push({
        heading: headingText,
        paragraph: paragraphText.trim(),
    });

    if (imageSrc) {
        sectionImageUrls[headingText] = imageSrc;
    }
  });

  return { firstParagraph, sections, initialImages: { featuredUrl, sectionImageUrls } };
}

const ProxiedImage = ({ src, alt, ...props }: { src: string, alt: string, [key: string]: any }) => {
    const proxiedSrc = src.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(src)}` : src;
    return <Image src={proxiedSrc} alt={alt} {...props} />;
};


export default function ImageGeneratorPage() {
  const { toast } = useToast();
  const [sites] = useLocalStorage<WpSite[]>('wp-sites', []);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [posts, setPosts] = useState<WpPost[]>([]);
  const [images, setImages] = useLocalStorage<{ [postId: string]: ImageState }>('post-images', {});
  const [filter, setFilter] = useState<'all' | 'publish' | 'draft'>('all');
  const [isFetchingPosts, setIsFetchingPosts] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [searchDialogState, setSearchDialogState] = useState<SearchDialogState>({ open: false, type: null, postId: null });
  const [cropDialogState, setCropDialogState] = useState<CropDialogState>({ open: false, image: null, onCropComplete: null });
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ isUpdating: false, postId: null, type: null });
  const [postDetailsMap, setPostDetailsMap] = useState<Map<string, PostDetails>>(new Map());

  const selectedSite = useMemo(() => sites.find(s => s.id === selectedSiteId), [sites, selectedSiteId]);

  const processAndSetPostDetails = useCallback((postList: WpPost[]) => {
    setImages(prevImages => {
      let anyImageUpdated = false;
      const newImages = {...prevImages};

      postList.forEach(post => {
        const { firstParagraph, sections, initialImages } = parseContent(post);
        const existingPostImages = newImages[post.id] || { featured: null, sections: {} };
        let postImages: ImageState = JSON.parse(JSON.stringify(existingPostImages));
        let imagesUpdated = false;

        if (!postImages.featured && initialImages.featuredUrl) {
          postImages.featured = { url: initialImages.featuredUrl, alt: 'Existing featured image', photographer: 'From Post', photographerUrl: '#', source: 'Wikimedia' };
          imagesUpdated = true;
        }

        sections.forEach(section => {
          if (!postImages.sections[section.heading] && initialImages.sectionImageUrls[section.heading]) {
            postImages.sections[section.heading] = { url: initialImages.sectionImageUrls[section.heading], alt: 'Existing section image', photographer: 'From Post', photographerUrl: '#', source: 'Wikimedia' };
            imagesUpdated = true;
          }
        });

        if (imagesUpdated) {
          anyImageUpdated = true;
          newImages[post.id] = postImages;
        }

        const requiredImages = sections.length + 1;
        const generatedCount = (postImages.featured ? 1 : 0) + Object.values(postImages.sections).filter(Boolean).length;
        
        setPostDetailsMap(prevMap => new Map(prevMap).set(post.id, {
          firstParagraph,
          sections,
          requiredImages,
          generatedCount,
        }));
      });

      if (anyImageUpdated) {
        return newImages;
      }
      return prevImages;
    });
  }, [setImages]);


  const handleFetchPosts = useCallback(async (page = 1, refresh = false) => {
    if (!selectedSite) return;
    setIsFetchingPosts(true);
    if (refresh) {
      setPosts([]);
      setFetchError(null);
      setHasMorePosts(true);
      setCurrentPage(1);
      setPostDetailsMap(new Map());
    }
    
    if (!selectedSite.appPassword) {
      setFetchError("Application password not found for this site. Please add it in Settings.");
      setIsFetchingPosts(false);
      return;
    }
    
    const result = await fetchPostsFromWp(selectedSite.url, selectedSite.user, selectedSite.appPassword, page, filter);

    if (result.success) {
        if(result.data.length === 0){
            setHasMorePosts(false);
        } else {
            const newPosts = refresh ? result.data : [...posts, ...result.data];
            setPosts(newPosts);
            setCurrentPage(page);
            processAndSetPostDetails(result.data);
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
  }, [selectedSite, toast, filter, posts, processAndSetPostDetails]);


  useEffect(() => {
    if (selectedSiteId) {
      handleFetchPosts(1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSiteId, filter]);


  const handleOpenSearchDialog = useCallback(async (postId: string, type: 'featured' | 'section', heading?: string) => {
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
        setSearchDialogState({
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

  const handleSelectImageFromSearch = (image: ImageSearchResult) => {
    const { postId, type, heading } = searchDialogState;
    if (!postId || !type) return;

    const onCropComplete = (croppedImageUrl: string, originalImage: ImageSearchResult) => {
        const imageSize = getBase64Size(croppedImageUrl);
        const newImage: ImageSearchResult = { ...originalImage, url: croppedImageUrl, size: imageSize };
        
        setImages((prev) => {
          const currentImages = prev[postId] || { featured: null, sections: {} };
          let newImages: ImageState;
          if (type === 'featured') {
            newImages = { ...currentImages, featured: newImage };
          } else if (heading) {
            newImages = { ...currentImages, sections: { ...currentImages.sections, [heading]: newImage } };
          } else {
            newImages = currentImages;
          }
           const post = posts.find(p => p.id === postId);
           if (post) {
                const details = postDetailsMap.get(post.id);
                if (details) {
                    const generatedCount = (newImages.featured ? 1 : 0) + Object.values(newImages.sections).filter(Boolean).length;
                    setPostDetailsMap(prevMap => new Map(prevMap).set(post.id, {...details, generatedCount}));
                }
           }
          return { ...prev, [postId]: newImages };
        });

        toast({ title: 'Image Added!', description: `Image from ${newImage.source} by ${newImage.photographer}` });
        setCropDialogState({ open: false, image: null, onCropComplete: null });
    };

    setCropDialogState({
        open: true,
        image: image,
        onCropComplete: onCropComplete,
    });
    setSearchDialogState({ open: false, type: null, postId: null });
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
         const post = posts.find(p => p.id === postId);
         if (post) {
            const details = postDetailsMap.get(post.id);
            if (details) {
                const generatedCount = (newImages.featured ? 1 : 0) + Object.values(newImages.sections).filter(Boolean).length;
                setPostDetailsMap(prevMap => new Map(prevMap).set(post.id, {...details, generatedCount}));
            }
         }
        return { ...prev, [postId]: newImages };
      });
    },
    [setImages, posts, postDetailsMap]
  );
  
  const handleUpdatePost = async (postId: string, status: 'publish' | 'draft') => {
      const post = posts.find(p => p.id === postId);
      let postImages = images[postId];

      if (!selectedSite || !post || !postImages || !selectedSite.appPassword) {
          toast({ title: "Error", description: "Missing required information to update post.", variant: "destructive" });
          return;
      }

      setUpdateStatus({ isUpdating: true, postId, type: status });
      const toastMessage = status === 'draft' ? 'Saving Draft...' : 'Publishing Post...';
      toast({ title: toastMessage, description: 'Please wait a moment.' });

      try {
        let finalImages = postImages;

        // Only upload images if publishing
        if (status === 'publish') {
            const uploadedImages: ImageState = JSON.parse(JSON.stringify(postImages));
            let uploadsFailed = false;
            
            const processImage = async (imageKey: 'featured' | string) => {
                const image = imageKey === 'featured' ? postImages.featured : postImages.sections[imageKey];
                if (image && image.url.startsWith('data:image')) {
                    const fileName = `${post.title.replace(/\s+/g, '-').toLowerCase().slice(0, 20)}-${imageKey}`;
                    const caption = `Photo by <a href="${image.photographerUrl}" target="_blank">${image.photographer}</a> on <a href="https://www.${image.source.toLowerCase()}.com" target="_blank">${image.source}</a>`;
                    
                    const uploadResult = await uploadImageToWp(selectedSite.url, selectedSite.user, selectedSite.appPassword!, {
                        base64Data: image.url,
                        fileName: fileName,
                        altText: image.alt || post.title,
                        caption: caption,
                    });

                    if (uploadResult.success) {
                        if (imageKey === 'featured') {
                            uploadedImages.featured!.url = uploadResult.data.source_url;
                        } else {
                            uploadedImages.sections[imageKey]!.url = uploadResult.data.source_url;
                        }
                    } else {
                        uploadsFailed = true;
                        toast({ title: 'Image Upload Failed', description: `Could not upload image for ${imageKey}. Reason: ${uploadResult.error}`, variant: 'destructive' });
                    }
                }
            };

            const uploadPromises: Promise<void>[] = [];
            if (postImages.featured && postImages.featured.url.startsWith('data:image')) {
                uploadPromises.push(processImage('featured'));
            }
            for (const heading in postImages.sections) {
                const sectionImage = postImages.sections[heading];
                if (sectionImage && sectionImage.url.startsWith('data:image')) {
                    uploadPromises.push(processImage(heading));
                }
            }
            
            await Promise.all(uploadPromises);

            if (uploadsFailed) {
                setUpdateStatus({ isUpdating: false, postId: null, type: null });
                toast({ title: "Update Canceled", description: "Post update canceled due to image upload failure.", variant: "destructive" });
                return;
            }
            finalImages = uploadedImages;
        }

        const newContent = constructPostHtml(post.content, finalImages);
        const result = await updatePostOnWp(selectedSite.url, selectedSite.user, selectedSite.appPassword, postId, newContent, status);

        if (result.success) {
            toast({ title: "Success!", description: `Post has been successfully ${status === 'publish' ? 'published' : 'saved as a draft'}.` });
             // Optionally refresh posts
            handleFetchPosts(1, true);
        } else {
            toast({ title: "Update Failed", description: result.error, variant: "destructive" });
        }
      } catch (error) {
          console.error("Failed to update post:", error);
          toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
      } finally {
          setUpdateStatus({ isUpdating: false, postId: null, type: null });
      }
  }

  const renderPostList = () => {
    if (isFetchingPosts && posts.length === 0) {
      return (
        <div className="text-center text-muted-foreground p-8">
          <Loader2 className="mx-auto h-12 w-12 animate-spin" />
          <h3 className="mt-4 text-lg font-semibold">Fetching Posts...</h3>
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
    
    if (!isFetchingPosts && !fetchError && posts.length === 0) {
      return (
        <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md mt-4">
          <FileText className="mx-auto h-12 w-12" />
          <h3 className="mt-4 text-lg font-semibold">
            No {filter !== 'all' ? filter : ''} Posts Found
          </h3>
          <p className="mt-1 text-sm">
            No {filter !== 'all' ? filter : ''} posts were found on the connected site.
          </p>
        </div>
      );
    }
    

    return (
      <>
        <div className="flex justify-between items-center mb-4">
            <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="publish">Published</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => handleFetchPosts(1, true)} size="icon" variant="outline" disabled={isFetchingPosts}>
                <RefreshCw className="h-4 w-4" />
            </Button>
        </div>
        <Accordion type="single" collapsible className="w-full">
            {posts.map(post => {
                const details = postDetailsMap.get(post.id);
                const postImages = images[post.id] || { featured: null, sections: {} };
                const loadingKeyFeatured = `${post.id}-featured`;

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
                                    <div className="mt-2 pr-4 text-xs text-muted-foreground">Loading details...</div>
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
                                      {postImages.featured ? (
                                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                                      ) : (
                                          <XCircle className="h-5 w-5 text-destructive" />
                                      )}
                                      <h4 className="font-semibold text-lg">Featured Image</h4>
                                      <InfoTooltip info={details.firstParagraph} />
                                  </div>
  
                                  {postImages.featured ? (
                                      <div className="relative">
                                          <ProxiedImage src={postImages.featured.url} width={600} height={300} alt={postImages.featured.alt || 'Featured Image'} className="rounded-md aspect-[2/1] object-cover" />
                                          <div className="absolute top-2 right-2 flex gap-2 bg-black/50 p-1 rounded-md">
                                              <Button variant="outline" size="sm" onClick={() => handleOpenSearchDialog(post.id, 'featured')} disabled={loadingStates[loadingKeyFeatured]}>
                                              {loadingStates[loadingKeyFeatured] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Replace className="mr-2 h-4 w-4" />} Replace
                                              </Button>
                                              <Button variant="destructive" size="sm" onClick={() => deleteImage(post.id, 'featured')}>
                                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                                              </Button>
                                          </div>
                                           <div className="text-xs text-muted-foreground mt-1 flex justify-between items-center">
                                                <p className="italic">
                                                    Photo by <a href={postImages.featured.photographerUrl} target="_blank" rel="noopener noreferrer" className="underline">{postImages.featured.photographer}</a> on <a href={`https://www.${postImages.featured.source.toLowerCase()}.com`}  target="_blank" rel="noopener noreferrer" className="underline">{postImages.featured.source}</a>
                                                </p>
                                                {postImages.featured.size && <Badge variant="outline">{postImages.featured.size} KB</Badge>}
                                           </div>
                                      </div>
                                  ) : (
                                      <Button onClick={() => handleOpenSearchDialog(post.id, 'featured')} disabled={loadingStates[loadingKeyFeatured]}>
                                      {loadingStates[loadingKeyFeatured] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />} Add Featured Image
                                      </Button>
                                  )}
                                  </div>
                                  
                                  {/* Section Images Section */}
                                  {details.sections.length > 0 && (
                                  <div className="p-4 border rounded-lg bg-background">
                                       <h4 className="font-semibold text-lg mb-4">Section Images</h4>
                                      <div className="space-y-4">
                                      {details.sections.map(({ heading, paragraph }) => {
                                          const image = postImages.sections[heading];
                                          const loadingKeySection = `${post.id}-${heading}`;
                                          return (
                                          <div key={heading} className="flex items-start md:items-center justify-between gap-4 p-3 rounded-md border bg-muted/30 flex-col md:flex-row">
                                              <div className="flex items-start gap-2 flex-grow">
                                                  {image ? (
                                                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                                                  ) : (
                                                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-1" />
                                                  )}
                                                  <div className="flex items-center gap-2">
                                                    <p className="font-medium">{heading}</p>
                                                    <InfoTooltip info={paragraph} />
                                                  </div>
                                              </div>
                                              <div className="flex items-center gap-2 self-end md:self-center">
                                              {image ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col items-end text-xs text-muted-foreground">
                                                        <ProxiedImage src={image.url} width={80} height={45} alt={image.alt || 'Section image'} className="rounded-md aspect-video object-cover" />
                                                        {image.size && <Badge variant="outline" className="mt-1">{image.size} KB</Badge>}
                                                    </div>
                                                     <div className="flex flex-col gap-1">
                                                        <Button variant="outline" size="icon" onClick={() => handleOpenSearchDialog(post.id, 'section', heading)} disabled={loadingStates[loadingKeySection]}>
                                                        {loadingStates[loadingKeySection] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Replace className="h-4 w-4" />}
                                                        </Button>
                                                        <Button variant="destructive" size="icon" onClick={() => deleteImage(post.id, 'section', heading)}>
                                                        <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                              ) : (
                                                <Button variant="secondary" size="sm" onClick={() => handleOpenSearchDialog(post.id, 'section', heading)} disabled={loadingStates[loadingKeySection]}>
                                                    {loadingStates[loadingKeySection] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />} Add Image
                                                </Button>
                                              )}
                                              </div>
                                          </div>
                                          );
                                      })}
                                      </div>
                                  </div>
                                  )}
                               </CardContent>
                               <CardFooter className="flex justify-end gap-2 pt-4">
                                    <Button 
                                        variant="secondary" 
                                        onClick={() => handleUpdatePost(post.id, 'draft')}
                                        disabled={updateStatus.isUpdating}
                                    >
                                        {updateStatus.isUpdating && updateStatus.postId === post.id && updateStatus.type === 'draft' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Save Draft
                                    </Button>
                                    <Button 
                                        onClick={() => handleUpdatePost(post.id, 'publish')}
                                        disabled={updateStatus.isUpdating}
                                    >
                                        {updateStatus.isUpdating && updateStatus.postId === post.id && updateStatus.type === 'publish' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                        Publish
                                    </Button>
                               </CardFooter>
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
      </>
    );
  };
  
  const renderSiteSelection = () => {
    if (sites.length === 0) {
        return (
            <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
                <Globe className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">
                    Connect a Site to Begin
                </h3>
                <p className="mt-1 text-sm">
                    Go to settings to connect your WordPress site.
                </p>
                <Button asChild size="sm" className="mt-4">
                    <Link href="/dashboard/settings">Go to Settings</Link>
                </Button>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-headline font-bold mb-4">Select a Site to Manage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sites.map(site => (
                    <Card 
                        key={site.id} 
                        onClick={() => setSelectedSiteId(site.id)}
                        className="cursor-pointer hover:border-primary transition-colors"
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-primary" />
                                {new URL(site.url).hostname}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground truncate">{site.url}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
  }

  return (
    <>
    <ImageSearchDialog
        open={searchDialogState.open}
        onOpenChange={(open) => setSearchDialogState({ ...searchDialogState, open })}
        initialQuery={searchDialogState.initialQuery}
        initialImages={searchDialogState.initialImages}
        onSelectImage={handleSelectImageFromSearch}
        onSearch={async (query, page) => {
            const result = await searchImages({ query, page });
            return result.images;
        }}
    />
    <ImageCropDialog 
        open={cropDialogState.open}
        onOpenChange={(open) => setCropDialogState({ ...cropDialogState, open })}
        image={cropDialogState.image}
        onCropComplete={cropDialogState.onCropComplete}
    />
    <div className="space-y-8">
        <Card>
          <CardHeader>
             <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Image Generator</CardTitle>
                    <CardDescription>
                      {selectedSite ? `Managing images for ${selectedSite.url}` : 'Select a site to manage its images.'}
                    </CardDescription>
                </div>
                 {selectedSite && (
                    <Button onClick={() => setSelectedSiteId(null)} variant="outline">
                        <Power className="mr-2 h-4 w-4" /> Change Site
                    </Button>
                 )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedSiteId ? renderPostList() : renderSiteSelection()}
          </CardContent>
        </Card>
    </div>
    </>
  );
}
