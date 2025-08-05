
// src/app/dashboard/woocommerce-sync/actions.ts
'use server';

import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { z } from 'zod';
import { isEqual } from 'lodash';

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

type AddLogFn = (message: string, type?: SyncLog['type']) => void;

interface DataTypeConfig {
    endpoint: string;
    idKey: string;
    compareKeys?: (keyof any)[]; // Optional now, as we'll do deep comparison
}

const dataTypesConfig: Record<string, DataTypeConfig> = {
    products: { endpoint: 'products', idKey: 'id' },
    orders: { endpoint: 'orders', idKey: 'id' },
    reviews: { endpoint: 'products/reviews', idKey: 'id' },
    coupons: { endpoint: 'coupons', idKey: 'id' },
};

// Helper to fetch all items of a certain type from a site
async function fetchAllItems(api: WooCommerceRestApi, endpoint: string, addLog: AddLogFn): Promise<any[]> {
    let allItems: any[] = [];
    let page = 1;
    const perPage = 100;
    addLog(`Fetching all items from endpoint: ${endpoint}`);

    try {
        while (true) {
            const { data } = await api.get(endpoint, { per_page: perPage, page: page, status: 'any' });
            
            if (!data || !Array.isArray(data) || data.length === 0) break;
            
            allItems = allItems.concat(data);
            if (data.length < perPage) break;
            page++;
        }
        addLog(`Successfully fetched ${allItems.length} items from ${endpoint}.`, 'success');
        return allItems;
    } catch (error: any) {
        addLog(`Error fetching from ${endpoint}: ${error.message}. Please check API keys and URL.`, 'error');
        throw error;
    }
}

// More robust sanitization
function sanitizeData(item: any): any {
    const readOnlyFields = [
        'id', 'date_created', 'date_created_gmt', 'date_modified', 
        'date_modified_gmt', 'permalink', 'guid', '_links'
    ];
    const sanitizedItem = { ...item };

    for (const key of readOnlyFields) {
        delete sanitizedItem[key];
    }
    
    // Remove the entire 'store' object if it exists (often on coupons)
    if (sanitizedItem.store) {
        delete sanitizedItem.store;
    }
    
    if (sanitizedItem.images) {
        sanitizedItem.images = sanitizedItem.images.map((img: any) => ({
            src: img.src,
            name: img.name,
            alt: img.alt,
            position: img.position
        }));
    }

    return sanitizedItem;
}


export async function performSync(
    sourceSite: SiteFormData,
    destinationSite: SiteFormData,
    dataTypesToSync: { [key: string]: boolean },
    addLog: AddLogFn
) {
    const sourceApi = new WooCommerceRestApi({ ...sourceSite, version: "wc/v3" });
    const destApi = new WooCommerceRestApi({ ...destinationSite, version: "wc/v3" });

    for (const type of Object.keys(dataTypesConfig)) {
        if (!dataTypesToSync[type]) continue;
        
        const config = dataTypesConfig[type];
        addLog(`--- Starting sync for ${type} ---`, 'info');

        try {
            const [sourceItems, destItems] = await Promise.all([
                fetchAllItems(sourceApi, config.endpoint, addLog),
                fetchAllItems(destApi, config.endpoint, addLog),
            ]);

            const sourceMap = new Map(sourceItems.map(item => [item[config.idKey], item]));
            const destMap = new Map(destItems.map(item => [item[config.idKey], item]));
            
            addLog(`Found ${sourceMap.size} source items and ${destMap.size} destination items for ${type}.`);

            // Process creations and updates
            for (const [id, sourceItem] of sourceMap.entries()) {
                const destItem = destMap.get(id);

                if (!destItem) {
                    // Item exists in source, but not in destination: CREATE
                    addLog(`Item #${id} found in source but not destination. Creating...`, 'info');
                    try {
                        const createData = sanitizeData(sourceItem);
                        await destApi.post(config.endpoint, createData);
                        addLog(`CREATED ${type} #${id} on destination.`, 'success');
                    } catch (e: any) {
                        addLog(`Failed to CREATE ${type} #${id}: ${e.response?.data?.message || e.message}`, 'error');
                    }
                } else {
                    // Item exists on both: check for UPDATE
                    const cleanSource = sanitizeData(sourceItem);
                    const cleanDest = sanitizeData(destItem);

                    // A simple but effective deep comparison for changes
                    if (!isEqual(cleanSource, cleanDest)) {
                         addLog(`Item #${id} differs. Updating...`, 'info');
                         try {
                            const updateData = sanitizeData(sourceItem);
                            await destApi.put(`${config.endpoint}/${id}`, updateData);
                            addLog(`UPDATED ${type} #${id} on destination.`, 'success');
                        } catch (e: any)
                         {
                            addLog(`Failed to UPDATE ${type} #${id}: ${e.response?.data?.message || e.message}`, 'error');
                        }
                    } else {
                        addLog(`Item #${id} is already in sync. Skipping.`, 'info');
                    }
                }
            }

            // Process deletions
            for (const [id] of destMap.entries()) {
                if (!sourceMap.has(id)) {
                    // Item exists in destination, but not in source: DELETE
                    addLog(`Item #${id} found in destination but not source. Deleting...`, 'warn');
                     try {
                        await destApi.delete(`${config.endpoint}/${id}`, { force: true });
                        addLog(`DELETED ${type} #${id} from destination.`, 'success');
                    } catch (e: any) {
                        addLog(`Failed to DELETE ${type} #${id}: ${e.response?.data?.message || e.message}`, 'error');
                    }
                }
            }

        } catch (error: any) {
            addLog(`Could not complete sync for ${type}: ${error.message}`, 'error');
        }
         addLog(`--- Finished sync for ${type} ---`, 'info');
    }
}
