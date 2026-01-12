import React from 'react';
import { MapPin, Globe, Mail, Save, Edit2, Send, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button'; // Assuming we want to use the new UI components eventually, but sticking to existing style for now to minimize breakage? 
// Actually, the current LeadDetailPage uses raw HTML/Tailwind classes heavily. I should duplicate that first.

interface LeadInfoProps {
    lead: any;
    isEditing: boolean;
    editForm: any;
    setEditForm: (form: any) => void;
    onSave: () => void;
    onCancel: () => void;
    onEdit: () => void;
    onEmail: () => void;
}

export function LeadInfo({ lead, isEditing, editForm, setEditForm, onSave, onCancel, onEdit, onEmail }: LeadInfoProps) {
    if (!lead) return null;

    return (
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-4">Lead Details</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                        {isEditing ? (
                            <select
                                value={editForm.status}
                                onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                className="block w-full mt-1 border rounded p-1"
                            >
                                {['NEW', 'ATTEMPTED', 'CONNECTED', 'MEETING_SET', 'QUOTE_SENT', 'WON', 'LOST'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        ) : (
                            <div className="mt-1"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{lead.status}</span></div>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Priority</label>
                        {isEditing ? (
                            <select
                                value={editForm.priority}
                                onChange={e => setEditForm({ ...editForm, priority: e.target.value })}
                                className="block w-full mt-1 border rounded p-1"
                            >
                                {['HIGH', 'MEDIUM', 'LOW'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        ) : (
                            <div className="mt-1 font-medium">{lead.priority}</div>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Segment</label>
                        {isEditing ? (
                            <select
                                value={editForm.segment}
                                onChange={e => setEditForm({ ...editForm, segment: e.target.value })}
                                className="block w-full mt-1 border rounded p-1"
                            >
                                <option value="GC">GC</option>
                                <option value="COMMERCIAL_PM">Commercial PM</option>
                            </select>
                        ) : (
                            <div className="mt-1 font-medium">{lead.segment}</div>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Focus</label>
                        {isEditing ? (
                            <input value={editForm.focus || ''} onChange={e => setEditForm({ ...editForm, focus: e.target.value })} className="block w-full mt-1 border rounded p-1" />
                        ) : (
                            <div className="mt-1 font-medium">{lead.focus || '-'}</div>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                        {isEditing ? (
                            <input value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="block w-full mt-1 border rounded p-1" />
                        ) : (
                            <div className="mt-1 font-medium">{lead.phone || '-'}</div>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Rating / Reviews</label>
                        {isEditing ? (
                            <div className="flex gap-2">
                                <input type="number" step="0.1" placeholder="4.5" value={editForm.rating || ''} onChange={e => setEditForm({ ...editForm, rating: parseFloat(e.target.value) })} className="block w-full mt-1 border rounded p-1" />
                                <input type="number" placeholder="Count" value={editForm.reviewCount || ''} onChange={e => setEditForm({ ...editForm, reviewCount: parseInt(e.target.value) })} className="block w-full mt-1 border rounded p-1" />
                            </div>
                        ) : (
                            <div className="mt-1 font-medium">{lead.rating ? `${lead.rating} (${lead.reviewCount || 0} reviews)` : '-'}</div>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Contact Form</label>
                        {isEditing ? (
                            <input value={editForm.contactFormURL || ''} onChange={e => setEditForm({ ...editForm, contactFormURL: e.target.value })} className="block w-full mt-1 border rounded p-1 text-xs" />
                        ) : (
                            <div className="mt-1 font-medium truncate text-xs"><a href={lead.contactFormURL} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{lead.contactFormURL || '-'}</a></div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-4">Contacts</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => {
                        if (isEditing) {
                            return (
                                <div key={i} className="pb-4 border-b">
                                    <label className="text-xs font-bold text-gray-400 mb-1 block">Contact {i}</label>
                                    <input placeholder="Name" value={editForm[`contactName${i}`] || ''} onChange={e => setEditForm({ ...editForm, [`contactName${i}`]: e.target.value })} className="w-full mb-1 border rounded px-1" />
                                    <input placeholder="Role" value={editForm[`role${i}`] || ''} onChange={e => setEditForm({ ...editForm, [`role${i}`]: e.target.value })} className="w-full mb-1 border rounded px-1 text-sm" />
                                    <input placeholder="Email" value={editForm[`email${i}`] || ''} onChange={e => setEditForm({ ...editForm, [`email${i}`]: e.target.value })} className="w-full border rounded px-1 text-sm" />
                                </div>
                            )
                        }
                        const name = lead[`contactName${i}`];
                        if (!name && !isEditing) return null;
                        return (
                            <div key={i} className="pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                <div className="font-bold">{name}</div>
                                <div className="text-sm text-gray-500 mb-1">{lead[`role${i}`]}</div>
                                <div className="flex items-center text-sm text-gray-600 gap-3">
                                    {lead[`email${i}`] && (
                                        <a href={`mailto:${lead[`email${i}`]}`} className="hover:text-neon-pink flex items-center">
                                            <Mail size={14} className="mr-1" /> {lead[`email${i}`]}
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
