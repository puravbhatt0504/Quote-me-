'use client';

import { useState, useEffect } from 'react';
import { useQuotation } from '@/store/QuotationContext';
import { Header, Card } from '@/components';
import { Settings as SettingsIcon, Save, Check } from 'lucide-react';
import { CompanySettings } from '@/types';

export default function SettingsPage() {
    const { settings, updateSettings } = useQuotation();
    const [formData, setFormData] = useState<CompanySettings>(settings);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    const handleChange = (field: keyof CompanySettings, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSave = () => {
        updateSettings(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const inputClassName = "w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all";
    const labelClassName = "block text-sm font-medium text-slate-400 mb-2";

    return (
        <>
            <Header
                title="Company Settings"
                subtitle="Customize company information"
            />

            <Card title="Company Details" icon={<SettingsIcon className="w-5 h-5" />}>
                <div className="grid grid-cols-2 gap-6 max-w-3xl">
                    <div>
                        <label htmlFor="companyName" className={labelClassName}>Company Name</label>
                        <input
                            id="companyName"
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Enter company name"
                            className={inputClassName}
                        />
                    </div>

                    <div>
                        <label htmlFor="tagline" className={labelClassName}>Tagline</label>
                        <input
                            id="tagline"
                            type="text"
                            value={formData.tagline}
                            onChange={(e) => handleChange('tagline', e.target.value)}
                            placeholder="Enter tagline"
                            className={inputClassName}
                        />
                    </div>

                    <div className="col-span-2">
                        <label htmlFor="address" className={labelClassName}>Address</label>
                        <textarea
                            id="address"
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            rows={2}
                            placeholder="Enter company address"
                            className={inputClassName + " resize-none"}
                        />
                    </div>

                    <div>
                        <label htmlFor="phone" className={labelClassName}>Phone Numbers</label>
                        <input
                            id="phone"
                            type="text"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="Enter phone numbers"
                            className={inputClassName}
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className={labelClassName}>Email</label>
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="Enter email address"
                            className={inputClassName}
                        />
                    </div>

                    <div>
                        <label htmlFor="gst" className={labelClassName}>GST Number</label>
                        <input
                            id="gst"
                            type="text"
                            value={formData.gst}
                            onChange={(e) => handleChange('gst', e.target.value)}
                            placeholder="Enter GST number"
                            className={inputClassName}
                        />
                    </div>

                    <div>
                        <label htmlFor="certification" className={labelClassName}>Certification</label>
                        <input
                            id="certification"
                            type="text"
                            value={formData.certification}
                            onChange={(e) => handleChange('certification', e.target.value)}
                            placeholder="Enter certification"
                            className={inputClassName}
                        />
                    </div>
                </div>
            </Card>

            <Card title="Bank Details" icon={<SettingsIcon className="w-5 h-5" />}>
                <div className="grid grid-cols-2 gap-6 max-w-3xl">
                    <div>
                        <label htmlFor="bankName" className={labelClassName}>Bank Name</label>
                        <input
                            id="bankName"
                            type="text"
                            value={formData.bankName}
                            onChange={(e) => handleChange('bankName', e.target.value)}
                            placeholder="Enter bank name"
                            className={inputClassName}
                        />
                    </div>

                    <div>
                        <label htmlFor="bankBranch" className={labelClassName}>Bank Branch</label>
                        <input
                            id="bankBranch"
                            type="text"
                            value={formData.bankBranch}
                            onChange={(e) => handleChange('bankBranch', e.target.value)}
                            placeholder="Enter bank branch"
                            className={inputClassName}
                        />
                    </div>

                    <div>
                        <label htmlFor="accountNumber" className={labelClassName}>Account Number</label>
                        <input
                            id="accountNumber"
                            type="text"
                            value={formData.accountNumber}
                            onChange={(e) => handleChange('accountNumber', e.target.value)}
                            placeholder="Enter account number"
                            className={inputClassName}
                        />
                    </div>

                    <div>
                        <label htmlFor="ifscCode" className={labelClassName}>IFSC Code</label>
                        <input
                            id="ifscCode"
                            type="text"
                            value={formData.ifscCode}
                            onChange={(e) => handleChange('ifscCode', e.target.value)}
                            placeholder="Enter IFSC code"
                            className={inputClassName}
                        />
                    </div>

                    <div className="col-span-2">
                        <button
                            onClick={handleSave}
                            className={`
                                px-7 py-3.5 rounded-xl font-semibold flex items-center gap-2.5 transition-all
                                ${saved
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30'
                                }
                            `}
                        >
                            {saved ? (
                                <>
                                    <Check className="w-5 h-5" />
                                    Saved!
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Card>
        </>
    );
}
