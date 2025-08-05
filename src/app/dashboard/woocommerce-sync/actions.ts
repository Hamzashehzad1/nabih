
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

const READ_ONLY_FIELDS_FOR_UPDATE = [
    'id', 'date_created', 'date_created_gmt', 'date_modified', 
    'date_modified_gmt', 'permalink', 'guid', '_links',
    'number', // read-only for orders
    'order_key' // read-only for orders
];

const READ_ONLY_FIELDS_FOR_COMPARISON = [
    'date_modified', 'date_modified_gmt', '_links'
];


function sanitizeForUpdate(item: any): any {
    let sanitizedItem = cloneDeep(item);
    
    READ_ONLY_FIELDS_FOR_UPDATE.forEach(field => {
        delete sanitizedItem[field];
    });

    if (sanitizedItem.meta_data && Array.isArray(sanitizedItem.meta_data)) {
        sanitizedItem.meta_data = sanitizedItem.meta_data.map((meta: any) => ({ key: meta.key, value: meta.value })); 
    }
    
    if (sanitizedItem.images && Array.isArray(sanitizedItem.images)) {
        sanitizedItem.images = sanitizedItem.images.map((img: any) => (img.id ? { id: img.id } : { src: img.src }));
    }

    if(sanitizedItem.line_items) {
        sanitizedItem.line_items = sanitizedItem.line_items.map((line: any) => {
            const cleanLine = { ...line };
            delete cleanLine.id;
            delete cleanLine.subtotal_tax;
            delete cleanLine.total_tax;
            delete cleanLine.taxes;
            return cleanLine;
        });
    }

    return sanitizedItem;
}

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
            throw new Error(`Failed to fetch from ${endpoint}: ${error.message || 'Unknown error'}`);
        }
    }
    return allItems;
}

async function createItem(api: WooCommerceRestApi, endpoint: string, item: any): Promise<{ success: true, data: any } | { success: false, error: string }> {
    try {
        const createPayload = sanitizeForCreation(item);
        const response = await api.post(endpoint, createPayload);
        if (response.status >= 400) {
            const errorData = response.data.message || JSON.stringify(response.data);
            throw new Error(errorData);
        }
        return { success: true, data: response.data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
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
                    const createResult = await createItem(destApi, config.endpoint, sourceItem);
                    if (createResult.success) {
                        logs.push({ timestamp: new Date().toISOString(), message: `CREATED ${type} #${id} on destination.`, type: 'success' });
                    } else {
                        logs.push({ timestamp: new Date().toISOString(), message: `Failed to CREATE ${type} #${id}: ${createResult.error}`, type: 'error' });
                    }
                } else {
                    const comparableSource = omit(sourceItem, READ_ONLY_FIELDS_FOR_COMPARISON);
                    const comparableDest = omit(destItem, READ_ONLY_FIELDS_FOR_COMPARISON);

                    if (!isEqual(comparableSource, comparableDest)) {
                         logs.push({ timestamp: new Date().toISOString(), message: `Item #${id} differs. Updating...`, type: 'info' });
                         try {
                            const updatePayload = sanitizeForUpdate(sourceItem);
                            const response = await destApi.put(`${config.endpoint}/${id}`, updatePayload);
                             if (response.status >= 400) throw new Error(JSON.stringify(response.data));
                            logs.push({ timestamp: new Date().toISOString(), message: `UPDATED ${type} #${id} on destination.`, type: 'success' });
                        } catch (e: any) {
                            logs.push({ timestamp: new Date().toISOString(), message: `Failed to UPDATE ${type} #${id}: ${e.message}`, type: 'error' });
                        }
                    }
                }
            }

            // Process deletions
            for (const [id] of destMap.entries()) {
                if (!sourceMap.has(id)) {
                    logs.push({ timestamp: new Date().toISOString(), message: `Item #${id} in destination but not source. Deleting...`, type: 'warn' });
                     try {
                        const response = await destApi.delete(`${config.endpoint}/${id}`, { force: true });
                         if (response.status >= 400) throw new Error(JSON.stringify(response.data));
                        logs.push({ timestamp: new Date().toISOString(), message: `DELETED ${type} #${id} from destination.`, type: 'success' });
                    } catch (e: any)
                     {
                        logs.push({ timestamp: new Date().toISOString(), message: `Failed to DELETE ${type} #${id}: ${e.message}`, type: 'error' });
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

    