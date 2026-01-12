import React, { useState } from 'react';
import axios from 'axios';
import { Shield, CheckCircle } from 'lucide-react';

export default function LandingPage() {
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        segment: 'COMMERCIAL_PM',
        city: '',
        notes: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post('http://localhost:3001/api/public/leads', formData);
            setSubmitted(true);
        } catch (err) {
            alert('Something went wrong. Please try again or call us.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
                <div>
                    <CheckCircle className="text-neon-pink w-20 h-20 mx-auto mb-6" />
                    <h1 className="text-5xl font-bold mb-4">Request Received</h1>
                    <p className="text-xl text-gray-400 mb-8">We will contact you shortly to confirm your details.</p>
                    <a href="/amarillo-security" className="text-neon-pink hover:underline">Return Home</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            <nav className="p-6 border-b border-gray-800">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <span className="text-2xl font-bold text-neon-pink flex items-center">
                        <Shield className="mr-2" /> ELITE24 SECURITY
                    </span>
                    <a href="#contact" className="px-6 py-2 bg-neon-pink text-black font-bold hover:bg-pink-400 transition">
                        Get Quote
                    </a>
                </div>
            </nav>

            <header className="py-20 px-6 text-center border-b border-gray-800 bg-[size:50px_50px] bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)]">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                    PREMIUM SECURITY <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-purple-500">
                        SERVICES IN AMARILLO
                    </span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                    Professional armed and unarmed guards for construction sites, commercial properties, and events. 24/7 protection you can trust.
                </p>
                <div className="flex justify-center gap-4">
                    <a href="#contact" className="px-8 py-4 bg-neon-pink text-black font-bold text-lg hover:transform hover:-translate-y-1 transition shadow-[4px_4px_0px_white]">
                        SECURE YOUR SITE
                    </a>
                    <button className="px-8 py-4 border-2 border-white font-bold text-lg hover:bg-white hover:text-black transition">
                        LEARN MORE
                    </button>
                </div>
            </header>

            <div id="contact" className="max-w-4xl mx-auto py-20 px-6">
                <div className="bg-white text-black p-8 md:p-12 rounded-2xl shadow-2xl">
                    <h2 className="text-3xl font-bold mb-8 text-center">Get Your Free Security Analysis</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="font-bold text-sm uppercase text-gray-500">I need security for</label>
                            <select
                                className="w-full mt-1 p-3 border-2 border-gray-200 rounded-lg focus:border-neon-pink focus:outline-none"
                                value={formData.segment}
                                onChange={e => setFormData({ ...formData, segment: e.target.value })}
                            >
                                <option value="CONSTRUCTION_GC">Construction Site (GC)</option>
                                <option value="COMMERCIAL_PM">Commercial Property</option>
                                <option value="EVENT">Event / Venue</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-bold text-sm uppercase text-gray-500">Name</label>
                            <input
                                required
                                className="w-full mt-1 p-3 border-2 border-gray-200 rounded-lg focus:border-neon-pink focus:outline-none"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="font-bold text-sm uppercase text-gray-500">Company</label>
                            <input
                                required
                                className="w-full mt-1 p-3 border-2 border-gray-200 rounded-lg focus:border-neon-pink focus:outline-none"
                                placeholder="Amarillo Construction Info"
                                value={formData.company}
                                onChange={e => setFormData({ ...formData, company: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="font-bold text-sm uppercase text-gray-500">Phone</label>
                            <input
                                required
                                type="tel"
                                className="w-full mt-1 p-3 border-2 border-gray-200 rounded-lg focus:border-neon-pink focus:outline-none"
                                placeholder="(806) 555-0123"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="font-bold text-sm uppercase text-gray-500">Email</label>
                            <input
                                required
                                type="email"
                                className="w-full mt-1 p-3 border-2 border-gray-200 rounded-lg focus:border-neon-pink focus:outline-none"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="font-bold text-sm uppercase text-gray-500">City</label>
                            <input
                                className="w-full mt-1 p-3 border-2 border-gray-200 rounded-lg focus:border-neon-pink focus:outline-none"
                                placeholder="Amarillo"
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="font-bold text-sm uppercase text-gray-500">Special Requirements</label>
                            <textarea
                                className="w-full mt-1 p-3 border-2 border-gray-200 rounded-lg focus:border-neon-pink focus:outline-none h-24"
                                placeholder="Overnight patrol needed..."
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2 mt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-neon-pink text-black font-extrabold text-xl rounded-lg hover:opacity-90 transition disabled:opacity-50"
                            >
                                {isSubmitting ? 'Sending...' : 'REQUEST QUOTE'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
