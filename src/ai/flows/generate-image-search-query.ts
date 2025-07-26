// This file is machine-generated - edit with care!

'use server';

/**
 * @fileOverview Generates an image search query for a given blog post title and content.
 *
 * - generateImageSearchQuery - A function that generates an image search query.
 * - GenerateImageSearchQueryInput - The input type for the generateImageSearchQuery function.
 * - GenerateImageSearchQueryOutput - The return type for the generateImageSearchQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageSearchQueryInputSchema = z.object({
  title: z.string().describe('The title of the blog post.'),
  paragraph: z.string().describe('A paragraph from the blog post.'),
});
export type GenerateImageSearchQueryInput = z.infer<typeof GenerateImageSearchQueryInputSchema>;

const GenerateImageSearchQueryOutputSchema = z.object({
  query: z.string().describe('The generated image search query.'),
});
export type GenerateImageSearchQueryOutput = z.infer<typeof GenerateImageSearchQueryOutputSchema>;

export async function generateImageSearchQuery(
  input: GenerateImageSearchQueryInput
): Promise<GenerateImageSearchQueryOutput> {
  return generateImageSearchQueryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'imageSearchQueryPrompt',
  input: {schema: GenerateImageSearchQueryInputSchema},
  output: {schema: GenerateImageSearchQueryOutputSchema},
  prompt: `You are an AI assistant that generates precise and relevant image search queries for Pexels or Unsplash.
I will give you a blog title followed by a paragraph. Based on both the title and the context of the paragraph, generate a short and specific search query (3–6 words) that best represents the ideal image that should appear as a featured image.
Avoid abstract or generic terms like \"concept\" or \"metaphor.\" Think visually, and suggest something a human would search to find a matching stock photo.
Example Format:
Title: {{{title}}}
Paragraph: {{{paragraph}}}
Image Query: [your generated keyword phrase]
Let’s begin.`,
});

const generateImageSearchQueryFlow = ai.defineFlow(
  {
    name: 'generateImageSearchQueryFlow',
    inputSchema: GenerateImageSearchQueryInputSchema,
    outputSchema: GenerateImageSearchQueryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
