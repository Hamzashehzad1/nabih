'use server';

import { generateImagePrompt } from '@/ai/flows/generate-image-prompt';
import { generateImage } from '@/ai/flows/generate-image';

async function getImage(title: string, paragraph: string): Promise<string> {
  try {
    const promptResult = await generateImagePrompt({ title, paragraph });
    const imageResult = await generateImage({ prompt: promptResult.prompt });
    return imageResult.imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    // Return a placeholder or handle the error as needed
    return 'https://placehold.co/600x400.png';
  }
}


export async function getFeaturedImage(title: string, paragraph: string): Promise<string> {
    return getImage(title, paragraph);
}

export async function getSectionImage(heading: string, paragraph: string): Promise<string> {
    return getImage(heading, paragraph);
}
