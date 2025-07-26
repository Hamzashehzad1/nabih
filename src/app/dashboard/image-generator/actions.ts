
'use server';

import { generateImagePrompt, GenerateImagePromptInput } from '@/ai/flows/generate-image-prompt';
import { searchImages, SearchImagesOutput } from '@/ai/flows/search-images';
import { z } from 'zod';

// Define the schema for a single WordPress post
const PostSchema = z.object({
  id: z.number(),
  date: z.string(),
  title: z.object({
    rendered: z.string(),
  }),
  content: z.object({
    rendered: z.string(),
  }),
  status: z.enum(['publish', 'draft', 'pending', 'private', 'future']),
  link: z.string(),
});

// Define the schema for an array of posts
const PostsSchema = z.array(PostSchema);

export interface WpPost {
    id: string;
    title: string;
    content: string;
    date: string;
    status: 'publish' | 'draft' | 'pending' | 'private' | 'future';
    siteUrl: string;
}

export type ImageSearchResult = SearchImagesOutput['images'][0];


export async function generateAndSearch(input: GenerateImagePromptInput): Promise<{query: string, images: ImageSearchResult[]}> {
    try {
        const { query } = await generateImagePrompt(input);
        const searchResult = await searchImages({ query });
        return { query, images: searchResult.images };
    } catch (error) {
        console.error('Error in generateAndSearch:', error);
        return { query: '', images: [] };
    }
}


export async function fetchPostsFromWp(
    siteUrl: string,
    username: string,
    appPassword: string,
    page: number = 1
): Promise<{ success: true; data: WpPost[] } | { success: false; error: string }> {
    const statuses = ['publish', 'draft', 'pending'];
    const url = new URL(`${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts`);
    url.searchParams.append('context', 'edit');
    url.searchParams.append('_fields', 'id,date,title,content,status,link');
    url.searchParams.append('per_page', '10'); // Fetch 10 posts per page
    url.searchParams.append('page', page.toString());
    statuses.forEach(status => url.searchParams.append('status[]', status));

    try {
        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': 'Basic ' + btoa(`${username}:${appPassword}`),
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Ensure fresh data
        });

        if (!response.ok) {
            let errorDetails = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorDetails += ` - ${errorData.message || 'Unknown error'}`;
            } catch (e) {
                // Could not parse error JSON
            }
            return { success: false, error: errorDetails };
        }

        const data = await response.json();
        
        // If data is empty, it means no more posts
        if (Array.isArray(data) && data.length === 0) {
            return { success: true, data: [] };
        }
        
        const parsedData = PostsSchema.safeParse(data);

        if (!parsedData.success) {
            console.error('WP Parse Error:', parsedData.error);
            return { success: false, error: 'Failed to parse posts from WordPress.' };
        }
        
        const formattedPosts: WpPost[] = parsedData.data.map(post => ({
            id: post.id.toString(),
            title: post.title.rendered,
            content: post.content.rendered,
            date: new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            status: post.status,
            siteUrl: post.link,
        }));
        
        return { success: true, data: formattedPosts };

    } catch (error) {
        console.error('Error fetching from WP:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'An unknown error occurred while fetching posts.' };
    }
}
