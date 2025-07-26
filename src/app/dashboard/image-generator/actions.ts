
'use server';

import { generateImagePrompt } from '@/ai/flows/generate-image-prompt';
import { generateImage } from '@/ai/flows/generate-image';
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
  status: z.enum(['publish', 'draft', 'pending', 'private']),
  link: z.string(),
});

// Define the schema for an array of posts
const PostsSchema = z.array(PostSchema);

export interface WpPost {
    id: string;
    title: string;
    content: string;
    date: string;
    status: 'publish' | 'draft' | 'pending' | 'private';
    siteUrl: string;
}

async function getImage(title: string, paragraph: string): Promise<string> {
  try {
    const promptResult = await generateImagePrompt({ title, paragraph });
    const imageResult = await generateImage({ prompt: promptResult.prompt });
    return imageResult.imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    // Return a placeholder or handle the error as needed
    return 'https://placehold.co/600x400.png';
  }
}

export async function getFeaturedImage(title: string, paragraph: string): Promise<string> {
    return getImage(title, paragraph);
}

export async function getSectionImage(heading: string, paragraph: string): Promise<string> {
    return getImage(heading, paragraph);
}

export async function fetchPostsFromWp(
    siteUrl: string,
    username: string,
    appPassword: string
): Promise<{ success: true; data: WpPost[] } | { success: false; error: string }> {
    const apiUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts?context=edit&status=publish,draft,pending&_fields=id,date,title,content,status,link`;
    
    try {
        const response = await fetch(apiUrl, {
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
        const parsedData = PostsSchema.safeParse(data);

        if (!parsedData.success) {
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
