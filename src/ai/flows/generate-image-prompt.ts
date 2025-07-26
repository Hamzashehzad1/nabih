
'use server';

/**
 * @fileOverview Generates a descriptive image search query for a given blog post section.
 *
 * - generateImagePrompt - A function that generates an image search query.
 * - GenerateImagePromptInput - The input type for the generateImagePrompt function.
 * - GenerateImagePromptOutput - The return type for the generateImagePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImagePromptInputSchema = z.object({
  title: z.string().describe('The title or heading of the blog post section.'),
  paragraph: z.string().describe('A paragraph from the blog post.'),
  type: z.enum(['featured', 'section']),
});
export type GenerateImagePromptInput = z.infer<typeof GenerateImagePromptInputSchema>;

const GenerateImagePromptOutputSchema = z.object({
  query: z.string().describe('The generated image search query.'),
});
export type GenerateImagePromptOutput = z.infer<typeof GenerateImagePromptOutputSchema>;


export async function generateImagePrompt(
  input: GenerateImagePromptInput
): Promise<GenerateImagePromptOutput> {
  return generateImagePromptFlow(input);
}

const featuredImagePrompt = ai.definePrompt({
    name: 'featuredImageSearchQuery',
    input: { schema: GenerateImagePromptInputSchema },
    output: { schema: GenerateImagePromptOutputSchema },
    prompt: `Your task is to generate a short, specific, and relevant image search query for a stock photo website like Pexels or Unsplash.

I will provide you with a blog post title and the first paragraph. Your query must be 3-6 words and visually represent the core theme of the text.

**IMPORTANT RULES:**
1.  **DO NOT** invent subjects or concepts not explicitly mentioned in the text.
2.  Base the query **ONLY** on the provided Title and Paragraph.
3.  Think visually. What would a person search for to find an excellent photo for this article?
4.  Avoid abstract terms.

**EXAMPLE:**
- **Title**: "The Ultimate Guide to Organic Gardening for Beginners"
- **Paragraph**: "Starting a garden can feel overwhelming, but growing your own organic vegetables is a rewarding experience. This guide will walk you through the essential first steps, from preparing your soil to choosing the right plants for your climate."
- **QUERY**: "beginner organic vegetable garden"

**TASK:**
- **Title**: {{{title}}}
- **Paragraph**: {{{paragraph}}}
- **QUERY**:`
});

const sectionImagePrompt = ai.definePrompt({
    name: 'sectionImageSearchQuery',
    input: { schema: GenerateImagePromptInputSchema },
    output: { schema: GenerateImagePromptOutputSchema },
    prompt: `Your task is to generate a short, specific, and relevant image search query for a stock photo website like Pexels or Unsplash.

I will provide you with a section heading (H2 or H3) and its following paragraph. Your query must be 3-6 words and visually represent the core theme of the text.

**IMPORTANT RULES:**
1.  **DO NOT** invent subjects or concepts not explicitly mentioned in the text.
2.  Base the query **ONLY** on the provided Heading and Paragraph.
3.  Think visually. What would a person search for to find an excellent photo for this section?
4.  Avoid abstract terms.

**EXAMPLE:**
- **Heading**: "Choosing the Right Soil"
- **Paragraph**: "The foundation of any healthy garden is its soil. For organic gardening, this means looking for soil rich in compost and natural matter, avoiding synthetic fertilizers. You can test your soil's pH to understand its composition better."
- **QUERY**: "hands holding rich garden soil"

**TASK:**
- **Heading**: {{{title}}}
- **Paragraph**: {{{paragraph}}}
- **QUERY**:`
});


const generateImagePromptFlow = ai.defineFlow(
  {
    name: 'generateImagePromptFlow',
    inputSchema: GenerateImagePromptInputSchema,
    outputSchema: GenerateImagePromptOutputSchema,
  },
  async input => {
    let promptToRun;
    if (input.type === 'featured') {
        promptToRun = featuredImagePrompt;
    } else {
        promptToRun = sectionImagePrompt;
    }
    const {output} = await promptToRun(input);
    // Sanitize output to remove any potential formatting issues or unwanted text from the model
    const cleanQuery = output!.query.replace('Image Query:', '').trim();
    return { query: cleanQuery };
  }
);

