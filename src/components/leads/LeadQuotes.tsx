import React from 'react';
import { Plus, Mail } from 'lucide-react';

interface LeadQuotesProps {
    quotes: any[];
    onCreateQuote: () => void;
    onEmailQuote: (quote: any) => void;
}

export function LeadQuotes({ quotes, onCreateQuote, onEmailQuote }: LeadQuotesProps) {
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold">Quotes</h4>
                <button onClick={onCreateQuote} className="text-sm bg-black text-white px-3 py-1 rounded hover:bg-gray-800 flex items-center">
                    <Plus size={14} className="mr-1" /> Create
                </button>
            </div>
            {quotes.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No quotes</div>
            ) : (
                quotes.map(q => (
                    <div key={q.id} className="p-4 border border-gray-100 rounded mb-3 hover:bg-gray-50">
                        <div className="flex justify-between mb-2">
                            <span className="font-bold">{q.serviceType} - {q.guardType}</span>
                            <span className="font-bold">${q.monthlyEstimate?.toLocaleString() || q.totalAmount?.toLocaleString()}/mo</span>
                        </div>
                        <div className="text-sm text-gray-500 flex justify-between items-center">
                            <span>{q.hoursPerWeek} hrs/week @ ${q.hourlyRate}/hr</span>
                            <div className="flex gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs ${q.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                                        q.status === 'SENT' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                                    }`}>{q.status}</span>
                                <button onClick={() => onEmailQuote(q)} className="text-xs text-neon-pink font-bold hover:underline flex items-center">
                                    <Mail size={12} className="mr-1" /> Email Quote
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
