'use client';

import { useQuotation } from '@/store/QuotationContext';
import { Header, Card } from '@/components';
import { Clock, FileText, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
    const { history, loadFromHistory, clearHistory } = useQuotation();
    const router = useRouter();

    const handleLoad = (historyId: number) => {
        loadFromHistory(historyId);
        router.push('/');
    };

    const handleClearHistory = () => {
        if (confirm('Are you sure you want to clear all quotation history?')) {
            clearHistory();
        }
    };

    return (
        <>
            <Header
                title="Quotation History"
                subtitle="View past quotations"
            />

            <Card
                title="All Quotations"
                icon={<Clock className="w-5 h-5" />}
                headerRight={
                    history.length > 0 && (
                        <button
                            onClick={handleClearHistory}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear All
                        </button>
                    )
                }
            >
                {history.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                        <FileText className="w-16 h-16 text-slate-700 mx-auto mb-4" strokeWidth={1} />
                        <p className="text-base mb-1">No quotations generated yet</p>
                        <p className="text-sm">Your saved quotations will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {history.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-5 bg-slate-900 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors"
                            >
                                <div className="flex-1">
                                    <h4 className="text-base font-medium text-white mb-1">{item.clientName}</h4>
                                    <div className="text-sm text-slate-500">
                                        {item.clientAddress && `${item.clientAddress} | `}
                                        {new Date(item.date).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                        {' | '}
                                        {item.items.length} item{item.items.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                                <div className="text-xl font-bold text-orange-400 mx-6">
                                    ₹ {item.total.toLocaleString('en-IN')}
                                </div>
                                <button
                                    onClick={() => handleLoad(item.id)}
                                    className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-colors"
                                >
                                    Load
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </>
    );
}
