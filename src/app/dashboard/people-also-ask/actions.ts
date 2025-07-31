// src/app/dashboard/people-also-ask/actions.ts
'use server';

import * as cheerio from 'cheerio';

export async function getPeopleAlsoAsk(keyword: string): Promise<{ success: true; data: string[] } | { success: false; error: string }> {
  if (!keyword) {
    return { success: false, error: 'A keyword is required.' };
  }

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;
  
  try {
    const response = await fetch(searchUrl, {
      headers: {
        // This User-Agent is important to mimic a real browser request.
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.82 Safari/537.36'
      }
    });

    if (!response.ok) {
      return { success: false, error: `Failed to fetch from Google. Status: ${response.status}` };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const questions: string[] = [];

    // Google uses specific data attributes for PAA boxes. This is more reliable than class names.
    $('div[data-init-pAQLCf]').find('div[role="heading"]').each((i, el) => {
        const questionText = $(el).text().trim();
        if (questionText) {
            questions.push(questionText);
        }
    });

    // Fallback for different structures
    if (questions.length === 0) {
        $('div.related-question-pair > div > div > div > span').each((i, elem) => {
            const questionText = $(elem).text();
            if(questionText) questions.push(questionText);
        });
    }

    if (questions.length === 0) {
        return { success: false, error: 'Could not find any "People Also Ask" questions. Try a different keyword.' };
    }

    return { success: true, data: questions };

  } catch (error: any) {
    console.error("Error scraping Google:", error);
    return { success: false, error: 'An error occurred while trying to scrape Google search results. This can happen if Google blocks the request.' };
  }
}
