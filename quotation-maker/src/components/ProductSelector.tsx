'use client';

import { useState, useMemo } from 'react';
import { useQuotation } from '@/store/QuotationContext';
import { categoryNames } from '@/data/products';
import { ShoppingBag, Search } from 'lucide-react';
import Card from './Card';

const categories = ['all', 'refilling', 'new-supply', 'accessories', 'hpt', 'amc', 'general'] as const;

export default function ProductSelector() {
    const { products, toggleProduct, isProductSelected } = useQuotation();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchTerm, activeCategory]);

    return (
        <Card
            title="Add Products"
            icon={<ShoppingBag className="w-5 h-5" />}
            headerRight={
                <div className="relative w-72">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search products..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-all"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                </div>
            }
        >
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`
              px-5 py-2.5 rounded-full text-sm font-medium transition-all
              ${activeCategory === category
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                                : 'bg-transparent border border-slate-700 text-slate-400 hover:border-orange-400 hover:text-orange-400'
                            }
            `}
                    >
                        {categoryNames[category]}
                    </button>
                ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
                {filteredProducts.map((product) => {
                    const selected = isProductSelected(product.id);
                    return (
                        <div
                            key={product.id}
                            onClick={() => toggleProduct(product.id)}
                            className={`
                relative p-4 bg-slate-900 border rounded-xl cursor-pointer transition-all overflow-hidden
                ${selected
                                    ? 'border-orange-500 bg-orange-500/[0.08]'
                                    : 'border-slate-700 hover:border-orange-500 hover:shadow-md hover:-translate-y-0.5'
                                }
              `}
                        >
                            <div
                                className={`
                  absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-orange-500 to-orange-400
                  transition-transform duration-300
                  ${selected ? 'scale-x-100' : 'scale-x-0'}
                `}
                            />
                            <div className="text-sm font-medium text-white mb-2">{product.name}</div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 uppercase tracking-wider">
                                    {categoryNames[product.category]}
                                </span>
                                <span className="text-base font-semibold text-orange-400">
                                    ₹ {product.rate.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredProducts.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                    No products found matching your search.
                </div>
            )}
        </Card>
    );
}
