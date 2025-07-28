// src/app/dashboard/invoice-generator/invoice-template.tsx
import React, { forwardRef } from 'react';
import { InvoiceFormData } from './page';
import { format } from 'date-fns';

interface InvoiceTemplateProps extends InvoiceFormData {
    // any additional props needed for the template can go here
}

const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>((props, ref) => {
    const { 
        businessName, businessLogo, businessInfo, clientName, clientInfo, 
        invoiceNumber, invoiceDate, dueDate, items, tax = 0, discount = 0, 
        notes, theme, customColor, currency 
    } = props;

    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const taxAmount = (subtotal * tax) / 100;
    const total = subtotal + taxAmount - discount;
    
    const themeStyles = {
        light: {
            bg: 'bg-white',
            text: 'text-gray-800',
            border: 'border-gray-200',
            headerBg: 'bg-gray-50',
            primaryColor: customColor || '#A674F8',
        },
        dark: {
            bg: 'bg-gray-800',
            text: 'text-gray-200',
            border: 'border-gray-700',
            headerBg: 'bg-gray-900',
            primaryColor: customColor || '#A674F8',
        },
        custom: {
            bg: 'bg-white',
            text: 'text-gray-800',
            border: 'border-gray-200',
            headerBg: 'bg-gray-50',
            primaryColor: customColor || '#A674F8',
        }
    };

    const currentTheme = themeStyles[theme] || themeStyles.light;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    return (
        <div ref={ref} className={`p-8 font-sans ${currentTheme.bg} ${currentTheme.text} shadow-lg`}>
            {/* Header */}
            <div className="flex justify-between items-start pb-8 border-b" style={{ borderColor: currentTheme.border }}>
                <div className="flex items-center gap-4">
                    {businessLogo && <img src={businessLogo} alt="Business Logo" className="w-24 h-24 object-contain" />}
                    <div>
                        <h1 className="text-3xl font-bold" style={{ color: currentTheme.primaryColor }}>{businessName}</h1>
                        <p className="text-sm whitespace-pre-line">{businessInfo}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl font-light uppercase text-gray-400">Invoice</h2>
                    <p><strong>Invoice #:</strong> {invoiceNumber}</p>
                </div>
            </div>

            {/* Bill To & Dates */}
            <div className="grid grid-cols-2 gap-8 mt-8">
                <div>
                    <h3 className="font-semibold text-gray-500">BILL TO</h3>
                    <p className="font-bold">{clientName}</p>
                    <p className="whitespace-pre-line">{clientInfo}</p>
                </div>
                <div className="text-right">
                    <div className="mb-2">
                        <span className="font-semibold text-gray-500">Invoice Date: </span>
                        <span>{format(invoiceDate, 'MMMM dd, yyyy')}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-500">Due Date: </span>
                        <span>{format(dueDate, 'MMMM dd, yyyy')}</span>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="mt-8">
                <table className="w-full">
                    <thead style={{ backgroundColor: currentTheme.headerBg }}>
                        <tr>
                            <th className="p-3 text-left font-semibold text-sm uppercase">Description</th>
                            <th className="p-3 text-center font-semibold text-sm uppercase">Qty</th>
                            <th className="p-3 text-right font-semibold text-sm uppercase">Unit Price</th>
                            <th className="p-3 text-right font-semibold text-sm uppercase">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index} className="border-b" style={{ borderColor: currentTheme.border }}>
                                <td className="p-3">{item.description}</td>
                                <td className="p-3 text-center">{item.quantity}</td>
                                <td className="p-3 text-right">{formatCurrency(item.price)}</td>
                                <td className="p-3 text-right">{formatCurrency(item.quantity * item.price)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Totals */}
            <div className="flex justify-end mt-8">
                <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Tax ({tax}%):</span>
                        <span>{formatCurrency(taxAmount)}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Discount:</span>
                            <span>- {formatCurrency(discount)}</span>
                        </div>
                    )}
                    <div className="border-t pt-2 mt-2" style={{ borderColor: currentTheme.border }}></div>
                    <div className="flex justify-between font-bold text-lg">
                        <span style={{ color: currentTheme.primaryColor }}>Grand Total:</span>
                        <span style={{ color: currentTheme.primaryColor }}>{formatCurrency(total)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-16 border-t pt-8" style={{ borderColor: currentTheme.border }}>
                <h4 className="font-semibold text-gray-500">Notes</h4>
                <p className="text-sm whitespace-pre-line">{notes}</p>
            </div>
        </div>
    );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
export default InvoiceTemplate;
