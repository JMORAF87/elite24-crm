import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, X, Building2, User } from 'lucide-react';
import api from '../services/api';
import { PageShell } from '../components/ui/PageShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function LeadsPage() {
    const navigate = useNavigate();
    const [leads, setLeads] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        segment: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        segment: 'COMMERCIAL_PM',
        focus: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        website: '',
        contactName1: '', role1: '', email1: '',
        contactName2: '', role2: '', email2: '',
        priority: 'MEDIUM',
        status: 'NEW'
    });

    const fetchLeads = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20', // Increased limit for better density
                search,
                ...filters
            });
            // Remove empty filters
            Object.keys(filters).forEach(key => {
                if (!filters[key as keyof typeof filters]) params.delete(key);
            });

            const { data } = await api.get(`/leads?${params}`);
            setLeads(data.leads);
            setTotalPages(data.pagination.totalPages);
        } catch (error) {
            console.error('Failed to fetch leads:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLeads();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, search, filters]);

    const handleCreateLead = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/leads', formData);
            setShowModal(false);
            setFormData({
                companyName: '',
                segment: 'COMMERCIAL_PM',
                focus: '',
                address: '',
                city: '',
                state: '',
                zip: '',
                phone: '',
                website: '',
                contactName1: '', role1: '', email1: '',
                contactName2: '', role2: '', email2: '',
                priority: 'MEDIUM',
                status: 'NEW'
            });
            fetchLeads();
            alert('Lead created successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to create lead');
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'WON': return 'success';
            case 'LOST': return 'error';
            case 'NEW': return 'info';
            case 'ATTEMPTED': return 'warning';
            case 'CONNECTED': return 'success';
            default: return 'neutral';
        }
    };

    const getPriorityVariant = (priority: string) => {
        switch (priority) {
            case 'HIGH': return 'error';
            case 'MEDIUM': return 'warning';
            case 'LOW': return 'success';
            default: return 'neutral';
        }
    };

    return (
        <PageShell
            title="Leads"
            description="Manage your prospective clients and track their status."
            actions={
                <Button onClick={() => setShowModal(true)}>
                    <Plus size={18} className="mr-2" />
                    Add Lead
                </Button>
            }
        >
            <Card noPadding>
                {/* Filters */}
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-white rounded-t-xl">
                    <div className="relative w-full md:w-96">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search companies, cities, or contacts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-slate-700"
                        />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        {['', 'GC', 'COMMERCIAL_PM'].map(seg => (
                            <button
                                key={seg}
                                onClick={() => setFilters(prev => ({ ...prev, segment: seg }))}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${filters.segment === seg
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-slate-500 border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                {seg === '' ? 'All Segments' : seg === 'GC' ? 'General Contractors' : 'Property Managers'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Company</th>
                                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Priority</th>
                                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Last Activity</th>
                                <th className="p-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading leads...</td></tr>
                            ) : leads.map(lead => (
                                <tr
                                    key={lead.id}
                                    onClick={() => navigate(`/leads/${lead.id}`)}
                                    className="hover:bg-indigo-50/30 cursor-pointer transition-colors group"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                <Building2 size={16} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{lead.companyName}</div>
                                                <div className="text-xs text-slate-500">{lead.city || 'No City'}, {lead.state || 'State'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                {lead.contactName1 ? lead.contactName1.charAt(0) : <User size={12} />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-slate-700">{lead.contactName1 || 'No Contact'}</div>
                                                <div className="text-[10px] text-slate-400 uppercase">{lead.role1 || ''}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <Badge variant={getStatusVariant(lead.status)}>{lead.status}</Badge>
                                    </td>
                                    <td className="p-4">
                                        <Badge variant={getPriorityVariant(lead.priority)}>{lead.priority}</Badge>
                                    </td>
                                    <td className="p-4 text-sm text-slate-500">
                                        {lead.activities && lead.activities.length > 0
                                            ? new Date(lead.activities[0].createdAt).toLocaleDateString()
                                            : 'No activity'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/leads/${lead.id}?edit=true`);
                                            }}
                                        >
                                            Edit
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Scale Pagination (Simplified) */}
            <div className="flex justify-center mt-6 gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <span className="flex items-center px-4 text-sm font-medium text-slate-600">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
            </div>

            {/* Add Lead Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-10">
                    <Card className="w-[800px] max-w-full relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-slate-900">Add New Lead</h2>
                        <form onSubmit={handleCreateLead} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div className="md:col-span-2 border-b border-gray-100 pb-2 font-bold text-slate-400 uppercase text-xs tracking-wider mb-2">Company Info</div>

                            <Input
                                label="Company Name *"
                                required
                                value={formData.companyName}
                                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                            />
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Segment</label>
                                <select
                                    value={formData.segment}
                                    onChange={e => setFormData({ ...formData, segment: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                    <option value="COMMERCIAL_PM">Commercial PM</option>
                                    <option value="GC">GC</option>
                                </select>
                            </div>

                            <Input label="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            <Input label="Website" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />

                            <div className="md:col-span-2 grid grid-cols-3 gap-2">
                                <Input label="City" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                <Input label="State" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
                                <Input label="Zip" value={formData.zip} onChange={e => setFormData({ ...formData, zip: e.target.value })} />
                            </div>

                            <Input label="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="md:col-span-2" />

                            <div className="md:col-span-2 border-b border-gray-100 pb-2 font-bold text-slate-400 uppercase text-xs tracking-wider mt-4 mb-2">Primary Contact</div>

                            <Input label="Contact Name" value={formData.contactName1} onChange={e => setFormData({ ...formData, contactName1: e.target.value })} />
                            <Input label="Role" value={formData.role1} onChange={e => setFormData({ ...formData, role1: e.target.value })} />
                            <Input label="Email" value={formData.email1} onChange={e => setFormData({ ...formData, email1: e.target.value })} className="md:col-span-2" />

                            <div className="md:col-span-2 mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit">Create Lead</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </PageShell>
    );
}
