
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
  prompt: `You are an expert blog writer and SEO strategist.
Write a complete blog article based on the details below:

Title: {{{title}}}
SEO Keywords: {{{seoKeywords}}}
Target Length: around {{{wordLength}}} words
Tone: {{{tone}}}
Theme: {{{theme}}}
Copywriting Style: {{{copywritingStyle}}}

Formatting and Output Rules:
1. Do not use Markdown, asterisks, hashtags, or special characters for formatting.
2. Use plain text only. Structure the blog with clear section headings written as normal sentences (e.g., "Why Wills Matter for Everyone") — not with symbols.
3. Paragraphs should be short and readable. No bullet points, no numbered lists — explain ideas in flowing text.
4. Naturally integrate SEO keywords without overstuffing.
5. Write with depth and authority: expand on ideas, provide context, examples, comparisons, and insights.
6. The introduction should hook the reader, the body should inform and engage, and the conclusion should provide a strong closing thought or call to action.
7. Make the blog feel unique and professional, not generic. Avoid robotic or templated wording.
8. Deliver only the blog article text, clean and ready to publish in WordPress.
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
