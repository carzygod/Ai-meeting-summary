import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { Clock, Users, CheckCircle, TrendingUp } from 'lucide-react';
import { Language } from '../types';
import { t } from '../utils/i18n';

interface DashboardProps {
    lang: Language;
}

const data = [
  { name: 'Mon', meetings: 4, trainings: 2 },
  { name: 'Tue', meetings: 3, trainings: 5 },
  { name: 'Wed', meetings: 6, trainings: 3 },
  { name: 'Thu', meetings: 2, trainings: 8 },
  { name: 'Fri', meetings: 5, trainings: 4 },
];

const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
  <div className="neu-card p-6 flex items-center justify-between hover:translate-y-[-4px] transition-transform duration-300">
    <div>
      <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{title}</p>
      <h3 className="text-3xl font-black text-slate-700 mt-2">{value}</h3>
    </div>
    <div className={`p-4 rounded-full shadow-neu-icon ${colorClass}`}>
      <Icon size={24} />
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ lang }) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Total Meetings" value="124" icon={Clock} colorClass="text-blue-500" />
        <StatCard title="Active Clients" value="843" icon={Users} colorClass="text-indigo-500" />
        <StatCard title="Training Passed" value="92%" icon={CheckCircle} colorClass="text-green-500" />
        <StatCard title="Efficiency Score" value="+18%" icon={TrendingUp} colorClass="text-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="neu-card p-8">
          <h3 className="text-xl font-bold text-slate-700 mb-6">Weekly Activity</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ 
                      backgroundColor: '#e0e5ec', 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '6px 6px 12px #b8c2cc, -6px -6px 12px #ffffff',
                      color: '#475569'
                  }}
                  itemStyle={{ color: '#475569' }}
                />
                <Bar dataKey="meetings" fill="#3b82f6" radius={[6, 6, 6, 6]} barSize={20} />
                <Bar dataKey="trainings" fill="#6366f1" radius={[6, 6, 6, 6]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="neu-card p-8">
          <h3 className="text-xl font-bold text-slate-700 mb-6">Training Trajectory</h3>
           <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorTrain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                   contentStyle={{ 
                      backgroundColor: '#e0e5ec', 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '6px 6px 12px #b8c2cc, -6px -6px 12px #ffffff',
                      color: '#475569'
                  }}
                />
                <Area type="monotone" dataKey="trainings" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTrain)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
