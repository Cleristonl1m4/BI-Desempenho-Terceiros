import { memo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import type { BeneficiadorIndicador, ChartTotals } from '@/types';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { DEFAULT_PAGE_SIZE } from '@/utils/constants';
import { abbreviateName, formatNumber, formatPercent, normalizePercent } from '@/utils/format';

interface Props {
  data: BeneficiadorIndicador[];
  loading: boolean;
  totals?: ChartTotals;
}

function colorFor(value: number): string {
  if (value > 40) return '#22C55E';
  if (value >= 20) return '#EAB308';
  return '#EF4444';
}

const availabilityLegend = [
  { label: 'Alta', value: '> 40%', color: '#22C55E' },
  { label: 'Média', value: '20% - 40%', color: '#EAB308' },
  { label: 'Baixa', value: '< 20%', color: '#EF4444' },
];

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: { value: number; payload: { fullName: string } }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-slate-700">{payload[0].payload.fullName}</p>
      <p className="text-xs text-slate-500">Disponibilidade: {formatPercent(payload[0].value)}</p>
    </div>
  );
}

function AvailabilityChartImpl({ data, loading, totals }: Props) {
  const chartData = [...data]
    .sort((a, b) => (b.capacidade_media_mensal ?? 0) - (a.capacidade_media_mensal ?? 0))
    .slice(0, DEFAULT_PAGE_SIZE)
    .map((d) => {
      const fallbackPercent = d.capacidade_media_mensal && d.capacidade_media_mensal > 0
        ? ((d.disponibilidade ?? 0) / d.capacidade_media_mensal) * 100
        : 0;

      return {
        name: abbreviateName(d.beneficiador_nome?.trim() ?? d.beneficiador_nome),
        fullName: d.beneficiador_nome?.trim() ?? d.beneficiador_nome,
        value: normalizePercent(d.disponibilidade_percentual ?? fallbackPercent),
      };
    });

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-slate-800">
              Disponibilidade Percentual por Beneficiador
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-600">
              {availabilityLegend.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.label}</span>
                  <span className="text-slate-400">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            {totals && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                Disp. Total: {formatNumber(totals.disponibilidade)}
              </span>
            )}
            <p className="text-xs text-slate-500">Ordenado do maior para o menor</p>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        {loading ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#64748b' }}
                unit="%"
                domain={[0, 100]}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
              <ReferenceLine x={20} stroke="#EF4444" strokeDasharray="4 4" label={{ value: '20%', fontSize: 10, fill: '#EF4444' }} />
              <ReferenceLine x={40} stroke="#22C55E" strokeDasharray="4 4" label={{ value: '40%', fontSize: 10, fill: '#22C55E' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={colorFor(entry.value)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardBody>
    </Card>
  );
}

export const AvailabilityChart = memo(AvailabilityChartImpl);
