
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
  prompt: `You are an expert blog writer and SEO content strategist.
Write a unique, well-structured, and engaging blog post based on the following details:

Title: {{{title}}}
SEO Keywords: {{{seoKeywords}}}
Word Count: Around {{{wordLength}}} words
Tone: {{{tone}}}
Theme: {{{theme}}}
Copywriting Style: {{{copywritingStyle}}}

Guidelines for writing:
- Do NOT use Markdown formatting like "##", "###", or bullet points with asterisks. Write in clean paragraphs suitable for a WordPress blog editor.
- Use proper subheadings (H2, H3) written naturally, not with symbols.
- Write in a natural, conversational style while keeping it professional and authoritative.
- Research the topic in depth. Provide accurate, useful, and detailed information with examples, context, and insights.
- Incorporate the SEO keywords smoothly and naturally, without keyword stuffing.
- Make the introduction engaging and the conclusion strong, encouraging reader action or reflection.
- Add depth, storytelling elements, and creative angles to keep the reader hooked.
- The blog should feel original and insightful, not generic.

Deliver a polished, ready-to-publish blog article.
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
