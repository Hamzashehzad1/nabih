import { config } from 'dotenv';
config();

import '@/ai/flows/generate-blog-post.ts';
import '@/ai/flows/generate-image-prompt.ts';
import '@/ai/flows/generate-image.ts';
import '@/ai/flows/search-images.ts';
import '@/ai/flows/website-chat.ts';
import '@/ai/flows/generate-content-ideas.ts';
import '@/ai/flows/generate-legal-document.ts';
import '@/ai/flows/suggest-internal-links.ts';
