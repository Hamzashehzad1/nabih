
'use server';

import { z } from 'zod';
import { JSDOM } from 'jsdom';

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
  })).optional(),
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
  mime_type: string;
}

function stripHtml(html: string): string {
    const dom = new JSDOM(html);
    return dom.window.document.body.textContent || "";
}

export async function fetchWpMedia(
    siteUrl: string,
    username: string,
    appPassword: string,
    page: number = 1,
    perPage: number = 50
): Promise<{ success: true; data: WpMediaItem[], totalPages: number } | { success: false; error: string }> {
  
  const baseUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/media`;
  const authHeader = 'Basic ' + btoa(`${username}:${appPassword}`);
  const url = new URL(baseUrl);
  url.searchParams.append('context', 'edit');
  url.searchParams.append('per_page', perPage.toString());
  url.searchParams.append('page', page.toString());


  try {
    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        cache: 'no-store',
    });
    
    if (!response.ok) {
        let errorDetails = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
             if (errorData.code === 'rest_post_invalid_page_number') {
                // This is not a fatal error, it just means we're past the last page.
                // Return success with empty data.
                return { success: true, data: [], totalPages: 0 };
            } else {
                errorDetails += ` - ${errorData.message || 'Unknown error'}`;
            }
        } catch (e) {}
        return { success: false, error: errorDetails };
    }

    const totalPagesHeader = response.headers.get('x-wp-totalpages');
    const totalPages = totalPagesHeader ? parseInt(totalPagesHeader, 10) : 1;
    
    const pageData = await response.json();

    if (!Array.isArray(pageData)) {
      return { success: false, error: "Invalid data format from WordPress API." };
    }

    const parsedData = MediaItemsSchema.safeParse(pageData);
     if (!parsedData.success) {
        console.error('WP Media Parse Error:', parsedData.error);
        return { success: false, error: 'Failed to parse media from WordPress.' };
    }

    const mediaForPage: WpMediaItem[] = parsedData.data.map(item => ({
        id: item.id,
        date: item.date_gmt,
        filename: item.media_details.file,
        filesize: item.media_details.filesize || 0,
        width: item.media_details.width,
        height: item.media_details.height,
        thumbnailUrl: item.media_details.sizes?.thumbnail?.source_url || item.source_url,
        fullUrl: item.source_url,
        alt: item.alt_text,
        caption: stripHtml(item.caption.rendered),
        description: stripHtml(item.description.rendered),
        mime_type: item.media_details.sizes?.full?.mime_type || 'image/jpeg',
    }));
    
    return { success: true, data: mediaForPage, totalPages };

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


export async function replaceWpMediaFile(
  siteUrl: string,
  username: string,
  appPassword: string,
  mediaItem: WpMediaItem,
  optimizedImage: { base64: string }
): Promise<{ success: true } | { success: false; error: string }> {
  const url = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/media/${mediaItem.id}`;
  const authHeader = 'Basic ' + btoa(`${username}:${appPassword}`);
  const buffer = Buffer.from(optimizedImage.base64.split(';base64,').pop()!, 'base64');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Disposition': `attachment; filename="${mediaItem.filename}"`
      },
      body: buffer
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
    console.error('Error replacing media file:', error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred while replacing the media file.' };
  }
}

export async function uploadWpMedia(
  siteUrl: string,
  username: string,
  appPassword: string,
  details: {
    base64: string;
    filename: string;
    alt: string;
    caption: string;
    description: string;
    mimeType: string;
  }
): Promise<{ success: true, data: any } | { success: false; error: string }> {
  const url = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/media`;
  const authHeader = 'Basic ' + btoa(`${username}:${appPassword}`);
  const buffer = Buffer.from(details.base64.split(';base64,').pop()!, 'base64');
  
  try {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': authHeader,
            'Content-Type': details.mimeType,
            'Content-Disposition': `attachment; filename="${details.filename}"`,
        },
        body: buffer,
    });
    
    if (!response.ok) {
      let errorDetails = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorDetails += ` - ${errorData.message || 'Unknown error'}`;
      } catch (e) {}
      return { success: false, error: errorDetails };
    }

    const mediaData = await response.json();

    // Now, update the media item with alt text, title, and caption
    const updateUrl = `${url}/${mediaData.id}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        alt_text: details.alt,
        caption: details.caption,
        description: details.description,
        title: details.alt,
      }),
    });

    if (!updateResponse.ok) {
        console.warn(`Image uploaded but failed to set metadata: ${await updateResponse.text()}`);
    }
    
    return { success: true, data: mediaData };
  } catch (error) {
    console.error('Error uploading new media:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred while uploading.' };
  }
}



export async function backupMediaToCloud(
  mediaItem: { filename: string },
  destination: string
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  console.log(`Backing up ${mediaItem.filename} to ${destination}...`);
  
  // Simulate network delay and potential failure
  const delay = Math.random() * 2000 + 500; // 0.5 to 2.5 seconds
  await new Promise(resolve => setTimeout(resolve, delay));
  
  const shouldFail = Math.random() < 0.1; // 10% chance of failure

  if (shouldFail) {
    console.error(`Failed to back up ${mediaItem.filename}.`);
    return { success: false, error: 'A simulated network error occurred.' };
  }
  
  return { success: true, message: `Successfully backed up ${mediaItem.filename} to ${destination}.` };
}

    