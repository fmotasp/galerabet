import React from 'react';
import { Download, FileText, Loader2, Clock, CheckCircle2, AlertTriangle, Trophy } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

import { useReportsData } from './hooks/useReportsData';
import { exportReportsToCSV } from './utils/reportsExportUtils';
import { ReportPDF } from './components/ReportPDF';
import { Button } from '../ui';

export const ReportsView: React.FC = () => {
  const { data, isLoading } = useReportsData();

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#E4007E]" />
        <p>Carregando Dashboard Enterprise...</p>
      </div>
    );
  }

  const handleExportCSV = () => {
    exportReportsToCSV(data);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#101010] p-6 lg:p-8 overflow-y-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Dashboard de Gestão</h1>
          <p className="text-slate-400 text-sm">Resumo executivo do mês atual</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExportCSV} 
            variant="outline" 
            className="border-[#2A2A2A] text-slate-300 hover:text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          
          <PDFDownloadLink 
            document={<ReportPDF data={data} />} 
            fileName={`dashboard_${new Date().getTime()}.pdf`}
          >
            {({ loading }) => (
              <Button 
                variant="primary" 
                className="bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white border-0 shadow-lg"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                Gerar PDF
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* KPIS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        
        <div className="bg-[#181818] border border-[#2A2A2A] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Lead Time Médio</span>
            <div className="text-2xl font-black text-white mt-1">{data.kpis.leadTime} dias</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#181818] border border-[#2A2A2A] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Entrega no Prazo</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{data.kpis.onTimeRate}%</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#181818] border border-[#2A2A2A] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Gargalo Atual</span>
            <div className="text-2xl font-black text-rose-400 mt-1">{data.kpis.bottleneck}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#181818] border border-[#2A2A2A] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Top Performer</span>
            <div className="text-xl font-black text-amber-400 mt-1">{data.kpis.topPerformer}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        
        {/* Gráfico 1: Status */}
        <div className="bg-[#181818] border border-[#2A2A2A] rounded-2xl p-5 flex flex-col">
          <h3 className="text-sm font-bold text-white mb-4">Distribuição por Status</h3>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#222', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Workload */}
        <div className="bg-[#181818] border border-[#2A2A2A] rounded-2xl p-5 flex flex-col">
          <h3 className="text-sm font-bold text-white mb-4">Carga de Trabalho (Pendentes)</h3>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.workload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: '#222' }}
                  contentStyle={{ backgroundColor: '#222', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                />
                <Bar dataKey="pendentes" fill="#E4007E" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 3: Burnup */}
        <div className="bg-[#181818] border border-[#2A2A2A] rounded-2xl p-5 flex flex-col">
          <h3 className="text-sm font-bold text-white mb-4">Volume de Entregas (7 dias)</h3>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.burnup} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                <XAxis dataKey="date" stroke="#666" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#222', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="concluidas" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
