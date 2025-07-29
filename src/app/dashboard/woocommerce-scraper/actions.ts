
// src/app/dashboard/woocommerce-scraper/actions.ts
'use server';

// This file is kept for the type definition, but the main logic is moved to the API route.

export interface ProductData {
    id: string;
    type: string;
    sku: string;
    name: string;
    published: number;
    isFeatured: string;
    visibility: string;
    shortDescription: string;
    description: string;
    salePrice: string;
    regularPrice: string;
    taxStatus: string;
    taxClass: string;
    inStock: number;
    stock: string;
    backorders: string;
    weight: string;
    length: string;
    width: string;
    height: string;
    allowCustomerReviews: number;
    purchaseNote: string;
    shippingClass: string;
    images: string; // Comma-separated list of image URLs/paths
    categories: string; // Comma-separated list
    tags: string; // Comma-separated list
    // for variable products
    attribute1Name?: string;
    attribute1Values?: string;
    attribute1Visible?: number;
    attribute1Global?: number;
}
