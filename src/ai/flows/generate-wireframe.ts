
'use server';

/**
 * @fileOverview AI Wireframe Generator.
 *
 * - generateWireframe - A function that handles wireframe generation.
 * - GenerateWireframeInput - The input type for the generateWireframe function.
 * - GenerateWireframeOutput - The return type for the generateWireframe function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWireframeInputSchema = z.object({
  websiteName: z.string().describe('The name of the website or business.'),
  websiteType: z.string().describe('The type of website (e.g., Portfolio, eCommerce, SaaS, Blog).'),
  targetAudience: z.string().describe('Description of the target audience (e.g., young professionals, B2B, students).'),
  primaryGoal: z.string().describe('The primary goal of the website (e.g., sell products, showcase work, generate leads).'),
  pagesRequired: z.string().describe('A comma-separated list of pages required (e.g., Home, About, Services, Contact, Blog).'),
  layoutPreferences: z.string().optional().describe('User layout preferences (e.g., minimalist, image-heavy, sidebar, grid layout).'),
  specialSections: z.string().optional().describe('Any special sections required (e.g., testimonials, pricing tables, contact form, carousel).'),
  brandColors: z.string().optional().describe('Brand colors (hex codes or descriptions).'),
  fonts: z.string().optional().describe('Preferred fonts.'),
});
export type GenerateWireframeInput = z.infer<typeof GenerateWireframeInputSchema>;


const GenerateWireframeOutputSchema = z.object({
  explanation: z.string().describe('A brief explanation of the wireframe layout and reasoning behind UX choices.'),
  wireframeHtml: z.string().describe('A complete HTML string with structural CSS for the wireframe. It should be a single HTML document starting with <!DOCTYPE html>.'),
});
export type GenerateWireframeOutput = z.infer<typeof GenerateWireframeOutputSchema>;


export async function generateWireframe(input: GenerateWireframeInput): Promise<GenerateWireframeOutput> {
  return generateWireframeFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateWireframePrompt',
  input: {schema: GenerateWireframeInputSchema},
  output: {schema: GenerateWireframeOutputSchema},
  prompt: `Act as a professional UI/UX designer and web developer. Based on the following details:

- Website Name: {{{websiteName}}}
- Website Type: {{{websiteType}}}
- Target Audience: {{{targetAudience}}}
- Website Goal: {{{primaryGoal}}}
- Pages Needed: {{{pagesRequired}}}
- Layout Preferences: {{{layoutPreferences}}}
- Special Sections: {{{specialSections}}}
- Brand Colors: {{{brandColors}}}
- Preferred Fonts: {{{fonts}}}

Generate a complete HTML wireframe structure with semantic layout for each page. The entire output for the wireframe must be a single HTML string.
Include comments in the HTML to describe each section’s purpose.
Keep the design responsive and modular.
Use placeholder images (e.g., from https://placehold.co/600x400) and structural CSS only to demonstrate layout. The CSS should be included in a <style> tag in the <head> of the HTML.

Additionally, provide a short, separate explanation of the wireframe layout and the reasoning behind your UX choices based on the target audience and website goal.
`,
});

const generateWireframeFlow = ai.defineFlow(
  {
    name: 'generateWireframeFlow',
    inputSchema: GenerateWireframeInputSchema,
    outputSchema: GenerateWireframeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
