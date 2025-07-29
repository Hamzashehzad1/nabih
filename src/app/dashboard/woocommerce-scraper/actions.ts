// src/app/dashboard/woocommerce-scraper/actions.ts
'use server';

import { z } from 'zod';
import * as cheerio from 'cheerio';
import JSZip from 'jszip';

export interface ProductData {
    id: string;
    type: string;
    sku: string;
    name: string;
    published: number;
    isFeatured: string;
    visibility: string;
    shortDescription: string;
    description: string;
    salePrice: string;
    regularPrice: string;
    taxStatus: string;
    taxClass: string;
    inStock: number;
    stock: string;
    backorders: string;
    weight: string;
    length: string;
    width: string;
    height: string;
    allowCustomerReviews: number;
    purchaseNote: string;
    shippingClass: string;
    images: string; // Comma-separated list of image URLs/paths
    categories: string; // Comma-separated list
    tags: string; // Comma-separated list
    // for variable products
    attribute1Name?: string;
    attribute1Values?: string;
    attribute1Visible?: number;
    attribute1Global?: number;
}

const fetchWithRetry = async (url: string, retries = 3, delay = 1000): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.82 Safari/537.36' }});
            if (response.ok) return response;
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(res => setTimeout(res, delay));
        }
    }
    throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
};


async function scrapeProductPage(url: string, imageZip: JSZip): Promise<ProductData | null> {
    try {
        const response = await fetchWithRetry(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        const name = $('h1.product_title').text().trim();
        if (!name) return null; // Not a valid product page

        // Prices
        let regularPrice = '';
        let salePrice = '';
        const priceElement = $('.price');
        if (priceElement.find('ins').length > 0) { // Sale price exists
            salePrice = priceElement.find('ins .woocommerce-Price-amount.amount').first().text().replace(/[^0-9.]/g, '');
            regularPrice = priceElement.find('del .woocommerce-Price-amount.amount').first().text().replace(/[^0-9.]/g, '');
        } else {
            regularPrice = priceElement.find('.woocommerce-Price-amount.amount').first().text().replace(/[^0-9.]/g, '');
        }

        // Images
        const imagePromises: Promise<void>[] = [];
        const imageFilenames: string[] = [];
        $('.woocommerce-product-gallery__image a').each((i, el) => {
            const imageUrl = $(el).attr('href');
            if (imageUrl) {
                const filename = imageUrl.split('/').pop()?.split('?')[0] || `image-${Date.now()}`;
                imageFilenames.push(filename);
                imagePromises.push((async () => {
                    const imageResponse = await fetchWithRetry(imageUrl);
                    const arrayBuffer = await imageResponse.arrayBuffer();
                    imageZip.file(`images/${filename}`, arrayBuffer);
                })());
            }
        });
        await Promise.all(imagePromises);

        const categories = $('.posted_in a').map((i, el) => $(el).text()).get().join(' > ');
        const tags = $('.tagged_as a').map((i, el) => $(el).text()).get().join(', ');
        
        const descriptionElement = $('#tab-description');
        const description = descriptionElement.length > 0 ? descriptionElement.html() || '' : $('.woocommerce-product-details__short-description').html() || '';

        const product: ProductData = {
            id: '',
            type: 'simple', // Assuming simple for now
            sku: $('.sku').text().trim(),
            name,
            published: 1,
            isFeatured: 'no',
            visibility: 'visible',
            shortDescription: $('.woocommerce-product-details__short-description').text().trim(),
            description: description,
            salePrice,
            regularPrice,
            taxStatus: 'taxable',
            taxClass: '',
            inStock: $('.stock.in-stock').length > 0 ? 1 : 0,
            stock: '',
            backorders: 'no',
            weight: '',
            length: '',
            width: '',
            height: '',
            allowCustomerReviews: 1,
            purchaseNote: '',
            shippingClass: '',
            images: imageFilenames.map(f => `images/${f}`).join(', '),
            categories,
            tags,
        };
        
        return product;
    } catch (error) {
        console.error(`Failed to scrape ${url}:`, error);
        return null;
    }
}

function convertToCsv(products: ProductData[]): string {
    if (products.length === 0) return '';
    const headers = Object.keys(products[0]);
    const headerRow = headers.join(',');

    const rows = products.map(product => {
        return headers.map(header => {
            const value = product[header as keyof ProductData] as string | number | undefined;
            const stringValue = (value === undefined || value === null) ? '' : String(value);
            // Escape quotes and wrap in quotes if it contains commas or newlines
            const escapedValue = stringValue.replace(/"/g, '""');
            if (escapedValue.includes(',') || escapedValue.includes('\n')) {
                return `"${escapedValue}"`;
            }
            return escapedValue;
        }).join(',');
    });

    return [headerRow, ...rows].join('\n');
}

export async function scrapeWooCommerceSite(
    baseUrl: string
): Promise<{ success: true; data: { products: ProductData[], csv: string, zip: string } } | { success: false; error: string }> {
    try {
        const productUrls = new Set<string>();
        const visitedUrls = new Set<string>();
        const queue: string[] = [baseUrl];
        visitedUrls.add(baseUrl);

        let processedQueue = 0;
        while(queue.length > 0 && processedQueue < 100) { // Limit pages to crawl to prevent infinite loops
             const currentUrl = queue.shift();
             if (!currentUrl) continue;
             
             processedQueue++;

            try {
                const response = await fetchWithRetry(currentUrl);
                const html = await response.text();
                const $ = cheerio.load(html);

                $('a').each((i, el) => {
                    const href = $(el).attr('href');
                    if (href) {
                        const absoluteUrl = new URL(href, baseUrl).toString();
                        if (absoluteUrl.startsWith(baseUrl) && !visitedUrls.has(absoluteUrl)) {
                            visitedUrls.add(absoluteUrl);
                            queue.push(absoluteUrl);
                        }
                        // Simple check for a product URL structure
                        if ($(el).hasClass('woocommerce-LoopProduct-link') || $(el).parents('.product').length > 0) {
                             if(absoluteUrl.startsWith(baseUrl)){
                                productUrls.add(absoluteUrl);
                            }
                        }
                    }
                });
            } catch (e) {
                console.warn(`Could not crawl ${currentUrl}:`, e);
            }
        }

        if (productUrls.size === 0) {
            return { success: false, error: 'Could not find any product links on the website. Ensure it is a standard WooCommerce site.' };
        }

        const allProducts: ProductData[] = [];
        const imageZip = new JSZip();

        for (const url of Array.from(productUrls)) {
            const product = await scrapeProductPage(url, imageZip);
            if (product) {
                allProducts.push(product);
            }
        }
        
        const csv = convertToCsv(allProducts);
        const zip = await imageZip.generateAsync({ type: 'base64' });

        return { success: true, data: { products: allProducts, csv, zip }};

    } catch (error) {
        console.error('Scraping error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
    }
}
