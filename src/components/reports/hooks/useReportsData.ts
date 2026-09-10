import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

// Tipagens para o Dashboard
export interface ReportsKPIs {
  leadTime: number;
  onTimeRate: number;
  bottleneck: string;
  topPerformer: string;
}

export interface TaskStatusDistribution {
  name: string;
  value: number;
  color: string;
}

export interface WorkloadDistribution {
  name: string;
  pendentes: number;
}

export interface BurnupData {
  date: string;
  concluidas: number;
}

export interface ReportsData {
  kpis: ReportsKPIs;
  statusDistribution: TaskStatusDistribution[];
  workload: WorkloadDistribution[];
  burnup: BurnupData[];
}

/**
 * Hook dedicado para buscar dados do relatório via RPCs do Supabase.
 */
export const useReportsData = () => {
  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Chamadas paralelas para as RPCs do Supabase
        const [kpisRes, distRes, workloadRes, burnupRes] = await Promise.all([
          supabase.rpc('get_kpis_summary'),
          supabase.rpc('get_tasks_distribution'),
          supabase.rpc('get_pending_workload'),
          supabase.rpc('get_deliveries_last_7_days'),
        ]);

        if (kpisRes.error) throw kpisRes.error;
        if (distRes.error) throw distRes.error;
        if (workloadRes.error) throw workloadRes.error;
        if (burnupRes.error) throw burnupRes.error;

        setData({
          kpis: kpisRes.data,
          statusDistribution: distRes.data,
          workload: workloadRes.data,
          burnup: burnupRes.data,
        });
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        // Em caso de erro na RPC, usar um fallback vazio seguro para não quebrar a UI
        setData({
          kpis: { leadTime: 0, onTimeRate: 0, bottleneck: 'Erro', topPerformer: 'Erro' },
          statusDistribution: [],
          workload: [],
          burnup: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return { data, isLoading };
};
