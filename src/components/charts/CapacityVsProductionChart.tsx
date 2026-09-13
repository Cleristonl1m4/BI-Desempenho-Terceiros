import { memo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Cell,
} from 'recharts';
import type { BeneficiadorIndicador, ChartTotals } from '@/types';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { TOP_CHART_ITEMS } from '@/utils/constants';
import { abbreviateName, formatNumber } from '@/utils/format';
import { TrendingUp, Zap, Award } from 'lucide-react';

interface Props {
  data: BeneficiadorIndicador[];
  loading: boolean;
  totals?: ChartTotals;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string; payload?: { fullName?: string } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  
  const fullName = payload[0]?.payload?.fullName || label;
  
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-2xl shadow-slate-200/50">
      <p className="mb-2 text-sm font-bold text-slate-800 border-b border-slate-100 pb-1.5">
        {fullName}
      </p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 py-0.5">
          <span className="text-xs font-medium" style={{ color: p.color }}>
            {p.name}:
          </span>
          <span className="text-xs font-bold tabular-nums text-slate-700">
            {formatNumber(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function CustomLegend({ payload }: { payload?: { value: string; color: string }[] }) {
  if (!payload) return null;
  return (
    <div className="flex items-center justify-center gap-6 mt-2">
      {payload.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div 
            className="h-3 w-3 rounded-full shadow-sm" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs font-medium text-slate-600">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function CapacityVsProductionChartImpl({ data, loading, totals }: Props) {
  const chartData = data
    .slice(0, TOP_CHART_ITEMS)
    .map((d) => ({
      name: abbreviateName(d.beneficiador_nome),
      fullName: d.beneficiador_nome,
      Capacidade: d.capacidade_media_mensal ?? 0,
      Produção: d.producao_total_alocada ?? 0,
      total: (d.capacidade_media_mensal ?? 0) + (d.producao_total_alocada ?? 0),
    }));

  const maxValue = Math.max(
    ...chartData.map(d => Math.max(d.Capacidade, d.Produção)),
    100
  );

  return (
    <Card className="h-full overflow-hidden border-0 shadow-2xl shadow-slate-200/50 backdrop-blur-sm bg-gradient-to-br from-white to-slate-50/50">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-sm">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                Capacidade vs Produção
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Top {TOP_CHART_ITEMS} beneficiadores
              </p>
            </div>
          </div>
          {totals && (
            <div className="flex items-center gap-4 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100/50">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-xs font-medium text-slate-600">
                  Total: {formatNumber(totals.totalCapacidade)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <span className="text-xs font-medium text-slate-600">
                  {formatNumber(totals.totalProducao)}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardBody className="pt-2">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center gap-3 text-slate-400">
            <div className="rounded-full bg-slate-50 p-4">
              <TrendingUp className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-slate-500">
              Nenhum dado disponível
            </p>
          </div>
        ) : (
          <div className="relative">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart 
                data={chartData} 
                margin={{ top: 16, right: 16, left: 8, bottom: 24 }}
                barGap={8}
                barSize={32}
              >
                <defs>
                  <linearGradient id="capacidadeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#818CF8" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="producaoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.7} />
                  </linearGradient>
                  <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
                  </filter>
                </defs>

                <CartesianGrid 
                  strokeDasharray="4 4" 
                  stroke="#e2e8f0" 
                  strokeOpacity={0.5}
                  vertical={false}
                />
                
                <XAxis
                  dataKey="name"
                  tick={{ 
                    fontSize: 11, 
                    fill: '#94a3b8',
                    fontWeight: 500,
                  }}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  axisLine={{ stroke: '#e2e8f0', strokeWidth: 0.5 }}
                  tickLine={false}
                />
                
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, maxValue * 1.15]}
                  tickFormatter={(value) => formatNumber(value)}
                />
                
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ 
                    fill: '#f1f5f9', 
                    fillOpacity: 0.5,
                    radius: 8,
                  }} 
                />
                
                <Legend 
                  content={<CustomLegend />}
                  wrapperStyle={{ paddingTop: 8 }}
                />
                
                <Bar 
                  dataKey="Capacidade" 
                  fill="url(#capacidadeGradient)"
                  radius={[6, 6, 0, 0]}
                  filter="url(#barShadow)"
                  animationDuration={1000}
                  animationBegin={200}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-cap-${index}`} />
                  ))}
                </Bar>
                
                <Bar 
                  dataKey="Produção" 
                  fill="url(#producaoGradient)"
                  radius={[6, 6, 0, 0]}
                  filter="url(#barShadow)"
                  animationDuration={1000}
                  animationBegin={400}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-prod-${index}`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Indicador visual sutíl no canto */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-30">
              <Award className="h-3 w-3 text-slate-400" />
              <span className="text-[10px] text-slate-400 font-medium">
                {chartData.length} beneficiadores
              </span>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export const CapacityVsProductionChart = memo(CapacityVsProductionChartImpl);
