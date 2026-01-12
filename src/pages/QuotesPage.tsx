import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, FileText, Brain, List as ListIcon, Save, Clock } from 'lucide-react';
import api from '../services/api';
import { PageShell } from '../components/ui/PageShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function QuotesPage() {
    const [quotes, setQuotes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'list' | 'knowledge'>('list');
    const [knowledge, setKnowledge] = useState('');
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchQuotes();
    }, [statusFilter]);

    useEffect(() => {
        if (activeTab === 'knowledge') {
            fetchKnowledge();
        }
    }, [activeTab]);

    const fetchQuotes = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'ALL') params.append('status', statusFilter);

            const res = await api.get(`/quotes?${params}`);
            setQuotes(res.data);
        } catch (error) {
            console.error('Failed to fetch quotes', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchKnowledge = async () => {
        try {
            const res = await api.get('/quotes/knowledge');
            if (res.data) {
                setKnowledge(res.data.content);
                setLastUpdated(res.data.updatedAt);
            }
        } catch (error) {
            console.error('Failed to fetch knowledge:', error);
        }
    };

    const handleSaveKnowledge = async () => {
        setIsSaving(true);
        try {
            try {
                JSON.parse(knowledge);
            } catch (e) {
                alert('Invalid JSON format');
                setIsSaving(false);
                return;
            }

            await api.post('/quotes/knowledge', {
                content: knowledge,
                contentType: 'json'
            });
            setLastUpdated(new Date().toISOString());
        } catch (error) {
            console.error('Failed to save knowledge:', error);
            alert('Failed to save knowledge');
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'ACCEPTED': return 'success';
            case 'DECLINED': return 'error';
            case 'SENT': return 'info';
            case 'DRAFT': return 'neutral';
            default: return 'default';
        }
    };

    return (
        <PageShell
            title="Quotes & Proposals"
            description="Manage your quotes and configure automated pricing logic."
            actions={
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <ListIcon size={16} /> List
                    </button>
                    <button
                        onClick={() => setActiveTab('knowledge')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'knowledge' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Brain size={16} /> Quote Brain
                    </button>
                </div>
            }
        >
            {activeTab === 'list' && (
                <Card noPadding>
                    <div className="p-4 border-b border-gray-100 flex justify-end">
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-gray-50 border-none rounded-lg px-4 py-2 pr-8 text-sm font-medium text-slate-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer hover:bg-gray-100 transition-colors appearance-none"
                            >
                                <option value="ALL">All Status</option>
                                <option value="DRAFT">Draft</option>
                                <option value="SENT">Sent</option>
                                <option value="ACCEPTED">Accepted</option>
                                <option value="DECLINED">Declined</option>
                            </select>
                            <Filter size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Lead</th>
                                    <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Service</th>
                                    <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                                    <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading quotes...</td></tr>
                                ) : quotes.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-500">
                                            <FileText size={48} className="mx-auto mb-4 text-slate-200" />
                                            <p>No quotes found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    quotes.map(q => (
                                        <tr
                                            key={q.id}
                                            onClick={() => navigate(`/leads/${q.leadId}`)}
                                            className="hover:bg-indigo-50/30 cursor-pointer transition-colors group"
                                        >
                                            <td className="p-4">
                                                <div className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{q.lead?.companyName || 'Unknown Lead'}</div>
                                                <div className="text-xs text-slate-500">{q.lead?.contactName1}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-slate-700">{q.serviceType}</div>
                                                <div className="text-xs text-slate-500">{q.guardType}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-900">
                                                    ${q.monthlyEstimate?.toLocaleString() || q.totalAmount?.toLocaleString()}/mo
                                                </div>
                                                <div className="text-xs text-slate-400">{q.hoursPerWeek} hours/week</div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={getStatusVariant(q.status)}>{q.status}</Badge>
                                            </td>
                                            <td className="p-4 text-sm text-slate-500">
                                                {new Date(q.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeTab === 'knowledge' && (
                <Card>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                                <Brain className="text-indigo-500" size={20} />
                                Pricing Logic & Context
                            </h3>
                            <p className="text-sm text-slate-500">Configure base rates, multipliers, and business context used for AI drafting.</p>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            {lastUpdated && (
                                <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                    <Clock size={12} />
                                    Updated: {new Date(lastUpdated).toLocaleString()}
                                </div>
                            )}
                            <Button onClick={handleSaveKnowledge} isLoading={isSaving}>
                                <Save size={16} className="mr-2" /> Save Config
                            </Button>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute top-0 right-0 p-2 bg-slate-100 text-xs font-mono text-slate-500 rounded-bl-lg border-l border-b border-slate-200">
                            JSON Editor
                        </div>
                        <textarea
                            value={knowledge}
                            onChange={(e) => setKnowledge(e.target.value)}
                            className="w-full h-[600px] font-mono text-sm p-4 pt-10 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y transition-colors"
                            spellCheck={false}
                            placeholder="Loading configuration..."
                        />
                    </div>
                </Card>
            )}
        </PageShell>
    );
}
