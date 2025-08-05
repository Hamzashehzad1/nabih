// src/app/dashboard/landing-page-generator/actions.ts
'use server';

import { generateLandingPage } from '@/ai/flows/generate-landing-page';
import type { GenerateLandingPageInput, GenerateLandingPageOutput } from '@/ai/flows/types/landing-page';
import { z } from 'zod';

export interface WpSite {
  id: string;
  url: string;
  user: string;
  appPassword?: string;
}

interface PublishInput {
    site: WpSite;
    title: string;
    content: string;
}

const WpPageSchema = z.object({
  id: z.number(),
  link: z.string().url(),
  title: z.object({
    rendered: z.string(),
  }),
});


export async function generateLandingPageAction(
  input: GenerateLandingPageInput
): Promise<GenerateLandingPageOutput> {
  return generateLandingPage(input);
}


export async function publishToWordPress(
  input: PublishInput
): Promise<{ success: true; data: z.infer<typeof WpPageSchema> } | { success: false; error: string }> {
  const { site, title, content } = input;

  if (!site.appPassword) {
    return { success: false, error: 'Application password for the site is missing.' };
  }

  const url = `${site.url.replace(/\/$/, '')}/wp-json/wp/v2/pages`;
  const authHeader = 'Basic ' + btoa(`${site.user}:${site.appPassword}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
        status: 'publish', // Or 'draft'
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `WordPress API error: ${response.statusText}`);
    }

    const data = await response.json();
    const parsedData = WpPageSchema.safeParse(data);

     if (!parsedData.success) {
        console.error('WP Page Parse Error:', parsedData.error);
        return { success: false, error: 'Failed to parse response from WordPress.' };
    }

    return { success: true, data: parsedData.data };
  } catch (error) {
    console.error('Error publishing to WordPress:', error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred while publishing.' };
  }
}
