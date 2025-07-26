
'use server';
/**
 * @fileOverview Searches for images on Pexels and Unsplash.
 *
 * - searchImages - A function that handles searching for images.
 * - SearchImagesInput - The input type for the searchImages function.
 * - SearchImagesOutput - The return type for the searchImages function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SearchImagesInputSchema = z.object({
  query: z.string().describe('The search query for images.'),
});
export type SearchImagesInput = z.infer<typeof SearchImagesInputSchema>;

const ImageSchema = z.object({
  url: z.string(),
  alt: z.string(),
  photographer: z.string(),
  photographerUrl: z.string(),
  source: z.literal('Pexels').or(z.literal('Unsplash')),
});

const SearchImagesOutputSchema = z.object({
  images: z.array(ImageSchema),
});
export type SearchImagesOutput = z.infer<typeof SearchImagesOutputSchema>;

async function searchPexels(query: string): Promise<SearchImagesOutput['images']> {
  try {
    const response = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=15&orientation=landscape`, {
      headers: { Authorization: process.env.PEXELS_API_KEY! },
    });
    if (!response.ok) {
        console.error('Pexels API Error:', await response.text());
        return [];
    }
    const data = await response.json();
    return data.photos.map((photo: any) => ({
      url: photo.src.large, // Use large for better preview in dialog
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

async function searchUnsplash(query: string): Promise<SearchImagesOutput['images']> {
  try {
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${query}&per_page=15&orientation=landscape`, {
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

export async function searchImages({ query }: SearchImagesInput): Promise<SearchImagesOutput> {
    const [pexelsImages, unsplashImages] = await Promise.all([
      searchPexels(query),
      searchUnsplash(query),
    ]);
    
    // Simple interleaving of results
    const images: SearchImagesOutput['images'] = [];
    let pIndex = 0;
    let uIndex = 0;
    while(pIndex < pexelsImages.length || uIndex < unsplashImages.length) {
        if(pIndex < pexelsImages.length) images.push(pexelsImages[pIndex++]);
        if(uIndex < unsplashImages.length) images.push(unsplashImages[uIndex++]);
    }

    return { images };
  }
