'use server';

/**
 * @fileOverview AI content idea generator.
 *
 * - generateContentIdeas - A function that handles the content idea generation.
 * - GenerateContentIdeasInput - The input type for the generateContentIdeas function.
 * - GenerateContentIdeasOutput - The return type for the generateContentIdeas function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateContentIdeasInputSchema = z.object({
  niche: z.string().describe('The niche or topic to generate ideas for.'),
  targetAudience: z.string().describe('The target audience for the content.'),
});
export type GenerateContentIdeasInput = z.infer<typeof GenerateContentIdeasInputSchema>;

const IdeaSchema = z.object({
    title: z.string().describe("The catchy, SEO-friendly title for the blog post."),
    description: z.string().describe("A brief, 2-3 sentence description of what the post would be about and why it's valuable to the reader."),
});

const GenerateContentIdeasOutputSchema = z.object({
  ideas: z.array(IdeaSchema).describe('A list of 10 generated content ideas.'),
});
export type GenerateContentIdeasOutput = z.infer<typeof GenerateContentIdeasOutputSchema>;


export async function generateContentIdeas(input: GenerateContentIdeasInput): Promise<GenerateContentIdeasOutput> {
  return generateContentIdeasFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateContentIdeasPrompt',
  input: {schema: GenerateContentIdeasInputSchema},
  output: {schema: GenerateContentIdeasOutputSchema},
  prompt: `You are an expert content strategist and SEO specialist. Your task is to generate 10 compelling blog post ideas based on a given niche and target audience.

For each idea, provide a catchy, SEO-friendly title and a brief 2-3 sentence description explaining the post's angle and value proposition for the reader.

The ideas should cover a range of formats, such as "how-to" guides, listicles, comparison posts, expert roundups, or thought leadership pieces.

Niche: {{{niche}}}
Target Audience: {{{targetAudience}}}
`,
});

const generateContentIdeasFlow = ai.defineFlow(
  {
    name: 'generateContentIdeasFlow',
    inputSchema: GenerateContentIdeasInputSchema,
    outputSchema: GenerateContentIdeasOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
