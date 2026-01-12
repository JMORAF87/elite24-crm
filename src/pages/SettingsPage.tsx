import React, { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function SettingsPage() {
    const [settings, setSettings] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/settings');
            setSettings(data);
        } catch (error) {
            console.error('Failed to fetch settings', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.post('/settings', settings);
            alert('Settings saved successfully!');
        } catch (error) {
            alert('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setSettings((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleTestEmail = async () => {
        try {
            const res = await api.post('/email/test', {});
            alert(`Test Email Result: ${res.data.success ? 'Sent!' : 'Failed'}`);
        } catch (error) {
            alert('Failed to send test email');
        }
    };

    if (isLoading) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Settings</h1>

            <form onSubmit={handleSave} className="space-y-8">

                {/* Business Info */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h2 className="text-xl font-bold mb-4 flex items-center">Business Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Company Name</label>
                            <input
                                className="w-full border p-2 rounded"
                                value={settings['business_name'] || ''}
                                onChange={e => handleChange('business_name', e.target.value)}
                                placeholder="Elite24 Security"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                            <input
                                className="w-full border p-2 rounded"
                                value={settings['business_phone'] || ''}
                                onChange={e => handleChange('business_phone', e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
                            <input
                                className="w-full border p-2 rounded"
                                value={settings['business_address'] || ''}
                                onChange={e => handleChange('business_address', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Website</label>
                            <input
                                className="w-full border p-2 rounded"
                                value={settings['business_website'] || ''}
                                onChange={e => handleChange('business_website', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Email Settings */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Email Configuration</h2>
                        <button type="button" onClick={handleTestEmail} className="text-xs bg-gray-100 px-3 py-1 rounded hover:bg-gray-200 flex items-center">
                            <RefreshCw size={12} className="mr-1" /> Test Email
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">From Name</label>
                            <input
                                className="w-full border p-2 rounded"
                                value={settings['email_fromName'] || ''}
                                onChange={e => handleChange('email_fromName', e.target.value)}
                                placeholder="Elite24 Sales"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">From Email (Verified)</label>
                            <input
                                className="w-full border p-2 rounded"
                                value={settings['email_fromAddress'] || ''}
                                onChange={e => handleChange('email_fromAddress', e.target.value)}
                                placeholder="sales@elite24.com"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                                Email Provider is currently set to <strong>Resend</strong> via Environment Variables.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quote Defaults */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h2 className="text-xl font-bold mb-4">Quote Defaults</h2>
                    <div className="bg-amber-50 p-3 rounded text-sm text-amber-800 mb-4 border border-amber-200">
                        Base rates are loaded from <code>src/data/quoteConfig.ts</code>. You can edit them there.
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Rate: Unarmed</label>
                            <input
                                type="number"
                                className="w-full border p-2 rounded"
                                value={settings['rate_unarmed'] || '25'}
                                onChange={e => handleChange('rate_unarmed', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Rate: Armed</label>
                            <input
                                type="number"
                                className="w-full border p-2 rounded"
                                value={settings['rate_armed'] || '35'}
                                onChange={e => handleChange('rate_armed', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Rate: Patrol</label>
                            <input
                                type="number"
                                className="w-full border p-2 rounded"
                                value={settings['rate_patrol'] || '45'}
                                onChange={e => handleChange('rate_patrol', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-black text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 flex items-center text-lg disabled:opacity-50"
                    >
                        <Save size={20} className="mr-2" /> Save Settings
                    </button>
                </div>
            </form>
        </div>
    );
}
