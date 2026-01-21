'use client';

import { useState } from 'react';
import { useQuotation } from '@/store/QuotationContext';
import { quotationTypes } from '@/data/products';
import { generateExcelQuotation, formatDate } from '@/utils/excel';
import { generatePdfQuotation } from '@/utils/pdf';
import { Eye, Download, X, FileText } from 'lucide-react';
import Image from 'next/image';
import Toast from './Toast';

// Toast Component


// Preview Modal Component
function PreviewModal({ isOpen, onClose, onDownloadExcel, onDownloadPdf }: { isOpen: boolean; onClose: () => void; onDownloadExcel: () => void; onDownloadPdf: () => void }) {
    const {
        selectedItems,
        settings: contextSettings,
        clientName,
        clientAddress,
        quotationDate,
        quotationType,
        additionalNotes,
        applyDiscount,
        discountPercentage,
        includeGST,
        calculateTotals,
    } = useQuotation();

    const settings = contextSettings;

    if (!isOpen) return null;

    const totals = calculateTotals();
    const quotationTypeText = quotationTypes.find(t => t.value === quotationType)?.label || 'Quotation';

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-10">
            <div className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-modal-slide">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between no-print">
                    <h3 className="text-xl font-semibold text-white">Quotation Preview</h3>
                    <button
                        onClick={onClose}
                        title="Close preview"
                        aria-label="Close preview"
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 printable-content">
                    <div className="bg-white text-gray-800 p-10 rounded-xl font-serif">
                        {/* Company Header */}
                        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                            <h1 className="text-2xl font-bold text-orange-700 mb-1">{settings.name}</h1>
                            <p className="italic text-sm mb-2">{settings.tagline}</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{settings.services}</p>
                            <p className="text-xs mt-2">{settings.address}</p>
                            <p className="text-xs">Helpline: {settings.phone} | Email: {settings.email} | {settings.website}</p>
                            <p className="text-xs font-bold mt-2">An {settings.certification}</p>
                        </div>

                        {/* Meta Info */}
                        <div className="flex justify-between text-sm mb-5">
                            <div>GST No: {settings.gst}</div>
                            <div>Date: {formatDate(quotationDate)}</div>
                        </div>

                        {/* Client Details */}
                        <div className="mb-5 text-sm">
                            <strong>To:</strong><br />
                            {clientName || 'Client Name'}<br />
                            {clientAddress || 'Address'}
                        </div>

                        {/* Quotation Title */}
                        <h2 className="text-center text-lg font-bold underline mb-5">{quotationTypeText}</h2>

                        {/* Items Table */}
                        <table className="w-full border-collapse text-sm mb-5">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-800 p-2 text-left">S.N.</th>
                                    <th className="border border-gray-800 p-2 text-left">Description</th>
                                    <th className="border border-gray-800 p-2 text-left">Unit</th>
                                    <th className="border border-gray-800 p-2 text-left">Rate</th>
                                    <th className="border border-gray-800 p-2 text-left">Qty</th>
                                    <th className="border border-gray-800 p-2 text-left">Amount (INR)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedItems.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="border border-gray-800 p-2">{index + 1}</td>
                                        <td className="border border-gray-800 p-2">{item.name}</td>
                                        <td className="border border-gray-800 p-2">{item.unit}</td>
                                        <td className="border border-gray-800 p-2">₹ {item.rate.toLocaleString('en-IN')}</td>
                                        <td className="border border-gray-800 p-2">{item.quantity}</td>
                                        <td className="border border-gray-800 p-2">₹ {item.amount.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                                <tr>
                                    <td colSpan={5} className="border border-gray-800 p-2 text-right font-semibold">Subtotal</td>
                                    <td className="border border-gray-800 p-2">₹ {Math.round(totals.subtotal).toLocaleString('en-IN')}</td>
                                </tr>
                                {applyDiscount && (
                                    <tr>
                                        <td colSpan={5} className="border border-gray-800 p-2 text-right">Discount ({discountPercentage}%)</td>
                                        <td className="border border-gray-800 p-2">- ₹ {Math.round(totals.discount).toLocaleString('en-IN')}</td>
                                    </tr>
                                )}
                                {includeGST && (
                                    <tr>
                                        <td colSpan={5} className="border border-gray-800 p-2 text-right">GST (18%)</td>
                                        <td className="border border-gray-800 p-2">+ ₹ {Math.round(totals.gst).toLocaleString('en-IN')}</td>
                                    </tr>
                                )}
                                <tr className="bg-orange-50 font-bold">
                                    <td colSpan={5} className="border border-gray-800 p-2 text-right">Total</td>
                                    <td className="border border-gray-800 p-2">₹ {Math.round(totals.total).toLocaleString('en-IN')}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Notes */}
                        {additionalNotes && (
                            <p className="text-xs text-gray-600 mb-3"><strong>Notes:</strong> {additionalNotes}</p>
                        )}
                        {applyDiscount && (
                            <p className="text-xs text-gray-600 mb-3">#{discountPercentage}% Discount has been applied on all above rates</p>
                        )}

                        {/* Terms & Conditions */}
                        <div className="text-xs mb-5">
                            <h4 className="font-bold mb-2">Terms & Conditions:</h4>
                            <ol className="list-decimal ml-5 space-y-1">
                                <li>GST {includeGST ? 'is included' : 'will be extra'} on above rates as per applicable.</li>
                                <li>One year validity for any manufacturing defect.</li>
                                <li>Payment 100% against billing.</li>
                                <li>This quotation is valid for 15 days only from the date of quotation.</li>
                            </ol>
                        </div>



                        <p className="text-sm mb-10">Thanks & Regards</p>

                        {/* Signature Section */}
                        <div className="flex justify-between text-sm items-end">
                            <div className="text-center relative">
                                <div className="h-24 flex items-end justify-center mb-[-10px]">
                                    <Image
                                        src="/sign_stamp.png"
                                        alt="Signature Stamp"
                                        width={128}
                                        height={128}
                                        className="w-32 object-contain mix-blend-multiply"
                                        unoptimized
                                    />
                                </div>
                                <div className="w-40 border-b border-gray-800 mb-2" />
                                <div>For {settings.name}</div>
                                <div className="text-xs mt-1">7838625646</div>
                            </div>

                            <div className="text-center">
                                <div className="w-40 border-b border-gray-800 mb-2 pt-10" />
                                <div>For Client</div>
                                <div className="text-xs mt-1">Sign.</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-slate-700 flex justify-end gap-3 no-print">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={onDownloadPdf}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all"
                    >
                        <FileText className="w-5 h-5" />
                        PDF
                    </button>
                    <button
                        onClick={onDownloadExcel}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-orange-500/30 transition-all"
                    >
                        <Download className="w-5 h-5" />
                        Excel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ActionButtons() {
    const [showPreview, setShowPreview] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    const {
        selectedItems,
        settings: contextSettings,
        clientName,
        clientAddress,
        quotationDate,
        quotationType,
        additionalNotes,
        applyDiscount,
        discountPercentage,
        includeGST,
        calculateTotals,
        saveToHistory,
    } = useQuotation();

    const settings = contextSettings;

    const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handlePreview = () => {
        if (selectedItems.length === 0) {
            showToast('Please add at least one item to the quotation', 'warning');
            return;
        }
        setShowPreview(true);
    };

    const handleGenerateExcel = async () => {
        if (selectedItems.length === 0) {
            showToast('Please add at least one item to the quotation', 'warning');
            return;
        }

        try {
            const totals = calculateTotals();
            const quotationTypeText = quotationTypes.find(t => t.value === quotationType)?.label || 'Quotation';

            await generateExcelQuotation({
                selectedItems,
                totals,
                clientName: clientName || 'Client',
                clientAddress,
                quotationDate,
                quotationTypeText,
                additionalNotes,
                applyDiscount,
                discountPercentage,
                includeGST,
                settings,
            });

            saveToHistory(clientName || 'Client', clientAddress, totals.total);
            setShowPreview(false);
            showToast('Excel quotation generated successfully!', 'success');
        } catch (error) {
            console.error('Error generating Excel:', error);
            showToast('Error generating Excel. Please try again.', 'error');
        }
    };

    const handleGeneratePdf = async () => {
        if (selectedItems.length === 0) {
            showToast('Please add at least one item to the quotation', 'warning');
            return;
        }

        try {
            const totals = calculateTotals();
            const quotationTypeText = quotationTypes.find(t => t.value === quotationType)?.label || 'Quotation';

            generatePdfQuotation({
                selectedItems,
                totals,
                clientName: clientName || 'Client',
                clientAddress,
                quotationDate,
                quotationTypeText,
                additionalNotes,
                applyDiscount,
                discountPercentage,
                includeGST,
                settings,
            });

            saveToHistory(clientName || 'Client', clientAddress, totals.total);
            setShowPreview(false);
            showToast('PDF quotation generated successfully!', 'success');
        } catch (error) {
            console.error('Error generating PDF:', error);
            showToast('Error generating PDF. Please try again.', 'error');
        }
    };

    return (
        <>
            <div className="flex justify-end gap-4 pt-4">
                <button
                    onClick={handlePreview}
                    className="px-7 py-3.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl font-semibold flex items-center gap-2.5 transition-all"
                >
                    <Eye className="w-5 h-5" />
                    Preview
                </button>
                <button
                    onClick={handleGeneratePdf}
                    className="px-7 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold flex items-center gap-2.5 shadow-lg shadow-red-600/30 hover:shadow-red-600/40 hover:-translate-y-0.5 transition-all"
                >
                    <FileText className="w-5 h-5" />
                    PDF
                </button>
                <button
                    onClick={handleGenerateExcel}
                    className="px-7 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold flex items-center gap-2.5 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all"
                >
                    <Download className="w-5 h-5" />
                    Excel
                </button>
            </div>

            <PreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                onDownloadExcel={handleGenerateExcel}
                onDownloadPdf={handleGeneratePdf}
            />

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                />
            )}
        </>
    );
}
