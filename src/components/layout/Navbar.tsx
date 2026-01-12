import React from 'react';

const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-black">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="text-2xl font-black">
                        EventHub
                    </div>

                    {/* Navigation Buttons - Segmented Control Style */}
                    <div className="flex items-center border-2 border-black">
                        <button className="px-6 py-2 font-bold uppercase text-sm border-r-2 border-black hover:bg-black hover:text-white transition-colors">
                            Discover
                        </button>
                        <button className="px-6 py-2 font-bold uppercase text-sm border-r-2 border-black hover:bg-black hover:text-white transition-colors">
                            Create Event
                        </button>
                        <button className="px-6 py-2 font-bold uppercase text-sm hover:bg-black hover:text-white transition-colors">
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
