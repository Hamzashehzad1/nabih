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

export interface SyncResult {
    logs: Omit<SyncLog, 'timestamp'>[];
    syncedItems: SyncedItem[];
    newLastSyncTime: string;
}

async function getNewItems(api: WooCommerceRestApi, endpoint: string, name: string, lastSyncTime: string) {
    try {
        const response = await api.get(endpoint, {
            after: lastSyncTime,
            per_page: 100,
            status: 'any', // Include all statuses for orders/reviews
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

export async function performSync(siteA: SiteFormData, siteB: SiteFormData, lastSyncTime: string): Promise<SyncResult> {
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
        // --- Sync from Site A to Site B ---
        logs.push({ message: `Checking Site A for new items... (since ${new Date(lastSyncTime).toLocaleString()})`, type: 'info' });
        
        // Products A -> B
        const newProductsA = await getNewItems(apiA, 'products', 'Product', lastSyncTime);
        for (const product of newProductsA) {
            await createItem(apiB, 'products', product, 'Product');
            syncedItems.push({ id: `prod_A_to_B_${product.id}`, type: 'Product', description: `Synced product "${product.name}" from A to B.`});
        }
        
        // Orders A -> B
        const newOrdersA = await getNewItems(apiA, 'orders', 'Order', lastSyncTime);
         for (const order of newOrdersA) {
            await createItem(apiB, 'orders', order, 'Order');
            syncedItems.push({ id: `order_A_to_B_${order.id}`, type: 'Order', description: `Synced order #${order.id} from A to B.`});
        }

        // Reviews A -> B
        const newReviewsA = await getNewItems(apiA, 'products/reviews', 'Review', lastSyncTime);
         for (const review of newReviewsA) {
            await createItem(apiB, 'products/reviews', review, 'Review');
            syncedItems.push({ id: `review_A_to_B_${review.id}`, type: 'Review', description: `Synced review by ${review.reviewer} from A to B.`});
        }
        
        // --- Sync from Site B to Site A ---
        logs.push({ message: "Checking Site B for new items...", type: 'info' });

        // Products B -> A
        const newProductsB = await getNewItems(apiB, 'products', 'Product', lastSyncTime);
        for (const product of newProductsB) {
            await createItem(apiA, 'products', product, 'Product');
            syncedItems.push({ id: `prod_B_to_A_${product.id}`, type: 'Product', description: `Synced product "${product.name}" from B to A.`});
        }
        
        // Orders B -> A
        const newOrdersB = await getNewItems(apiB, 'orders', 'Order', lastSyncTime);
        for (const order of newOrdersB) {
            await createItem(apiA, 'orders', order, 'Order');
            syncedItems.push({ id: `order_B_to_A_${order.id}`, type: 'Order', description: `Synced order #${order.id} from B to A.`});
        }
        
        // Reviews B -> A
        const newReviewsB = await getNewItems(apiB, 'products/reviews', 'Review', lastSyncTime);
         for (const review of newReviewsB) {
            await createItem(apiA, 'products/reviews', review, 'Review');
            syncedItems.push({ id: `review_B_to_A_${review.id}`, type: 'Review', description: `Synced review by ${review.reviewer} from B to A.`});
        }

    } catch (error: any) {
        logs.push({ message: error.message, type: 'error' });
        // Return current time on error to avoid re-syncing failed items repeatedly
        return { logs, syncedItems, newLastSyncTime: currentSyncTime };
    }
    
    return { logs, syncedItems, newLastSyncTime: currentSyncTime };
}