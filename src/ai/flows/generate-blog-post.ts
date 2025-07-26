'use server';

/**
 * @fileOverview AI blog post generator.
 *
 * - generateBlogPost - A function that handles the blog post generation.
 * - GenerateBlogPostInput - The input type for the generateBlogPost function.
 * - GenerateBlogPostOutput - The return type for the generateBlogPost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBlogPostInputSchema = z.object({
  title: z.string().describe('The title of the blog post.'),
  seoKeywords: z.string().describe('SEO keywords for the blog post.'),
  wordLength: z.number().describe('Desired word count for the blog post.'),
  tone: z.string().describe('The tone of the article (e.g., formal, informal, humorous).'),
  theme: z.string().describe('The theme of the article.'),
  copywritingStyle: z.string().describe('The copywriting style to use (e.g., Neil Patel, Seth Godin).'),
});
export type GenerateBlogPostInput = z.infer<typeof GenerateBlogPostInputSchema>;

const GenerateBlogPostOutputSchema = z.object({
  blogPost: z.string().describe('The generated blog post content.'),
});
export type GenerateBlogPostOutput = z.infer<typeof GenerateBlogPostOutputSchema>;

export async function generateBlogPost(input: GenerateBlogPostInput): Promise<GenerateBlogPostOutput> {
  return generateBlogPostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBlogPostPrompt',
  input: {schema: GenerateBlogPostInputSchema},
  output: {schema: GenerateBlogPostOutputSchema},
  prompt: `You are an AI assistant that specializes in generating blog posts.

  Generate a blog post based on the following criteria:
  Title: {{{title}}}
  SEO Keywords: {{{seoKeywords}}}
  Word Length: {{{wordLength}}} words
  Tone: {{{tone}}}
  Theme: {{{theme}}}
  Copywriting Style: {{{copywritingStyle}}}
  `,
});

const generateBlogPostFlow = ai.defineFlow(
  {
    name: 'generateBlogPostFlow',
    inputSchema: GenerateBlogPostInputSchema,
    outputSchema: GenerateBlogPostOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
