'use server';

/**
 * @fileOverview Generates a descriptive image prompt for a given blog post section.
 *
 * - generateImagePrompt - A function that generates an image prompt.
 * - GenerateImagePromptInput - The input type for the generateImagePrompt function.
 * - GenerateImagePromptOutput - The return type for the generateImagePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImagePromptInputSchema = z.object({
  title: z.string().describe('The title of the blog post.'),
  paragraph: z.string().describe('A paragraph from the blog post.'),
});
export type GenerateImagePromptInput = z.infer<typeof GenerateImagePromptInputSchema>;

const GenerateImagePromptOutputSchema = z.object({
  prompt: z.string().describe('The generated image prompt.'),
});
export type GenerateImagePromptOutput = z.infer<typeof GenerateImagePromptOutputSchema>;

export async function generateImagePrompt(
  input: GenerateImagePromptInput
): Promise<GenerateImagePromptOutput> {
  return generateImagePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'imagePromptGenerator',
  input: {schema: GenerateImagePromptInputSchema},
  output: {schema: GenerateImagePromptOutputSchema},
  prompt: `You are an AI assistant that generates high-quality, visually descriptive prompts for an AI image generation model.
Based on the blog title and paragraph, create a prompt that is detailed and artistic. The prompt should describe a scene, subject, environment, and mood.
Example Format:
Title: {{{title}}}
Paragraph: {{{paragraph}}}
Image Prompt: [A photorealistic image of a vintage typewriter on a rustic wooden desk, with a cup of coffee steaming beside it and soft morning light filtering through a window.]
Let’s begin.`,
});

const generateImagePromptFlow = ai.defineFlow(
  {
    name: 'generateImagePromptFlow',
    inputSchema: GenerateImagePromptInputSchema,
    outputSchema: GenerateImagePromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
