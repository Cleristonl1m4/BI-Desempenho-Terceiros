import * as XLSX from 'xlsx';
import type { BeneficiadorIndicador } from '@/types';
import {formatPercent, formatDate } from './format';

export function exportToCsv(data: BeneficiadorIndicador[]): void {
  const rows = data.map((d) => ({
    'Beneficiador ID': String(d.beneficiador_id ?? '').trim(),
    'Beneficiador Nome': String(d.beneficiador_nome ?? '').trim(),
    'Capacidade Media Mensal': Number(d.capacidade_media_mensal ?? 0),
    'Producao Total Alocada': Number(d.producao_total_alocada ?? 0),
    'Disponibilidade': Number(d.disponibilidade ?? 0),
    'Disponibilidade Percentual': formatPercent(d.disponibilidade_percentual),
    'Ultima Data Inicio': formatDate(d.ultima_data_inicio),
    'Media Pecas Dia': Number(d.media_pecas_dia ?? 0),
    'Situacao Capacidade': d.situacao_capacidade,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: [
      'Beneficiador ID',
      'Beneficiador Nome',
      'Capacidade Media Mensal',
      'Producao Total Alocada',
      'Disponibilidade',
      'Disponibilidade Percentual',
      'Ultima Data Inicio',
      'Media Pecas Dia',
      'Situacao Capacidade',
    ],
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Beneficiadores');

  const fileName = `beneficiadores-indicadores-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
