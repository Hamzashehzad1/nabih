// src/ai/flows/generate-image-search-query-h2-h3.ts
'use server';
/**
 * @fileOverview Generates an image search query for H2/H3 headings in a blog post.
 *
 * - generateImageSearchQueryH2H3 - A function that generates the image search query.
 * - GenerateImageSearchQueryH2H3Input - The input type for the generateImageSearchQueryH2H3 function.
 * - GenerateImageSearchQueryH2H3Output - The return type for the generateImageSearchQueryH2H3 function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageSearchQueryH2H3InputSchema = z.object({
  heading: z.string().describe('The heading (H2 or H3) of the blog post section.'),
  paragraph: z.string().describe('The paragraph of the blog post section.'),
});
export type GenerateImageSearchQueryH2H3Input = z.infer<typeof GenerateImageSearchQueryH2H3InputSchema>;

const GenerateImageSearchQueryH2H3OutputSchema = z.object({
  searchQuery: z.string().describe('The generated image search query.'),
});
export type GenerateImageSearchQueryH2H3Output = z.infer<typeof GenerateImageSearchQueryH2H3OutputSchema>;

export async function generateImageSearchQueryH2H3(input: GenerateImageSearchQueryH2H3Input): Promise<GenerateImageSearchQueryH2H3Output> {
  return generateImageSearchQueryH2H3Flow(input);
}

const prompt = ai.definePrompt({
  name: 'generateImageSearchQueryH2H3Prompt',
  input: {schema: GenerateImageSearchQueryH2H3InputSchema},
  output: {schema: GenerateImageSearchQueryH2H3OutputSchema},
  prompt: `You are an AI assistant that generates precise and relevant image search queries for Pexels or Unsplash.
I will give you a heading (H2 or H3) followed by a paragraph. Based on both the heading and the context of the paragraph, generate a short and specific search query (3–6 words) that best represents the ideal image that should appear with the content.
Avoid abstract or generic terms like "concept" or "metaphor." Think visually, and suggest something a human would search to find a matching stock photo.
Example Format:
Heading: {{heading}}
Paragraph: {{paragraph}}
Image Query: [your generated keyword phrase]
Let’s begin.`,
});

const generateImageSearchQueryH2H3Flow = ai.defineFlow(
  {
    name: 'generateImageSearchQueryH2H3Flow',
    inputSchema: GenerateImageSearchQueryH2H3InputSchema,
    outputSchema: GenerateImageSearchQueryH2H3OutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
