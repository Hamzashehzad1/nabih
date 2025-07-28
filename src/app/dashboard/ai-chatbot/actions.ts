
'use server';

import { z } from 'zod';

const PostSchema = z.object({
  id: z.number(),
  title: z.object({
    rendered: z.string(),
  }),
  content: z.object({
    rendered: z.string(),
  }),
});

const PostsSchema = z.array(PostSchema);

interface PostContent {
    id: number;
    title: string;
    content: string;
}

function stripHtml(html: string): string {
    if (typeof document === 'undefined') {
        // Basic stripping for server-side
        return html.replace(/<[^>]*>?/gm, '');
    }
    // Browser-side stripping
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}


export async function fetchAllPostsContent(
    siteUrl: string,
    username: string,
    appPassword: string,
): Promise<{ success: true; data: PostContent[] } | { success: false; error: string }> {
  
  const baseUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts`;
  const authHeader = 'Basic ' + btoa(`${username}:${appPassword}`);
  let allPosts: PostContent[] = [];
  let page = 1;
  const perPage = 100; // Fetch max posts per page

  try {
    while (true) {
        const url = new URL(baseUrl);
        url.searchParams.append('context', 'edit');
        url.searchParams.append('_fields', 'id,title,content');
        url.searchParams.append('per_page', perPage.toString());
        url.searchParams.append('page', page.toString());
        
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
            cache: 'no-store',
        });
        
        if (!response.ok) {
            let errorDetails = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorDetails += ` - ${errorData.message || 'Unknown error'}`;
            } catch (e) {}
            return { success: false, error: errorDetails };
        }

        const pageData = await response.json();

        if (!Array.isArray(pageData) || pageData.length === 0) {
            break; // No more posts
        }
        
        const parsedData = PostsSchema.safeParse(pageData);
        if (!parsedData.success) {
            console.error('WP Post Parse Error:', parsedData.error);
            return { success: false, error: 'Failed to parse posts from WordPress.' };
        }

        const postsForPage: PostContent[] = parsedData.data.map(item => ({
            id: item.id,
            title: item.title.rendered,
            content: stripHtml(item.content.rendered).replace(/\s\s+/g, ' ').trim(),
        }));

        allPosts = [...allPosts, ...postsForPage];
        page++;
    }
    
    return { success: true, data: allPosts };

  } catch (error) {
    console.error('Error fetching all posts from WP:', error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred while fetching posts.' };
  }
}
