import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout() {
    return (
        <div className="flex h-screen bg-[#F8F9FC] overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <TopBar />
                <main className="flex-1 overflow-auto p-8 scrollbar-hide">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
