
'use server';

/**
 * @fileOverview AI Wireframe Generator for a single page.
 *
 * - generateWireframe - A function that handles wireframe generation for a specific page.
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
  pageToGenerate: z.string().default('Home').describe("The specific page to generate the wireframe for (e.g., 'Home', 'About', 'Contact')."),
  brandColors: z.string().optional().describe('Brand colors (hex codes or descriptions).'),
  fonts: z.string().optional().describe('Preferred fonts.'),
});
export type GenerateWireframeInput = z.infer<typeof GenerateWireframeInputSchema>;


const ImageQuerySchema = z.object({
    id: z.string().describe("A unique identifier for the image, like 'hero-background' or 'testimonial-1'."),
    query: z.string().describe("The specific, descriptive search query for Pexels/Unsplash."),
});

const GenerateWireframeOutputSchema = z.object({
  explanation: z.string().describe('A brief explanation of the wireframe layout and reasoning behind UX choices, written in a friendly, expert tone.'),
  copywriting: z.string().describe("Suggested copywriting for the page's key sections (headlines, CTAs, descriptions) written in the style of Neil Patel."),
  wireframeHtml: z.string().describe('A complete HTML string with structural and aesthetic CSS for the wireframe. It should be a single HTML document starting with <!DOCTYPE html>. Use placeholder images with data-ai-hint attributes.'),
  imageQueries: z.array(ImageQuerySchema).describe("A list of image search queries to be used in the wireframe's placeholders."),
});
export type GenerateWireframeOutput = z.infer<typeof GenerateWireframeOutputSchema>;


export async function generateWireframe(input: GenerateWireframeInput): Promise<GenerateWireframeOutput> {
  return generateWireframeFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateWireframePrompt',
  input: {schema: GenerateWireframeInputSchema},
  output: {schema: GenerateWireframeOutputSchema},
  prompt: `You are an expert UI/UX designer and conversion-focused copywriter, channeling the style of Neil Patel. Your task is to generate a complete, high-fidelity wireframe for the '{{{pageToGenerate}}}' page of a website.

**Project Details:**
- Website Name: {{{websiteName}}}
- Website Type: {{{websiteType}}}
- Target Audience: {{{targetAudience}}}
- Website Goal: {{{primaryGoal}}}
- Brand Colors: {{{brandColors}}}
- Preferred Fonts: {{{fonts}}}

**Your Tasks:**

1.  **UX/UI Rationale:** First, provide a short, expert explanation of your layout choices. Explain WHY this design works for the target audience and the primary goal. Think about user flow, trust signals, and conversion optimization.

2.  **Copywriting (Neil Patel Style):** Write compelling, action-oriented copy for the key sections of the page. This includes the main headline, sub-headline, call-to-action buttons, and brief descriptive text for major sections. The tone should be authoritative, clear, and persuasive.

3.  **Image Search Queries:** For every image in your wireframe, create a specific, descriptive search query (3-6 words) suitable for Pexels or Unsplash. Give each image a unique ID. For example: { id: 'hero-background', query: 'minimalist workspace with laptop' }.

4.  **High-Fidelity Wireframe (HTML & CSS):** Generate a SINGLE, complete HTML file.
    *   **Structure:** Use semantic HTML5 (header, nav, main, section, footer). The page should be well-structured and visually appealing.
    *   **Styling:** Embed a \`<style>\` tag in the \`<head>\`. Use CSS to create a professional, clean, and modern layout. Define a color palette based on the provided brand colors or, if none are provided, on the psychology of the business type. Use CSS variables for colors. Style buttons, cards, and typography.
    *   **Placeholders:** For images, use a placeholder like \`<img src="https://placehold.co/800x400.png" data-ai-hint="hero-background" alt="A descriptive alt text">\`. The 'data-ai-hint' value MUST correspond to one of the IDs from your image query list.
    *   **Responsiveness:** Ensure the design is responsive using media queries.
    *   **Header & Footer:** Include a well-designed header with navigation and a comprehensive footer with links and social media icons.
    *   **Trust Signals:** Include sections for things like client logos, testimonials, or key stats where appropriate for the website type.

The final output should be a polished, near-production-ready wireframe that a developer could use as a strong starting point.`,
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
