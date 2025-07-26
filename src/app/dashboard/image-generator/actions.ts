
'use server';

import { generateImagePrompt, GenerateImagePromptInput } from '@/ai/flows/generate-image-prompt';
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

// This function simulates fetching an image URL after getting a prompt.
// In a real app, this would involve searching Pexels/Unsplash.
async function getImageUrlFromPrompt(query: string): Promise<string> {
    // Simulate API call and return a placeholder.
    // The query can be used to make the placeholder more relevant.
    await new Promise(resolve => setTimeout(resolve, 1000));
    const queryHint = query.split(' ').slice(0, 2).join(' ');
    const placeholderUrl = `https://placehold.co/600x400.png`;
    
    const urlWithHint = new URL(placeholderUrl);
    urlWithHint.searchParams.set('data-ai-hint', queryHint);
    return urlWithHint.toString();
}

export async function getFeaturedImage(title: string, paragraph: string): Promise<string> {
  try {
    const result = await generateImagePrompt({ title, paragraph, type: 'featured' });
    return getImageUrlFromPrompt(result.query);
  } catch (error) {
    console.error('Error generating featured image query:', error);
    return 'https://placehold.co/600x400.png';
  }
}

export async function getSectionImage(heading: string, paragraph: string): Promise<string> {
    try {
        const result = await generateImagePrompt({ title: heading, paragraph, type: 'section' });
        return getImageUrlFromPrompt(result.query);
    } catch (error) {
        console.error('Error generating section image query:', error);
        return 'https://placehold.co/600x400.png';
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
