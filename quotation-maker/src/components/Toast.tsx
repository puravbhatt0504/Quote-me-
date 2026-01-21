'use client';

import { Check, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose?: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
    const icons = {
        success: <Check className="w-5 h-5" />,
        error: <X className="w-5 h-5" />,
        warning: <AlertTriangle className="w-5 h-5" />,
    };

    const colors = {
        success: 'border-l-green-500 text-green-400',
        error: 'border-l-red-500 text-red-400',
        warning: 'border-l-yellow-500 text-yellow-400',
    };

    return (
        <div
            onClick={onClose}
            className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-4 bg-slate-800 border border-slate-700 border-l-4 ${colors[type]} rounded-xl shadow-lg z-50 animate-slide-in cursor-pointer hover:bg-slate-750 transition-colors`}
        >
            {icons[type]}
            <span className="text-white">{message}</span>
        </div>
    );
}
