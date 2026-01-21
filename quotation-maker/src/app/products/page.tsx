'use client';

import { useState } from 'react';
import { useQuotation } from '@/store/QuotationContext';
import { Header, Card } from '@/components';
import { categoryNames } from '@/data/products';
import { Package, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { Product } from '@/types';

export default function ProductsPage() {
    const { products, setProducts } = useQuotation();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<{ name: string; rate: number }>({ name: '', rate: 0 });
    const [showAddForm, setShowAddForm] = useState(false);
    const [newProduct, setNewProduct] = useState<Partial<Product>>({
        name: '',
        category: 'refilling',
        unit: 'Each',
        rate: 0,
    });

    const handleEdit = (product: Product) => {
        setEditingId(product.id);
        setEditForm({ name: product.name, rate: product.rate });
    };

    const handleSaveEdit = (productId: number) => {
        setProducts(products.map(p =>
            p.id === productId
                ? { ...p, name: editForm.name, rate: editForm.rate }
                : p
        ));
        setEditingId(null);
    };

    const handleDelete = (productId: number) => {
        if (confirm('Are you sure you want to delete this product?')) {
            setProducts(products.filter(p => p.id !== productId));
        }
    };

    const handleAddProduct = () => {
        if (!newProduct.name || !newProduct.rate) return;

        const maxId = Math.max(...products.map(p => p.id), 0);
        const product: Product = {
            id: maxId + 1,
            name: newProduct.name,
            category: newProduct.category as Product['category'],
            unit: newProduct.unit || 'Each',
            rate: newProduct.rate,
        };

        setProducts([...products, product]);
        setNewProduct({ name: '', category: 'refilling', unit: 'Each', rate: 0 });
        setShowAddForm(false);
    };

    const groupedProducts = products.reduce((acc, product) => {
        if (!acc[product.category]) {
            acc[product.category] = [];
        }
        acc[product.category].push(product);
        return acc;
    }, {} as Record<string, Product[]>);

    return (
        <>
            <Header
                title="Product Rate Management"
                subtitle="View and manage product rates"
            />

            <Card
                title="All Products"
                icon={<Package className="w-5 h-5" />}
                headerRight={
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Add Product
                    </button>
                }
            >
                {/* Add Product Form */}
                {showAddForm && (
                    <div className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-700">
                        <h4 className="text-sm font-medium text-white mb-4">Add New Product</h4>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-2">
                                <label htmlFor="newProductName" className="sr-only">Product Name</label>
                                <input
                                    id="newProductName"
                                    type="text"
                                    placeholder="Product Name"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="newProductCategory" className="sr-only">Category</label>
                                <select
                                    id="newProductCategory"
                                    value={newProduct.category}
                                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as Product['category'] })}
                                    title="Select product category"
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                                >
                                    <option value="refilling">Refilling</option>
                                    <option value="new-supply">New Supply</option>
                                    <option value="accessories">Accessories</option>
                                    <option value="hpt">HPT</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="newProductRate" className="sr-only">Rate</label>
                                <input
                                    id="newProductRate"
                                    type="number"
                                    placeholder="Rate"
                                    value={newProduct.rate || ''}
                                    onChange={(e) => setNewProduct({ ...newProduct, rate: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddProduct}
                                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                            >
                                Add Product
                            </button>
                        </div>
                    </div>
                )}

                {/* Products by Category */}
                <div className="space-y-8 max-h-[600px] overflow-y-auto pr-2">
                    {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                        <div key={category}>
                            <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-3">
                                {categoryNames[category]} ({categoryProducts.length})
                            </h3>
                            <div className="space-y-2">
                                {categoryProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors"
                                    >
                                        {editingId === product.id ? (
                                            <>
                                                <div className="flex-1">
                                                    <label htmlFor={`edit-name-${product.id}`} className="sr-only">Product Name</label>
                                                    <input
                                                        id={`edit-name-${product.id}`}
                                                        type="text"
                                                        value={editForm.name}
                                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                        title="Edit product name"
                                                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-3 ml-4">
                                                    <label htmlFor={`edit-rate-${product.id}`} className="sr-only">Product Rate</label>
                                                    <input
                                                        id={`edit-rate-${product.id}`}
                                                        type="number"
                                                        value={editForm.rate}
                                                        onChange={(e) => setEditForm({ ...editForm, rate: parseInt(e.target.value) || 0 })}
                                                        title="Edit product rate"
                                                        className="w-24 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm text-right focus:outline-none focus:border-orange-500"
                                                    />
                                                    <button
                                                        onClick={() => handleSaveEdit(product.id)}
                                                        title="Save changes"
                                                        aria-label="Save changes"
                                                        className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        title="Cancel editing"
                                                        aria-label="Cancel editing"
                                                        className="p-1.5 text-slate-400 hover:bg-slate-700 rounded-lg transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div>
                                                    <h4 className="text-sm font-medium text-white">{product.name}</h4>
                                                    <span className="text-xs text-slate-500">{product.unit}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-base font-semibold text-orange-400">
                                                        ₹ {product.rate.toLocaleString('en-IN')}
                                                    </span>
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        title={`Edit ${product.name}`}
                                                        aria-label={`Edit ${product.name}`}
                                                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        title={`Delete ${product.name}`}
                                                        aria-label={`Delete ${product.name}`}
                                                        className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </>
    );
}
