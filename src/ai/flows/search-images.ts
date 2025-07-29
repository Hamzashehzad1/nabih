
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
import { JSDOM } from 'jsdom';

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
        
        const url = new URL('https://commons.wikimedia.org/w/api.php');
        const params = {
            action: 'query',
            generator: 'search',
            gsrsearch: `filetype:image ${query}`,
            gsrnamespace: '6',
            gsrlimit: perPage.toString(),
            gsroffset: offset.toString(),
            prop: 'imageinfo',
            iiprop: 'url|user|extmetadata',
            iiurlwidth: '500', // Request a thumbnail of a specific width
            format: 'json',
            origin: '*',
        };

        Object.keys(params).forEach(key => url.searchParams.append(key, (params as any)[key]));

        const response = await fetch(url.toString());
        if (!response.ok) {
            console.error('Wikimedia Search Error:', await response.text());
            return [];
        }

        const data = await response.json();
        const pages = data.query?.pages;

        if (!pages) return [];
        
        return Object.values(pages)
            .filter((page: any): page is { imageinfo: any[] } => page.imageinfo && page.imageinfo.length > 0)
            .map((page: any) => {
                const info = page.imageinfo[0];
                const extmeta = info.extmetadata;

                const cleanHtml = (html: string | undefined) => {
                    if (!html) return '';
                    const dom = new JSDOM(html);
                    return dom.window.document.body.textContent || '';
                }

                const alt = cleanHtml(extmeta?.ObjectName?.value) || page.title.replace('File:', '').replace(/\.[^/.]+$/, "").replace(/_/g, ' ');
                const artistHtml = extmeta?.Artist?.value || '';
                const creditHtml = extmeta?.Credit?.value || '';

                let photographer = info.user || 'Unknown';
                if(artistHtml) photographer = cleanHtml(artistHtml);
                
                let photographerUrl = info.descriptionurl;
                if(info.user) photographerUrl = `https://commons.wikimedia.org/wiki/User:${encodeURIComponent(info.user)}`;
                if(creditHtml) {
                    const dom = new JSDOM(creditHtml);
                    const link = dom.window.document.querySelector('a');
                    if (link) photographerUrl = link.href;
                }

                return {
                    url: info.thumburl,
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


