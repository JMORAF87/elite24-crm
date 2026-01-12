import React from 'react';

interface PageShellProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const PageShell: React.FC<PageShellProps> = ({
    title,
    description,
    children,
    actions
}) => {
    return (
        <div className="animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                    {description && <p className="text-slate-500 mt-1">{description}</p>}
                </div>
                {actions && <div className="flex items-center gap-3">{actions}</div>}
            </header>
            <main>
                {children}
            </main>
        </div>
    );
};
