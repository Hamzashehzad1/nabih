// src/app/dashboard/broken-link-checker/actions.ts
'use server';

import { z } from 'zod';
import * as cheerio from 'cheerio';

const PostSchema = z.object({
  id: z.number(),
  title: z.object({
    rendered: z.string(),
  }),
  content: z.object({
    rendered: z.string(),
  }),
  link: z.string().url(),
});

const PostsSchema = z.array(PostSchema);

interface WpPost {
    id: number;
    title: string;
    content: string;
    url: string;
}

export interface LinkStatus {
    url: string;
    status: number;
    statusText: string;
    foundOnUrl: string;
    foundOnTitle: string;
}

type ProgressCallback = (status: LinkStatus) => void;
type TotalCallback = (total: number) => void;

async function fetchAllPosts(siteUrl: string, authHeader: string): Promise<WpPost[]> {
    let allPosts: WpPost[] = [];
    const perPage = 100;
    const postTypes = ['posts', 'pages'];
    const baseUrl = siteUrl.replace(/\/$/, '');

    for (const postType of postTypes) {
        let page = 1;
        while (true) {
            const url = new URL(`${baseUrl}/wp-json/wp/v2/${postType}`);
            url.searchParams.append('status', 'publish');
            url.searchParams.append('context', 'edit');
            url.searchParams.append('_fields', 'id,title,content,link');
            url.searchParams.append('per_page', perPage.toString());
            url.searchParams.append('page', page.toString());

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
                cache: 'no-store',
            });

            if (!response.ok) {
                // Silently fail for post types that don't exist
                if (response.status === 404) break;
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to fetch ${postType}: ${errorData.message || response.statusText}`);
            }

            const data = await response.json();
            if (data.length === 0) break;

            const parsedPosts = PostsSchema.safeParse(data);
            if (!parsedPosts.success) {
                console.error(`WP ${postType} Parse Error:`, parsedPosts.error);
                throw new Error(`Failed to parse ${postType} from WordPress.`);
            }

            allPosts = allPosts.concat(parsedPosts.data.map(p => ({
                id: p.id,
                title: p.title.rendered,
                content: p.content.rendered,
                url: p.link
            })));
            page++;
        }
    }
    return allPosts;
}

export async function checkLinks(
    siteUrl: string,
    username: string,
    appPassword: string,
    progressCallback: ProgressCallback,
    totalCallback: TotalCallback,
): Promise<void> {
    const authHeader = 'Basic ' + btoa(`${username}:${appPassword}`);
    
    // 1. Fetch all posts and pages
    const allContent = await fetchAllPosts(siteUrl, authHeader);
    
    // 2. Extract all unique links
    const linksToTest = new Map<string, { foundOnUrl: string, foundOnTitle: string }>();
    allContent.forEach(post => {
        const $ = cheerio.load(post.content);
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && (href.startsWith('http') || href.startsWith('https'))) {
                if (!linksToTest.has(href)) {
                    linksToTest.set(href, { foundOnUrl: post.url, foundOnTitle: post.title });
                }
            }
        });
    });

    totalCallback(linksToTest.size);

    // 3. Check each link
    const linkPromises = Array.from(linksToTest.entries()).map(async ([url, source]) => {
        try {
            const response = await fetch(url, { method: 'HEAD', redirect: 'manual' });
            const statusUpdate = {
                url,
                status: response.status,
                statusText: response.statusText,
                ...source
            };
            progressCallback(statusUpdate);
            return statusUpdate;
        } catch (error) {
            const statusUpdate = {
                url,
                status: 0, // Indicates a network error
                statusText: 'Network Error',
                ...source
            };
            progressCallback(statusUpdate);
            return statusUpdate;
        }
    });

    await Promise.all(linkPromises);
}
