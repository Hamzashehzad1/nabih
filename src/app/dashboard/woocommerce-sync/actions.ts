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
    type: 'info' | 'success' | 'error';
}

export interface SyncedItem {
    id: string;
    type: 'Order' | 'Product' | 'Review';
    description: string;
}

interface SyncResult {
    logs: Omit<SyncLog, 'timestamp'>[];
    syncedItems: SyncedItem[];
}

let lastSyncTime = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // Set initial sync to 5 minutes ago

async function getNewItems(api: WooCommerceRestApi, endpoint: string, name: string) {
    try {
        const response = await api.get(endpoint, {
            after: lastSyncTime,
            per_page: 100,
        });
        if (response.status !== 200) {
            throw new Error(`Failed to fetch ${name}s: ${response.statusText}`);
        }
        return response.data;
    } catch (error: any) {
        throw new Error(`Error fetching ${name}s: ${error.message}`);
    }
}

async function createItem(api: WooCommerceRestApi, endpoint: string, data: any, name: string) {
     try {
        // Basic transformation to avoid sending read-only fields
        const createData = { ...data };
        delete createData.id;
        delete createData.date_created;
        delete createData.date_modified;
        delete createData.total; // for orders
        
        const response = await api.post(endpoint, createData);
        if (response.status !== 201) {
             const errorData = response.data.message || `Status code ${response.status}`;
            throw new Error(`Failed to create ${name}: ${errorData}`);
        }
        return response.data;
    } catch (error: any) {
        throw new Error(`Error creating ${name}: ${error.message}`);
    }
}

export async function performSync(siteA: SiteFormData, siteB: SiteFormData): Promise<SyncResult> {
    const logs: Omit<SyncLog, 'timestamp'>[] = [];
    const syncedItems: SyncedItem[] = [];

    const apiA = new WooCommerceRestApi({
        url: siteA.url,
        consumerKey: siteA.consumerKey,
        consumerSecret: siteA.consumerSecret,
        version: "wc/v3"
    });
    const apiB = new WooCommerceRestApi({
        url: siteB.url,
        consumerKey: siteB.consumerKey,
        consumerSecret: siteB.consumerSecret,
        version: "wc/v3"
    });
    
    const currentSyncTime = new Date().toISOString();

    try {
        // Sync from A to B
        logs.push({ message: "Checking Site A for new items...", type: 'info' });
        const newProductsA = await getNewItems(apiA, 'products', 'Product');
        for (const product of newProductsA) {
            await createItem(apiB, 'products', product, 'Product');
            syncedItems.push({ id: `prod_A_${product.id}`, type: 'Product', description: `Synced product "${product.name}" from A to B.`});
        }
        
        const newOrdersA = await getNewItems(apiA, 'orders', 'Order');
         for (const order of newOrdersA) {
            await createItem(apiB, 'orders', order, 'Order');
            syncedItems.push({ id: `order_A_${order.id}`, type: 'Order', description: `Synced order #${order.id} from A to B.`});
        }
        
        // Sync from B to A
        logs.push({ message: "Checking Site B for new items...", type: 'info' });
        const newProductsB = await getNewItems(apiB, 'products', 'Product');
        for (const product of newProductsB) {
            await createItem(apiA, 'products', product, 'Product');
            syncedItems.push({ id: `prod_B_${product.id}`, type: 'Product', description: `Synced product "${product.name}" from B to A.`});
        }
        
        const newOrdersB = await getNewItems(apiB, 'orders', 'Order');
        for (const order of newOrdersB) {
            await createItem(apiA, 'orders', order, 'Order');
            syncedItems.push({ id: `order_B_${order.id}`, type: 'Order', description: `Synced order #${order.id} from B to A.`});
        }

    } catch (error: any) {
        logs.push({ message: error.message, type: 'error' });
    }
    
    lastSyncTime = currentSyncTime;
    return { logs, syncedItems };
}
