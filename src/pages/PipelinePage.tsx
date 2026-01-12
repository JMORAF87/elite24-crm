import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const COLUMNS = [
    { id: 'NEW', label: 'New', color: 'bg-blue-100 text-blue-800' },
    { id: 'ATTEMPTED', label: 'Attempted', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'CONNECTED', label: 'Connected', color: 'bg-purple-100 text-purple-800' },
    { id: 'MEETING_SET', label: 'Meeting Set', color: 'bg-indigo-100 text-indigo-800' },
    { id: 'QUOTE_SENT', label: 'Quote Sent', color: 'bg-pink-100 text-pink-800' },
    { id: 'WON', label: 'Won', color: 'bg-green-100 text-green-800' },
    { id: 'LOST', label: 'Lost', color: 'bg-gray-100 text-gray-800' }
];

export default function PipelinePage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        segment: '',
        priority: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchLeads();
    }, [filters]);

    const fetchLeads = async () => {
        setIsLoading(true);
        try {
            // Fetch all leads for the board, filtering by API or client side?
            // API supports filtering.
            const params = new URLSearchParams({ limit: '200' }); // Fetch more for kanban
            if (filters.segment) params.append('segment', filters.segment);
            if (filters.priority) params.append('priority', filters.priority);

            const { data } = await api.get(`/leads?${params}`);
            setLeads(data.leads);
        } catch (error) {
            console.error('Failed to fetch leads for pipeline:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        setDraggedLeadId(leadId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent, status: string) => {
        e.preventDefault();
        if (!draggedLeadId) return;

        // Optimistic Update
        const originalLeads = [...leads];
        const updatedLeads = leads.map(l =>
            l.id === draggedLeadId ? { ...l, status } : l
        );
        setLeads(updatedLeads);

        try {
            await api.patch(`/leads/${draggedLeadId}/status`, { status });
            // Activity created by backend hook for status chanage
        } catch (error) {
            console.error('Failed to update status:', error);
            setLeads(originalLeads); // Revert
        } finally {
            setDraggedLeadId(null);
        }
    };

    const getLeadsByStatus = (status: string) => {
        return leads.filter(l => l.status === status);
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-between items-center mb-4 px-1">
                <h1 className="text-3xl font-bold">Pipeline</h1>
                <div className="flex gap-2">
                    <select
                        className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-neon-pink"
                        value={filters.segment}
                        onChange={(e) => setFilters(prev => ({ ...prev, segment: e.target.value }))}
                    >
                        <option value="">All Segments</option>
                        <option value="GC">GC</option>
                        <option value="COMMERCIAL_PM">Commercial PM</option>
                    </select>
                    <select
                        className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-neon-pink"
                        value={filters.priority}
                        onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    >
                        <option value="">All Priority</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading pipeline...</div>
            ) : (
                <div className="flex gap-4 min-w-[1200px] flex-1 overflow-x-auto pb-4">
                    {COLUMNS.map(column => (
                        <div
                            key={column.id}
                            className="flex-1 min-w-[280px] bg-gray-50 rounded-xl flex flex-col max-h-full border border-gray-200"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, column.id)}
                        >
                            <div className={`p-3 font-bold border-b border-gray-200 rounded-t-xl bg-white sticky top-0 z-10 flex justify-between items-center`}>
                                <div className="flex items-center gap-2">
                                    <span className={`w-3 h-3 rounded-full ${column.color.split(' ')[0]}`}></span>
                                    {column.label}
                                </div>
                                <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs text-gray-600">
                                    {getLeadsByStatus(column.id).length}
                                </span>
                            </div>

                            <div className="p-3 overflow-y-auto flex-1 space-y-3">
                                {getLeadsByStatus(column.id).map(lead => (
                                    <div
                                        key={lead.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, lead.id)}
                                        onClick={() => navigate(`/leads/${lead.id}`)}
                                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-move hover:shadow-md transition active:cursor-grabbing group"
                                    >
                                        <div className="font-bold mb-1 text-gray-900 group-hover:text-neon-pink transition-colors">{lead.companyName}</div>
                                        <div className="text-sm text-gray-500 mb-2 truncate">{lead.city || 'No Location'}</div>
                                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                                                {lead.segment}
                                            </span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${lead.priority === 'HIGH' ? 'bg-red-50 text-red-600' :
                                                lead.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'
                                                }`}>
                                                {lead.priority}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
