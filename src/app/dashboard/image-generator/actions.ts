// src/app/dashboard/image-generator/actions.ts
'use server';

import { generateImageSearchQuery } from '@/ai/flows/generate-image-search-query';
import { generateImageSearchQueryH2H3 } from '@/ai/flows/generate-image-search-query-h2-h3';

export async function getFeaturedImageQuery(title: string, paragraph: string): Promise<string> {
  try {
    const result = await generateImageSearchQuery({ title, paragraph });
    return result.query;
  } catch (error) {
    console.error('Error generating featured image query:', error);
    return 'abstract modern art';
  }
}

export async function getSectionImageQuery(heading: string, paragraph: string): Promise<string> {
  try {
    const result = await generateImageSearchQueryH2H3({ heading, paragraph });
    return result.searchQuery;
  } catch (error) {
    console.error('Error generating section image query:', error);
    return 'abstract technology background';
  }
}
