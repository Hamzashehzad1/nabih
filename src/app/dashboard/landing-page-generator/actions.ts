// src/app/dashboard/landing-page-generator/actions.ts
'use server';

import { generateLandingPage } from '@/ai/flows/generate-landing-page';
import type { GenerateLandingPageInput, GenerateLandingPageOutput } from '@/ai/flows/types/landing-page';

export async function generateLandingPageAction(
  input: GenerateLandingPageInput
): Promise<GenerateLandingPageOutput> {
  return generateLandingPage(input);
}
