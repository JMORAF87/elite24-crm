import React from 'react';
import { Phone, Mail, FileText } from 'lucide-react';

interface LeadActivityProps {
    activities: any[];
}

export function LeadActivity({ activities }: LeadActivityProps) {
    if (activities.length === 0) {
        return <div className="text-center text-gray-400 py-8">No activity yet</div>;
    }

    return (
        <div className="space-y-6">
            {activities.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {activity.type === 'CALL' ? <Phone size={14} /> :
                            activity.type === 'EMAIL' ? <Mail size={14} /> :
                                <FileText size={14} />}
                    </div>
                    <div>
                        <p className="font-bold text-sm">
                            {activity.type} - {activity.subject}
                        </p>
                        <p className="text-gray-600 text-sm mt-1" dangerouslySetInnerHTML={{ __html: activity.bodyPreview || '' }}></p>
                        <p className="text-xs text-gray-400 mt-2">
                            {new Date(activity.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
