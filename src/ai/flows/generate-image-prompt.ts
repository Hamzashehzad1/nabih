'use server';

/**
 * @fileOverview Generates a descriptive image search query for a given blog post section.
 *
 * - generateImagePrompt - A function that generates an image search query.
 * - GenerateImagePromptInput - The input type for the generateImagePrompt function.
 * - GenerateImagePromptOutput - The return type for the generateImagePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImagePromptInputSchema = z.object({
  title: z.string().describe('The title or heading of the blog post section.'),
  paragraph: z.string().describe('A paragraph from the blog post.'),
  type: z.enum(['featured', 'section']),
});
export type GenerateImagePromptInput = z.infer<typeof GenerateImagePromptInputSchema>;

const GenerateImagePromptOutputSchema = z.object({
  query: z.string().describe('The generated image search query.'),
});
export type GenerateImagePromptOutput = z.infer<typeof GenerateImagePromptOutputSchema>;


export async function generateImagePrompt(
  input: GenerateImagePromptInput
): Promise<GenerateImagePromptOutput> {
  return generateImagePromptFlow(input);
}

const featuredImagePrompt = ai.definePrompt({
    name: 'featuredImageSearchQuery',
    input: { schema: GenerateImagePromptInputSchema },
    output: { schema: GenerateImagePromptOutputSchema },
    prompt: `You are an AI assistant that generates precise and relevant image search queries for Pexels or Unsplash. I will give you a blog title followed by a paragraph. Based on both the title and the context of the paragraph, generate a short and specific search query (3–6 words) that best represents the ideal image that should appear as a featured image. Avoid abstract or generic terms like "concept" or "metaphor." Think visually, and suggest something a human would search to find a matching stock photo.
Example Format:
Title: {{{title}}}
Paragraph: {{{paragraph}}}
Image Query: [your generated keyword phrase]
Let’s begin.`
});

const sectionImagePrompt = ai.definePrompt({
    name: 'sectionImageSearchQuery',
    input: { schema: GenerateImagePromptInputSchema },
    output: { schema: GenerateImagePromptOutputSchema },
    prompt: `You are an AI assistant that generates precise and relevant image search queries for Pexels or Unsplash. I will give you a heading (H2 or H3) followed by a paragraph. Based on both the heading and the context of the paragraph, generate a short and specific search query (3–6 words) that best represents the ideal image that should appear with the content. Avoid abstract or generic terms like "concept" or "metaphor." Think visually, and suggest something a human would search to find a matching stock photo.
Example Format:
Heading: {{{title}}}
Paragraph: {{{paragraph}}}
Image Query: [your generated keyword phrase]
Let’s begin.`
});


const generateImagePromptFlow = ai.defineFlow(
  {
    name: 'generateImagePromptFlow',
    inputSchema: GenerateImagePromptInputSchema,
    outputSchema: GenerateImagePromptOutputSchema,
  },
  async input => {
    let promptToRun;
    if (input.type === 'featured') {
        promptToRun = featuredImagePrompt;
    } else {
        promptToRun = sectionImagePrompt;
    }
    const {output} = await promptToRun(input);
    // For prototype, we just return the query. In a real app we'd use this to search.
    return { query: output!.query };
  }
);
