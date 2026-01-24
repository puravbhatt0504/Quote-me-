'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Image, Loader2, AlertCircle, CheckCircle2, X, Plus, Wand2, Search } from 'lucide-react';
import { useQuotation } from '@/store/QuotationContext';
import Card from './Card';

interface ExtractedItem {
    name: string;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
}

interface ExtractedQuotation {
    clientName: string;
    clientAddress: string;
    quotationDate: string;
    items: ExtractedItem[];
    subtotal: number;
    discount: number;
    gst: number;
    total: number;
    notes: string;
}

type ImportStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export default function QuotationImport() {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<ImportStatus>('idle');
    const [error, setError] = useState<string>('');
    const [extractedData, setExtractedData] = useState<ExtractedQuotation | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [loadingRates, setLoadingRates] = useState<Set<number>>(new Set());
    const [fetchedRates, setFetchedRates] = useState<Set<number>>(new Set()); // Track which rates were AI-fetched
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        products,
        setClientName,
        setClientAddress,
        setQuotationDate,
        setAdditionalNotes,
        addItem,
        clearSelectedItems,
        setProducts,
    } = useQuotation();

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file: File) => {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            setError('Please upload a PDF or image file (JPEG, PNG, WebP, GIF)');
            setStatus('error');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            setStatus('error');
            return;
        }

        setSelectedFile(file);
        setStatus('uploading');
        setError('');
        setExtractedData(null);

        try {
            setStatus('processing');

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/extract-quotation', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                // Check for rate limit error
                if (response.status === 429) {
                    const remaining = result.remaining;
                    let errorMessage = result.error || 'Rate limit exceeded. Please try again later.';
                    if (remaining) {
                        errorMessage += ` (Remaining: ${remaining.minute}/min, ${remaining.hour}/hr, ${remaining.day}/day)`;
                    }
                    throw new Error(errorMessage);
                }
                throw new Error(result.error || 'Failed to extract quotation data');
            }

            if (result.success && result.data) {
                // Post-process items to detect headers intelligently
                // Rule: An item is a Header (Qty 0) if it definitely has children (e.g. Item "1" followed by "1.1")
                // OR if it explicitly says "Section" and rate is 0.

                const items = result.data.items;
                const processedItems = items.map((item: any, index: number) => {
                    // Default to original extraction
                    let isHeader = false;

                    // extract item number (e.g. "1", "1.1", "6.1")
                    const getNumber = (str: string) => {
                        const match = str.match(/^(\d+(\.\d+)*)/);
                        return match ? match[1] : null;
                    };

                    const currentNum = getNumber(item.name);
                    const nextItem = items[index + 1];
                    const nextNum = nextItem ? getNumber(nextItem.name) : null;

                    if (currentNum && nextNum) {
                        // Check if nextNum starts with currentNum + "." (e.g. "1" -> "1.1")
                        // But precise check: "1" shouldn't match "10" or "11". It must be "1."
                        if (nextNum.startsWith(currentNum + '.') && item.rate === 0) {
                            isHeader = true;
                        }
                    }

                    // Fallback: If no numbers, check for very generic "Section" headers
                    if (item.name.toLowerCase().startsWith('section') && item.rate === 0) {
                        isHeader = true;
                    }

                    if (isHeader) {
                        return { ...item, quantity: 0 };
                    }
                    return item;
                });

                setExtractedData({ ...result.data, items: processedItems });
                setStatus('success');
            } else {
                throw new Error('No data extracted from the document');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while processing the file');
            setStatus('error');
        }
    };

    const handleFindRate = async (index: number, itemName: string) => {
        if (!extractedData) return;

        setLoadingRates(prev => new Set(prev).add(index));

        try {
            // Context Awareness: Look backwards for a header (Qty 0) to enrich the search terms
            // e.g. If item is "1.1 2280 lpm" and at index-1 is "1. Supply... Pump...", use that context.
            let fullSearchTerm = itemName;
            for (let i = index - 1; i >= 0; i--) {
                const prevItem = extractedData.items[i];
                if (prevItem.quantity === 0) { // It's a header
                    // Simple check: does the current item (1.1) look like a child of header (1)?
                    const currentNum = itemName.match(/^(\d+)/)?.[1];
                    const headerNum = prevItem.name.match(/^(\d+)/)?.[1];

                    if (currentNum && headerNum && currentNum.startsWith(headerNum)) {
                        // Prepend meaningful context (strip "Supplying..." boilerplate if needed, but Gemini handles it well)
                        fullSearchTerm = `${prevItem.name} ${itemName}`;
                        break; // Found the matching parent header, stop searching
                    }
                    // If not a match (e.g. unnumbered note), continue passing through to find real header
                }
            }

            const response = await fetch('/api/find-rate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemName: fullSearchTerm }),
            });

            if (response.status === 429) {
                alert('Daily AI Quota Exceeded. You have hit the limit (approx 20/day) for the available models. Please try again tomorrow.');
                return;
            }

            if (!response.ok) throw new Error('Failed to fetch rate');

            const { rate } = await response.json();

            if (rate > 0) {
                const newItems = [...extractedData.items];
                newItems[index] = {
                    ...newItems[index],
                    rate: rate,
                    amount: rate * newItems[index].quantity
                };

                const newSubtotal = newItems.reduce((sum, item) => sum + item.amount, 0);

                setExtractedData({
                    ...extractedData,
                    items: newItems,
                    subtotal: newSubtotal,
                    total: newSubtotal
                });

                setFetchedRates(prev => new Set(prev).add(index));
            } else {
                alert('AI could not find a confident market rate for this item. Please try the Google Search button.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingRates(prev => {
                const next = new Set(prev);
                next.delete(index);
                return next;
            });
        }
    };

    const applyExtractedData = () => {
        if (!extractedData) return;

        // Set client details
        if (extractedData.clientName) {
            setClientName(extractedData.clientName);
        }
        if (extractedData.clientAddress) {
            setClientAddress(extractedData.clientAddress);
        }
        if (extractedData.quotationDate) {
            setQuotationDate(extractedData.quotationDate);
        }
        if (extractedData.notes) {
            setAdditionalNotes(extractedData.notes);
        }

        // Clear existing items
        clearSelectedItems();

        // Try to match extracted items with existing products or add as new
        // Helper function to finding best matching product using token-based fuzzy search
        // Helper function to finding best matching product using token-based fuzzy search
        const findBestMatch = (extractedName: string) => {
            // Clean the name: Remove item numbers (e.g. "1. ", "6.1 ", "A. ") and generic words
            const cleanName = extractedName.replace(/^[\d+.]+\s*/, '').toLowerCase();

            // Extract potential key specifications (e.g. "25mm", "80 mm", "100mm") to avoid matching distinct sizes
            const getSpecs = (str: string) => {
                const matches = str.match(/(\d+)\s*(mm|ltr|lpm|hp|kva|zone)/g);
                return matches ? matches.map(m => m.replace(/\s+/g, '')) : [];
            };

            const extractedSpecs = getSpecs(cleanName); // Use cleaned name for specs too

            const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
            const extractedTokens = normalize(cleanName);

            if (extractedTokens.length === 0) return null;

            let bestMatch: any = null;
            let maxScore = 0;

            products.forEach(product => {
                const productNameClean = product.name.toLowerCase();
                const productSpecs = getSpecs(productNameClean);

                // CRITICAL: If specs (like 25mm vs 80mm) exist in both but don't match, reject strictly.
                // This prevents "25mm pipe" matching "80mm pipe" just because they share "pipe", "make", "jindal".
                if (extractedSpecs.length > 0 && productSpecs.length > 0) {
                    const hasCommonSpec = extractedSpecs.some(s => productSpecs.includes(s));
                    if (!hasCommonSpec) return; // Sizes widely different? Skip.
                }

                const productTokens = normalize(productNameClean);
                if (productTokens.length === 0) return;

                // Token overlap score
                const intersection = extractedTokens.filter(t => productTokens.includes(t));
                // Jaccard-ish Score
                let score = intersection.length / (Math.sqrt(extractedTokens.length * productTokens.length) || 1);

                // Boost for Brand Names if found (common brands handling)
                const brands = ['agni', 'kirloskar', 'jindal', 'polycab', 'havells', 'kartar', 'lifeguard'];
                brands.forEach(brand => {
                    if (extractedTokens.includes(brand) && productTokens.includes(brand)) {
                        score += 0.3;
                    }
                });

                if (score > maxScore && score > 0.25) { // Slightly lower threshold but strict on specs
                    maxScore = score;
                    bestMatch = product;
                }
            });

            return bestMatch;
        };

        let lastHeader = '';
        extractedData.items.forEach((item, index) => {
            // If it's a header (detected by Qty 0 post-processing), keep it as text-only context
            if (item.quantity === 0) {
                lastHeader = item.name;
                // Add header as a comment/text item (Rate 0)
                const headerProduct = {
                    id: Date.now() + index,
                    name: item.name,
                    category: 'general' as const,
                    unit: '',
                    rate: 0,
                    description: 'Section Header'
                };
                addItem(headerProduct);
                return;
            }

            // Context Aware Matching
            let searchName = item.name;
            const currentNum = item.name.match(/^(\d+)/)?.[1];
            const headerNum = lastHeader.match(/^(\d+)/)?.[1];

            if (lastHeader && currentNum && headerNum && currentNum.startsWith(headerNum)) {
                searchName = lastHeader + ' ' + item.name;
            }

            const matchingProduct = findBestMatch(searchName);

            if (matchingProduct) {
                // Use existing product details
                // PRIORITIZE Database Rate if the extracted rate is 0 or missing
                const appliedRate = (item.rate && item.rate > 0) ? item.rate : matchingProduct.rate;

                addItem({
                    ...matchingProduct,
                    // If the extracted name is very different, we might want to keep the extracted name 
                    // so the user recognizes it from their PDF, but usually improving the DB entry is better.
                    // For now, let's keep the extracted name as the primary name for the quote item 
                    // so it matches the input document, but using the RATE from our DB.
                    name: item.name,
                    unit: item.unit || matchingProduct.unit,
                    rate: appliedRate
                });
            } else {
                // Add as a new product
                const newProduct = {
                    id: Date.now() + index,
                    name: item.name,
                    category: 'general' as const,
                    unit: item.unit || 'Each',
                    rate: item.rate || 0,
                };

                // Add to products list (optional: maybe we shouldn't clutter the global list?)
                // For now, pushing to global list as temporary "custom" items in context is fine
                setProducts([...products, newProduct]);

                // Add to selected items
                addItem(newProduct);
            }
        });

        // Close the import modal
        setIsOpen(false);
        resetState();
    };

    const resetState = () => {
        setStatus('idle');
        setError('');
        setExtractedData(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <>
            {/* Import Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
                <Upload className="w-4 h-4" />
                Import Quotation
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
                        {/* Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Import Quotation
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Upload a PDF or image of a quotation to extract data
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    resetState();
                                }}
                                aria-label="Close modal"
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* Upload Area */}
                            {status === 'idle' && (
                                <div
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${dragActive
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                                        }`}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        id="quotation-file-upload"
                                        aria-label="Upload quotation file (PDF, JPEG, PNG, WebP, or GIF)"
                                        accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />

                                    <div className="flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                                                <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                                                <Image className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-lg font-medium text-gray-900 dark:text-white">
                                                Drop your file here, or{' '}
                                                <span className="text-purple-600 dark:text-purple-400">browse</span>
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                Supports PDF, JPEG, PNG, WebP, GIF (max 10MB)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Processing State */}
                            {(status === 'uploading' || status === 'processing') && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="relative">
                                        <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
                                        <div className="absolute inset-0 blur-xl bg-purple-400/30 animate-pulse" />
                                    </div>
                                    <p className="mt-6 text-lg font-medium text-gray-900 dark:text-white">
                                        {status === 'uploading' ? 'Uploading file...' : 'Extracting quotation data...'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        This may take a few seconds
                                    </p>
                                    {selectedFile && (
                                        <p className="text-xs text-gray-400 mt-4">
                                            {selectedFile.name}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Error State */}
                            {status === 'error' && (
                                <div className="text-center py-8">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                                        <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                                    </div>
                                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                        Extraction Failed
                                    </p>
                                    <p className="text-sm text-red-600 dark:text-red-400 mb-6">
                                        {error}
                                    </p>
                                    <button
                                        onClick={resetState}
                                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}

                            {/* Success State - Preview */}
                            {status === 'success' && extractedData && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                                        <p className="text-green-700 dark:text-green-300 font-medium">
                                            Successfully extracted quotation data!
                                        </p>
                                    </div>

                                    {/* Client Details */}
                                    {(extractedData.clientName || extractedData.clientAddress) && (
                                        <Card title="Client Details">
                                            <div className="space-y-2 text-sm">
                                                {extractedData.clientName && (
                                                    <p>
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>{' '}
                                                        <span className="text-gray-600 dark:text-gray-400">{extractedData.clientName}</span>
                                                    </p>
                                                )}
                                                {extractedData.clientAddress && (
                                                    <p>
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">Address:</span>{' '}
                                                        <span className="text-gray-600 dark:text-gray-400">{extractedData.clientAddress}</span>
                                                    </p>
                                                )}
                                                {extractedData.quotationDate && (
                                                    <p>
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">Date:</span>{' '}
                                                        <span className="text-gray-600 dark:text-gray-400">{extractedData.quotationDate}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </Card>
                                    )}

                                    {/* Extracted Items */}
                                    {extractedData.items.length > 0 && (
                                        <Card title={`Items (${extractedData.items.length})`}>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                                            <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">Item</th>
                                                            <th className="text-right py-2 px-3 font-medium text-gray-700 dark:text-gray-300">Qty</th>
                                                            <th className="text-right py-2 px-3 font-medium text-gray-700 dark:text-gray-300">Rate</th>
                                                            <th className="text-right py-2 px-3 font-medium text-gray-700 dark:text-gray-300">Amount</th>
                                                            <th className="text-center py-2 px-3 font-medium text-gray-700 dark:text-gray-300 w-10">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {extractedData.items.map((item, index) => (
                                                            <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                                <td className="py-2 px-3 text-gray-600 dark:text-gray-400 max-w-md truncate" title={item.name}>
                                                                    <span className={item.quantity === 0 ? "font-bold text-gray-800 dark:text-gray-200" : ""}>
                                                                        {item.name}
                                                                    </span>
                                                                    {item.quantity > 0 && <span className="text-xs text-gray-400 ml-1">({item.unit})</span>}
                                                                </td>
                                                                <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                                                                    {item.quantity > 0 ? item.quantity : '-'}
                                                                </td>
                                                                <td className={`py-2 px-3 text-right ${item.rate === 0 && item.quantity > 0 ? 'text-orange-500 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                                                    {item.quantity > 0 ? formatCurrency(item.rate) : '-'}
                                                                </td>
                                                                <td className="py-2 px-3 text-right font-medium text-gray-700 dark:text-gray-300">
                                                                    {item.quantity > 0 ? formatCurrency(item.amount) : '-'}
                                                                </td>
                                                                <td className="py-2 px-3 text-center flex justify-center gap-1">
                                                                    {item.quantity > 0 && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => handleFindRate(index, item.name)}
                                                                                disabled={loadingRates.has(index)}
                                                                                title="AI: Find Market Rate"
                                                                                className={`p-1.5 rounded-lg transition-colors ${fetchedRates.has(index)
                                                                                    ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                                                                                    : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                                                                                    }`}
                                                                            >
                                                                                {loadingRates.has(index) ? (
                                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                                ) : (
                                                                                    <Wand2 className="w-4 h-4" />
                                                                                )}
                                                                            </button>

                                                                            <button
                                                                                onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(item.name + ' price india')}`, '_blank')}
                                                                                title="Search Google manually"
                                                                                className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                                            >
                                                                                <Search className="w-4 h-4" />
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </Card>
                                    )}

                                    {/* Totals */}
                                    {extractedData.total > 0 && (
                                        <Card title="Totals">
                                            <div className="space-y-2 text-sm">
                                                {extractedData.subtotal > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                                                        <span className="text-gray-700 dark:text-gray-300">{formatCurrency(extractedData.subtotal)}</span>
                                                    </div>
                                                )}
                                                {extractedData.discount > 0 && (
                                                    <div className="flex justify-between text-green-600 dark:text-green-400">
                                                        <span>Discount</span>
                                                        <span>-{formatCurrency(extractedData.discount)}</span>
                                                    </div>
                                                )}
                                                {extractedData.gst > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">GST</span>
                                                        <span className="text-gray-700 dark:text-gray-300">{formatCurrency(extractedData.gst)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 font-bold text-base">
                                                    <span className="text-gray-800 dark:text-gray-200">Total</span>
                                                    <span className="text-purple-600 dark:text-purple-400">{formatCurrency(extractedData.total)}</span>
                                                </div>
                                            </div>
                                        </Card>
                                    )}

                                    {/* Notes */}
                                    {extractedData.notes && (
                                        <Card title="Notes">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {extractedData.notes}
                                            </p>
                                        </Card>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={resetState}
                                            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            Upload Different File
                                        </button>
                                        <button
                                            onClick={applyExtractedData}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-lg"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Apply to Quotation
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div >
            )
            }
        </>
    );
}
