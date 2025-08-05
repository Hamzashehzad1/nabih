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
