
'use server';

import { z } from 'zod';

const PageSchema = z.object({
  id: z.number(),
  title: z.object({
    rendered: z.string(),
  }),
  content: z.object({
    rendered: z.string(),
  }),
  slug: z.string(),
});

const PagesSchema = z.array(PageSchema);

interface PageContent {
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


export async function fetchWebsiteContent(
    siteUrl: string,
    username: string,
    appPassword: string,
): Promise<{ success: true; data: PageContent[] } | { success: false; error: string }> {
  
  const baseUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/pages`;
  const authHeader = 'Basic ' + btoa(`${username}:${appPassword}`);
  const targetSlugs = ['home', 'about', 'contact', 'about-us', 'contact-us'];
  
  try {
    const url = new URL(baseUrl);
    url.searchParams.append('context', 'view');
    url.searchParams.append('_fields', 'id,title,content,slug');
    url.searchParams.append('per_page', '50'); // Fetch up to 50 pages, should be enough
    
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

    if (!Array.isArray(pageData)) {
         return { success: false, error: 'Could not fetch pages from WordPress.' };
    }
    
    const parsedData = PagesSchema.safeParse(pageData);
    if (!parsedData.success) {
        console.error('WP Page Parse Error:', parsedData.error);
        return { success: false, error: 'Failed to parse pages from WordPress.' };
    }

    const relevantPages: PageContent[] = parsedData.data
        .filter(page => targetSlugs.includes(page.slug.toLowerCase()) || (page.slug.toLowerCase() === 'front-page'))
        .map(item => ({
            id: item.id,
            title: item.title.rendered,
            content: stripHtml(item.content.rendered).replace(/\s\s+/g, ' ').trim(),
        }));

    if (relevantPages.length === 0) {
        return { success: false, error: "Could not find Home, About, or Contact pages. Please ensure they exist and have simple slugs (e.g., 'about', 'contact')." };
    }
    
    return { success: true, data: relevantPages };

  } catch (error) {
    console.error('Error fetching website content from WP:', error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred while fetching pages.' };
  }
}
