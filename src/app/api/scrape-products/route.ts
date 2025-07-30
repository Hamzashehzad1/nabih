
import { NextRequest } from 'next/server';
import * as cheerio from 'cheerio';
import JSZip from 'jszip';
import { z } from 'zod';

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

const SelectorSchema = z.object({
    productLink: z.string(),
    title: z.string(),
    price: z.string(),
    salePrice: z.string(),
    description: z.string(),
    images: z.string(),
    sku: z.string(),
});
type Selectors = z.infer<typeof SelectorSchema>;

const platformSelectors: Record<string, Selectors> = {
    woocommerce: {
        productLink: '.woocommerce-LoopProduct-link, .product-item-link, a.product-image-link',
        title: 'h1.product_title, .product-title',
        price: '.price, .product-price',
        salePrice: '.price ins, .sale-price',
        description: '#tab-description, .product-description, .woocommerce-product-details__short-description',
        images: '.woocommerce-product-gallery__image a, .product-image a',
        sku: '.sku, [itemprop="sku"]',
    },
    shopify: {
        productLink: 'a[href*="/products/"]',
        title: 'h1.product__title, h1[itemprop="name"]',
        price: '.price__container .price-item, [itemprop="price"]',
        salePrice: '.price__container .price-item--sale',
        description: '.product__description, [itemprop="description"]',
        images: '.product__media-gallery img, .product-gallery__image img',
        sku: '[data-sku], .sku',
    }
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

// Helper to extract content from a page
const extractText = ($: cheerio.CheerioAPI, selector: string) => {
    let content = '';
    // Handle meta and link tags
    if (selector.startsWith('meta') || selector.startsWith('link')) {
        const elements = $(selector);
        elements.each((i, el) => {
            const value = $(el).attr('content') || $(el).attr('href');
            if(value) {
                content = value;
                return false; // break the loop
            }
        });
    } else {
        content = $(selector).first().text().trim();
    }
    return content;
};


// Generic product scraper
async function scrapeProductPage(url: string, imageZip: JSZip, selectors: Selectors): Promise<ProductData | null> {
    try {
        const response = await fetchWithRetry(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        const name = extractText($, selectors.title);
        if (!name) return null; // If we can't find a name, it's probably not a product page

        let regularPrice = '';
        let salePrice = '';
        const priceElement = $(selectors.price).first();
        if ($(selectors.salePrice).length > 0 && $(selectors.salePrice).text().trim() !== "") {
            salePrice = $(selectors.salePrice).first().text().replace(/[^0-9.,]/g, '');
            regularPrice = priceElement.find('del').first().text().replace(/[^0-9.,]/g, '') || priceElement.text().replace(/[^0-9.,]/g, '');
        } else {
            regularPrice = priceElement.text().replace(/[^0-9.,]/g, '');
        }
        
        const imagePromises: Promise<void>[] = [];
        const imageFilenames: string[] = [];
        $(selectors.images).each((i, el) => {
            const imageUrl = $(el).attr('href') || $(el).attr('src');
            if (imageUrl) {
                const absoluteImageUrl = new URL(imageUrl, url).toString();
                const filename = absoluteImageUrl.split('/').pop()?.split('?')[0] || `image-${Date.now()}`;
                if (!imageZip.file(`images/${filename}`)) { // Avoid re-downloading
                    imageFilenames.push(filename);
                    imagePromises.push((async () => {
                        try {
                            const imageResponse = await fetchWithRetry(absoluteImageUrl);
                            const arrayBuffer = await imageResponse.arrayBuffer();
                            imageZip.file(`images/${filename}`, arrayBuffer);
                        } catch (imgError) {
                            console.error(`Failed to download image ${absoluteImageUrl}:`, imgError);
                        }
                    })());
                } else {
                    imageFilenames.push(filename);
                }
            }
        });
        await Promise.all(imagePromises);

        return {
            id: '', type: 'simple', sku: extractText($, selectors.sku), name, published: 1,
            isFeatured: 'no', visibility: 'visible',
            shortDescription: $(selectors.description).first().text().trim().substring(0, 200),
            description: $(selectors.description).first().html() || '',
            salePrice, regularPrice, taxStatus: 'taxable', taxClass: '',
            inStock: 1, stock: '', backorders: 'no',
            weight: '', length: '', width: '', height: '', allowCustomerReviews: 1,
            purchaseNote: '', shippingClass: '',
            images: imageFilenames.map(f => `images/${f}`).join(', '),
            categories: '', tags: '',
        };
    } catch (error) {
        console.error(`Failed to scrape page ${url}:`, error);
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
    const platform = searchParams.get('platform') || 'woocommerce';
    const selectors = platformSelectors[platform];

    if (!baseUrl) {
        return new Response('URL is required', { status: 400 });
    }
     if (!selectors) {
        return new Response('Invalid platform specified', { status: 400 });
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
                while (queue.length > 0 && processedQueue < 50) { // Limit crawl to 50 pages to prevent infinite loops
                    const currentUrl = queue.shift();
                    if (!currentUrl) continue;
                    processedQueue++;

                    sendProgress(controller, 'progress', { message: `Crawling: ${currentUrl.substring(baseUrl.length) || '/'}` });
                    
                    try {
                        const response = await fetchWithRetry(currentUrl);
                        const html = await response.text();
                        const $ = cheerio.load(html);

                        // Find all links on the page for further crawling
                        $('a').each((i, el) => {
                            const href = $(el).attr('href');
                            if (href) {
                                let absoluteUrl;
                                try {
                                    absoluteUrl = new URL(href, baseUrl).toString().split('#')[0];
                                } catch(e) {
                                    // Ignore invalid URLs
                                    return;
                                }

                                if (absoluteUrl.startsWith(baseUrl) && !visitedUrls.has(absoluteUrl)) {
                                    visitedUrls.add(absoluteUrl);
                                    // A simple heuristic to avoid crawling non-essential pages
                                    if (!absoluteUrl.match(/\.(jpg|jpeg|png|gif|pdf|zip|css|js)$/i)) {
                                        queue.push(absoluteUrl);
                                    }
                                }
                            }
                        });

                        // From the links on the current page, identify potential product pages based on the product link selector
                         $(selectors.productLink).each((i, el) => {
                             const href = $(el).attr('href');
                             if (href) {
                                let absoluteUrl;
                                try {
                                    absoluteUrl = new URL(href, baseUrl).toString().split('#')[0];
                                    if(absoluteUrl.startsWith(baseUrl)) {
                                       productUrls.add(absoluteUrl);
                                    }
                                } catch (e) { /* ignore invalid urls */ }
                             }
                        });

                    } catch (e) {
                         sendProgress(controller, 'progress', { message: `Warning: Could not crawl ${currentUrl}` });
                    }
                }

                if (productUrls.size === 0) {
                     // Check if the base URL itself is a product page
                    const baseResponse = await fetchWithRetry(baseUrl);
                    const baseHtml = await baseResponse.text();
                    const $ = cheerio.load(baseHtml);
                    if (extractText($, selectors.title)) {
                         productUrls.add(baseUrl);
                         sendProgress(controller, 'progress', { message: 'Base URL detected as a product page.' });
                    } else {
                       throw new Error("No product links found. Is this a standard e-commerce site? Try adjusting custom selectors.");
                    }
                }
                
                sendProgress(controller, 'progress', { message: `Found ${productUrls.size} unique product pages. Starting scrape...` });

                const allProducts: ProductData[] = [];
                const imageZip = new JSZip();
                let productCount = 0;

                for (const url of Array.from(productUrls)) {
                    productCount++;
                    sendProgress(controller, 'progress', { message: `Scraping product ${productCount}/${productUrls.size}...` });
                    const product = await scrapeProductPage(url, imageZip, selectors);
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
