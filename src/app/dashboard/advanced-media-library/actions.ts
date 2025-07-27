
'use server';

import { z } from 'zod';

const MediaDetailsSchema = z.object({
  width: z.number(),
  height: z.number(),
  file: z.string(),
  filesize: z.number(),
  sizes: z.record(z.object({
    file: z.string(),
    width: z.number(),
    height: z.number(),
    mime_type: z.string(),
    source_url: z.string(),
  })),
});

const MediaItemSchema = z.object({
  id: z.number(),
  title: z.object({
    rendered: z.string(),
  }),
  media_details: MediaDetailsSchema,
  source_url: z.string(),
});

const MediaItemsSchema = z.array(MediaItemSchema);

export interface WpMediaItem {
  id: number;
  filename: string;
  filesize: number;
  width: number;
  height: number;
  thumbnailUrl: string;
  fullUrl: string;
}


export async function fetchWpMedia(
    siteUrl: string,
    username: string,
    appPassword: string,
): Promise<{ success: true; data: WpMediaItem[] } | { success: false; error: string }> {
  
  const allMedia: WpMediaItem[] = [];
  let page = 1;
  let hasMore = true;

  while(hasMore) {
    const url = new URL(`${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/media`);
    url.searchParams.append('context', 'edit');
    url.searchParams.append('per_page', '100'); // Fetch 100 at a time
    url.searchParams.append('page', page.toString());
    
    try {
        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': 'Basic ' + btoa(`${username}:${appPassword}`),
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
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

        if (data.length === 0) {
            hasMore = false;
            continue;
        }

        const parsedData = MediaItemsSchema.safeParse(data);

        if (!parsedData.success) {
            console.error('WP Media Parse Error:', parsedData.error);
            return { success: false, error: 'Failed to parse media from WordPress.' };
        }
        
        const formattedMedia: WpMediaItem[] = parsedData.data.map(item => ({
            id: item.id,
            filename: item.media_details.file,
            filesize: item.media_details.filesize,
            width: item.media_details.width,
            height: item.media_details.height,
            thumbnailUrl: item.media_details.sizes.thumbnail?.source_url || item.source_url,
            fullUrl: item.source_url,
        }));
        
        allMedia.push(...formattedMedia);
        page++;

    } catch (error) {
        console.error('Error fetching media from WP:', error);
        hasMore = false; // Stop fetching on error
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'An unknown error occurred while fetching media.' };
    }
  }

  return { success: true, data: allMedia };
}
