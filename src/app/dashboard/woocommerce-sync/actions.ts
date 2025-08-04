
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

export interface SyncLog {
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warn';
}

type AddLogFn = (message: string, type?: SyncLog['type']) => void;

interface DataTypeConfig {
    endpoint: string;
    idKey: string;
    compareKeys: (keyof any)[];
}

const dataTypesConfig: Record<string, DataTypeConfig> = {
    products: { endpoint: 'products', idKey: 'id', compareKeys: ['name', 'price', 'stock_quantity'] },
    orders: { endpoint: 'orders', idKey: 'id', compareKeys: ['status', 'total'] },
    reviews: { endpoint: 'products/reviews', idKey: 'id', compareKeys: ['review', 'rating'] },
    coupons: { endpoint: 'coupons', idKey: 'id', compareKeys: ['code', 'amount', 'usage_limit'] },
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
            
            if (!data || data.length === 0) break;
            
            allItems = allItems.concat(data);
            page++;
        }
        addLog(`Successfully fetched ${allItems.length} items from ${endpoint}.`, 'success');
        return allItems;
    } catch (error: any) {
        addLog(`Error fetching from ${endpoint}: ${error.message}. Please check API keys and URL.`, 'error');
        throw error;
    }
}

// Helper to sanitize data for creation (remove read-only fields)
function sanitizeForCreation(item: any, type: string): any {
    const readOnlyFields = ['id', 'date_created', 'date_modified', 'permalink', 'date_created_gmt', 'date_modified_gmt', '_links'];
    const sanitizedItem = { ...item };
    for (const key of readOnlyFields) {
        delete sanitizedItem[key];
    }
    // Specific sanitizations
    if (type === 'products') {
        delete sanitizedItem.variations;
        delete sanitizedItem.related_ids;
    }
    if (type === 'orders') {
        // Orders are particularly tricky, often better to not create them this way
        // But if needed, many fields must be removed or handled differently.
        delete sanitizedItem.customer_id;
        delete sanitizedItem.date_paid;
        delete sanitizedItem.number;
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

            // Items to create on destination
            for (const [id, item] of sourceMap.entries()) {
                if (!destMap.has(id)) {
                    try {
                        const createData = sanitizeForCreation(item, type);
                        await destApi.post(config.endpoint, createData);
                        addLog(`CREATED ${type} #${id} on destination.`, 'success');
                    } catch (e: any) {
                        addLog(`Failed to CREATE ${type} #${id}: ${e.message}`, 'error');
                    }
                } else {
                    // Item exists, check if it needs update (simple comparison)
                    const destItem = destMap.get(id);
                    let needsUpdate = false;
                    for (const key of config.compareKeys) {
                        if(item[key] !== destItem[key]) {
                            needsUpdate = true;
                            break;
                        }
                    }
                    if (needsUpdate) {
                         try {
                            const updateData = sanitizeForCreation(item, type);
                            await destApi.put(`${config.endpoint}/${id}`, updateData);
                            addLog(`UPDATED ${type} #${id} on destination.`, 'success');
                        } catch (e: any) {
                            addLog(`Failed to UPDATE ${type} #${id}: ${e.message}`, 'error');
                        }
                    }
                }
            }

            // Items to delete from destination
            for (const [id, item] of destMap.entries()) {
                if (!sourceMap.has(id)) {
                     try {
                        await destApi.delete(`${config.endpoint}/${id}`, { force: true });
                        addLog(`DELETED ${type} #${id} from destination.`, 'warn');
                    } catch (e: any) {
                        addLog(`Failed to DELETE ${type} #${id}: ${e.message}`, 'error');
                    }
                }
            }

        } catch (error: any) {
            addLog(`Could not complete sync for ${type}: ${error.message}`, 'error');
        }
         addLog(`--- Finished sync for ${type} ---`, 'info');
    }
}
