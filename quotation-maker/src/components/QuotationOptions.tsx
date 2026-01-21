'use client';

import { useQuotation } from '@/store/QuotationContext';
import { SlidersHorizontal } from 'lucide-react';
import Card from './Card';

export default function QuotationOptions() {
    const {
        applyDiscount,
        discountPercentage,
        includeGST,
        additionalNotes,
        setApplyDiscount,
        setDiscountPercentage,
        setIncludeGST,
        setAdditionalNotes,
    } = useQuotation();

    return (
        <Card title="Additional Options" icon={<SlidersHorizontal className="w-5 h-5" />}>
            <div className="flex flex-wrap gap-6 items-start">
                {/* Discount Toggle */}
                {/* Discount Toggle & Value */}
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={applyDiscount}
                                onChange={(e) => setApplyDiscount(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-12 h-6 bg-slate-600 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-orange-500 peer-checked:to-orange-600 transition-all" />
                            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-6" />
                        </div>
                        <span className="text-sm text-white">Apply Discount</span>
                    </label>

                    {applyDiscount && (
                        <div className="flex items-center gap-2 animate-fade-in">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={discountPercentage}
                                onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                                className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500 text-center"
                                aria-label="Discount percentage"
                            />
                            <span className="text-sm text-slate-400">%</span>
                        </div>
                    )}
                </div>

                {/* GST Toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={includeGST}
                            onChange={(e) => setIncludeGST(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-slate-600 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-orange-500 peer-checked:to-orange-600 transition-all" />
                        <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-6" />
                    </div>
                    <span className="text-sm text-white">Include GST (18%)</span>
                </label>

                {/* Additional Notes */}
                <div className="w-full mt-2">
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                        Additional Notes
                    </label>
                    <textarea
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        placeholder="Enter any additional notes for this quotation..."
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                    />
                </div>
            </div>
        </Card>
    );
}
