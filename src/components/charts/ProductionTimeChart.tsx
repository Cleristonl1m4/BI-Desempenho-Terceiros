import { memo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts';
import type { BeneficiadorIndicador } from '@/types';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { abbreviateName, formatNumber } from '@/utils/format';
import { Clock, Calendar, TrendingUp } from 'lucide-react';

interface Props {
  data: BeneficiadorIndicador[];
  loading: boolean;
}

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: { value: number; payload: { fullName: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-2xl shadow-slate-200/50">
      <p className="mb-1.5 text-sm font-bold text-slate-800 border-b border-slate-100 pb-1.5">
        {p.fullName}
      </p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-medium text-blue-600">Tempo médio:</span>
        <span className="text-xs font-bold tabular-nums text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
          {formatNumber(payload[0].value, 0)} dias
        </span>
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
      x={x + (width ?? 0) + 6}
      y={y + 12}
      textAnchor="start"
      className="text-[11px] font-bold"
      fill="#1e293b"
      style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
    >
      {value}
    </text>
  );
}

function ProductionTimeChartImpl({ data, loading }: Props) {
  const chartData = data
    .map((d) => ({
      name: abbreviateName(d.beneficiador_nome),
      fullName: d.beneficiador_nome,
      dias: d.media_tempo_producao_dias ?? 0,
      label: d.media_tempo_producao_dias != null ? `${d.media_tempo_producao_dias} dias` : '0 dias',
    }));

  return (
    <Card className="h-full overflow-hidden border-0 shadow-2xl shadow-slate-200/50 backdrop-blur-sm bg-gradient-to-br from-white to-blue-50/30">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-sm">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                Tempo Médio de Produção
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Dias por beneficiador
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardBody className="pt-2">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        ) : (
          <div className="relative">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={chartData} 
                layout="vertical" 
                margin={{ top: 8, right: 40, left: 8, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="timeGradientBlue" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#93BBFC" stopOpacity={0.7} />
                  </linearGradient>
                  <filter id="barShadowBlue" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="2" dy="0" stdDeviation="3" floodOpacity="0.15" floodColor="#3B82F6" />
                  </filter>
                </defs>

                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e2e8f0" 
                  strokeOpacity={0.5}
                  horizontal={false}
                />
                
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#e2e8f0', strokeWidth: 0.5 }}
                  tickLine={false}
                />
                
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                  width={120}
                  axisLine={false}
                  tickLine={false}
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
                  dataKey="dias" 
                  fill="url(#timeGradientBlue)"
                  radius={[0, 6, 6, 0]} 
                  maxBarSize={28}
                  filter="url(#barShadowBlue)"
                  animationDuration={1000}
                  animationBegin={200}
                >
                  <LabelList dataKey="label" content={<CustomBarLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Indicador visual sutíl */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-30">
              <TrendingUp className="h-3 w-3 text-slate-400" />
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

export const ProductionTimeChart = memo(ProductionTimeChartImpl);