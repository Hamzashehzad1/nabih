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
  numberOfLeads: z.number().describe("The number of leads to generate."),
});
export type FindLeadsInput = z.infer<typeof FindLeadsInputSchema>;

const LeadSchema = z.object({
    businessName: z.string().describe("The full name of the business."),
    websiteUrl: z.string().describe("The likely, publicly accessible website URL for the business. Should start with http or https."),
    email: z.string().optional().describe("The contact email address for the business, if found on their website."),
    phoneNumber: z.string().optional().describe("The contact phone number for the business, if found on their website."),
    description: z.string().describe("A brief, one-sentence description of the business."),
});

export const FindLeadsOutputSchema = z.object({
  leads: z.array(LeadSchema).describe('An array of business leads.'),
});
export type FindLeadsOutput = z.infer<typeof FindLeadsOutputSchema>;

export async function findLeads(input: FindLeadsInput): Promise<FindLeadsOutput> {
  const prompt = ai.definePrompt({
    name: 'findLeadsPrompt',
    input: {schema: FindLeadsInputSchema},
    output: {schema: FindLeadsOutputSchema},
    prompt: `You are an expert business directory analyst. Your task is to generate a list of {{numberOfLeads}} real-world businesses based on a given keyword and location.

For each business, provide its name, a likely website URL, a contact email address, a phone number, and a very brief description.

**Instructions:**
1.  Identify {{numberOfLeads}} distinct businesses matching the keyword: "{{keyword}}" in the location: "{{location}}".
2.  For each business, find its most likely official website URL. The URL must be a valid, real-world address.
3.  Visit the website in your simulated environment to find a publicly listed contact email (e.g., contact@, info@, hello@) and a contact phone number. If no email or phone is found, you may leave the field empty.
4.  Provide a concise, one-sentence summary of what the business does.
5.  Do not invent businesses or contact information. Use your knowledge of real-world companies.
`,
  });
  
  const {output} = await prompt(input);
  return output!;
}
