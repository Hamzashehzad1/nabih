'use server';
/**
 * @fileOverview A Q&A flow for a website chatbot.
 *
 * - answerQuestion - A function that answers a question based on website content.
 * - AnswerQuestionInput - The input type for the answerQuestion function.
 * - AnswerQuestionOutput - The return type for the answerQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerQuestionInputSchema = z.object({
  question: z.string().describe('The user\'s question.'),
  context: z.string().describe('A summary of the website content.'),
});
export type AnswerQuestionInput = z.infer<typeof AnswerQuestionInputSchema>;

const AnswerQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the user\'s question.'),
});
export type AnswerQuestionOutput = z.infer<typeof AnswerQuestionOutputSchema>;

export async function answerQuestion(input: AnswerQuestionInput): Promise<AnswerQuestionOutput> {
  return websiteChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'websiteChatPrompt',
  input: {schema: AnswerQuestionInputSchema},
  output: {schema: AnswerQuestionOutputSchema},
  prompt: `You are a friendly and helpful chatbot for a website. Your goal is to answer user questions based on the content provided from the website.

  Do not answer questions that are not related to the website content. If the answer is not found in the provided context, politely say that you don't have that information.
  
  Keep your answers concise and to the point.

  CONTEXT:
  ---
  {{{context}}}
  ---

  QUESTION:
  "{{{question}}}"

  ANSWER:
  `,
});

const websiteChatFlow = ai.defineFlow(
  {
    name: 'websiteChatFlow',
    inputSchema: AnswerQuestionInputSchema,
    outputSchema: AnswerQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
