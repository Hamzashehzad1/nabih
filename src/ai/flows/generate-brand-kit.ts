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
});

const MoodboardSchema = z.object({
    keywords: z.array(z.string()).describe("A list of 3-5 descriptive keywords for sourcing moodboard images."),
    style: z.string().describe("A brief description of the suggested image style (e.g., 'Clean and modern', 'Natural and organic', 'Vibrant and energetic')."),
});

const ThemeSuggestionSchema = z.enum(['Minimal', 'Elegant', 'Vibrant', 'Corporate', 'Bold & Youthful', 'Artistic / Portfolio']);

export const GenerateBrandKitOutputSchema = z.object({
    colorPalette: ColorPaletteSchema,
    colorPsychology: z.string().describe("A paragraph explaining the psychological meaning of the suggested color palette and why it's a good fit for the brand."),
    fontCombination: FontCombinationSchema,
    moodboard: MoodboardSchema,
    suggestedTheme: ThemeSuggestionSchema,
});
export type GenerateBrandKitOutput = z.infer<typeof GenerateBrandKitOutputSchema>;

export async function generateBrandKit(input: GenerateBrandKitInput): Promise<GenerateBrandKitOutput> {
  return generateBrandKitFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateBrandKitPrompt',
  input: {schema: GenerateBrandKitInputSchema},
  output: {schema: GenerateBrandKitOutputSchema},
  prompt: `You are an expert brand identity designer and color psychologist. Your task is to generate a comprehensive brand kit for a new website based on user-provided information.

**User's Business Information:**
- **Business Name:** {{{businessName}}}
- **Description:** {{{description}}}
- **Website Type:** {{{websiteType}}}
- **Target Audience:** {{{targetAudience}}}

**Your Task:**
Generate a complete brand identity kit.

1.  **Color Palette:**
    *   Create a 5-color palette (primary, secondary, accent, background, text) using hex codes.
    *   The palette should be visually appealing and psychologically appropriate for the business niche and target audience.
    *   Ensure high contrast and accessibility, especially between background and text colors.

2.  **Color Psychology:**
    *   Write a concise paragraph explaining the psychological associations of the chosen colors and why they are suitable for the brand's identity and target audience.

3.  **Font Combination:**
    *   Suggest one Google Font for headlines and one for body text.
    *   The fonts should complement each other and match the brand's intended personality. Prioritize readability.

4.  **Moodboard Suggestion:**
    *   Provide 3-5 descriptive keywords for sourcing images that would fit the brand's mood (e.g., "minimalist workspace", "vibrant street art", "serene nature").
    *   Briefly describe the overall image style.

5.  **Suggested Theme Type:**
    *   Based on all the inputs, recommend one of the following theme types: 'Minimal', 'Elegant', 'Vibrant', 'Corporate', 'Bold & Youthful', 'Artistic / Portfolio'.

Generate the response in the required structured format.`,
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
