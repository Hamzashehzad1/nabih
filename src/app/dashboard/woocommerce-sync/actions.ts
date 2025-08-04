// src/app/dashboard/woocommerce-sync/actions.ts
'use server';

import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { z } from 'zod';

const siteSchema = z.object({
    url: z.string().url(),
    consumerKey: z.string(),
    consumerSecret: z.string(),
});
type SiteFormData = z.infer<typeof siteSchema>;

export interface SyncLog {
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'delete' | 'create' | 'update';
}

export interface SyncedItem {
    id: string;
    type: 'Order' | 'Product' | 'Review';
    action: 'Created' | 'Updated' | 'Deleted';
    description: string;
}

export interface SyncResult {
    logs: Omit<SyncLog, 'timestamp'>[];
    syncedItems: SyncedItem[];
}

// Helper to fetch all items of a certain type from a site
async function fetchAllItems(api: WooCommerceRestApi, endpoint: string, siteName: string, logs: Omit<SyncLog, 'timestamp'>[]): Promise<any[] | null> {
    let allItems: any[] = [];
    let page = 1;
    const perPage = 100;

    try {
        while (true) {
            const { data, headers } = await api.get(endpoint, {
                per_page: perPage,
                page: page,
                status: 'any',
            });
            
            if (data && Array.isArray(data) && data.length > 0) {
                allItems = allItems.concat(data);
            } else if (data && (data as any).code === 'rest_post_invalid_page_number') {
                break;
            } else if (!data || data.length === 0) {
                break;
            }
            
            const totalPages = headers['x-wp-totalpages'];
            if (!totalPages || parseInt(totalPages, 10) <= page) {
                break;
            }
            page++;
        }
        return allItems;
    } catch (e: any) {
        logs.push({ message: `Error fetching from ${siteName} (${endpoint}): ${e.message}. Check URL and API keys.`, type: 'error' });
        return null; // Return null to indicate failure
    }
}


// Helper to sanitize data for creation/update
function sanitizeData(item: any) {
    const createData = { ...item };
    const fieldsToRemove = [
      'id', 'date_created', 'date_created_gmt', 'date_modified', 
      'date_modified_gmt', 'permalink', '_links', 'guid',
      // Product specific read-only fields
      'average_rating', 'rating_count', 'related_ids', 'upsell_ids',
      'cross_sell_ids', 'parent_id', 'purchase_count', 'variations',
      // Order specific read-only fields
      'number', 'order_key', 'currency_symbol', 'date_paid', 'date_paid_gmt',
      'date_completed', 'date_completed_gmt', 'cart_hash', 'prices_include_tax'
    ];
    fieldsToRemove.forEach(field => delete createData[field]);
    return createData;
}


// Main sync logic for a given data type (products, orders, reviews)
async function syncDataType(
    apiA: WooCommerceRestApi,
    apiB: WooCommerceRestApi,
    endpoint: string,
    dataType: 'Product' | 'Order' | 'Review',
    logs: Omit<SyncLog, 'timestamp'>[],
    syncedItems: SyncedItem[]
) {
    logs.push({ message: `Fetching all ${dataType}s from both sites...`, type: 'info' });
    
    const [itemsA, itemsB] = await Promise.all([
        fetchAllItems(apiA, endpoint, 'Site A', logs),
        fetchAllItems(apiB, endpoint, 'Site B', logs)
    ]);

    // If fetching from either site fails, we can't proceed with this data type.
    if (itemsA === null || itemsB === null) {
        logs.push({ message: `Aborting sync for ${dataType}s due to fetch error.`, type: 'error' });
        return;
    }

    const mapA = new Map(itemsA.map(item => [item.id.toString(), item]));
    const mapB = new Map(itemsB.map(item => [item.id.toString(), item]));
    const nameField = dataType === 'Product' ? 'name' : 'id';


    // Create/Update items from A to B
    for (const itemA of itemsA) {
        const idA = itemA.id.toString();
        const itemB = mapB.get(idA);
        const cleanData = sanitizeData(itemA);

        if (itemB) { // Item exists on B, check for update
            if (new Date(itemA.date_modified_gmt) > new Date(itemB.date_modified_gmt)) {
                try {
                    await apiB.put(`${endpoint}/${itemA.id}`, cleanData);
                    logs.push({ message: `Updated ${dataType} #${itemA[nameField]} on Site B.`, type: 'update' });
                    syncedItems.push({ id: `${dataType}_update_${itemA.id}`, type: dataType, action: 'Updated', description: `${dataType} #${itemA[nameField]}`});
                } catch(e: any) {
                    logs.push({ message: `Failed to update ${dataType} #${itemA[nameField]}: ${e.message}`, type: 'error' });
                }
            }
        } else { // Item doesn't exist on B, create it
            try {
                await apiB.post(endpoint, cleanData);
                logs.push({ message: `Created ${dataType} #${itemA[nameField]} on Site B.`, type: 'create' });
                syncedItems.push({ id: `${dataType}_create_${itemA.id}`, type: dataType, action: 'Created', description: `${dataType} #${itemA[nameField]}`});
            } catch(e: any) {
                logs.push({ message: `Failed to create ${dataType} #${itemA[nameField]}: ${e.message}`, type: 'error' });
            }
        }
    }

    // Delete items on B that are not on A
    for (const itemB of itemsB) {
        if (!mapA.has(itemB.id.toString())) {
            try {
                await apiB.delete(`${endpoint}/${itemB.id}`, { force: true });
                logs.push({ message: `Deleted ${dataType} #${itemB[nameField]} from Site B.`, type: 'delete' });
                syncedItems.push({ id: `${dataType}_delete_${itemB.id}`, type: dataType, action: 'Deleted', description: `${dataType} #${itemB[nameField]}`});
            } catch (e: any) {
                logs.push({ message: `Failed to delete ${dataType} #${itemB[nameField]} from Site B: ${e.message}`, type: 'error' });
            }
        }
    }
}


export async function performSync(siteA: SiteFormData, siteB: SiteFormData): Promise<SyncResult> {
    const logs: Omit<SyncLog, 'timestamp'>[] = [];
    const syncedItems: SyncedItem[] = [];

    const apiConfig = {
      version: "wc/v3",
      axiosConfig: {
        validateStatus: function (status: number) {
          return status >= 200 && status < 500;
        },
      },
    };

    const apiA = new WooCommerceRestApi({ url: siteA.url, consumerKey: siteA.consumerKey, consumerSecret: siteA.consumerSecret, ...apiConfig });
    const apiB = new WooCommerceRestApi({ url: siteB.url, consumerKey: siteB.consumerKey, consumerSecret: siteB.consumerSecret, ...apiConfig });
    
    try {
        await syncDataType(apiA, apiB, 'products', 'Product', logs, syncedItems);
        await syncDataType(apiA, apiB, 'orders', 'Order', logs, syncedItems);
        await syncDataType(apiA, apiB, 'products/reviews', 'Review', logs, syncedItems);
        
        logs.push({ message: "Mirror sync complete.", type: 'success' });
        
    } catch (error: any) {
        logs.push({ message: `A critical error occurred during the sync process: ${error.message}`, type: 'error' });
    }
    
    return { logs, syncedItems };
}