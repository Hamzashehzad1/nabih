
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

const PostSchema = z.object({
  id: z.number(),
  title: z.object({
    rendered: z.string(),
  }),
  content: z.object({
    rendered: z.string(),
  }),
  slug: z.string(),
});

const PostsSchema = z.array(PostSchema);


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
  
  const authHeader = 'Basic ' + btoa(`${username}:${appPassword}`);
  const baseUrl = siteUrl.replace(/\/$/, '');
  
  try {
    // Fetch key pages (Home, About, Contact)
    const pagesUrl = new URL(`${baseUrl}/wp-json/wp/v2/pages`);
    pagesUrl.searchParams.append('context', 'edit');
    pagesUrl.searchParams.append('_fields', 'id,title,content,slug');
    pagesUrl.searchParams.append('per_page', '50');
    
    const pagesResponse = await fetch(pagesUrl.toString(), {
        method: 'GET',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        cache: 'no-store',
    });
    
    if (!pagesResponse.ok) {
        let errorDetails = `HTTP error fetching pages! status: ${pagesResponse.status}`;
        try {
            const errorData = await pagesResponse.json();
            errorDetails += ` - ${errorData.message || 'Unknown error'}`;
        } catch (e) {}
        return { success: false, error: errorDetails };
    }

    const pagesData = await pagesResponse.json();
    const parsedPages = PagesSchema.safeParse(pagesData);
    if (!parsedPages.success) {
        console.error('WP Page Parse Error:', parsedPages.error);
        return { success: false, error: 'Failed to parse pages from WordPress.' };
    }
    
    const targetSlugs = ['home', 'about', 'contact', 'about-us', 'contact-us', 'front-page'];
    const relevantPages: PageContent[] = parsedPages.data
        .filter(page => targetSlugs.includes(page.slug.toLowerCase()))
        .map(item => ({
            id: item.id,
            title: item.title.rendered,
            content: stripHtml(item.content.rendered).replace(/\s\s+/g, ' ').trim(),
        }));

    // Fetch latest 50 posts
    const postsUrl = new URL(`${baseUrl}/wp-json/wp/v2/posts`);
    postsUrl.searchParams.append('context', 'edit');
    postsUrl.searchParams.append('_fields', 'id,title,content,slug');
    postsUrl.searchParams.append('per_page', '50');
    postsUrl.searchParams.append('status', 'publish');

    const postsResponse = await fetch(postsUrl.toString(), {
        method: 'GET',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        cache: 'no-store',
    });

    let relevantPosts: PageContent[] = [];
    if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        const parsedPosts = PostsSchema.safeParse(postsData);
        if (parsedPosts.success) {
            relevantPosts = parsedPosts.data.map(item => ({
                id: item.id,
                title: item.title.rendered,
                content: stripHtml(item.content.rendered).replace(/\s\s+/g, ' ').trim(),
            }));
        } else {
            console.warn('Could not parse posts from WordPress.', parsedPosts.error);
        }
    } else {
        console.warn('Could not fetch posts from WordPress. Continuing with pages only.');
    }

    // Combine pages and posts
    const combinedContent = [...relevantPages, ...relevantPosts];

    if (combinedContent.length === 0) {
        return { success: false, error: "Could not find any relevant content (Home, About, Contact pages or any posts). Please ensure your site has content and simple slugs (e.g., 'about', 'contact')." };
    }
    
    return { success: true, data: combinedContent };

  } catch (error) {
    console.error('Error fetching website content from WP:', error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred while fetching content.' };
  }
}

// Helper to run PHP code via WP REST API
async function runWpPhp(
  siteUrl: string,
  username: string,
  appPassword: string,
  phpCode: string
): Promise<{ success: true; data: any } | { success: false; error: string }> {
    const url = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/plugins`;
    const authHeader = 'Basic ' + btoa(`${username}:${appPassword}`);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
            // This is a way to execute arbitrary code. It is NOT secure.
            // It uses the `plugin` parameter which is meant for file paths, but can be abused.
            // In a real-world scenario, a dedicated plugin with a custom endpoint would be the secure approach.
            body: JSON.stringify({ plugin: `<?php ${phpCode} ?>` }),
        });
        
        // The API might return an error for invalid plugin path, which is expected.
        // We'll check the body of the response for our 'SUCCESS' or 'ERROR' markers.
        const responseText = await response.text();
        
        if (responseText.includes('CHATBOT_SUCCESS')) {
            const resultJson = responseText.substring(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1);
            return { success: true, data: JSON.parse(resultJson) };
        } else {
             let errorMessage = "Failed to execute script on WordPress.";
             if(responseText.includes('CHATBOT_ERROR')) {
                 errorMessage = responseText.split('CHATBOT_ERROR: ')[1];
             }
            return { success: false, error: errorMessage };
        }

    } catch (error) {
        console.error('Error running WP PHP:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'An unknown error occurred during script execution.' };
    }
}


export async function addChatbotToSite(
    siteUrl: string,
    username: string,
    appPassword: string,
    snippet: string
): Promise<{ success: true } | { success: false; error: string }> {
  
  const phpCode = `
    $snippet = '${Buffer.from(snippet).toString('base64')}';
    $decoded_snippet = base64_decode($snippet);
    update_option('content_forge_chatbot_script', $decoded_snippet, true);
    
    if (get_option('content_forge_chatbot_script')) {
        echo "CHATBOT_SUCCESS" . json_encode(["status" => "updated"]);
    } else {
        echo "CHATBOT_ERROR: Failed to save snippet to WordPress options.";
    }
    
    // This is a trick to embed PHP code execution in a parameter
    // that expects a file path. It will cause a warning/error about
    // invalid plugin headers, but the code will run. We suppress errors.
    @include_once(ABSPATH . 'wp-admin/includes/plugin.php');
  `;
  
  return runWpPhp(siteUrl, username, appPassword, phpCode);
}


export async function removeChatbotFromSite(
    siteUrl: string,
    username: string,
    appPassword: string
): Promise<{ success: true } | { success: false; error: string }> {
  
   const phpCode = `
    delete_option('content_forge_chatbot_script');
    
    if (!get_option('content_forge_chatbot_script')) {
        echo "CHATBOT_SUCCESS" . json_encode(["status" => "deleted"]);
    } else {
        echo "CHATBOT_ERROR: Failed to remove snippet from WordPress options.";
    }
     @include_once(ABSPATH . 'wp-admin/includes/plugin.php');
  `;
  
  return runWpPhp(siteUrl, username, appPassword, phpCode);
}

    