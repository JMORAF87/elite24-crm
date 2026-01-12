import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, MapPin, Globe, Save, Edit2, Send, Plus
} from 'lucide-react';
import api from '../services/api';
import { LeadInfo } from '../components/leads/LeadInfo';
import { LeadActivity } from '../components/leads/LeadActivity';
import { LeadTasks } from '../components/leads/LeadTasks';
import { LeadQuotes } from '../components/leads/LeadQuotes';
import { PageShell } from '../components/ui/PageShell'; // Assuming PageShell is desired, but keeping layout native for now

export default function LeadDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lead, setLead] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [quotes, setQuotes] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>({});
    const [activeTab, setActiveTab] = useState('activity');
    const [isLoading, setIsLoading] = useState(true);

    // Edit Mode
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({});

    // Task Creation
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', dueDate: '' });

    // Quote Creation
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [quoteStep, setQuoteStep] = useState<'details' | 'draft'>('details');
    const [activeKnowledge, setActiveKnowledge] = useState<any>(null);
    const [quoteDraft, setQuoteDraft] = useState('');
    const [newQuote, setNewQuote] = useState({
        serviceType: 'CONSTRUCTION_SITE',
        guardType: 'UNARMED',
        hoursPerWeek: 40,
        hourlyRate: 25
    });

    // Email Modal
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailData, setEmailData] = useState({
        to: '',
        subject: '',
        html: ''
    });

    useEffect(() => {
        fetchData();
    }, [id]);

    // Fetch knowledge when opening quote modal
    useEffect(() => {
        if (showQuoteModal) {
            api.get('/quotes/knowledge').then(res => {
                if (res.data && res.data.content) {
                    try {
                        const parsed = JSON.parse(res.data.content);
                        setActiveKnowledge(parsed);
                    } catch (e) {
                        console.error('Invalid knowledge JSON');
                    }
                }
            });
        }
    }, [showQuoteModal]);

    const fetchData = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            // 1. Fetch Lead separately to handle 404 gracefully
            let leadData;
            try {
                const leadRes = await api.get(`/leads/${id}`);
                leadData = leadRes.data;
                setLead(leadData);
            } catch (error: any) {
                if (error.response?.status === 404) {
                    setLead(null);
                    return;
                }
                throw error;
            }

            // 2. Initialize form immediately if lead exists
            if (leadData) {
                setEditForm({
                    companyName: leadData.companyName || '',
                    segment: leadData.segment || 'COMMERCIAL_PM',
                    focus: leadData.focus || '',
                    address: leadData.address || '',
                    city: leadData.city || '',
                    state: leadData.state || '',
                    zip: leadData.zip || '',
                    phone: leadData.phone || '',
                    website: leadData.website || '',
                    contactName1: leadData.contactName1 || '', role1: leadData.role1 || '', email1: leadData.email1 || '',
                    contactName2: leadData.contactName2 || '', role2: leadData.role2 || '', email2: leadData.email2 || '',
                    contactName3: leadData.contactName3 || '', role3: leadData.role3 || '', email3: leadData.email3 || '',
                    priority: leadData.priority || 'MEDIUM',
                    status: leadData.status || 'NEW',
                    contactFormURL: leadData.contactFormURL || '',
                    rating: leadData.rating || '',
                    reviewCount: leadData.reviewCount || ''
                });

                if (leadData.email1) {
                    setEmailData(prev => ({ ...prev, to: leadData.email1 }));
                }

                // Check for edit mode param
                const params = new URLSearchParams(window.location.search);
                if (params.get('edit') === 'true') {
                    setIsEditing(true);
                }
            }

            // 3. Fetch auxiliary data
            try {
                const [activityRes, taskRes, quoteRes, settingsRes] = await Promise.all([
                    api.get(`/activities?leadId=${id}`),
                    api.get(`/tasks?leadId=${id}`),
                    api.get(`/quotes?leadId=${id}`),
                    api.get('/settings')
                ]);
                setActivities(activityRes.data);
                setTasks(taskRes.data);
                setQuotes(quoteRes.data);
                setSettings(settingsRes.data);
            } catch (auxError) {
                console.error('Failed to fetch auxiliary data:', auxError);
            }

        } catch (error: any) {
            console.error('Critical failure fetching lead:', error);
            const msg = error.response ? `Server Error: ${error.response.status} ${error.response.data?.error || ''}` : error.message;
            alert(`Error loading details: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveLead = async () => {
        try {
            await api.patch(`/leads/${id}`, editForm);
            setLead(editForm);
            setIsEditing(false);
            // Log activity
            await api.post('/activities', {
                leadId: id, type: 'NOTE', subject: 'Lead Updated', bodyPreview: 'Lead details updated manually'
            });
            fetchData(); // Refresh all
        } catch (err) {
            alert('Failed to save changes');
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/tasks', { ...newTask, leadId: id });
            setShowTaskModal(false);
            setNewTask({ title: '', dueDate: '' });
            fetchData();
        } catch (err) {
            alert('Failed to add task');
        }
    };

    const handleGenerateDraft = async () => {
        try {
            const res = await api.post('/quotes/draft-suggest', {
                leadId: id,
                ...newQuote,
                knowledge: activeKnowledge
            });
            setQuoteDraft(res.data.draft);
        } catch (error) {
            alert('Failed to generate draft');
        }
    };

    const handleCreateQuote = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const rate = Number(newQuote.hourlyRate);
            const hours = Number(newQuote.hoursPerWeek);
            const monthly = rate * hours * 4.33;

            await api.post('/quotes', {
                leadId: id,
                ...newQuote,
                totalAmount: monthly,
                notes: quoteDraft,
                draftText: quoteDraft,
                pricingSnapshot: activeKnowledge,
                status: 'DRAFT'
            });
            setShowQuoteModal(false);
            setQuoteStep('details');
            setQuoteDraft('');
            fetchData();
        } catch (err) {
            alert('Failed to create quote');
        }
    };

    // Update rate when guard type changes
    useEffect(() => {
        if (!showQuoteModal || !activeKnowledge || !activeKnowledge.rates) return;
        const serviceKey = newQuote.serviceType === 'CONSTRUCTION_SITE' ? 'constructionSite'
            : newQuote.serviceType === 'COMMERCIAL_PROPERTY' ? 'commercialProperty'
                : 'constructionSite';
        const guardKey = newQuote.guardType === 'UNARMED' ? 'unarmed'
            : newQuote.guardType === 'ARMED' ? 'armed'
                : newQuote.guardType === 'PATROL' ? 'patrol'
                    : 'unarmed';
        const rate = activeKnowledge.rates[serviceKey]?.[guardKey] || 25;
        setNewQuote(prev => ({ ...prev, hourlyRate: rate }));
    }, [newQuote.guardType, newQuote.serviceType, showQuoteModal, activeKnowledge]);

    // Update service type default based on segment
    useEffect(() => {
        if (showQuoteModal && lead) {
            if (lead.segment === 'GC') {
                setNewQuote(prev => ({ ...prev, serviceType: 'CONSTRUCTION_SITE' }));
            } else if (lead.segment === 'COMMERCIAL_PM') {
                setNewQuote(prev => ({ ...prev, serviceType: 'COMMERCIAL_PROPERTY' }));
            }
        }
    }, [showQuoteModal, lead]);


    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/email/send', {
                leadId: id,
                to: emailData.to,
                subject: emailData.subject,
                html: emailData.html
            });
            setShowEmailModal(false);
            setEmailData({ to: lead?.email1 || '', subject: '', html: '' });
            alert('Email sent successfully!');
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Email not sent – check email settings');
        }
    };

    const openEmailForQuote = (quote: any) => {
        const ctx = activeKnowledge?.context || {
            name: settings.companyName || "Elite 24 Security",
            phone: settings.phone || "555-0199",
            website: settings.website || "www.elite24.com",
            email: settings.email || "dispatch@elite24.com"
        };
        const signature = `\n\n${ctx.name}\n${ctx.phone || ''}\n${ctx.website || ''}\n${ctx.email}`;

        setEmailData({
            to: lead.email1 || '',
            subject: `Security Services Quote - ${lead.companyName}`,
            html: `Dear ${lead.contactName1 || 'Client'},<br><br>Here is the quote we discussed:<br><br>
             <strong>Service:</strong> ${quote.serviceType}<br>
             <strong>Details:</strong> ${quote.guardType}<br>
             <strong>Estimate:</strong> $${quote.monthlyEstimate?.toLocaleString() || quote.totalAmount?.toLocaleString()}/month<br><br>
             Looking forward to working with you.${signature.replace(/\n/g, '<br>')}`
        });
        setShowEmailModal(true);
    };

    const openGeneralEmail = () => {
        setEmailData(prev => ({ ...prev, to: lead.email1 || '', subject: '', html: '' }));
        setShowEmailModal(true);
    };

    if (isLoading) return <div className="p-8">Loading...</div>;
    if (!lead) return <div className="p-8">Lead not found</div>;

    return (
        <div className="relative">
            <div className="mb-6">
                <button
                    onClick={() => navigate('/leads')}
                    className="flex items-center text-gray-500 hover:text-black mb-4"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Leads
                </button>

                <div className="flex justify-between items-start">
                    <div>
                        {isEditing ? (
                            <input
                                value={editForm.companyName}
                                onChange={e => setEditForm({ ...editForm, companyName: e.target.value })}
                                className="text-3xl font-bold mb-2 border-b border-black focus:outline-none w-full"
                            />
                        ) : (
                            <h1 className="text-3xl font-bold mb-2">{lead.companyName}</h1>
                        )}

                        <div className="flex items-center gap-4 text-gray-500">
                            <span className="flex items-center">
                                <MapPin size={16} className="mr-1" />
                                {isEditing ? (
                                    <div className="flex gap-1">
                                        <input value={editForm.city || ''} onChange={e => setEditForm({ ...editForm, city: e.target.value })} className="border rounded px-1 w-24" placeholder="City" />
                                        <input value={editForm.state || ''} onChange={e => setEditForm({ ...editForm, state: e.target.value })} className="border rounded px-1 w-16" placeholder="State" />
                                        <input value={editForm.zip || ''} onChange={e => setEditForm({ ...editForm, zip: e.target.value })} className="border rounded px-1 w-20" placeholder="Zip" />
                                    </div>
                                ) : (
                                    <span>{lead.city || 'City'}, {lead.state || 'State'} {lead.zip}</span>
                                )}
                            </span>
                            <span className="flex items-center">
                                <Globe size={16} className="mr-1" />
                                {isEditing ? (
                                    <input value={editForm.website || ''} onChange={e => setEditForm({ ...editForm, website: e.target.value })} className="border rounded px-1 w-48" placeholder="Website" />
                                ) : (
                                    lead.website ? <a href={lead.website} target="_blank" rel="noreferrer" className="hover:underline">{lead.website}</a> : 'No website'
                                )}
                            </span>
                        </div>
                        {isEditing && (
                            <div className="mt-2">
                                <input value={editForm.address || ''} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="border rounded px-1 w-full" placeholder="Street Address" />
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        {isEditing ? (
                            <>
                                <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-gray-300 rounded-lg font-bold hover:bg-gray-50">Cancel</button>
                                <button onClick={handleSaveLead} className="px-4 py-2 bg-neon-pink text-black rounded-lg font-bold hover:bg-pink-400 flex items-center">
                                    <Save size={16} className="mr-2" /> Save
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setIsEditing(true)} className="px-4 py-2 border border-black rounded-lg font-bold hover:bg-gray-50 flex items-center">
                                    <Edit2 size={16} className="mr-2" /> Edit
                                </button>
                                <button onClick={openGeneralEmail} className="px-4 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 flex items-center">
                                    <Send size={16} className="mr-2" /> Send Email
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <LeadInfo
                    lead={lead}
                    isEditing={isEditing}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    onSave={handleSaveLead}
                    onCancel={() => setIsEditing(false)}
                    onEdit={() => setIsEditing(true)}
                    onEmail={openGeneralEmail}
                />

                {/* Right Column: Activity/Tasks/Quotes */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                        <div className="flex border-b border-gray-100">
                            {['activity', 'tasks', 'quotes'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-4 font-bold text-sm uppercase tracking-wide ${activeTab === tab
                                        ? 'border-b-2 border-neon-pink text-black'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="p-6">
                            {activeTab === 'activity' && <LeadActivity activities={activities} />}
                            {activeTab === 'tasks' && <LeadTasks tasks={tasks} onAddTask={() => setShowTaskModal(true)} />}
                            {activeTab === 'quotes' && <LeadQuotes quotes={quotes} onCreateQuote={() => setShowQuoteModal(true)} onEmailQuote={openEmailForQuote} />}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {/* Task Modal */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-96">
                        <h3 className="font-bold text-xl mb-4">Add Task</h3>
                        <form onSubmit={handleAddTask}>
                            <input
                                className="w-full border p-2 rounded mb-3"
                                placeholder="Task Title"
                                required
                                value={newTask.title}
                                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                            />
                            <input
                                type="date"
                                className="w-full border p-2 rounded mb-4"
                                value={newTask.dueDate}
                                onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                            />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-black text-white rounded font-bold">Add Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Quote Modal */}
            {showQuoteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-[500px] max-w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xl">Create Quote</h3>
                            <div className="flex bg-gray-100 rounded p-1">
                                <button
                                    onClick={() => setQuoteStep('details')}
                                    className={`px-3 py-1 text-xs font-bold rounded ${quoteStep === 'details' ? 'bg-white shadow' : 'text-gray-500'}`}
                                >
                                    DETAILS
                                </button>
                                <button
                                    onClick={() => setQuoteStep('draft')}
                                    className={`px-3 py-1 text-xs font-bold rounded ${quoteStep === 'draft' ? 'bg-white shadow' : 'text-gray-500'}`}
                                >
                                    DRAFTING
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleCreateQuote}>
                            {quoteStep === 'details' ? (
                                <div className="space-y-3 mb-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase">Service</label>
                                        <select className="w-full border p-2 rounded" value={newQuote.serviceType} onChange={e => setNewQuote({ ...newQuote, serviceType: e.target.value })}>
                                            <option value="CONSTRUCTION_SITE">Construction Site</option>
                                            <option value="COMMERCIAL_PROPERTY">Commercial Property</option>
                                            <option value="EVENT">Event Security</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase">Guard Type</label>
                                        <select className="w-full border p-2 rounded" value={newQuote.guardType} onChange={e => setNewQuote({ ...newQuote, guardType: e.target.value })}>
                                            <option value="UNARMED">Unarmed Guard</option>
                                            <option value="ARMED">Armed Guard</option>
                                            <option value="PATROL">Vehicle Patrol</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-xs font-bold uppercase">Hrs/Week</label>
                                            <input type="number" className="w-full border p-2 rounded" value={newQuote.hoursPerWeek} onChange={e => setNewQuote({ ...newQuote, hoursPerWeek: Number(e.target.value) })} />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs font-bold uppercase">Rate ($/hr)</label>
                                            <input type="number" className="w-full border p-2 rounded" value={newQuote.hourlyRate} onChange={e => setNewQuote({ ...newQuote, hourlyRate: Number(e.target.value) })} />
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded text-center">
                                        <span className="text-xs text-gray-500 block">Estimated Monthly</span>
                                        <span className="text-xl font-bold">${(newQuote.hourlyRate * newQuote.hoursPerWeek * 4.33).toLocaleString()}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold uppercase text-gray-500">Quote Logic: {activeKnowledge ? 'ACTIVE' : 'DEFAULT'}</label>
                                        <button
                                            type="button"
                                            onClick={handleGenerateDraft}
                                            className="text-xs bg-neon-pink text-black px-2 py-1 rounded font-bold hover:bg-pink-400"
                                        >
                                            Generate Proposal
                                        </button>
                                    </div>
                                    <textarea
                                        className="w-full border p-3 rounded h-48 text-sm leading-relaxed"
                                        placeholder="Click Generate to create a draft based on config..."
                                        value={quoteDraft}
                                        onChange={e => setQuoteDraft(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-400">
                                        This text will be saved with the quote and can be used in emails.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowQuoteModal(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-black text-white rounded font-bold">
                                    {quoteStep === 'details' ? 'Next / Save' : 'Create Quote'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Email Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-[600px] max-w-full">
                        <h3 className="font-bold text-xl mb-4">Send Email</h3>
                        <form onSubmit={handleSendEmail}>
                            <div className="space-y-3 mb-4">
                                <input
                                    className="w-full border p-2 rounded"
                                    placeholder="To"
                                    required
                                    value={emailData.to}
                                    onChange={e => setEmailData({ ...emailData, to: e.target.value })}
                                />
                                <input
                                    className="w-full border p-2 rounded"
                                    placeholder="Subject"
                                    required
                                    value={emailData.subject}
                                    onChange={e => setEmailData({ ...emailData, subject: e.target.value })}
                                />
                                <textarea
                                    className="w-full border p-2 rounded h-40"
                                    placeholder="Message (HTML supported)"
                                    required
                                    value={emailData.html}
                                    onChange={e => setEmailData({ ...emailData, html: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowEmailModal(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-black text-white rounded font-bold flex items-center">
                                    <Send size={16} className="mr-2" /> Send
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
