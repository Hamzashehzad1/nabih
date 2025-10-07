
'use server';

import { z } from 'zod';

interface WpSite {
  id: string;
  url: string;
  user: string;
  appPassword?: string;
}

const PostDataSchema = z.object({
  title: z.string(),
  content: z.string(),
  status: z.enum(['publish', 'draft', 'pending', 'private']),
});

type PostData = z.infer<typeof PostDataSchema>;

const WpPostResponseSchema = z.object({
    id: z.number(),
    link: z.string().url(),
});


export async function createWpPost(
  site: WpSite,
  post: PostData
): Promise<{ success: true; data: z.infer<typeof WpPostResponseSchema> } | { success: false; error: string }> {
  
  if (!site.appPassword) {
    return { success: false, error: 'Application password for the site is missing.' };
  }

  const url = `${site.url.replace(/\/$/, '')}/wp-json/wp/v2/posts`;
  const authHeader = 'Basic ' + btoa(`${site.user}:${site.appPassword}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(post),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `WordPress API error: ${response.statusText}`);
    }

    const data = await response.json();
    const parsedData = WpPostResponseSchema.safeParse(data);

     if (!parsedData.success) {
        console.error('WP Post Response Parse Error:', parsedData.error);
        return { success: false, error: 'Failed to parse response from WordPress.' };
    }

    return { success: true, data: parsedData.data };
  } catch (error) {
    console.error('Error creating WP post:', error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred while publishing.' };
  }
}
