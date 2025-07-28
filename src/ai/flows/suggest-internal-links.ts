'use server';

/**
 * @fileOverview Suggests internal links for a new blog post.
 *
 * - suggestInternalLinks - A function that suggests internal links.
 * - SuggestInternalLinksInput - The input type for the suggestInternalLinks function.
 * - SuggestInternalLinksOutput - The return type for the suggestInternalLinks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExistingPostSchema = z.object({
  title: z.string(),
  url: z.string().url(),
});

const SuggestInternalLinksInputSchema = z.object({
  postContent: z.string().describe('The full content of the new blog post.'),
  existingPosts: z.array(ExistingPostSchema).describe('A list of existing blog posts with their titles and URLs.'),
});
export type SuggestInternalLinksInput = z.infer<typeof SuggestInternalLinksInputSchema>;

const LinkSuggestionSchema = z.object({
    anchorText: z.string().describe("The exact text from the new post content that should be hyperlinked."),
    linkToUrl: z.string().url().describe("The URL of the existing post that should be linked to."),
    reason: z.string().describe("A brief explanation of why this link is relevant and beneficial for SEO.")
});

const SuggestInternalLinksOutputSchema = z.object({
  suggestions: z.array(LinkSuggestionSchema).describe('A list of up to 7 suggested internal links.'),
});
export type SuggestInternalLinksOutput = z.infer<typeof SuggestInternalLinksOutputSchema>;

export async function suggestInternalLinks(input: SuggestInternalLinksInput): Promise<SuggestInternalLinksOutput> {
  return suggestInternalLinksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestInternalLinksPrompt',
  input: {schema: SuggestInternalLinksInputSchema},
  output: {schema: SuggestInternalLinksOutputSchema},
  prompt: `You are an expert SEO strategist specializing in on-page optimization and internal linking.

Your task is to analyze a new blog post and suggest relevant internal links to existing articles on the same website. The goal is to create a strong internal linking structure to improve SEO, distribute link equity, and enhance user navigation.

**Instructions:**
1.  Carefully read the content of the "New Blog Post".
2.  Review the "List of Existing Articles" provided.
3.  Identify natural and contextually relevant opportunities within the "New Blog Post" content to link to articles from the "List of Existing Articles".
4.  For each suggestion, provide the exact anchor text from the new post, the URL of the existing article to link to, and a brief justification for the suggestion.
5.  Prioritize high-relevance links. Do not force links where they don't make sense.
6.  Generate a maximum of 7 of the most impactful link suggestions.

**List of Existing Articles:**
---
{{#each existingPosts}}
- Title: {{this.title}}
  URL: {{this.url}}
{{/each}}
---

**New Blog Post Content:**
---
{{{postContent}}}
---
`,
});

const suggestInternalLinksFlow = ai.defineFlow(
  {
    name: 'suggestInternalLinksFlow',
    inputSchema: SuggestInternalLinksInputSchema,
    outputSchema: SuggestInternalLinksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
