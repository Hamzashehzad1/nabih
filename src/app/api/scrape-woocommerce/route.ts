// src/app/api/scrape-woocommerce/route.ts
import { NextRequest } from 'next/server';
import * as cheerio from 'cheerio';
import JSZip from 'jszip';

// Define the structure of a product
interface ProductData {
    id: string; type: string; sku: string; name: string; published: number;
    isFeatured: string; visibility: string; shortDescription: string;
    description: string; salePrice: string; regularPrice: string;
    taxStatus: string; taxClass: string; inStock: number; stock: string;
    backorders: string; weight: string; length: string; width: string;
    height: string; allowCustomerReviews: number; purchaseNote: string;
    shippingClass: string; images: string; categories: string; tags: string;
    attribute1Name?: string; attribute1Values?: string;
    attribute1Visible?: number; attribute1Global?: number;
}

// Function to send progress updates to the client
const sendProgress = (controller: ReadableStreamDefaultController, type: string, data: any) => {
    try {
        const message = `data: ${JSON.stringify({ type, ...data })}\n\n`;
        controller.enqueue(new TextEncoder().encode(message));
    } catch (e) {
        console.error("Failed to send progress update:", e);
    }
};

// Retry logic for fetching
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

// Main function to scrape a single product page
async function scrapeProductPage(url: string, imageZip: JSZip): Promise<ProductData | null> {
    try {
        const response = await fetchWithRetry(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        const name = $('h1.product_title, .product_title, h1').first().text().trim();
        if (!name) return null;

        let regularPrice = '';
        let salePrice = '';
        const priceElement = $('.price').first();
        if (priceElement.find('ins').length > 0) {
            salePrice = priceElement.find('ins .woocommerce-Price-amount.amount').first().text().replace(/[^0-9.]/g, '');
            regularPrice = priceElement.find('del .woocommerce-Price-amount.amount').first().text().replace(/[^0-9.]/g, '');
        } else {
            regularPrice = priceElement.find('.woocommerce-Price-amount.amount').first().text().replace(/[^0-9.]/g, '');
        }

        const imagePromises: Promise<void>[] = [];
        const imageFilenames: string[] = [];
        $('.woocommerce-product-gallery__image a, .product-images a, .product-gallery a').each((i, el) => {
            const imageUrl = $(el).attr('href');
            if (imageUrl) {
                const filename = imageUrl.split('/').pop()?.split('?')[0] || `image-${Date.now()}`;
                if (!imageZip.file(`images/${filename}`)) { // Avoid duplicate downloads
                    imageFilenames.push(filename);
                    imagePromises.push((async () => {
                        try {
                            const imageResponse = await fetchWithRetry(imageUrl);
                            const arrayBuffer = await imageResponse.arrayBuffer();
                            imageZip.file(`images/${filename}`, arrayBuffer);
                        } catch (imgError) {
                            console.error(`Failed to download image ${imageUrl}:`, imgError);
                            // Don't add to zip, it will be missing but won't crash the app
                        }
                    })());
                } else {
                    imageFilenames.push(filename);
                }
            }
        });
        await Promise.all(imagePromises);

        const categories = $('.posted_in a').map((i, el) => $(el).text()).get().join(' > ');
        const tags = $('.tagged_as a').map((i, el) => $(el).text()).get().join(', ');
        
        const descriptionElement = $('#tab-description').html() || $('.woocommerce-product-details__short-description').html() || '';
        
        return {
            id: '', type: 'simple', sku: $('.sku').text().trim(), name, published: 1,
            isFeatured: 'no', visibility: 'visible',
            shortDescription: $('.woocommerce-product-details__short-description').text().trim(),
            description: descriptionElement.trim(), salePrice, regularPrice, taxStatus: 'taxable', taxClass: '',
            inStock: $('.stock.in-stock, .in-stock').length > 0 ? 1 : 0, stock: '', backorders: 'no',
            weight: '', length: '', width: '', height: '', allowCustomerReviews: 1,
            purchaseNote: '', shippingClass: '',
            images: imageFilenames.map(f => `images/${f}`).join(', '),
            categories, tags,
        };
    } catch (error) {
        console.error(`Failed to scrape ${url}:`, error);
        return null;
    }
}

// Function to convert product data to CSV format
function convertToCsv(products: ProductData[]): string {
    if (products.length === 0) return '';
    const headers = Object.keys(products[0]);
    const headerRow = headers.join(',');
    const rows = products.map(product => {
        return headers.map(header => {
            const value = product[header as keyof ProductData] as string | number | undefined;
            const stringValue = (value === undefined || value === null) ? '' : String(value);
            const escapedValue = stringValue.replace(/"/g, '""');
            if (escapedValue.includes(',') || escapedValue.includes('\n')) {
                return `"${escapedValue}"`;
            }
            return escapedValue;
        }).join(',');
    });
    return [headerRow, ...rows].join('\n');
}

// The main GET handler for the API route
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const baseUrl = searchParams.get('url');

    if (!baseUrl) {
        return new Response('URL is required', { status: 400 });
    }

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const productUrls = new Set<string>();
                const visitedUrls = new Set<string>();
                const queue: string[] = [baseUrl];
                visitedUrls.add(baseUrl);
                
                sendProgress(controller, 'progress', { message: `Starting crawl at ${baseUrl}` });

                let processedQueue = 0;
                while (queue.length > 0 && processedQueue < 50) { // Limit pages to prevent infinite loops
                    const currentUrl = queue.shift();
                    if (!currentUrl) continue;
                    processedQueue++;

                    sendProgress(controller, 'progress', { message: `Crawling: ${currentUrl.substring(baseUrl.length) || '/'}` });
                    
                    try {
                        const response = await fetchWithRetry(currentUrl);
                        const html = await response.text();
                        const $ = cheerio.load(html);

                        $('a').each((i, el) => {
                            const href = $(el).attr('href');
                            if (href) {
                                let absoluteUrl;
                                try {
                                    absoluteUrl = new URL(href, baseUrl).toString().split('#')[0]; // Ignore fragments
                                } catch(e) { return; }

                                if (absoluteUrl.startsWith(baseUrl) && !visitedUrls.has(absoluteUrl)) {
                                    visitedUrls.add(absoluteUrl);
                                    if (!absoluteUrl.match(/\.(jpg|jpeg|png|gif|pdf|zip)$/i)) {
                                        queue.push(absoluteUrl);
                                    }
                                }

                                if ($(el).closest('.product, .type-product').length > 0 && href.includes('/product/')) {
                                   if(absoluteUrl.startsWith(baseUrl)){
                                       productUrls.add(absoluteUrl);
                                   }
                                }
                            }
                        });
                    } catch (e) {
                         sendProgress(controller, 'progress', { message: `Warning: Could not crawl ${currentUrl}` });
                    }
                }

                if (productUrls.size === 0) {
                     sendProgress(controller, 'progress', { message: 'No product links found on main pages. Trying a direct /shop page crawl.' });
                     try {
                        const shopUrl = `${baseUrl.replace(/\/$/, '')}/shop/`;
                        const response = await fetchWithRetry(shopUrl);
                        const html = await response.text();
                        const $ = cheerio.load(html);
                        $('.woocommerce-LoopProduct-link').each((i, el) => {
                            const href = $(el).attr('href');
                             if (href) productUrls.add(href);
                        });
                     } catch (e) {
                        // ignore if /shop doesn't exist
                     }
                }

                if (productUrls.size === 0) {
                    throw new Error('No product links found. Is this a standard WooCommerce site?');
                }
                
                sendProgress(controller, 'progress', { message: `Found ${productUrls.size} unique product pages.` });

                const allProducts: ProductData[] = [];
                const imageZip = new JSZip();
                let productCount = 0;

                for (const url of Array.from(productUrls)) {
                    productCount++;
                    sendProgress(controller, 'progress', { message: `Scraping product ${productCount}/${productUrls.size}...` });
                    const product = await scrapeProductPage(url, imageZip);
                    if (product) {
                        allProducts.push(product);
                        sendProgress(controller, 'product', { product });
                    } else {
                        sendProgress(controller, 'progress', { message: `Warning: Could not extract product data from ${url}` });
                    }
                }
                
                sendProgress(controller, 'progress', { message: `Generating final files...` });
                const csv = convertToCsv(allProducts);
                const zip = await imageZip.generateAsync({ type: 'base64' });

                sendProgress(controller, 'complete', { csv, zip });

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                console.error("Scraping error:", error);
                sendProgress(controller, 'error', { message: errorMessage });
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
