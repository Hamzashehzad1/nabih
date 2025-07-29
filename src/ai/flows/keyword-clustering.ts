'use server';

/**
 * @fileOverview AI Keyword Clustering.
 *
 * - clusterKeywords - Groups keywords into topical clusters.
 * - ClusterKeywordsInput - The input type for the clusterKeywords function.
 * - ClusterKeywordsOutput - The return type for the clusterKeywords function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClusterKeywordsInputSchema = z.object({
  keywords: z.array(z.string()).describe('A list of keywords to be clustered.'),
});
export type ClusterKeywordsInput = z.infer<typeof ClusterKeywordsInputSchema>;


const KeywordClusterSchema = z.object({
    clusterName: z.string().describe("A short, descriptive name for the keyword cluster (e.g., 'Running for Beginners')."),
    keywords: z.array(z.string()).describe("The list of keywords belonging to this cluster."),
});

const ClusterKeywordsOutputSchema = z.object({
  clusters: z.array(KeywordClusterSchema).describe('An array of keyword clusters.'),
});
export type ClusterKeywordsOutput = z.infer<typeof ClusterKeywordsOutputSchema>;


export async function clusterKeywords(input: ClusterKeywordsInput): Promise<ClusterKeywordsOutput> {
  return clusterKeywordsFlow(input);
}


const prompt = ai.definePrompt({
  name: 'clusterKeywordsPrompt',
  input: {schema: ClusterKeywordsInputSchema},
  output: {schema: ClusterKeywordsOutputSchema},
  prompt: `You are an expert SEO content strategist. Your task is to analyze a list of keywords and group them into semantically related topical clusters.

**Instructions:**
1.  Read the provided list of keywords.
2.  Identify the main topics and sub-topics within the list.
3.  Group the keywords into logical clusters based on user intent and semantic relevance.
4.  For each cluster, provide a short, descriptive name that represents the main topic of that cluster.
5.  Ensure that every keyword from the input list is placed into one of the clusters.

**Keyword List:**
---
{{#each keywords}}
- {{this}}
{{/each}}
---
`,
});

const clusterKeywordsFlow = ai.defineFlow(
  {
    name: 'clusterKeywordsFlow',
    inputSchema: ClusterKeywordsInputSchema,
    outputSchema: ClusterKeywordsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
