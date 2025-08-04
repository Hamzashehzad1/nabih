'use server';

/**
 * @fileOverview AI Lead Finder.
 *
 * - findLeads - A function that finds business leads based on a keyword and location.
 * - FindLeadsInput - The input type for the findLeads function.
 * - FindLeadsOutput - The return type for the findLeads function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const FindLeadsInputSchema = z.object({
  keyword: z.string().describe("The type of business to search for, e.g., 'plumber', 'marketing agency'."),
  location: z.string().describe("The city and/or country to search in, e.g., 'Dubai' or 'New York, USA'."),
});
export type FindLeadsInput = z.infer<typeof FindLeadsInputSchema>;

const LeadSchema = z.object({
    businessName: z.string().describe("The full name of the business."),
    websiteUrl: z.string().url().describe("The likely, publicly accessible website URL for the business. Should start with http or https."),
    description: z.string().describe("A brief, one-sentence description of the business."),
});

export const FindLeadsOutputSchema = z.object({
  leads: z.array(LeadSchema).describe('An array of 10 business leads.'),
});
export type FindLeadsOutput = z.infer<typeof FindLeadsOutputSchema>;

export async function findLeads(input: FindLeadsInput): Promise<FindLeadsOutput> {
  return findLeadsFlow(input);
}


const prompt = ai.definePrompt({
  name: 'findLeadsPrompt',
  input: {schema: FindLeadsInputSchema},
  output: {schema: FindLeadsOutputSchema},
  prompt: `You are an expert business directory analyst. Your task is to generate a list of 10 real-world businesses based on a given keyword and location.

For each business, provide its name, a likely website URL, and a very brief description.

**Instructions:**
1.  Identify 10 distinct businesses matching the keyword: "{{keyword}}" in the location: "{{location}}".
2.  For each business, find its most likely official website URL. The URL must be a valid, real-world address.
3.  Provide a concise, one-sentence summary of what the business does.
4.  Do not invent businesses. Use your knowledge of real-world companies.
`,
});

const findLeadsFlow = ai.defineFlow(
  {
    name: 'findLeadsFlow',
    inputSchema: FindLeadsInputSchema,
    outputSchema: FindLeadsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
