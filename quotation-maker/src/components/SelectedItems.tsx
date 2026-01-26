'use client';

import { useQuotation } from '@/store/QuotationContext';
import { ClipboardList, X, Package } from 'lucide-react';
import Card from './Card';

export default function SelectedItems() {
    const { selectedItems, removeItem, updateQuantity, calculateTotals } = useQuotation();
    const totals = calculateTotals();

    return (
        <Card
            title="Selected Items"
            icon={<ClipboardList className="w-5 h-5" />}
            headerRight={
                <span className="text-sm text-slate-500 px-4 py-1.5 bg-slate-900 rounded-full">
                    {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
                </span>
            }
        >
            <div className="relative min-h-[200px]">
                {selectedItems.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                        <Package className="w-16 h-16 text-slate-700 mb-4" strokeWidth={1} />
                        <p className="text-base">No items selected yet</p>
                        <span className="text-sm">Click on products above to add them</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-900">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">S.N.</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rate (₹)</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount (₹)</th>
                                    <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedItems.map((item, index) => {
                                    // Extract original serial number from item name (e.g., "1.1 Description" -> "1.1")
                                    const serialMatch = item.name.match(/^([\d]+(?:\.[\d]+)?)\s+/);
                                    const serialNumber = serialMatch ? serialMatch[1] : String(index + 1);
                                    // Strip the serial number from the description to avoid duplication
                                    const displayName = serialMatch ? item.name.replace(/^[\d]+(?:\.[\d]+)?\s+/, '') : item.name;
                                    // Check if this is a header (quantity 0)
                                    const isHeader = item.quantity === 0;

                                    return (
                                        <tr key={item.id} className={`border-b border-slate-700 hover:bg-slate-700/30 transition-colors ${isHeader ? 'bg-slate-800/50' : ''}`}>
                                            <td className="px-4 py-3 text-sm text-white">{serialNumber}</td>
                                            <td className={`px-4 py-3 text-sm text-white ${isHeader ? 'font-semibold' : ''}`}>{displayName}</td>
                                            <td className="px-4 py-3 text-sm text-white">{isHeader ? '' : item.unit}</td>
                                            <td className="px-4 py-3 text-sm text-white">{isHeader ? '' : `₹ ${item.rate.toLocaleString('en-IN')}`}</td>
                                            <td className="px-4 py-3">
                                                {isHeader ? (
                                                    <span className="text-slate-500 text-sm">-</span>
                                                ) : (
                                                    <>
                                                        <label htmlFor={`qty-${item.id}`} className="sr-only">Quantity for {item.name}</label>
                                                        <input
                                                            id={`qty-${item.id}`}
                                                            type="number"
                                                            min="0"
                                                            value={item.quantity}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                updateQuantity(item.id, isNaN(val) ? 0 : val);
                                                            }}
                                                            title={`Quantity for ${item.name}`}
                                                            className="w-16 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-center focus:outline-none focus:border-orange-500"
                                                        />
                                                    </>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-white font-medium">
                                                {isHeader ? '' : `₹ ${item.amount.toLocaleString('en-IN')}`}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    title={`Remove ${item.name}`}
                                                    aria-label={`Remove ${item.name}`}
                                                    className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gradient-to-r from-orange-500/5 to-transparent">
                                    <td colSpan={5} className="px-4 py-4 text-right font-bold text-lg text-orange-400">
                                        Total
                                    </td>
                                    <td className="px-4 py-4 font-bold text-lg text-orange-400">
                                        ₹ {Math.round(totals.total).toLocaleString('en-IN')}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </Card>
    );
}
