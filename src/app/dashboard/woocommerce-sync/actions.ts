
// src/app/dashboard/woocommerce-sync/actions.ts
'use server';

import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { z } from 'zod';
import { isEqual, omit, cloneDeep } from 'lodash';

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
}

const dataTypesConfig: Record<string, DataTypeConfig> = {
    products: { endpoint: 'products', idKey: 'id' },
    orders: { endpoint: 'orders', idKey: 'id' },
    reviews: { endpoint: 'products/reviews', idKey: 'id' },
    coupons: { endpoint: 'coupons', idKey: 'id' },
};

const READ_ONLY_FIELDS = [
    'id', 'date_created', 'date_created_gmt', 'date_modified', 
    'date_modified_gmt', 'permalink', 'guid', '_links', 'store_credit_balance'
];

function sanitizeForUpdate(item: any): any {
    let sanitizedItem = cloneDeep(item);
    
    // Remove top-level read-only fields
    READ_ONLY_FIELDS.forEach(field => {
        delete sanitizedItem[field];
    });

    // Remove meta_data with read-only keys
    if (sanitizedItem.meta_data && Array.isArray(sanitizedItem.meta_data)) {
        sanitizedItem.meta_data = sanitizedItem.meta_data.filter((meta: any) => {
             // Example of filtering a specific read-only meta key
            if (meta.key === '_wc_review_count') return false;
            return true;
        }).map((meta: any) => ({ key: meta.key, value: meta.value })); // Ensure only key/value is sent
    }
    
    // For products, ensure images are just `src` or `id`
    if (sanitizedItem.images && Array.isArray(sanitizedItem.images)) {
        sanitizedItem.images = sanitizedItem.images.map((img: any) => {
            // If the image already exists on the destination site (has an id), just send the id.
            // Otherwise, send the src to create a new one. This logic may need refinement
            // based on whether you're syncing images by URL or assuming they exist.
            return img.id ? { id: img.id } : { src: img.src };
        });
    }

    // Orders specific sanitization
    if(sanitizedItem.line_items) {
        sanitizedItem.line_items = sanitizedItem.line_items.map((line: any) => {
            const cleanLine = { ...line };
            delete cleanLine.id; // line_item ID is read-only
            return cleanLine;
        });
    }


    return sanitizedItem;
}

// For creation, we can use the same aggressive sanitization as update
const sanitizeForCreation = sanitizeForUpdate;


async function fetchAllItems(api: WooCommerceRestApi, endpoint: string): Promise<any[]> {
    let allItems: any[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
        try {
            const { data } = await api.get(endpoint, { per_page: perPage, page: page, status: 'any' });
            if (!data || !Array.isArray(data) || data.length === 0) break;
            allItems = allItems.concat(data);
            if (data.length < perPage) break;
            page++;
        } catch (error: any) {
            console.error(`Error fetching from ${endpoint} (Page ${page}):`, error.response?.data || error.message);
            throw new Error(`Failed to fetch from ${endpoint}. Check URL and API keys.`);
        }
    }
    return allItems;
}


export async function performSync(
    sourceSite: SiteFormData,
    destinationSite: SiteFormData,
    dataTypesToSync: { [key: string]: boolean }
): Promise<SyncLog[]> {
    const logs: SyncLog[] = [];
    
    const sourceApi = new WooCommerceRestApi({ ...sourceSite, version: "wc/v3", axiosConfig: { validateStatus: () => true } });
    const destApi = new WooCommerceRestApi({ ...destinationSite, version: "wc/v3", axiosConfig: { validateStatus: () => true } });

    for (const type of Object.keys(dataTypesConfig)) {
        if (!dataTypesToSync[type]) continue;
        
        const config = dataTypesConfig[type];
        logs.push({ timestamp: new Date().toISOString(), message: `--- Starting sync for ${type} ---`, type: 'info' });

        try {
            const [sourceItems, destItems] = await Promise.all([
                fetchAllItems(sourceApi, config.endpoint),
                fetchAllItems(destApi, config.endpoint),
            ]);

            const sourceMap = new Map(sourceItems.map(item => [item[config.idKey], item]));
            const destMap = new Map(destItems.map(item => [item[config.idKey], item]));
            
            logs.push({ timestamp: new Date().toISOString(), message: `Found ${sourceMap.size} source items and ${destMap.size} destination items for ${type}.`, type: 'info'});

            // Process creations and updates
            for (const [id, sourceItem] of sourceMap.entries()) {
                const destItem = destMap.get(id);

                if (!destItem) {
                    logs.push({ timestamp: new Date().toISOString(), message: `Item #${id} not in destination. Creating...`, type: 'info' });
                    try {
                        const cleanSource = sanitizeForCreation(sourceItem);
                        await destApi.post(config.endpoint, cleanSource);
                        logs.push({ timestamp: new Date().toISOString(), message: `CREATED ${type} #${id} on destination.`, type: 'success' });
                    } catch (e: any) {
                        logs.push({ timestamp: new Date().toISOString(), message: `Failed to CREATE ${type} #${id}: ${e.response?.data?.message || e.message}`, type: 'error' });
                    }
                } else {
                    const cleanSource = sanitizeForUpdate(sourceItem);
                    const cleanDest = sanitizeForUpdate(destItem);

                    if (!isEqual(cleanSource, cleanDest)) {
                         logs.push({ timestamp: new Date().toISOString(), message: `Item #${id} differs. Updating...`, type: 'info' });
                         try {
                            await destApi.put(`${config.endpoint}/${id}`, cleanSource);
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
                    logs.push({ timestamp: new Date().toISOString(), message: `Item #${id} in destination but not source. Deleting...`, type: 'warn' });
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
