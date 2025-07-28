'use server';

import { z } from 'zod';

const PostSchema = z.object({
  id: z.number(),
  title: z.object({
    rendered: z.string(),
  }),
  link: z.string().url(),
});

const PostsSchema = z.array(PostSchema);

export interface WpPost {
    id: number;
    title: string;
    url: string;
}

export async function fetchAllPublishedPosts(
    siteUrl: string,
    username: string,
    appPassword: string,
): Promise<{ success: true; data: WpPost[] } | { success: false; error: string }> {
  
    const authHeader = 'Basic ' + btoa(`${username}:${appPassword}`);
    const baseUrl = siteUrl.replace(/\/$/, '');
    let allPosts: WpPost[] = [];
    let page = 1;
    const perPage = 100;

    try {
        while (true) {
            const url = new URL(`${baseUrl}/wp-json/wp/v2/posts`);
            url.searchParams.append('status', 'publish');
            url.searchParams.append('_fields', 'id,title,link');
            url.searchParams.append('per_page', perPage.toString());
            url.searchParams.append('page', page.toString());

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
                cache: 'no-store',
            });

            if (!response.ok) {
                let errorDetails = `HTTP error fetching posts! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorDetails += ` - ${errorData.message || 'Unknown error'}`;
                } catch (e) {}
                return { success: false, error: errorDetails };
            }
            
            const postsData = await response.json();

            if (postsData.length === 0) {
                // No more posts to fetch
                break;
            }
            
            const parsedPosts = PostsSchema.safeParse(postsData);
            if (!parsedPosts.success) {
                console.error('WP Post Parse Error:', parsedPosts.error);
                return { success: false, error: 'Failed to parse posts from WordPress.' };
            }

            const formattedPosts = parsedPosts.data.map(post => ({
                id: post.id,
                title: post.title.rendered,
                url: post.link,
            }));
            
            allPosts = allPosts.concat(formattedPosts);
            page++;
        }
    
        return { success: true, data: allPosts };

  } catch (error) {
    console.error('Error fetching website content from WP:', error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred while fetching content.' };
  }
}
