
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
  blogPost: z.string().describe('The generated blog post content, formatted with HTML.'),
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
Write a complete, well-structured, and engaging blog article based on the details below.

Title: {{{title}}}
SEO Keywords: {{{seoKeywords}}}
Target Length: around {{{wordLength}}} words
Tone: {{{tone}}}
Theme: {{{theme}}}
Copywriting Style: {{{copywritingStyle}}}

**Formatting and Output Rules:**
1.  **Use HTML for structure:**
    *   The main title should be in an <h1> tag.
    *   Use <h2> and <h3> tags for subheadings. Do not use Markdown ('##', '###').
    *   Wrap paragraphs in <p> tags. No bullet points or numbered lists.
2.  **External Links:** Where relevant, include placeholders for external links, like this: \`[link to relevant external source]\`.
3.  **Content Quality:**
    *   Write in a natural, conversational style while keeping it professional and authoritative.
    *   Research the topic in depth. Provide accurate, useful, and detailed information with examples, context, and insights.
    *   Incorporate the SEO keywords smoothly and naturally, without keyword stuffing.
    *   Make the introduction engaging and the conclusion strong, encouraging reader action or reflection.
    *   Add depth and storytelling to keep the reader hooked. The blog should feel original and insightful, not generic.
4.  **Final Output:** Deliver only the complete HTML content of the blog article, ready to be pasted into a WordPress editor.
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
