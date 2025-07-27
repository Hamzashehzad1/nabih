
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

async function fetchWpMediaPage(
    url: string,
    authHeader: string
): Promise<WpMediaItem[]> {
    const response = await fetch(url, {
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
    });

    if (!response.ok) {
        // Return empty array for this page on error, to not fail the whole process
        console.error(`Failed to fetch media page ${url}: ${response.statusText}`);
        return [];
    }

    const data = await response.json();
    const parsedData = MediaItemsSchema.safeParse(data);

    if (!parsedData.success) {
        console.error('WP Media Parse Error on a page:', parsedData.error);
        return [];
    }
    
    return parsedData.data.map(item => ({
        id: item.id,
        filename: item.media_details.file,
        filesize: item.media_details.filesize,
        width: item.media_details.width,
        height: item.media_details.height,
        thumbnailUrl: item.media_details.sizes.thumbnail?.source_url || item.source_url,
        fullUrl: item.source_url,
    }));
}


export async function fetchWpMedia(
    siteUrl: string,
    username: string,
    appPassword: string,
): Promise<{ success: true; data: WpMediaItem[] } | { success: false; error: string }> {
  
  const baseUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/media`;
  const firstPageUrl = new URL(baseUrl);
  firstPageUrl.searchParams.append('context', 'edit');
  firstPageUrl.searchParams.append('per_page', '100');
  
  const authHeader = 'Basic ' + btoa(`${username}:${appPassword}`);

  try {
    // First, make a request to the first page to get pagination headers
    const initialResponse = await fetch(firstPageUrl.toString(), {
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        cache: 'no-store',
    });

    if (!initialResponse.ok) {
        let errorDetails = `HTTP error! status: ${initialResponse.status}`;
        try {
            const errorData = await initialResponse.json();
            errorDetails += ` - ${errorData.message || 'Unknown error'}`;
        } catch (e) {}
        return { success: false, error: errorDetails };
    }

    const totalPagesHeader = initialResponse.headers.get('X-WP-TotalPages');
    const totalPages = totalPagesHeader ? parseInt(totalPagesHeader, 10) : 1;
    
    const initialData = await initialResponse.json();
    const parsedInitialData = MediaItemsSchema.safeParse(initialData);
     if (!parsedInitialData.success) {
        console.error('WP Media Parse Error on initial fetch:', parsedInitialData.error);
        return { success: false, error: 'Failed to parse media from WordPress.' };
    }

    const allMedia: WpMediaItem[] = parsedInitialData.data.map(item => ({
        id: item.id,
        filename: item.media_details.file,
        filesize: item.media_details.filesize,
        width: item.media_details.width,
        height: item.media_details.height,
        thumbnailUrl: item.media_details.sizes.thumbnail?.source_url || item.source_url,
        fullUrl: item.source_url,
    }));


    if (totalPages > 1) {
        const pagePromises: Promise<WpMediaItem[]>[] = [];
        for (let page = 2; page <= totalPages; page++) {
            const pageUrl = new URL(baseUrl);
            pageUrl.searchParams.append('context', 'edit');
            pageUrl.searchParams.append('per_page', '100');
            pageUrl.searchParams.append('page', page.toString());
            pagePromises.push(fetchWpMediaPage(pageUrl.toString(), authHeader));
        }
        
        const results = await Promise.all(pagePromises);
        results.forEach(pageMedia => allMedia.push(...pageMedia));
    }
    
    return { success: true, data: allMedia };

  } catch (error) {
    console.error('Error fetching media from WP:', error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred while fetching media.' };
  }
}

