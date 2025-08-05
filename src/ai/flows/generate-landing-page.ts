
'use server';

/**
 * @fileOverview AI Landing Page Generator.
 *
 * - generateLandingPage - Generates a complete landing page based on user specifications.
 * - GenerateLandingPageInput - The input type for the landing page generator.
 * - GenerateLandingPageOutput - The return type for the landing page generator.
 */

import {ai} from '@/ai/genkit';
import { GenerateLandingPageInput, GenerateLandingPageOutput, GenerateLandingPageInputSchema, GenerateLandingPageOutputSchema } from './types/landing-page';

export async function generateLandingPage(input: GenerateLandingPageInput): Promise<GenerateLandingPageOutput> {
  const prompt = ai.definePrompt({
    name: 'generateLandingPagePrompt',
    input: {schema: GenerateLandingPageInputSchema},
    output: {schema: GenerateLandingPageOutputSchema},
    prompt: `You are a professional UX/UI web designer and SEO copywriter. Your task is to generate a complete HTML landing page for a lift/elevator company based in Pakistan.

Requirements:

1. **Target Audience**: Homeowners, builders, real estate developers in Pakistan looking for 4 to 5-person capacity home elevators (residential lifts).
2. **Goal**: Generate leads by making users trust the brand and inquire via a form.

Structure:

- **Responsive Design**: Ensure the layout is highly responsive, mobile-first, and fully SEO-optimized.
- **Above the Fold**:
  - Strong, emotionally compelling headline that builds trust and urgency.
  - Subheadline highlighting benefits (e.g., safe, space-saving, affordable home lifts).
  - Call-to-action button: “Get Free Quote”
  - Hero image or illustration of a modern home elevator.
- **Sections**:
  1. **Benefits section** (icons + short blurbs):
     - Space-efficient designs
     - Quiet and smooth ride
     - Solar and backup options
     - Affordable installation
  2. **About the Company**:
     - Brief trustworthy background
     - Serving homes across Pakistan
  3. **Product Features**:
     - 4-person, 5-person models
     - Power usage details
     - Installation process
     - Optional customizations (glass doors, colors)
  4. **Pricing Range Section**:
     - “Starting from PKR 2.5M”
     - Emphasis on transparency and quality
  5. **Testimonials / Reviews Section**
     - At least 2 customer reviews (short, human-style)
  6. **Contact / Inquiry Form**:
     - Name, phone, city, inquiry message
     - Call-to-action: “Talk to Our Elevator Expert”

Styling:

- Use modern fonts (e.g., Inter, Open Sans)
- Clean layout with generous white space
- Soft shadows, subtle gradients
- Primary color: Deep blue or maroon
- Buttons should have hover effects

Technical:

- All content should be embedded in a valid HTML5 structure
- Include all text content (no placeholder lorem ipsum)
- Make it accessible (aria labels, alt text on images)
- Meta title and description included
- Avoid inline CSS; use a \`<style>\` tag or embedded class-based CSS

Final Output:

Return a single block of clean, properly formatted HTML code inside a code block with no explanation or commentary. Only return the code.
`,
  });

  const {output} = await prompt(input);
  return output!;
}
