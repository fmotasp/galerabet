import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Activity, Briefcase } from 'lucide-react';
import { isTaskCompleted } from "../../lib/taskDateUtils";
import { Task } from '../../types';

const isTaskDoneOrInReview = (t: Task): boolean => {
  const s = (t.status || '').toLowerCase().trim();
  return (
    isTaskCompleted(t) ||
    s === 'in_review' ||
    s === 'postar' ||
    s === 'revisar' ||
    s === 'agendado' ||
    s === 'aguardando_aprovacao'
  );
};

export const ReportsDataViz: React.FC<{
  tasks: Task[];
  clientDistribution: any[];
}> = ({ tasks, clientDistribution }) => {
  
  // Daily Productivity (Last 14 days)
  const dailyData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const displayDate = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      const completedThatDay = tasks.filter(t => {
        if (!isTaskDoneOrInReview(t)) return false;
        // Use deliveredAt or updatedAt
        const timestamp = t.deliveredAt || t.updatedAt || t.createdAt;
        if (!timestamp) return false;
        return timestamp.startsWith(dateStr);
      }).length;

      const createdThatDay = tasks.filter(t => {
        const timestamp = t.createdAt;
        if (!timestamp) return false;
        return timestamp.startsWith(dateStr);
      }).length;

      data.push({
        date: displayDate,
        Entregues: completedThatDay,
        Criadas: createdThatDay
      });
    }
    return data;
  }, [tasks]);

  // Top 5 Clients by Volume
  const topClientsData = useMemo(() => {
    return [...clientDistribution]
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(c => ({
        name: c.name,
        Entregues: c.completed,
        Pendentes: c.pending,
        color: c.color || '#E4007E'
      }));
  }, [clientDistribution]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1C1C1C] border border-[#262626] p-3 rounded-xl shadow-xl">
          <p className="text-white font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-400">{entry.name}:</span>
              <span className="text-white font-semibold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
      
      {/* Area Chart: Ritmo de Entregas */}
      <div className="p-6 bg-[#141414] border border-[#262626] rounded-2xl flex flex-col shadow-xs h-[380px]">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-4 h-4 text-[#E4007E]" />
          <h2 className="text-base font-semibold text-white tracking-tight">Ritmo de Entregas (14 dias)</h2>
        </div>
        <div className="flex-1 w-full h-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEntregues" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCriadas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E4007E" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#E4007E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis dataKey="date" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="Criadas" stroke="#E4007E" strokeWidth={2} fillOpacity={1} fill="url(#colorCriadas)" />
              <Area type="monotone" dataKey="Entregues" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorEntregues)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart: Volume por Cliente */}
      <div className="p-6 bg-[#141414] border border-[#262626] rounded-2xl flex flex-col shadow-xs h-[380px]">
        <div className="flex items-center gap-2 mb-6">
          <Briefcase className="w-4 h-4 text-sky-400" />
          <h2 className="text-base font-semibold text-white tracking-tight">Top 5 Clientes (Volume)</h2>
        </div>
        <div className="flex-1 w-full h-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topClientsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis dataKey="name" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} dy={10} tickFormatter={(val) => val.split(' ')[0]} />
              <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1C1C1C' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Entregues" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
              <Bar dataKey="Pendentes" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
