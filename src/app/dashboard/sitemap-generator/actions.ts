// src/app/dashboard/sitemap-generator/actions.ts
'use server';

import { z } from 'zod';

const SitemapEntrySchema = z.object({
  id: z.number(),
  link: z.string().url(),
  modified_gmt: z.string().datetime(),
});

type SitemapEntry = {
    url: string;
    modified: string;
}

export async function fetchAllUrls(
    siteUrl: string,
    username: string,
    appPassword: string,
): Promise<{ success: true; data: SitemapEntry[] } | { success: false; error: string }> {
  
    const authHeader = 'Basic ' + btoa(`${username}:${appPassword}`);
    const baseUrl = siteUrl.replace(/\/$/, '');
    let allEntries: SitemapEntry[] = [];
    const perPage = 100;
    const postTypes = ['posts', 'pages']; // Add custom post types if needed

    try {
        for (const postType of postTypes) {
            let page = 1;
            while (true) {
                const url = new URL(`${baseUrl}/wp-json/wp/v2/${postType}`);
                url.searchParams.append('status', 'publish');
                url.searchParams.append('_fields', 'id,link,modified_gmt');
                url.searchParams.append('per_page', perPage.toString());
                url.searchParams.append('page', page.toString());

                const response = await fetch(url.toString(), {
                    method: 'GET',
                    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
                    cache: 'no-store',
                });

                if (!response.ok) {
                    let errorDetails = `HTTP error fetching ${postType}! status: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        errorDetails += ` - ${errorData.message || 'Unknown error'}`;
                    } catch (e) {}
                    return { success: false, error: errorDetails };
                }
                
                const data = await response.json();

                if (data.length === 0) {
                    break;
                }
                
                const parsedEntries = z.array(SitemapEntrySchema).safeParse(data);
                if (!parsedEntries.success) {
                    console.error(`WP ${postType} Parse Error:`, parsedEntries.error);
                    return { success: false, error: `Failed to parse ${postType} from WordPress.` };
                }

                const formattedEntries = parsedEntries.data.map(entry => ({
                    url: entry.link,
                    modified: entry.modified_gmt,
                }));
                
                allEntries = allEntries.concat(formattedEntries);
                page++;
            }
        }
    
        return { success: true, data: allEntries };

  } catch (error) {
    console.error('Error fetching website URLs from WP:', error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred while fetching URLs.' };
  }
}
