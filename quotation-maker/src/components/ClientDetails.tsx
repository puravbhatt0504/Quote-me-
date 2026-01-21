'use client';

import { useQuotation } from '@/store/QuotationContext';
import { quotationTypes } from '@/data/products';
import { User } from 'lucide-react';
import Card from './Card';

export default function ClientDetails() {
    const {
        clientName,
        clientAddress,
        quotationDate,
        quotationType,
        setClientName,
        setClientAddress,
        setQuotationDate,
        setQuotationType,
    } = useQuotation();

    return (
        <Card title="Client Details" icon={<User className="w-5 h-5" />}>
            <div className="space-y-5">
                <div>
                    <label htmlFor="clientName" className="block text-sm font-medium text-slate-400 mb-2">
                        Client / Company Name
                    </label>
                    <input
                        id="clientName"
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Enter client or company name"
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                </div>

                <div>
                    <label htmlFor="clientAddress" className="block text-sm font-medium text-slate-400 mb-2">
                        Address / Location
                    </label>
                    <input
                        id="clientAddress"
                        type="text"
                        value={clientAddress}
                        onChange={(e) => setClientAddress(e.target.value)}
                        placeholder="Enter address or location"
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label htmlFor="quotationDate" className="block text-sm font-medium text-slate-400 mb-2">
                            Quotation Date
                        </label>
                        <input
                            id="quotationDate"
                            type="date"
                            value={quotationDate}
                            onChange={(e) => setQuotationDate(e.target.value)}
                            title="Select quotation date"
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                        />
                    </div>

                    <div>
                        <label htmlFor="quotationType" className="block text-sm font-medium text-slate-400 mb-2">
                            Quotation Type
                        </label>
                        <select
                            id="quotationType"
                            value={quotationType}
                            onChange={(e) => setQuotationType(e.target.value)}
                            title="Select quotation type"
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all appearance-none cursor-pointer pr-10 select-arrow"
                        >
                            {quotationTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </Card>
    );
}
