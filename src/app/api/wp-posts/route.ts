
// src/app/api/wp-posts/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';

const PostSchema = z.object({
  id: z.number(),
  date: z.string(),
  title: z.object({
    rendered: z.string(),
  }),
  content: z.object({
    rendered: z.string(),
  }),
  status: z.enum(['publish', 'draft', 'pending', 'private', 'future']),
  link: z.string(),
  _embedded: z.optional(z.object({
    'wp:featuredmedia': z.optional(z.array(z.object({
      source_url: z.string().optional(),
    }))),
  })),
});

const PostsSchema = z.array(PostSchema);

// Function to send data through the stream
function sendEvent(controller: ReadableStreamDefaultController, data: object) {
    controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const siteUrl = searchParams.get('siteUrl');
    const username = searchParams.get('username');
    const appPassword = searchParams.get('password');
    const statusFilter = searchParams.get('status');

    if (!siteUrl || !username || !appPassword || !statusFilter) {
        return new Response('Missing required query parameters.', { status: 400 });
    }

    const authHeader = 'Basic ' + btoa(`${username}:${appPassword}`);
    const baseUrl = siteUrl.replace(/\/$/, '');
    const perPage = 20;

    const stream = new ReadableStream({
        async start(controller) {
            let page = 1;
            const statuses = statusFilter === 'all' ? ['publish', 'draft'] : [statusFilter];

            try {
                while (true) {
                    const url = new URL(`${baseUrl}/wp-json/wp/v2/posts`);
                    url.searchParams.append('context', 'edit');
                    url.searchParams.append('_embed', 'wp:featuredmedia');
                    url.searchParams.append('_fields', 'id,date,title,content,status,link,_links,_embedded');
                    url.searchParams.append('per_page', perPage.toString());
                    url.searchParams.append('page', page.toString());
                    statuses.forEach(s => url.searchParams.append('status[]', s));

                    const response = await fetch(url.toString(), {
                        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
                        cache: 'no-store',
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        if (errorData.code === 'rest_post_invalid_page_number') {
                            break; // End of posts
                        }
                        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Unknown error'}`);
                    }

                    const postsData = await response.json();
                    if (postsData.length === 0) {
                        break; // End of posts
                    }

                    const parsedData = PostsSchema.safeParse(postsData);
                    if (!parsedData.success) {
                        throw new Error('Failed to parse posts from WordPress.');
                    }

                    const formattedPosts = parsedData.data.map(post => ({
                        id: post.id.toString(),
                        title: post.title.rendered,
                        content: post.content.rendered,
                        date: new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                        status: post.status,
                        siteUrl: post.link,
                        featuredImageUrl: post._embedded?.['wp:featuredmedia']?.[0]?.source_url
                    }));
                    
                    // Stream each post individually
                    for (const post of formattedPosts) {
                        sendEvent(controller, { type: 'post', data: post });
                    }

                    page++;
                }

                sendEvent(controller, { type: 'done' });

            } catch (error: any) {
                console.error('Error in post stream:', error);
                sendEvent(controller, { type: 'error', message: error.message });
            } finally {
                controller.close();
            }
        },
        cancel() {
            console.log("Stream canceled by client.");
        }
    });
    
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
