import React, { useState, useEffect } from 'react';
import { Mail, Search, Send, FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PageShell } from '../components/ui/PageShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export default function EmailPage() {
    const [recentEmails, setRecentEmails] = useState<any[]>([]);
    const [showCompose, setShowCompose] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // Compose State
    const [leads, setLeads] = useState<any[]>([]);
    const [searchLead, setSearchLead] = useState('');
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [emailForm, setEmailForm] = useState({
        to: '',
        subject: '',
        body: ''
    });

    useEffect(() => {
        fetchEmails();
    }, []);

    // Debounced search for leads
    useEffect(() => {
        if (!showCompose) return;
        const timer = setTimeout(() => {
            if (searchLead) {
                api.get(`/leads?search=${searchLead}&limit=5`)
                    .then(res => setLeads(res.data.leads))
                    .catch(console.error);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchLead, showCompose]);

    const fetchEmails = async () => {
        try {
            const { data } = await api.get('/email');
            setRecentEmails(data);
        } catch (error) {
            console.error('Failed to fetch emails', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectLead = (lead: any) => {
        setSelectedLead(lead);
        setEmailForm(prev => ({ ...prev, to: lead.email1 || '' }));
        setSearchLead(lead.companyName);
        setLeads([]); // Hide dropdown
    };

    const handleTemplateSelect = (template: string) => {
        if (!selectedLead) return;

        const company = selectedLead.companyName;
        const contact = selectedLead.contactName1 || 'Client';

        if (template === 'GC_INTRO') {
            setEmailForm(prev => ({
                ...prev,
                subject: `Security Services for ${company} Projects`,
                body: `Hi ${contact},\n\nI noticed ${company} has several active projects in the area. Elite24 Security specializes in construction site protection...\n\nBest,\nElite24 Team`
            }));
        } else if (template === 'PM_INTRO') {
            setEmailForm(prev => ({
                ...prev,
                subject: `Security Patrol for ${company} Properties`,
                body: `Hi ${contact},\n\nAre you currently satisfied with your patrol services? We offer...\n\nBest,\nElite24 Team`
            }));
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!selectedLead) return alert('Please select a lead');

            await api.post('/email/send', {
                leadId: selectedLead.id,
                to: emailForm.to,
                subject: emailForm.subject,
                html: emailForm.body.replace(/\n/g, '<br>')
            });

            alert('Email sent!');
            setShowCompose(false);
            fetchEmails();
            // Reset
            setEmailForm({ to: '', subject: '', body: '' });
            setSelectedLead(null);
            setSearchLead('');
        } catch (error) {
            console.error(error);
            alert('Failed to send email');
        }
    };

    return (
        <PageShell
            title="Inbox"
            description="Track your communications and outreach."
            actions={
                <Button onClick={() => setShowCompose(true)}>
                    <Mail size={18} className="mr-2" />
                    Compose
                </Button>
            }
        >
            <Card noPadding className="min-h-[600px] flex flex-col">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl grid grid-cols-12 gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <div className="col-span-3">To</div>
                    <div className="col-span-1">Tag</div>
                    <div className="col-span-5">Subject</div>
                    <div className="col-span-3">Sent</div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-400">Loading emails...</div>
                    ) : recentEmails.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <Mail size={48} className="mx-auto mb-4 text-slate-200" />
                            <p>No recent emails</p>
                        </div>
                    ) : (
                        recentEmails.map(email => (
                            <div
                                onClick={() => navigate(`/leads/${email.leadId}`)}
                                key={email.id}
                                className="p-4 border-b border-gray-100 hover:bg-indigo-50/10 cursor-pointer grid grid-cols-12 gap-4 items-center group transition-colors"
                            >
                                <div className="col-span-3 text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600">
                                    {email.lead?.companyName || 'Unknown Lead'}
                                </div>
                                <div className="col-span-1">
                                    <Badge variant="info" className="text-[10px] py-0 px-2">Outbound</Badge>
                                </div>
                                <div className="col-span-5 text-sm truncate text-slate-600 font-medium">
                                    {email.subject}
                                </div>
                                <div className="col-span-3 text-xs text-slate-400">
                                    {new Date(email.createdAt).toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {/* Compose Modal */}
            {showCompose && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-[700px] max-w-full flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900">New Message</h3>
                            <button onClick={() => setShowCompose(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        <form onSubmit={handleSend} className="flex-1 flex flex-col p-6 overflow-y-auto">
                            <div className="mb-6 relative">
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Recipient Lead</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Search lead by name..."
                                        value={searchLead}
                                        onChange={e => setSearchLead(e.target.value)}
                                        required
                                    />
                                </div>
                                {/* Dropdown */}
                                {leads.length > 0 && (
                                    <div className="absolute z-10 w-full bg-white border border-gray-100 shadow-xl mt-2 rounded-xl max-h-48 overflow-y-auto">
                                        {leads.map(l => (
                                            <div
                                                key={l.id}
                                                className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                                onClick={() => handleSelectLead(l)}
                                            >
                                                <div className="font-bold text-sm text-slate-900">{l.companyName}</div>
                                                <div className="text-xs text-slate-500">{l.email1 || 'No email'}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mb-6">
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">To Email</label>
                                <input
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    value={emailForm.to}
                                    onChange={e => setEmailForm({ ...emailForm, to: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold uppercase text-slate-400">Message</label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => handleTemplateSelect('GC_INTRO')} className="text-xs border border-gray-200 px-2 py-1 rounded-md text-slate-600 hover:bg-gray-50 transition-colors">GC Intro</button>
                                        <button type="button" onClick={() => handleTemplateSelect('PM_INTRO')} className="text-xs border border-gray-200 px-2 py-1 rounded-md text-slate-600 hover:bg-gray-50 transition-colors">PM Intro</button>
                                    </div>
                                </div>

                                <input
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 mb-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                                    placeholder="Subject"
                                    value={emailForm.subject}
                                    onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
                                    required
                                />

                                <textarea
                                    className="w-full border border-gray-200 rounded-lg p-4 h-48 resize-none font-sans text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Write your message..."
                                    value={emailForm.body}
                                    onChange={e => setEmailForm({ ...emailForm, body: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="mt-auto flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <Button variant="ghost" onClick={() => setShowCompose(false)}>Cancel</Button>
                                <Button
                                    type="submit"
                                    disabled={!selectedLead}
                                    className="px-8"
                                >
                                    <Send size={16} className="mr-2" /> Send
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PageShell>
    );
}
