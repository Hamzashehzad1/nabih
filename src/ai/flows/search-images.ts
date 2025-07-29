
'use server';
/**
 * @fileOverview Searches for images on Pexels, Unsplash, and Wikimedia.
 *
 * - searchImages - A function that handles searching for images.
 * - SearchImagesInput - The input type for the searchImages function.
 * - SearchImagesOutput - The return type for the searchImages function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SearchImagesInputSchema = z.object({
  query: z.string().describe('The search query for images.'),
  page: z.number().optional().default(1).describe('The page number for pagination.'),
});
export type SearchImagesInput = z.infer<typeof SearchImagesInputSchema>;

const ImageSchema = z.object({
  url: z.string(),
  alt: z.string(),
  photographer: z.string(),
  photographerUrl: z.string(),
  source: z.literal('Pexels').or(z.literal('Unsplash')).or(z.literal('Wikimedia')),
});

const SearchImagesOutputSchema = z.object({
  images: z.array(ImageSchema),
});
export type SearchImagesOutput = z.infer<typeof SearchImagesOutputSchema>;

async function searchPexels(query: string, page: number): Promise<SearchImagesOutput['images']> {
  if (!process.env.PEXELS_API_KEY) return [];
  try {
    const response = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=15&orientation=landscape&page=${page}`, {
      headers: { Authorization: process.env.PEXELS_API_KEY },
    });
    if (!response.ok) {
        console.error('Pexels API Error:', await response.text());
        return [];
    }
    const data = await response.json();
    return data.photos.map((photo: any) => ({
      url: photo.src.large,
      alt: photo.alt,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      source: 'Pexels',
    }));
  } catch (error) {
    console.error('Error searching Pexels:', error);
    return [];
  }
}

async function searchUnsplash(query: string, page: number): Promise<SearchImagesOutput['images']> {
  if (!process.env.UNSPLASH_ACCESS_KEY) return [];
  try {
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${query}&per_page=15&orientation=landscape&page=${page}`, {
      headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
    });
    if (!response.ok) {
        console.error('Unsplash API Error:', await response.text());
        return [];
    }
    const data = await response.json();
    return data.results.map((photo: any) => ({
      url: photo.urls.regular,
      alt: photo.alt_description,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      source: 'Unsplash',
    }));
  } catch (error) {
    console.error('Error searching Unsplash:', error);
    return [];
  }
}

async function searchWikimedia(query: string, page: number): Promise<SearchImagesOutput['images']> {
    try {
        const perPage = 15;
        const offset = (page - 1) * perPage;
        // Step 1: Search for images by keyword
        const searchUrl = new URL('https://commons.wikimedia.org/w/api.php');
        const searchParams = {
            action: 'query',
            list: 'search',
            srsearch: query,
            srnamespace: '6', // File namespace
            srlimit: perPage.toString(),
            sroffset: offset.toString(),
            format: 'json',
            origin: '*',
        };
        Object.keys(searchParams).forEach(key => searchUrl.searchParams.append(key, (searchParams as any)[key]));

        const searchResponse = await fetch(searchUrl.toString());
        if (!searchResponse.ok) {
            console.error('Wikimedia Search Error:', await searchResponse.text());
            return [];
        }
        const searchData = await searchResponse.json();
        if (!searchData.query?.search?.length) {
            return [];
        }
        
        const titles = searchData.query.search.map((item: any) => item.title).join('|');

        // Step 2: Get image info for the found titles
        const imageInfoUrl = new URL('https://commons.wikimedia.org/w/api.php');
         const imageInfoParams = {
            action: 'query',
            titles: titles,
            prop: 'imageinfo',
            iiprop: 'url|user|extmetadata',
            format: 'json',
            origin: '*',
        };
        Object.keys(imageInfoParams).forEach(key => imageInfoUrl.searchParams.append(key, (imageInfoParams as any)[key]));


        const imageInfoResponse = await fetch(imageInfoUrl.toString());
        if (!imageInfoResponse.ok) {
            console.error('Wikimedia Info Error:', await imageInfoResponse.text());
            return [];
        }
        const imageInfoData = await imageInfoResponse.json();
        const pages = imageInfoData.query?.pages;

        if (!pages) return [];

        return Object.values(pages)
            .filter((page: any): page is { imageinfo: any[] } => page.imageinfo && page.imageinfo.length > 0)
            .map((page: any) => {
                const info = page.imageinfo[0];
                const extmeta = info.extmetadata;
                
                // Sanitize HTML from fields
                const artistHtml = extmeta?.Artist?.value || '';
                const artistText = artistHtml.replace(/<[^>]*>?/gm, '');

                const alt = extmeta?.ObjectName?.value || info.descriptionurl.split('/').pop().replace(/_/g, ' ');
                const photographer = info.user || artistText || 'Unknown';
                const photographerUrl = info.user 
                    ? `https://commons.wikimedia.org/wiki/User:${encodeURIComponent(info.user)}` 
                    : (extmeta?.Credit?.value?.match(/href="([^"]+)"/)?.[1] || info.descriptionurl);

                return {
                    url: info.url,
                    alt,
                    photographer,
                    photographerUrl,
                    source: 'Wikimedia',
                };
            });

    } catch (error) {
        console.error('Error searching Wikimedia:', error);
        return [];
    }
}


export async function searchImages({ query, page = 1 }: SearchImagesInput): Promise<SearchImagesOutput> {
    const [pexelsImages, unsplashImages, wikimediaImages] = await Promise.all([
      searchPexels(query, page),
      searchUnsplash(query, page),
      searchWikimedia(query, page),
    ]);
    
    // Simple interleaving of results
    const images: SearchImagesOutput['images'] = [];
    let pIndex = 0;
    let uIndex = 0;
    let wIndex = 0;
    const maxLength = Math.max(pexelsImages.length, unsplashImages.length, wikimediaImages.length);

    for (let i = 0; i < maxLength; i++) {
        if(wIndex < wikimediaImages.length) images.push(wikimediaImages[wIndex++]);
        if(pIndex < pexelsImages.length) images.push(pexelsImages[pIndex++]);
        if(uIndex < unsplashImages.length) images.push(unsplashImages[uIndex++]);
    }

    return { images };
  }

