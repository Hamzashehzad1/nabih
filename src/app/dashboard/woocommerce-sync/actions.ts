
// src/app/dashboard/woocommerce-sync/actions.ts
'use server';

import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { z } from 'zod';
import { isEqual, omit } from 'lodash';

const siteSchema = z.object({
    url: z.string().url(),
    consumerKey: z.string(),
    consumerSecret: z.string(),
});
export type SiteFormData = z.infer<typeof siteSchema>;

export interface SyncLog {
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warn';
}

interface DataTypeConfig {
    endpoint: string;
    idKey: string;
    compareKeys?: (keyof any)[];
}

const dataTypesConfig: Record<string, DataTypeConfig> = {
    products: { endpoint: 'products', idKey: 'id' },
    orders: { endpoint: 'orders', idKey: 'id' },
    reviews: { endpoint: 'products/reviews', idKey: 'id' },
    coupons: { endpoint: 'coupons', idKey: 'id' },
};

function sanitizeForCreation(item: any): any {
    const readOnlyFields = [
        'id', 'date_created', 'date_created_gmt', 'date_modified', 
        'date_modified_gmt', 'permalink', 'guid', '_links'
    ];
    return omit(item, readOnlyFields);
}

function sanitizeForUpdate(item: any): any {
    const readOnlyFields = [
       'date_created', 'date_created_gmt', 'date_modified', 
       'date_modified_gmt', 'permalink', 'guid', '_links'
    ];
     return omit(item, readOnlyFields);
}

// Helper to fetch all items of a certain type from a site
async function fetchAllItems(api: WooCommerceRestApi, endpoint: string, logs: SyncLog[]): Promise<any[]> {
    let allItems: any[] = [];
    let page = 1;
    const perPage = 100;
    logs.push({ timestamp: new Date().toISOString(), message: `Fetching all items from endpoint: ${endpoint}`, type: 'info' });

    try {
        while (true) {
            const { data } = await api.get(endpoint, { per_page: perPage, page: page, status: 'any' });
            
            if (!data || !Array.isArray(data) || data.length === 0) break;
            
            allItems = allItems.concat(data);
            if (data.length < perPage) break;
            page++;
        }
        logs.push({ timestamp: new Date().toISOString(), message: `Successfully fetched ${allItems.length} items from ${endpoint}.`, type: 'success' });
        return allItems;
    } catch (error: any) {
        const errorMessage = `Error fetching from ${endpoint}: ${error.message}. Please check API keys and URL.`;
        logs.push({ timestamp: new Date().toISOString(), message: errorMessage, type: 'error' });
        throw new Error(errorMessage);
    }
}


export async function performSync(
    sourceSite: SiteFormData,
    destinationSite: SiteFormData,
    dataTypesToSync: { [key: string]: boolean }
): Promise<SyncLog[]> {
    const logs: SyncLog[] = [];
    const sourceApi = new WooCommerceRestApi({ ...sourceSite, version: "wc/v3" });
    const destApi = new WooCommerceRestApi({ ...destinationSite, version: "wc/v3" });

    for (const type of Object.keys(dataTypesConfig)) {
        if (!dataTypesToSync[type]) continue;
        
        const config = dataTypesConfig[type];
        logs.push({ timestamp: new Date().toISOString(), message: `--- Starting sync for ${type} ---`, type: 'info' });

        try {
            const [sourceItems, destItems] = await Promise.all([
                fetchAllItems(sourceApi, config.endpoint, logs),
                fetchAllItems(destApi, config.endpoint, logs),
            ]);

            const sourceMap = new Map(sourceItems.map(item => [item.id, item]));
            const destMap = new Map(destItems.map(item => [item.id, item]));
            
            logs.push({ timestamp: new Date().toISOString(), message: `Found ${sourceMap.size} source items and ${destMap.size} destination items for ${type}.`, type: 'info'});

            // Process creations and updates
            for (const [id, sourceItem] of sourceMap.entries()) {
                const destItem = destMap.get(id);
                const cleanSourceForCreation = sanitizeForCreation(sourceItem);
                const cleanSourceForUpdate = sanitizeForUpdate(sourceItem);

                if (!destItem) {
                    logs.push({ timestamp: new Date().toISOString(), message: `Item #${id} found in source but not destination. Creating...`, type: 'info' });
                    try {
                        await destApi.post(config.endpoint, cleanSourceForCreation);
                        logs.push({ timestamp: new Date().toISOString(), message: `CREATED ${type} #${id} on destination.`, type: 'success' });
                    } catch (e: any) {
                        logs.push({ timestamp: new Date().toISOString(), message: `Failed to CREATE ${type} #${id}: ${e.response?.data?.message || e.message}`, type: 'error' });
                    }
                } else {
                    const cleanDest = sanitizeForUpdate(destItem);
                     if (!isEqual(cleanSourceForUpdate, cleanDest)) {
                         logs.push({ timestamp: new Date().toISOString(), message: `Item #${id} differs. Updating...`, type: 'info' });
                         try {
                            await destApi.put(`${config.endpoint}/${id}`, cleanSourceForUpdate);
                            logs.push({ timestamp: new Date().toISOString(), message: `UPDATED ${type} #${id} on destination.`, type: 'success' });
                        } catch (e: any) {
                            logs.push({ timestamp: new Date().toISOString(), message: `Failed to UPDATE ${type} #${id}: ${e.response?.data?.message || e.message}`, type: 'error' });
                        }
                    } else {
                        logs.push({ timestamp: new Date().toISOString(), message: `Item #${id} is already in sync. Skipping.`, type: 'info' });
                    }
                }
            }

            // Process deletions
            for (const [id] of destMap.entries()) {
                if (!sourceMap.has(id)) {
                    logs.push({ timestamp: new Date().toISOString(), message: `Item #${id} found in destination but not source. Deleting...`, type: 'warn' });
                     try {
                        await destApi.delete(`${config.endpoint}/${id}`, { force: true });
                        logs.push({ timestamp: new Date().toISOString(), message: `DELETED ${type} #${id} from destination.`, type: 'success' });
                    } catch (e: any) {
                        logs.push({ timestamp: new Date().toISOString(), message: `Failed to DELETE ${type} #${id}: ${e.response?.data?.message || e.message}`, type: 'error' });
                    }
                }
            }

        } catch (error: any) {
            logs.push({ timestamp: new Date().toISOString(), message: `Could not complete sync for ${type}: ${error.message}`, type: 'error' });
        }
         logs.push({ timestamp: new Date().toISOString(), message: `--- Finished sync for ${type} ---`, type: 'info' });
    }
    return logs;
}
