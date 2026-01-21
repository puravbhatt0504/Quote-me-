'use client';

import { ReactNode } from 'react';

interface CardProps {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
    headerRight?: ReactNode;
    className?: string;
}

export default function Card({ title, icon, children, headerRight, className = '' }: CardProps) {
    return (
        <div className={`bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden mb-6 ${className}`}>
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between bg-gradient-to-b from-white/[0.02] to-transparent">
                <h3 className="flex items-center gap-3 text-lg font-semibold text-white">
                    {icon && <span className="text-orange-400">{icon}</span>}
                    {title}
                </h3>
                {headerRight}
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}
