
'use server';

import { generateImagePrompt, GenerateImagePromptInput } from '@/ai/flows/generate-image-prompt';
import { searchImages, SearchImagesOutput } from '@/ai/flows/search-images';
import { z } from 'zod';
import { Readable } from 'stream';

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
  _embedded: z.optional(z.object({
    'wp:featuredmedia': z.optional(z.array(z.object({
      source_url: z.string(),
    }))),
  })),
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
    featuredImageUrl?: string;
}

export type ImageSearchResult = SearchImagesOutput['images'][0] & { size?: number };


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
    url.searchParams.append('_embed', 'wp:featuredmedia');
    url.searchParams.append('_fields', 'id,date,title,content,status,link,_links,_embedded');
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
            featuredImageUrl: post._embedded?.['wp:featuredmedia']?.[0]?.source_url
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

export async function uploadImageToWp(
  siteUrl: string,
  username: string,
  appPassword: string,
  {
    base64Data,
    fileName,
    altText,
    caption,
  }: {
    base64Data: string;
    fileName: string;
    altText: string;
    caption: string;
  }
): Promise<{ success: true; data: { source_url: string } } | { success: false; error: string }> {
  const url = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/media`;

  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data.split(';base64,').pop()!, 'base64');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${appPassword}`),
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${fileName}.jpg"`,
      },
      body: buffer,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || `HTTP error! status: ${response.status}` };
    }

    const mediaData = await response.json();

    // Now, update the media item with alt text, title, and caption
    const updateUrl = `${url}/${mediaData.id}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${appPassword}`),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        alt_text: altText,
        caption: { raw: caption },
        title: altText, // Often good to set title as well
      }),
    });

     if (!updateResponse.ok) {
        // Even if this fails, the image was uploaded. We can warn the user.
        console.warn(`Image uploaded but failed to set metadata: ${await updateResponse.text()}`);
    }

    return { success: true, data: { source_url: mediaData.source_url } };
  } catch (error) {
    console.error('Error uploading to WP:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred while uploading the image.' };
  }
}


export async function updatePostOnWp(
  siteUrl: string,
  username: string,
  appPassword: string,
  postId: string,
  newContent: string,
  status: 'publish' | 'draft'
): Promise<{ success: true } | { success: false; error: string }> {
  const url = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts/${postId}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${appPassword}`),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: newContent,
        status: status,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || `HTTP error! status: ${response.status}` };
    }

    return { success: true };

  } catch (error) {
    console.error('Error updating WP post:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred while updating the post.' };
  }
}
