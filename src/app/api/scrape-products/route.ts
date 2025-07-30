
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

// Define the schema for custom selectors
const SelectorSchema = z.object({
    productLink: z.string().default('.product a, .type-product a, .woocommerce-LoopProduct-link'),
    title: z.string().default('h1.product_title, .product_title, h1'),
    price: z.string().default('.price .amount, .price'),
    salePrice: z.string().default('.price ins .amount'),
    description: z.string().default('#tab-description, .product-description, .woocommerce-product-details__short-description'),
    images: z.string().default('.woocommerce-product-gallery__image a, .product-images a, .product-gallery a'),
    sku: z.string().default('.sku'),
});
type Selectors = z.infer<typeof SelectorSchema>;

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

// Scrape a single WooCommerce product page
async function scrapeWooCommerceProduct(url: string, imageZip: JSZip, selectors: Selectors): Promise<ProductData | null> {
    try {
        const response = await fetchWithRetry(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        const name = $(selectors.title).first().text().trim();
        if (!name) return null;

        let regularPrice = '';
        let salePrice = '';
        const priceElement = $(selectors.price).first();
        if ($(selectors.salePrice).length > 0) {
            salePrice = $(selectors.salePrice).first().text().replace(/[^0-9.]/g, '');
            regularPrice = priceElement.find('del').first().text().replace(/[^0-9.]/g, '') || priceElement.text().replace(/[^0-9.]/g, '');
        } else {
            regularPrice = priceElement.text().replace(/[^0-9.]/g, '');
        }

        const imagePromises: Promise<void>[] = [];
        const imageFilenames: string[] = [];
        $(selectors.images).each((i, el) => {
            const imageUrl = $(el).attr('href');
            if (imageUrl) {
                const filename = imageUrl.split('/').pop()?.split('?')[0] || `image-${Date.now()}`;
                if (!imageZip.file(`images/${filename}`)) {
                    imageFilenames.push(filename);
                    imagePromises.push((async () => {
                        try {
                            const imageResponse = await fetchWithRetry(imageUrl);
                            const arrayBuffer = await imageResponse.arrayBuffer();
                            imageZip.file(`images/${filename}`, arrayBuffer);
                        } catch (imgError) {
                            console.error(`Failed to download image ${imageUrl}:`, imgError);
                        }
                    })());
                } else {
                    imageFilenames.push(filename);
                }
            }
        });
        await Promise.all(imagePromises);

        return {
            id: '', type: 'simple', sku: $(selectors.sku).text().trim(), name, published: 1,
            isFeatured: 'no', visibility: 'visible',
            shortDescription: $('.woocommerce-product-details__short-description').text().trim(),
            description: $(selectors.description).html()?.trim() || '',
            salePrice, regularPrice, taxStatus: 'taxable', taxClass: '',
            inStock: $('.stock.in-stock, .in-stock').length > 0 ? 1 : 0, stock: '', backorders: 'no',
            weight: '', length: '', width: '', height: '', allowCustomerReviews: 1,
            purchaseNote: '', shippingClass: '',
            images: imageFilenames.map(f => `images/${f}`).join(', '),
            categories: $('.posted_in a').map((i, el) => $(el).text()).get().join(' > '),
            tags: $('.tagged_as a').map((i, el) => $(el).text()).get().join(', '),
        };
    } catch (error) {
        console.error(`Failed to scrape WooCommerce page ${url}:`, error);
        return null;
    }
}

// Scrape a single Shopify product page
async function scrapeShopifyProduct(url: string, imageZip: JSZip): Promise<ProductData | null> {
    try {
        const response = await fetchWithRetry(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        let productJson: any = null;
        $('script[type="application/ld+json"]').each((i, el) => {
            const scriptContent = $(el).html();
            if (scriptContent) {
                try {
                    const jsonData = JSON.parse(scriptContent);
                    if (jsonData['@type'] === 'Product') {
                        productJson = jsonData;
                        return false; // break the loop
                    }
                } catch (e) { /* ignore parse errors */ }
            }
        });

        if (!productJson) {
            // Fallback to scraping HTML if JSON-LD not found
            const name = $('h1').first().text().trim();
            if (!name) return null; // No name, no product.
            
            const price = $('meta[property="og:price:amount"]').attr('content') || $('.price__regular .price-item').first().text().replace(/[^0-9.]/g, '');
            const description = $('.product__description').html() || '';

            return {
                id: '', type: 'simple', sku: productJson?.sku || '', name, published: 1,
                isFeatured: 'no', visibility: 'visible', shortDescription: '', description: description,
                salePrice: '', regularPrice: price, taxStatus: 'taxable', taxClass: '',
                inStock: 1, stock: '', backorders: 'no', weight: '', length: '', width: '',
                height: '', allowCustomerReviews: 1, purchaseNote: '', shippingClass: '',
                images: '', categories: '', tags: '',
            };
        }
        
        const imagePromises: Promise<void>[] = [];
        const imageFilenames: string[] = [];
        (productJson.image || []).forEach((imageUrl: string) => {
             const filename = imageUrl.split('/').pop()?.split('?')[0] || `image-${Date.now()}`;
             if (!imageZip.file(`images/${filename}`)) {
                 imageFilenames.push(filename);
                 imagePromises.push((async () => {
                    try {
                        const imageResponse = await fetchWithRetry(imageUrl);
                        const arrayBuffer = await imageResponse.arrayBuffer();
                        imageZip.file(`images/${filename}`, arrayBuffer);
                    } catch(imgError){
                        console.error(`Failed to download shopify image ${imageUrl}:`, imgError);
                    }
                 })());
             } else {
                 imageFilenames.push(filename);
             }
        });
        await Promise.all(imagePromises);

        return {
            id: '', type: 'simple', sku: productJson.sku, name: productJson.name, published: 1,
            isFeatured: 'no', visibility: 'visible', shortDescription: '',
            description: productJson.description,
            salePrice: productJson.offers?.price, regularPrice: productJson.offers?.price,
            taxStatus: 'taxable', taxClass: '', inStock: 1, stock: '', backorders: 'no',
            weight: '', length: '', width: '', height: '', allowCustomerReviews: 1,
            purchaseNote: '', shippingClass: '', images: imageFilenames.map(f => `images/${f}`).join(', '),
            categories: '', tags: '',
        };
    } catch (error) {
        console.error(`Failed to scrape Shopify page ${url}:`, error);
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
    const platform = searchParams.get('platform');
    
    // Parse selectors from search params
    const selectors = SelectorSchema.parse(Object.fromEntries(searchParams));

    if (!baseUrl) {
        return new Response('URL is required', { status: 400 });
    }
     if (platform !== 'woocommerce' && platform !== 'shopify') {
        return new Response('Platform must be "woocommerce" or "shopify"', { status: 400 });
    }

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const productUrls = new Set<string>();
                const visitedUrls = new Set<string>();
                const queue: string[] = [baseUrl];
                visitedUrls.add(baseUrl);
                
                sendProgress(controller, 'progress', { message: `Starting ${platform} crawl at ${baseUrl}` });

                let processedQueue = 0;
                while (queue.length > 0 && processedQueue < 50) { 
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
                                    absoluteUrl = new URL(href, baseUrl).toString().split('#')[0];
                                } catch(e) { return; }

                                if (absoluteUrl.startsWith(baseUrl) && !visitedUrls.has(absoluteUrl)) {
                                    visitedUrls.add(absoluteUrl);
                                    if (!absoluteUrl.match(/\.(jpg|jpeg|png|gif|pdf|zip|css|js)$/i)) {
                                        queue.push(absoluteUrl);
                                    }
                                }
                                
                                const isProductLink = platform === 'woocommerce' ? $(el).closest(selectors.productLink).length > 0 && href.includes('/product/') : href.includes('/products/');
                                if (isProductLink && absoluteUrl.startsWith(baseUrl)) {
                                   productUrls.add(absoluteUrl);
                                }
                            }
                        });
                    } catch (e) {
                         sendProgress(controller, 'progress', { message: `Warning: Could not crawl ${currentUrl}` });
                    }
                }

                if (productUrls.size === 0) {
                     sendProgress(controller, 'progress', { message: 'No product links found on main pages. Trying a direct collection/shop page crawl.' });
                     try {
                        const shopUrl = platform === 'woocommerce' ? `${baseUrl.replace(/\/$/, '')}/shop/` : `${baseUrl.replace(/\/$/, '')}/collections/all`;
                        const response = await fetchWithRetry(shopUrl);
                        const html = await response.text();
                        const $ = cheerio.load(html);
                        const linkSelector = platform === 'woocommerce' ? selectors.productLink : 'a[href*="/products/"]';
                        $(linkSelector).each((i, el) => {
                            const href = $(el).attr('href');
                             if (href) {
                                let absoluteUrl;
                                try {
                                    absoluteUrl = new URL(href, baseUrl).toString().split('#')[0];
                                    productUrls.add(absoluteUrl);
                                } catch (e) { /* ignore invalid urls */ }
                             }
                        });
                     } catch (e) {
                        // ignore if shop page doesn't exist
                     }
                }

                if (productUrls.size === 0) {
                    throw new Error(`No product links found. Is this a standard ${platform} site?`);
                }
                
                sendProgress(controller, 'progress', { message: `Found ${productUrls.size} unique product pages.` });

                const allProducts: ProductData[] = [];
                const imageZip = new JSZip();
                let productCount = 0;

                for (const url of Array.from(productUrls)) {
                    productCount++;
                    sendProgress(controller, 'progress', { message: `Scraping product ${productCount}/${productUrls.size}...` });
                    
                    const product = platform === 'woocommerce' 
                        ? await scrapeWooCommerceProduct(url, imageZip, selectors)
                        : await scrapeShopifyProduct(url, imageZip);

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
