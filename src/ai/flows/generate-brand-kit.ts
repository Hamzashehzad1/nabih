
'use server';

/**
 * @fileOverview AI Brand Kit Generator.
 *
 * - generateBrandKit - A function that handles brand kit generation.
 * - GenerateBrandKitInput - The input type for the generateBrandKit function.
 * - GenerateBrandKitOutput - The return type for the generateBrandKit function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateBrandKitInputSchema = z.object({
  businessName: z.string().describe("The name of the website or business."),
  description: z.string().describe("A brief description of what the website is about."),
  websiteType: z.enum(['Blog', 'Portfolio', 'Online Store', 'Service-based', 'Landing Page', 'Membership/Community', 'Other']).describe("The type of website being created."),
  targetAudience: z.string().describe("A description of the target audience (e.g., age, gender, interests, demographics)."),
  hasLogo: z.boolean().describe("Whether the user has a logo."),
});
export type GenerateBrandKitInput = z.infer<typeof GenerateBrandKitInputSchema>;


const ColorPaletteSchema = z.object({
    primary: z.string().describe("The primary color hex code (e.g., '#A674F8')."),
    secondary: z.string().describe("The secondary color hex code."),
    accent: z.string().describe("The accent color hex code."),
    background: z.string().describe("The background color hex code (dark or light)."),
    text: z.string().describe("The main text color hex code."),
});

const FontCombinationSchema = z.object({
    headline: z.string().describe("The name of a Google Font for headlines (e.g., 'Space Grotesk')."),
    body: z.string().describe("The name of a Google Font for body text (e.g., 'Inter')."),
    reasoning: z.string().describe("An explanation for why these fonts were chosen.")
});

const MoodboardSchema = z.object({
    pexelsQueries: z.array(z.string()).describe("A list of 5 image search queries for Pexels."),
    unsplashQueries: z.array(z.string()).describe("A list of 5 image search queries for Unsplash."),
});

export const GenerateBrandKitOutputSchema = z.object({
    colorPalette: ColorPaletteSchema,
    colorPsychology: z.string().describe("A paragraph explaining the psychological meaning of the suggested color palette and why it's a good fit for the brand."),
    fontCombination: FontCombinationSchema,
    suggestedThemes: z.array(z.string()).describe("A list of 2-3 suggested visual theme styles (e.g., Minimal, Corporate)."),
    moodboard: MoodboardSchema,
    uxTip: z.string().describe("A specific UX or UI design tip for this project."),
});
export type GenerateBrandKitOutput = z.infer<typeof GenerateBrandKitOutputSchema>;

export async function generateBrandKit(input: GenerateBrandKitInput): Promise<GenerateBrandKitOutput> {
  return generateBrandKitFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateBrandKitPrompt',
  input: {schema: GenerateBrandKitInputSchema},
  output: {schema: GenerateBrandKitOutputSchema},
  prompt: `You are a creative branding and web design expert. Based on the following project information, generate an ideal color palette, font suggestions, theme style, and relevant moodboard image search queries from Pexels and Unsplash.

**Project Info:**
- Website Name: {{{businessName}}}
- Type of Website: {{{websiteType}}}
- Target Audience: {{{targetAudience}}}
- Description: {{{description}}}

**Now do the following:**

1.  **Color Palette:** Generate 5 HEX colors (primary, secondary, accent, background, text) based on the business type, audience, and industry. Ensure the primary and secondary colors are well-balanced and accessible.

2.  **Color Psychology:** Explain why these colors are chosen, referring to emotional triggers or user perception.

3.  **Font Suggestions:** Recommend 2 web-safe fonts (heading, body) and explain the reasoning behind them in terms of tone, audience match, and design balance.

4.  **Theme Style:** Suggest 2-3 visual theme ideas (e.g., minimalistic, corporate, fun & bold, editorial) that best suit the website and business goals.

5.  **Moodboard Queries:** Based on all of the above, generate 5 image search queries for Pexels and 5 image search queries for Unsplash. These should match the visual identity and theme.

6.  **Bonus Tip:** Provide 1 UX or UI design tip specifically suited to this project.`,
});

const generateBrandKitFlow = ai.defineFlow(
  {
    name: 'generateBrandKitFlow',
    inputSchema: GenerateBrandKitInputSchema,
    outputSchema: GenerateBrandKitOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
