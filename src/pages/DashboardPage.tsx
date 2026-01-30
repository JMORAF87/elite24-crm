import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, DollarSign, TrendingUp, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import api from '../services/api';
import { PageShell } from '../components/ui/PageShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { getLeadStatusOverride } from '../services/activityStore';

type Task = {
  id: string;
  leadId: string;
  title: string;
  dueDate?: string; // ISO or yyyy-mm-dd
  status?: string;
  createdAt?: string;
};

export default function DashboardPage() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    newLeads: 0,
    highPriority: 0,
    meetings: 0,
    quotesSent: 0,
    wonDeals: 0
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getEffectiveStatus = (lead: any) => {
    return getLeadStatusOverride(lead?.id) || lead?.status;
  };

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const [leadsRes, tasksRes] = await Promise.all([
          api.get('/leads?limit=200'),
          api.get('/tasks?limit=50')
        ]);

        const leads = leadsRes?.data?.leads || [];
        const t: Task[] = tasksRes?.data || [];

        const computed = {
          newLeads: leads.filter((l: any) => getEffectiveStatus(l) === 'NEW').length,
          highPriority: leads.filter((l: any) => l?.priority === 'HIGH').length,
          meetings: leads.filter((l: any) => getEffectiveStatus(l) === 'MEETING_SET').length,
          quotesSent: leads.filter((l: any) => getEffectiveStatus(l) === 'QUOTE_SENT').length,
          wonDeals: leads.filter((l: any) => getEffectiveStatus(l) === 'WON').length,
        };

        setStats(computed);

        // sort tasks by due date (soonest first)
        const sorted = [...t].sort((a, b) => {
          const da = a?.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
          const db = b?.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
          return da - db;
        });

        setTasks(sorted.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, []);

  const StatCard = ({ title, value, subtext, icon: Icon, trend, trendValue }: any) => (
    <Card noPadding className="p-6 relative overflow-hidden group hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
          <Icon size={24} />
        </div>
        {trend && (
          <Badge variant={trend === 'up' ? 'success' : 'error'} className="flex items-center gap-1">
            {trend === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {trendValue}
          </Badge>
        )}
      </div>
      <div>
        <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
        <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
        <p className="text-xs text-slate-400">{subtext}</p>
      </div>
    </Card>
  );

  const chartBars = [35, 45, 30, 60, 75, 50, 65, 80, 55, 40, 70, 90];

  return (
    <PageShell title="Dashboard" description="Overview of your business performance.">
      {isLoading ? (
        <div className="p-8 text-center text-slate-500">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="New Leads" value={stats.newLeads} subtext="Current NEW leads" icon={Users} trend="up" trendValue="—" />
            <StatCard title="High Priority" value={stats.highPriority} subtext="Leads requiring attention" icon={TrendingUp} trend="up" trendValue="—" />
            <StatCard title="Meetings" value={stats.meetings} subtext="MEETING_SET leads" icon={Calendar} />
            <StatCard title="Won Contracts" value={stats.wonDeals} subtext="Closed deals" icon={DollarSign} trend="up" trendValue="—" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="h-full">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">Revenue Analytics</h3>
                    <p className="text-sm text-slate-500">Projected vs Actual Earnings</p>
                  </div>
                  <select className="bg-gray-50 border-none text-sm font-medium text-slate-600 rounded-lg py-2 px-4 focus:ring-0 cursor-pointer hover:bg-gray-100 transition-colors">
                    <option>Last 30 Days</option>
                    <option>This Quarter</option>
                    <option>This Year</option>
                  </select>
                </div>

                <div className="h-64 flex items-end justify-between gap-2 mt-8 px-4">
                  {chartBars.map((height, i) => (
                    <div key={i} className="w-full flex flex-col items-center gap-2 group">
                      <div
                        className="w-full bg-indigo-100 rounded-t-lg relative group-hover:bg-indigo-200 transition-all duration-300"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          ${height * 100}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-xs text-slate-400 px-4">
                  <span>Mar 1</span>
                  <span>Mar 8</span>
                  <span>Mar 15</span>
                  <span>Mar 22</span>
                  <span>Mar 30</span>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="h-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-slate-900">Priority Tasks</h3>
                  <button
                    onClick={() => navigate('/leads')}
                    className="text-sm text-indigo-600 font-medium hover:text-indigo-700"
                  >
                    See all
                  </button>
                </div>

                {tasks.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-xl">
                    <p className="text-xs text-gray-400">No more urgent tasks</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasks.map((t) => {
                      const due = t?.dueDate ? new Date(t.dueDate) : null;
                      const dueLabel = due && !Number.isNaN(due.getTime()) ? due.toLocaleDateString() : '—';
                      return (
                        <div
                          key={t.id}
                          onClick={() => navigate(`/leads/${t.leadId}`)}
                          className="p-4 rounded-xl bg-[#F8F9FC] border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all cursor-pointer group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="warning" className="text-[10px]">Task</Badge>
                            <span className="text-xs text-slate-400">{dueLabel}</span>
                          </div>
                          <h4 className="font-semibold text-slate-800 text-sm mb-1 group-hover:text-indigo-600 transition-colors">
                            {t.title}
                          </h4>
                          <p className="text-xs text-slate-500">Lead: {t.leadId}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}
