import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Trello, FolderOpen, Mail, FileText, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
    const location = useLocation();

    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
        { icon: Users, label: 'Clients', path: '/leads' },
        { icon: Trello, label: 'Pipeline', path: '/pipeline' },
        { icon: FolderOpen, label: 'Projects', path: '/projects' },
        { icon: Mail, label: 'Inbox', path: '/email' },
        { icon: FileText, label: 'Quotes', path: '/quotes' },
    ];

    return (
        <aside className="w-64 bg-[#F8F9FC] border-r border-gray-100 flex flex-col h-screen sticky top-0">
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-indigo-200 shadow-md">
                        E
                    </div>
                    <span className="text-xl font-bold text-slate-900 tracking-tight">Elite24</span>
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
                <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Menu</p>
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                                }`}
                        >
                            <item.icon
                                size={18}
                                className={`mr-3 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                            />
                            {item.label}
                        </Link>
                    );
                })}

                <div className="mt-8">
                    <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">System</p>
                    <Link
                        to="/settings"
                        className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${location.pathname === '/settings'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                            }`}
                    >
                        <Settings size={18} className="mr-3 text-slate-400 group-hover:text-slate-600" />
                        Settings
                    </Link>
                </div>
            </nav>

            <div className="p-4 m-4 bg-indigo-50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs ring-2 ring-white">
                        AU
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-slate-900 truncate">Admin User</p>
                        <p className="text-xs text-slate-500 truncate">admin@elite24.com</p>
                    </div>
                </div>
                <button className="w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700 py-1.5 hover:bg-indigo-100 rounded-lg transition-colors">
                    <LogOut size={14} />
                    Log Out
                </button>
            </div>
        </aside>
    );
}
