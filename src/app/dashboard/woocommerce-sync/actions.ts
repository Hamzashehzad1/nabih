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
async function fetchAllItems(api: WooCommerceRestApi, endpoint: string) {
    let allItems: any[] = [];
    let page = 1;
    const perPage = 100;
    while (true) {
        const { data, headers } = await api.get(endpoint, {
            per_page: perPage,
            page: page,
            status: 'any',
        });
        if (data && data.length > 0) {
            allItems = allItems.concat(data);
        }
        const totalPages = headers['x-wp-totalpages'];
        if (parseInt(totalPages, 10) <= page) {
            break;
        }
        page++;
    }
    return allItems;
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
        fetchAllItems(apiA, endpoint),
        fetchAllItems(apiB, endpoint)
    ]);

    const mapA = new Map(itemsA.map(item => [item.id.toString(), item]));
    const mapB = new Map(itemsB.map(item => [item.id.toString(), item]));
    const nameField = dataType === 'Product' ? 'name' : 'id';


    // Create/Update items from A to B
    for (const itemA of itemsA) {
        const idA = itemA.id.toString();
        const itemB = mapB.get(idA);

        // Sanitize data for creation/update
        const createData = { ...itemA };
        const fieldsToRemove = ['id', 'date_created', 'date_created_gmt', 'date_modified', 'date_modified_gmt', 'permalink', '_links'];
        fieldsToRemove.forEach(field => delete createData[field]);

        if (itemB) { // Item exists on B, check for update
            if (new Date(itemA.date_modified_gmt) > new Date(itemB.date_modified_gmt)) {
                try {
                    await apiB.put(`${endpoint}/${itemA.id}`, createData);
                    logs.push({ message: `Updated ${dataType} #${itemA[nameField]} on Site B.`, type: 'update' });
                    syncedItems.push({ id: `${dataType}_update_${itemA.id}`, type: dataType, action: 'Updated', description: `${dataType} #${itemA[nameField]}`});
                } catch(e: any) {
                    logs.push({ message: `Failed to update ${dataType} #${itemA[nameField]}: ${e.message}`, type: 'error' });
                }
            }
        } else { // Item doesn't exist on B, create it
            try {
                await apiB.post(endpoint, createData);
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

    const apiA = new WooCommerceRestApi({ url: siteA.url, consumerKey: siteA.consumerKey, consumerSecret: siteA.consumerSecret, version: "wc/v3" });
    const apiB = new WooCommerceRestApi({ url: siteB.url, consumerKey: siteB.consumerKey, consumerSecret: siteB.consumerSecret, version: "wc/v3" });
    
    try {
        await syncDataType(apiA, apiB, 'products', 'Product', logs, syncedItems);
        await syncDataType(apiA, apiB, 'orders', 'Order', logs, syncedItems);
        await syncDataType(apiA, apiB, 'products/reviews', 'Review', logs, syncedItems);
        
        logs.push({ message: "Mirror sync complete.", type: 'success' });
        
    } catch (error: any) {
        logs.push({ message: `A critical error occurred: ${error.message}`, type: 'error' });
    }
    
    return { logs, syncedItems };
}
