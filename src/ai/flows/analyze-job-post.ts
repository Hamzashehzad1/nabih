
'use server';

/**
 * @fileOverview AI Job Post Analyzer.
 *
 * - analyzeJobPost - Analyzes a job post for quality, competition, and red flags.
 * - AnalyzeJobPostInput - The input type for the analyzeJobPost function.
 * - AnalyzeJobPostOutput - The return type for the analyzeJobPost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeJobPostInputSchema = z.object({
  jobDescription: z.string().describe('The full text content of the job post.'),
});
export type AnalyzeJobPostInput = z.infer<typeof AnalyzeJobPostInputSchema>;


const AnalyzeJobPostOutputSchema = z.object({
  jobQualityScore: z.number().min(0).max(100).describe("A score from 0-100 indicating the quality and clarity of the job post."),
  competitionLevel: z.enum(['Low', 'Medium', 'High']).describe("An estimation of the competition level for this job."),
  timeSensitivity: z.enum(['Low', 'Medium', 'High']).describe("An estimation of how urgently the client needs to hire."),
  suggestedApproach: z.string().describe("A brief suggested approach for the proposal (e.g., 'Quick apply vs detailed proposal')."),
  redFlags: z.array(z.string()).describe("A list of potential red flags or concerns found in the job post (e.g., vague requirements, low budget)."),
  smartProposalTips: z.array(z.string()).describe("A list of actionable tips for writing a compelling proposal for this specific job."),
  overallRisk: z.enum(['Low', 'Medium', 'High']).describe("An overall risk indicator for the job (Green/Yellow/Red)."),
});
export type AnalyzeJobPostOutput = z.infer<typeof AnalyzeJobPostOutputSchema>;


export async function analyzeJobPost(input: AnalyzeJobPostInput): Promise<AnalyzeJobPostOutput> {
  return analyzeJobPostFlow(input);
}


const prompt = ai.definePrompt({
  name: 'analyzeJobPostPrompt',
  input: {schema: AnalyzeJobPostInputSchema},
  output: {schema: AnalyzeJobPostOutputSchema},
  prompt: `You are an expert freelancer career coach, specializing in analyzing job posts from platforms like Upwork. Your task is to provide a detailed, objective analysis of the provided job post text to help a freelancer decide if it's worth their time to apply.

**Analysis Factors:**
- **Clarity & Detail:** How clear is the job title, description, and requirements? Are there specific deliverables?
- **Client Professionalism:** Does the client seem professional? Look for clues in the language used.
- **Budget Signals:** Even if not explicit, are there signals of a low or high budget?
- **Urgency:** Does the client seem to need someone immediately?
- **Spam/Scam Signals:** Are there any signs of a fake post (e.g., asking for free work, overly generic language)?
- **Competition:** Based on the skills mentioned, how much competition is likely?

**Input Job Post:**
---
{{{jobDescription}}}
---

**Your Task:**
Based on the provided job post, generate a structured analysis. Pay close attention to the output schema and provide concise, actionable insights for each field.`,
});

const analyzeJobPostFlow = ai.defineFlow(
  {
    name: 'analyzeJobPostFlow',
    inputSchema: AnalyzeJobPostInputSchema,
    outputSchema: AnalyzeJobPostOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
