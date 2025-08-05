
'use server';

/**
 * @fileOverview AI Landing Page Generator.
 *
 * - generateLandingPage - Generates a complete landing page based on user specifications.
 * - GenerateLandingPageInput - The input type for the landing page generator.
 * - GenerateLandingPageOutput - The return type for the landing page generator.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateLandingPageInputSchema = z.object({
  businessName: z.string().describe('The name of the business or website.'),
  industry: z.string().describe('The niche or industry of the business.'),
  audience: z.string().describe('The target audience for the landing page.'),
  tone: z.string().describe('The brand tone or voice (e.g., professional, playful, luxurious).'),
  goal: z.string().describe('The primary goal of the landing page (e.g., generate leads, sell product).'),
  features: z.string().describe('A comma-separated list of key features or services offered.'),
  testimonials: z.string().optional().describe('Optional comma-separated list of testimonials.'),
  contactMethod: z.string().describe('The preferred contact method (e.g., form, phone, WhatsApp).'),
  heroText: z.string().optional().describe('Optional specific hero text.'),
  style: z.string().optional().describe('Optional color preference or style guide.'),
});
export type GenerateLandingPageInput = z.infer<typeof GenerateLandingPageInputSchema>;

export const GenerateLandingPageOutputSchema = z.object({
  html: z.string().describe('The full HTML and Tailwind CSS code for the generated landing page.'),
});
export type GenerateLandingPageOutput = z.infer<typeof GenerateLandingPageOutputSchema>;


export async function generateLandingPage(input: GenerateLandingPageInput): Promise<GenerateLandingPageOutput> {
  const prompt = ai.definePrompt({
    name: 'generateLandingPagePrompt',
    input: {schema: GenerateLandingPageInputSchema},
    output: {schema: GenerateLandingPageOutputSchema},
    prompt: `You are a professional web design assistant specialized in generating highly converting, mobile-responsive, UX-optimized landing pages for modern businesses. Your job is to create a complete, long-form, and beautifully structured landing page in HTML and Tailwind CSS based on user input.

### TASK:
Generate a complete landing page with:
- Clean, semantic HTML structure
- Tailwind CSS utility classes
- Highly mobile-responsive layout
- Strong CTA (Call-to-Action) sections
- Conversion-focused UX and messaging
- No lorem ipsum. All content should be generated in detail.
- Modern design layout with smooth visual hierarchy

### USER INPUT:
- Business/Website Name: {{businessName}}
- Niche/Industry: {{industry}}
- Target Audience: {{audience}}
- Brand Tone/Voice: {{tone}}
- Primary Goal: {{goal}}
- Key Features/Services: {{features}}
- Testimonials (optional): {{testimonials}}
- Contact Method: {{contactMethod}}
- Hero Text (optional): {{heroText}}
- Color Preference or Style (optional): {{style}}

### STRUCTURE TO GENERATE:
1. Hero Section with Headline, Subheadline, CTA Button
2. Features/Services Section (minimum 3 cards)
3. About/Why Us Section
4. Testimonials Section (at least 2, use fakes if none provided)
5. CTA Section (repeated CTA)
6. Contact Section or Lead Form based on the contact method
7. Footer with basic info

### REQUIREMENTS:
- Use Tailwind CSS for styling.
- Ensure excellent mobile responsiveness.
- Follow UX best practices (white space, button size, visual flow).
- Structure should be long enough for real-world use.
- Ensure text is conversion-optimized and speaks to the audience.
- Add dummy images using \`https://source.unsplash.com/random/800x600?{{keyword}}\`, where keyword is relevant to the section.
- Return ONLY the full HTML + Tailwind code. Do not include explanations, markdown code blocks, or any extra text.
`,
  });

  const {output} = await prompt(input);
  return output!;
}
