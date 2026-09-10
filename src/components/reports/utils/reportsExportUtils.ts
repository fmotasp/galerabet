import Papa from 'papaparse';
import { ReportsData } from '../hooks/useReportsData';

export const exportReportsToCSV = (data: ReportsData) => {
  // Vamos exportar a carga de trabalho como exemplo
  const csvData = data.workload.map(w => ({
    Nome: w.name,
    'Tarefas Pendentes': w.pendentes
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio_gestao_${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
