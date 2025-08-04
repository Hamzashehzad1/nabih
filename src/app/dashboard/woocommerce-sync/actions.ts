
// src/app/dashboard/woocommerce-sync/actions.ts
'use server';

import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { z } from 'zod';

const siteSchema = z.object({
    url: z.string().url(),
    consumerKey: z.string(),
    consumerSecret: z.string(),
});
export type SiteFormData = z.infer<typeof siteSchema>;

export interface ExportLog {
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'error';
}

export interface ExportResult {
    logs: Omit<ExportLog, 'timestamp'>[];
    data: {
        products?: string;
        orders?: string;
        reviews?: string;
        coupons?: string;
    }
}

// Helper to fetch all items of a certain type from a site
async function fetchAllItems(api: WooCommerceRestApi, endpoint: string, logs: Omit<ExportLog, 'timestamp'>[]): Promise<any[] | null> {
    let allItems: any[] = [];
    let page = 1;
    const perPage = 100;

    try {
        while (true) {
            logs.push({ message: `Fetching page ${page} from ${endpoint}...`, type: 'info' });
            const { data, headers } = await api.get(endpoint, {
                per_page: perPage,
                page: page,
                status: 'any',
            });
            
            if (data && Array.isArray(data) && data.length > 0) {
                allItems = allItems.concat(data);
            } else if (data && (data as any).code === 'rest_post_invalid_page_number') {
                break; // WooCommerce sometimes sends this code for the last page
            } else if (!data || (Array.isArray(data) && data.length === 0)) {
                break; // No more items
            }
            
            const totalPages = headers && headers['x-wp-totalpages'];
            if (!totalPages || parseInt(totalPages, 10) <= page) {
                break;
            }
            page++;
        }
        return allItems;
    } catch (e: any) {
        logs.push({ message: `Error fetching from ${endpoint}: ${e.message}. Check URL and API keys.`, type: 'error' });
        return null; // Indicate failure
    }
}

// Helper to convert an array of objects to a CSV string
function toCsv(items: any[]): string {
    if (items.length === 0) return '';
    const headers = Object.keys(items[0]);
    const csvRows = [
        headers.join(','),
        ...items.map(item =>
            headers.map(header => {
                let value = item[header];
                if (value === null || value === undefined) {
                    return '';
                }
                if (typeof value === 'object') {
                    value = JSON.stringify(value);
                }
                const stringValue = String(value).replace(/"/g, '""');
                if (stringValue.includes(',')) {
                    return `"${stringValue}"`;
                }
                return stringValue;
            }).join(',')
        )
    ];
    return csvRows.join('\n');
}

export async function exportWooCommerceData(
    site: SiteFormData,
    dataTypes: { products: boolean, orders: boolean, reviews: boolean, coupons: boolean }
): Promise<ExportResult> {
    const logs: Omit<ExportLog, 'timestamp'>[] = [];
    const exportedData: ExportResult['data'] = {};

    const api = new WooCommerceRestApi({
      url: site.url,
      consumerKey: site.consumerKey,
      consumerSecret: site.consumerSecret,
      version: "wc/v3"
    });
    
    try {
        if (dataTypes.products) {
            logs.push({ message: 'Starting product export...', type: 'info' });
            const products = await fetchAllItems(api, 'products', logs);
            if (products) {
                exportedData.products = toCsv(products);
                logs.push({ message: `Successfully fetched ${products.length} products.`, type: 'success' });
            }
        }
        if (dataTypes.orders) {
            logs.push({ message: 'Starting order export...', type: 'info' });
            const orders = await fetchAllItems(api, 'orders', logs);
            if (orders) {
                exportedData.orders = toCsv(orders);
                logs.push({ message: `Successfully fetched ${orders.length} orders.`, type: 'success' });
            }
        }
        if (dataTypes.reviews) {
            logs.push({ message: 'Starting review export...', type: 'info' });
            const reviews = await fetchAllItems(api, 'products/reviews', logs);
            if (reviews) {
                exportedData.reviews = toCsv(reviews);
                logs.push({ message: `Successfully fetched ${reviews.length} reviews.`, type: 'success' });
            }
        }
        if (dataTypes.coupons) {
            logs.push({ message: 'Starting coupon export...', type: 'info' });
            const coupons = await fetchAllItems(api, 'coupons', logs);
            if (coupons) {
                exportedData.coupons = toCsv(coupons);
                logs.push({ message: `Successfully fetched ${coupons.length} coupons.`, type: 'success' });
            }
        }

        logs.push({ message: "Export process finished.", type: 'success' });
        
    } catch (error: any) {
        logs.push({ message: `A critical error occurred during the export process: ${error.message}`, type: 'error' });
    }
    
    return { logs, data: exportedData };
}
