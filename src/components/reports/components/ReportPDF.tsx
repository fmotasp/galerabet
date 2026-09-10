import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ReportsData } from '../hooks/useReportsData';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 5,
  },
  cellLabel: {
    width: '60%',
    fontSize: 12,
  },
  cellValue: {
    width: '40%',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

interface ReportPDFProps {
  data: ReportsData;
}

export const ReportPDF: React.FC<ReportPDFProps> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Relatório de Gestão Enterprise</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>KPIs Principais</Text>
        <View style={styles.row}>
          <Text style={styles.cellLabel}>Lead Time Médio</Text>
          <Text style={styles.cellValue}>{data.kpis.leadTime} dias</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cellLabel}>Taxa de Entrega no Prazo</Text>
          <Text style={styles.cellValue}>{data.kpis.onTimeRate}%</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cellLabel}>Gargalo Atual</Text>
          <Text style={styles.cellValue}>{data.kpis.bottleneck}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cellLabel}>Top Performer</Text>
          <Text style={styles.cellValue}>{data.kpis.topPerformer}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Carga de Trabalho (Pendentes)</Text>
        {data.workload.map((w, i) => (
          <View style={styles.row} key={i}>
            <Text style={styles.cellLabel}>{w.name}</Text>
            <Text style={styles.cellValue}>{w.pendentes} demandas</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);
