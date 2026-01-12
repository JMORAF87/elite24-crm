import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, ChevronRight } from 'lucide-react';

export default function TopBar() {
    const location = useLocation();

    // Simple breadcrumb generation
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = pathSegments.map(segment =>
        segment.charAt(0).toUpperCase() + segment.slice(1)
    );

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10 w-full">
            <div className="flex items-center text-sm text-slate-500">
                <span className="hover:text-slate-900 cursor-pointer transition-colors">App</span>
                {breadcrumbs.length > 0 && (
                    <>
                        <ChevronRight size={14} className="mx-2 text-slate-400" />
                        <span className="font-medium text-slate-900">{breadcrumbs[0]}</span>
                    </>
                )}
                {breadcrumbs.length > 1 && (
                    <>
                        <ChevronRight size={14} className="mx-2 text-slate-400" />
                        <span className="text-slate-500">{breadcrumbs[1]}</span>
                    </>
                )}
            </div>

            <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-9 pr-4 py-1.5 bg-gray-50 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-100 w-64 transition-all"
                    />
                </div>

                <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-full relative transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm cursor-pointer">
                    AU
                </div>
            </div>
        </header>
    );
}
