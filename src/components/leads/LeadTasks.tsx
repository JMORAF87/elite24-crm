import React from 'react';
import { Plus, CheckCircle } from 'lucide-react';

interface LeadTasksProps {
    tasks: any[];
    onAddTask: () => void;
}

export function LeadTasks({ tasks, onAddTask }: LeadTasksProps) {
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold">Pending Tasks</h4>
                <button onClick={onAddTask} className="text-sm bg-black text-white px-3 py-1 rounded hover:bg-gray-800 flex items-center">
                    <Plus size={14} className="mr-1" /> Add
                </button>
            </div>
            {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No tasks</div>
            ) : (
                tasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 border border-gray-100 rounded mb-2 hover:bg-gray-50">
                        <div className="flex items-center">
                            <button className="mr-3 text-gray-300 hover:text-green-500"><CheckCircle size={18} /></button>
                            <span className={t.status === 'COMPLETED' ? 'line-through text-gray-400' : ''}>{t.title}</span>
                        </div>
                        <span className="text-xs text-gray-500">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No date'}</span>
                    </div>
                ))
            )}
        </div>
    );
}
