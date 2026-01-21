'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    FilePlus,
    Package,
    Clock,
    Settings,
    Flame
} from 'lucide-react';

const navItems = [
    { href: '/', icon: FilePlus, label: 'New Quotation' },
    { href: '/products', icon: Package, label: 'Product Rates' },
    { href: '/history', icon: Clock, label: 'History' },
    { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-[280px] bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700 flex flex-col z-50">
            {/* Logo Section */}
            <div className="p-6 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                        <Flame className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">City Fire</h1>
                        <span className="text-xs text-slate-500 uppercase tracking-wider">Quotation Maker</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                transition-all duration-200 relative overflow-hidden
                ${isActive
                                    ? 'bg-gradient-to-r from-orange-500/15 to-transparent text-orange-400'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }
              `}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-orange-500" />
                            )}
                            <Icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700">
                <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl">
                    <span className="text-xl">🔥</span>
                    <span className="text-sm text-orange-300">ISO 9001:2015 Certified</span>
                </div>
            </div>
        </aside>
    );
}
