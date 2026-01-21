'use client';

interface HeaderProps {
    title: string;
    subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
    const today = new Date();
    const dateString = today.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <header className="h-20 flex items-center justify-between border-b border-slate-700 mb-8 sticky top-0 bg-slate-900 z-40">
            <div>
                <h2 className="text-2xl font-semibold text-white">{title}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
            </div>
            <div className="px-5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-400">
                {dateString}
            </div>
        </header>
    );
}
