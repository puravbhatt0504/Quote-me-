// Product and Quotation Types

export interface Product {
    id: number;
    name: string;
    category: 'refilling' | 'new-supply' | 'accessories' | 'hpt' | 'amc' | 'general';
    unit: string;
    rate: number;
}

export interface SelectedItem extends Product {
    quantity: number;
    amount: number;
}

export interface QuotationHistory {
    id: number;
    clientName: string;
    clientAddress: string;
    total: number;
    date: string;
    items: SelectedItem[];
}

export interface CompanySettings {
    name: string;
    tagline: string;
    services: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    gst: string;
    certification: string;
    bankName: string;
    bankBranch: string;
    accountNumber: string;
    ifscCode: string;
}

export interface Totals {
    subtotal: number;
    discount: number;
    afterDiscount: number;
    gst: number;
    total: number;
}
