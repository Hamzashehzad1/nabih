// src/app/dashboard/invoice-generator/actions.ts
'use server';

import { z } from 'zod';

const FormSchema = z.object({
    businessName: z.string(),
    businessLogo: z.any().optional(),
    businessInfo: z.string(),
    clientName: z.string(),
    clientInfo: z.string(),
    invoiceNumber: z.string(),
    invoiceDate: z.string(),
    dueDate: z.string(),
    items: z.array(z.object({
        description: z.string(),
        quantity: z.number(),
        price: z.number()
    })),
    tax: z.number().optional(),
    discount: z.number().optional(),
    notes: z.string().optional(),
    theme: z.enum(['light', 'dark', 'custom']),
    customColor: z.string().optional(),
    currency: z.string()
});

export type InvoiceFormState = z.infer<typeof FormSchema>;

// This is a placeholder for any server-side actions you might want in the future,
// such as saving an invoice to a database.
export async function saveInvoice(invoiceData: InvoiceFormState) {
    // Here you would typically save the validated data to your database
    console.log("Saving invoice data:", invoiceData);
    
    // For now, we'll just simulate a successful save
    return { success: true, message: "Invoice saved successfully!" };
}
