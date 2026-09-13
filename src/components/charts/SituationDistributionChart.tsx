import { memo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
  Cell,
} from 'recharts';
import type { BeneficiadorIndicador } from '@/types';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { TOP_CHART_ITEMS } from '@/utils/constants';
import { abbreviateName, formatNumber, formatPercent, normalizePercent } from '@/utils/format';
import { Package, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface Props {
  data: BeneficiadorIndicador[];
  loading: boolean;
}

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: { value: number; payload: { fullName: string; capacidade: number; producao: number; percent: number; disponibilidade: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-2xl shadow-slate-200/50">
      <p className="mb-2 text-sm font-bold text-slate-800 border-b border-slate-100 pb-1.5">
        {p.fullName}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-medium text-blue-600">Capacidade:</span>
          <span className="text-xs font-bold tabular-nums text-slate-700">
            {formatNumber(p.capacidade)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-medium text-amber-600">Produção:</span>
          <span className="text-xs font-bold tabular-nums text-slate-700">
            {formatNumber(p.producao)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100">
          <span className="text-xs font-medium text-emerald-600">Disponível:</span>
          <span className="text-xs font-bold tabular-nums text-emerald-700">
            {formatNumber(p.disponibilidade)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-medium text-emerald-600">Percentual:</span>
          <span className="text-xs font-bold tabular-nums text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            {formatPercent(p.percent)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CustomBarLabel({ x, y, width, value }: {
  x?: number; y?: number; width?: number; value?: string;
}) {
  if (!value || !x || !y || !width) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 10}
      textAnchor="middle"
      className="text-[11px] font-bold"
      fill="#1e293b"
      style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
    >
      {value}
    </text>
  );
}

function SituationDistributionChartImpl({ data, loading }: Props) {
  const altaData = data
    .filter((d) => {
      const s = String(d.situacao_capacidade ?? '').trim();
      return s === 'Alta' || s.includes('Alta');
    })
    .sort((a, b) => (b.capacidade_media_mensal ?? 0) - (a.capacidade_media_mensal ?? 0))
    .slice(0, TOP_CHART_ITEMS)
    .map((d, index) => {
      const fallbackPercent = d.capacidade_media_mensal && d.capacidade_media_mensal > 0
        ? ((d.disponibilidade ?? 0) / d.capacidade_media_mensal) * 100
        : 0;
      const percent = normalizePercent(d.disponibilidade_percentual ?? fallbackPercent);

      return {
        name: abbreviateName(d.beneficiador_nome),
        fullName: d.beneficiador_nome,
        capacidade: d.capacidade_media_mensal ?? 0,
        producao: d.producao_total_alocada ?? 0,
        disponibilidade: d.disponibilidade ?? 0,
        percent,
        label: formatNumber(d.disponibilidade ?? 0),
        index,
      };
    });

  const totalAlta = data.filter((d) => {
    const s = String(d.situacao_capacidade ?? '').trim();
    return s === 'Alta' || s.includes('Alta');
  }).length;

  return (
    <Card className="h-full overflow-hidden border-0 shadow-2xl shadow-slate-200/50 backdrop-blur-sm bg-gradient-to-br from-white to-emerald-50/30">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-sm">
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                Disponibilidade para Novos Materiais
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                Alta capacidade — {totalAlta} beneficiador{totalAlta !== 1 ? 'es' : ''}
                {altaData.length < totalAlta && ` (top ${altaData.length})`}
              </p>
            </div>
          </div>
          {totalAlta > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-50/80 to-green-50/80 border border-emerald-100/50">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">
                {formatPercent(altaData.reduce((acc, d) => acc + d.percent, 0) / altaData.length)} média
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardBody className="pt-2">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        ) : altaData.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-slate-400">
            <div className="rounded-full bg-slate-50 p-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-slate-500">
              Nenhum beneficiador com capacidade alta
            </p>
            <p className="text-xs text-slate-400">
              Ajuste os filtros para visualizar mais dados
            </p>
          </div>
        ) : (
          <div className="relative">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart 
                data={altaData} 
                margin={{ top: 32, right: 16, left: 8, bottom: 24 }}
                barSize={40}
              >
                <defs>
                  <linearGradient id="availabilityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#6EE7B7" stopOpacity={0.6} />
                  </linearGradient>
                  <filter id="barShadowGreen" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" floodColor="#10B981" />
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
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                />
                
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ 
                    fill: '#f1f5f9', 
                    fillOpacity: 0.5,
                    radius: 8,
                  }} 
                />
                
                <Bar 
                  dataKey="percent" 
                  fill="url(#availabilityGradient)"
                  radius={[8, 8, 0, 0]}
                  filter="url(#barShadowGreen)"
                  animationDuration={1000}
                  animationBegin={200}
                >
                  {altaData.map((entry) => (
                    <Cell key={`cell-${entry.index}`} />
                  ))}
                  <LabelList 
                    dataKey="label" 
                    content={<CustomBarLabel />} 
                    position="top"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Indicador visual sutíl */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-30">
              <Package className="h-3 w-3 text-slate-400" />
              <span className="text-[10px] text-slate-400 font-medium">
                {altaData.length} em alta capacidade
              </span>
            </div>

            {/* Legenda com valores */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30" />
                <span className="text-[10px] font-medium text-slate-500">
                  Disponibilidade média: {formatPercent(altaData.reduce((acc, d) => acc + d.percent, 0) / altaData.length)}
                </span>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-slate-500">
                  Total disponível: {formatNumber(altaData.reduce((acc, d) => acc + d.disponibilidade, 0))}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export const SituationDistributionChart = memo(SituationDistributionChartImpl);
