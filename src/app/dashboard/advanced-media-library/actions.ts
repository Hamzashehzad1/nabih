
'use server';

import { z } from 'zod';

const MediaDetailsSchema = z.object({
  width: z.number(),
  height: z.number(),
  file: z.string(),
  filesize: z.number().optional().default(0),
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
  date_gmt: z.string(),
  title: z.object({
    rendered: z.string(),
  }),
  alt_text: z.string(),
  caption: z.object({
    rendered: z.string(),
  }),
  description: z.object({
    rendered: z.string(),
  }),
  media_details: MediaDetailsSchema,
  source_url: z.string(),
});

const MediaItemsSchema = z.array(MediaItemSchema);

export interface WpMediaItem {
  id: number;
  date: string;
  filename: string;
  filesize: number;
  width: number;
  height: number;
  thumbnailUrl: string;
  fullUrl: string;
  alt: string;
  caption: string;
  description: string;
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

export async function fetchWpMedia(
    siteUrl: string,
    username: string,
    appPassword: string
): Promise<{ success: true; data: WpMediaItem[] } | { success: false; error: string }> {
  
  const baseUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/media`;
  const authHeader = 'Basic ' + btoa(`${username}:${appPassword}`);
  const allMediaData: z.infer<typeof MediaItemSchema>[] = [];
  const perPage = 100; // Max per_page for WP REST API by default

  try {
    // First, make a HEAD request or a request for a single item to get total pages
    const initialUrl = new URL(baseUrl);
    initialUrl.searchParams.append('per_page', '1');
    const initialResponse = await fetch(initialUrl.toString(), {
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

    const totalPagesHeader = initialResponse.headers.get('x-wp-totalpages');
    const totalPages = totalPagesHeader ? parseInt(totalPagesHeader, 10) : 1;

    // Now, fetch all pages
    const pagePromises = [];
    for (let page = 1; page <= totalPages; page++) {
        const url = new URL(baseUrl);
        url.searchParams.append('context', 'edit');
        url.searchParams.append('per_page', perPage.toString());
        url.searchParams.append('page', page.toString());

        pagePromises.push(
            fetch(url.toString(), {
                headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
                cache: 'no-store',
            }).then(res => {
                if (!res.ok) {
                    // We can still try to get a message, but we won't fail the whole batch for one page failure
                    console.error(`Failed to fetch page ${page}: ${res.statusText}`);
                    return []; 
                }
                return res.json();
            })
        );
    }
    
    const allPagesData = await Promise.all(pagePromises);
    allPagesData.forEach(pageData => {
        if (Array.isArray(pageData)) {
            allMediaData.push(...pageData);
        }
    });

    const parsedData = MediaItemsSchema.safeParse(allMediaData);
     if (!parsedData.success) {
        console.error('WP Media Parse Error:', parsedData.error);
        return { success: false, error: 'Failed to parse media from WordPress.' };
    }

    const allMedia: WpMediaItem[] = parsedData.data.map(item => ({
        id: item.id,
        date: item.date_gmt,
        filename: item.media_details.file,
        filesize: item.media_details.filesize || 0,
        width: item.media_details.width,
        height: item.media_details.height,
        thumbnailUrl: item.media_details.sizes.thumbnail?.source_url || item.source_url,
        fullUrl: item.source_url,
        alt: item.alt_text,
        caption: stripHtml(item.caption.rendered),
        description: stripHtml(item.description.rendered),
    }));
    
    return { success: true, data: allMedia };

  } catch (error) {
    console.error('Error fetching media from WP:', error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred while fetching media.' };
  }
}

export async function updateWpMediaDetails(
    siteUrl: string,
    username: string,
    appPassword: string,
    mediaId: number,
    details: { alt: string; caption: string; description: string }
): Promise<{ success: true } | { success: false; error: string }> {
    const url = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/media/${mediaId}`;
    const authHeader = 'Basic ' + btoa(`${username}:${appPassword}`);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                alt_text: details.alt,
                caption: details.caption,
                description: details.description,
            }),
        });

        if (!response.ok) {
            let errorDetails = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorDetails += ` - ${errorData.message || 'Unknown error'}`;
            } catch (e) {}
            return { success: false, error: errorDetails };
        }
        
        return { success: true };

    } catch (error) {
        console.error('Error updating media details:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'An unknown error occurred while updating media details.' };
    }
}
