// src/app/dashboard/invoice-generator/page.tsx
"use client";

import { useState, useRef, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileSpreadsheet, Download, Trash2, PlusCircle, Palette } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import InvoiceTemplate from './invoice-template';

const itemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.coerce.number().min(0, "Quantity must be positive"),
    price: z.coerce.number().min(0, "Price must be positive"),
});

const formSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  businessLogo: z.string().optional(),
  businessInfo: z.string().min(1, "Business info is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientInfo: z.string().min(1, "Client info is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.date(),
  dueDate: z.date(),
  items: z.array(itemSchema).min(1, "Please add at least one item"),
  tax: z.coerce.number().min(0).optional().default(0),
  discount: z.coerce.number().min(0).optional().default(0),
  notes: z.string().optional(),
  theme: z.enum(['light', 'dark', 'custom']).default('light'),
  customColor: z.string().optional().default('#A674F8'),
  currency: z.string().min(1, "Currency is required").default('USD'),
});

export type InvoiceFormData = z.infer<typeof formSchema>;

export default function InvoiceGeneratorPage() {
    const { toast } = useToast();
    const invoiceRef = useRef<HTMLDivElement>(null);

    const form = useForm<InvoiceFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            businessName: 'Content Forge Inc.',
            businessInfo: '123 AI Lane, Tech City, 12345',
            clientName: 'Big Corp',
            clientInfo: '456 Business Ave, Metro City, 67890',
            invoiceNumber: `INV-${new Date().getFullYear()}-001`,
            invoiceDate: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            items: [{ description: 'AI Content Strategy', quantity: 1, price: 1200 }],
            tax: 10,
            discount: 50,
            notes: 'Thank you for your business. Please pay within 30 days.',
            theme: 'light',
            customColor: '#A674F8',
            currency: 'USD',
        }
    });
    
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items"
    });

    const formData = form.watch();

    const handleDownloadPdf = async () => {
        const invoiceElement = invoiceRef.current;
        if (!invoiceElement) return;

        toast({ title: 'Generating PDF...', description: 'Please wait a moment.' });
        
        try {
            const canvas = await html2canvas(invoiceElement, {
                scale: 2, // Higher scale for better quality
                useCORS: true, 
                backgroundColor: null,
            });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`invoice-${formData.invoiceNumber}.pdf`);
            
            toast({ title: 'PDF Downloaded!', description: 'Your invoice has been successfully downloaded.' });

        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to generate PDF.', variant: 'destructive' });
        }
    };
    
    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                form.setValue('businessLogo', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-headline font-bold">Invoice Generator</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Create and customize professional invoices with ease. Fill out the form below and see a live preview.
                </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Invoice Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <details className="space-y-2 group">
                            <summary className="cursor-pointer font-medium text-lg">Business Info</summary>
                            <div className="space-y-2 pt-2 group-open:animate-in group-open:fade-in-0">
                                <Label>Business Name</Label>
                                <Input {...form.register('businessName')} />
                                <Label>Business Info</Label>
                                <Textarea {...form.register('businessInfo')} placeholder="Address, Phone, Email..."/>
                                <Label>Business Logo</Label>
                                <Input type="file" onChange={handleLogoUpload} accept="image/*" className="text-sm"/>
                            </div>
                        </details>
                        <details className="space-y-2 group" open>
                            <summary className="cursor-pointer font-medium text-lg">Client Info</summary>
                            <div className="space-y-2 pt-2 group-open:animate-in group-open:fade-in-0">
                                <Label>Client Name</Label>
                                <Input {...form.register('clientName')} />
                                <Label>Client Info</Label>
                                <Textarea {...form.register('clientInfo')} placeholder="Address, Phone, Email..."/>
                            </div>
                        </details>
                        
                         <details className="space-y-2 group" open>
                            <summary className="cursor-pointer font-medium text-lg">Invoice Metadata</summary>
                            <div className="space-y-2 pt-2 group-open:animate-in group-open:fade-in-0">
                                <Label>Invoice Number</Label>
                                <Input {...form.register('invoiceNumber')} />
                                <Controller name="invoiceDate" control={form.control} render={({field}) => (
                                    <div className="flex flex-col gap-2">
                                        <Label>Invoice Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn("justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                        </Popover>
                                    </div>
                                )} />
                               <Controller name="dueDate" control={form.control} render={({field}) => (
                                    <div className="flex flex-col gap-2">
                                        <Label>Due Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn("justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                        </Popover>
                                    </div>
                                )} />
                            </div>
                        </details>

                        <div>
                            <Label className="font-medium text-lg mb-2 block">Items</Label>
                            <div className="space-y-3">
                                {fields.map((item, index) => (
                                    <div key={item.id} className="grid grid-cols-[1fr_80px_100px_auto] gap-2 items-start">
                                        <Textarea placeholder="Item description" {...form.register(`items.${index}.description`)} rows={2} className="text-sm"/>
                                        <Input type="number" placeholder="Qty" {...form.register(`items.${index}.quantity`)} className="text-sm" />
                                        <Input type="number" placeholder="Price" {...form.register(`items.${index}.price`)} className="text-sm" />
                                        <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                             <Button variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, price: 0 })} className="mt-2">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                            </Button>
                        </div>
                        
                         <details className="space-y-2 group">
                            <summary className="cursor-pointer font-medium text-lg">Totals & Notes</summary>
                            <div className="space-y-2 pt-2 group-open:animate-in group-open:fade-in-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-1/2">
                                        <Label>Tax (%)</Label>
                                        <Input type="number" {...form.register('tax')} />
                                    </div>
                                    <div className="w-1/2">
                                        <Label>Discount ($)</Label>
                                        <Input type="number" {...form.register('discount')} />
                                    </div>
                                </div>
                                <Label>Notes / Payment Instructions</Label>
                                <Textarea {...form.register('notes')} />
                            </div>
                        </details>

                         <details className="space-y-2 group">
                            <summary className="cursor-pointer font-medium text-lg">Design</summary>
                            <div className="space-y-2 pt-2 group-open:animate-in group-open:fade-in-0">
                               <div className="flex items-center gap-4">
                                 <div className="w-1/2">
                                    <Label>Theme</Label>
                                    <Controller name="theme" control={form.control} render={({field}) => (
                                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="light">Light</SelectItem>
                                                <SelectItem value="dark">Dark</SelectItem>
                                                <SelectItem value="custom">Custom Color</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )} />
                                 </div>
                                 <div className="w-1/2">
                                    <Label>Currency</Label>
                                    <Controller name="currency" control={form.control} render={({field}) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="USD">$ USD</SelectItem>
                                                <SelectItem value="EUR">€ EUR</SelectItem>
                                                <SelectItem value="GBP">£ GBP</SelectItem>
                                                <SelectItem value="PKR">Rs PKR</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )} />
                                 </div>
                               </div>
                                {formData.theme === 'custom' && (
                                    <div>
                                        <Label>Custom Color</Label>
                                        <div className="flex items-center gap-2">
                                            <Input type="color" {...form.register('customColor')} className="w-12 h-10 p-1"/>
                                            <Input {...form.register('customColor')} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </details>
                    </CardContent>
                </Card>

                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Live Preview</CardTitle>
                                <CardDescription>Your generated invoice will appear here.</CardDescription>
                            </div>
                            <Button onClick={handleDownloadPdf}>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                            </Button>
                        </CardHeader>
                        <CardContent className="min-h-[800px] bg-muted/50 p-4">
                           <InvoiceTemplate ref={invoiceRef} {...formData} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
