'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, SelectedItem, QuotationHistory, CompanySettings, Totals } from '@/types';
import { defaultProducts, defaultCompanySettings } from '@/data/products';

interface QuotationContextType {
    products: Product[];
    selectedItems: SelectedItem[];
    history: QuotationHistory[];
    settings: CompanySettings;
    applyDiscount: boolean;
    discountPercentage: number;
    includeGST: boolean;
    clientName: string;
    clientAddress: string;
    quotationDate: string;
    quotationType: string;
    additionalNotes: string;
    setProducts: (products: Product[]) => void;
    addItem: (product: Product) => void;
    addItems: (products: Product[]) => void;
    removeItem: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    toggleProduct: (productId: number) => void;
    isProductSelected: (productId: number) => boolean;
    clearSelectedItems: () => void;
    calculateTotals: () => Totals;
    setApplyDiscount: (value: boolean) => void;
    setDiscountPercentage: (value: number) => void;
    setIncludeGST: (value: boolean) => void;
    setClientName: (value: string) => void;
    setClientAddress: (value: string) => void;
    setQuotationDate: (value: string) => void;
    setQuotationType: (value: string) => void;
    setAdditionalNotes: (value: string) => void;
    saveToHistory: (clientName: string, clientAddress: string, total: number) => void;
    loadFromHistory: (historyId: number) => void;
    clearHistory: () => void;
    updateSettings: (settings: CompanySettings) => void;
}

const QuotationContext = createContext<QuotationContextType | undefined>(undefined);

export function QuotationProvider({ children }: { children: ReactNode }) {
    const [products, setProducts] = useState<Product[]>(defaultProducts);
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [history, setHistory] = useState<QuotationHistory[]>([]);
    const [settings, setSettings] = useState<CompanySettings>(defaultCompanySettings);
    const [applyDiscount, setApplyDiscount] = useState(false);
    const [discountPercentage, setDiscountPercentage] = useState(5);
    const [includeGST, setIncludeGST] = useState(true);
    const [clientName, setClientName] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [quotationDate, setQuotationDate] = useState('');
    const [quotationType, setQuotationType] = useState('refilling');
    const [additionalNotes, setAdditionalNotes] = useState('');

    // Load from localStorage on mount

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedProducts = localStorage.getItem('cityfire_products');
            const storedHistory = localStorage.getItem('cityfire_history');
            const storedSettings = localStorage.getItem('cityfire_settings');

            if (storedProducts) {
                // eslint-disable-next-line
                setProducts(JSON.parse(storedProducts));
            }
            if (storedHistory) {

                setHistory(JSON.parse(storedHistory) as QuotationHistory[]);
            }
            if (storedSettings) {

                setSettings({ ...defaultCompanySettings, ...JSON.parse(storedSettings) });
            }

            // Set default date
            setQuotationDate(new Date().toISOString().split('T')[0]);
        }
    }, []);

    // Save products to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined' && products !== defaultProducts) {
            localStorage.setItem('cityfire_products', JSON.stringify(products));
        }
    }, [products]);

    // Save history to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('cityfire_history', JSON.stringify(history));
        }
    }, [history]);

    // Save settings to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('cityfire_settings', JSON.stringify(settings));
        }
    }, [settings]);

    const addItem = (product: Product) => {
        setSelectedItems(prev => {
            if (prev.find(item => item.id === product.id)) return prev;
            // Check if product overrides quantity (e.g. headers with qty 0), otherwise default to 1
            const initialQty = 'quantity' in product ? (product as any).quantity : 1;
            return [...prev, { ...product, quantity: initialQty, amount: product.rate * initialQty }];
        });
    };

    // Bulk add items - for importing multiple items at once
    const addItems = (productsToAdd: Product[]) => {
        const newItems: SelectedItem[] = productsToAdd.map(product => {
            const initialQty = 'quantity' in product ? (product as any).quantity : 1;
            return { ...product, quantity: initialQty, amount: product.rate * initialQty };
        });
        setSelectedItems(newItems);
    };

    const removeItem = (productId: number) => {
        setSelectedItems(selectedItems.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: number, quantity: number) => {
        setSelectedItems(selectedItems.map(item => {
            if (item.id === productId) {
                // Allow quantity 0 for headers or optional items
                const newQuantity = Math.max(0, quantity);
                return { ...item, quantity: newQuantity, amount: item.rate * newQuantity };
            }
            return item;
        }));
    };

    const toggleProduct = (productId: number) => {
        const existing = selectedItems.find(item => item.id === productId);
        if (existing) {
            removeItem(productId);
        } else {
            const product = products.find(p => p.id === productId);
            if (product) {
                addItem(product);
            }
        }
    };

    const isProductSelected = (productId: number) => {
        return selectedItems.some(item => item.id === productId);
    };

    const clearSelectedItems = () => {
        setSelectedItems([]);
    };

    const calculateTotals = (): Totals => {
        const subtotal = selectedItems.reduce((sum, item) => sum + item.amount, 0);
        const discount = applyDiscount ? subtotal * (discountPercentage / 100) : 0;
        const afterDiscount = subtotal - discount;
        const gst = includeGST ? afterDiscount * 0.18 : 0;
        const total = afterDiscount + gst;

        return { subtotal, discount, afterDiscount, gst, total };
    };

    const saveToHistory = (clientName: string, clientAddress: string, total: number) => {
        const historyItem: QuotationHistory = {
            id: Date.now(),
            clientName,
            clientAddress,
            total: Math.round(total),
            date: new Date().toISOString(),
            items: [...selectedItems],
        };

        const newHistory = [historyItem, ...history].slice(0, 50);
        setHistory(newHistory);
    };

    const loadFromHistory = (historyId: number) => {
        const historyItem = history.find(h => h.id === historyId);
        if (historyItem) {
            setClientName(historyItem.clientName);
            setClientAddress(historyItem.clientAddress);
            setSelectedItems([...historyItem.items]);
        }
    };

    const clearHistory = () => {
        setHistory([]);
    };

    const updateSettings = (newSettings: CompanySettings) => {
        setSettings(newSettings);
    };

    return (
        <QuotationContext.Provider
            value={{
                products,
                selectedItems,
                history,
                settings,
                applyDiscount,
                discountPercentage,
                includeGST,
                clientName,
                clientAddress,
                quotationDate,
                quotationType,
                additionalNotes,
                setProducts,
                addItem,
                addItems,
                removeItem,
                updateQuantity,
                toggleProduct,
                isProductSelected,
                clearSelectedItems,
                calculateTotals,
                setApplyDiscount,
                setDiscountPercentage,
                setIncludeGST,
                setClientName,
                setClientAddress,
                setQuotationDate,
                setQuotationType,
                setAdditionalNotes,
                saveToHistory,
                loadFromHistory,
                clearHistory,
                updateSettings,
            }}
        >
            {children}
        </QuotationContext.Provider>
    );
}

export function useQuotation() {
    const context = useContext(QuotationContext);
    if (context === undefined) {
        throw new Error('useQuotation must be used within a QuotationProvider');
    }
    return context;
}
