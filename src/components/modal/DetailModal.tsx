import { useEffect } from "react";
import { X, BarChart3, BarChart2, TrendingUp, Calendar, Package, Zap, User, Clock, Award } from "lucide-react";
import type { BeneficiadorIndicador } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { SituationBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatNumber, formatPercent, formatDate } from "@/utils/format";
import { CHART_COLORS } from "@/utils/constants";

interface DetailModalProps {
  beneficiador: BeneficiadorIndicador | null;
  onClose: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  "ID do Beneficiador": <User className="h-3.5 w-3.5" />,
  "Capacidade Média Mensal": <Package className="h-3.5 w-3.5" />,
  "Produção Total Alocada": <TrendingUp className="h-3.5 w-3.5" />,
  "Disponibilidade": <Zap className="h-3.5 w-3.5" />,
  "Disponibilidade Percentual": <Zap className="h-3.5 w-3.5" />,
  "Última Data Prevista": <Calendar className="h-3.5 w-3.5" />,
  "Média de Peças por Dia": <Clock className="h-3.5 w-3.5" />,
};

export function DetailModal({ beneficiador, onClose }: DetailModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (beneficiador) {
      document.addEventListener("keydown", handler);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [beneficiador, onClose]);

  if (!beneficiador) return null;

  const chartData = [
    {
      name: "Capacidade",
      value: beneficiador.capacidade_media_mensal ?? 0,
      color: CHART_COLORS.capacidade,
    },
    {
      name: "Produção",
      value: beneficiador.producao_total_alocada,
      color: CHART_COLORS.producao,
    },
    {
      name: "Disponib.",
      value: beneficiador.disponibilidade ?? 0,
      color: CHART_COLORS.disponibilidade,
    },
  ];

  const fields = [
    {
      label: "ID do Beneficiador",
      value: String(beneficiador.beneficiador_id ?? "").trim(),
    },
    {
      label: "Capacidade Média Mensal",
      value: formatNumber(beneficiador.capacidade_media_mensal),
    },
    {
      label: "Produção Total Alocada",
      value: formatNumber(beneficiador.producao_total_alocada),
    },
    {
      label: "Disponibilidade",
      value: formatNumber(beneficiador.disponibilidade),
    },
    {
      label: "Disponibilidade Percentual",
      value: formatPercent(beneficiador.disponibilidade_percentual),
    },
    {
      label: "Última Data Prevista",
      value: formatDate(beneficiador.ultima_data_inicio),
    },
    {
      label: "Média de Peças por Dia",
      value: formatNumber(beneficiador.media_pecas_dia),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Detalhes do beneficiador"
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl shadow-slate-900/20 animate-slide-up border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-start justify-between px-6 py-5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-transparent" />
          
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-sm shadow-lg shadow-blue-500/10">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Detalhes do Beneficiador
              </h2>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {beneficiador.beneficiador_nome?.trim()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="relative rounded-xl p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100/80 hover:text-slate-600 hover:scale-105"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 px-6 py-5">
          {/* Info grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div
                key={f.label}
                className="group relative overflow-hidden rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-50/80 to-white px-4 py-3.5 transition-all duration-200 hover:shadow-md hover:border-slate-300/80 hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative flex items-center gap-2">
                  <span className="text-slate-400">
                    {iconMap[f.label] || null}
                  </span>
                  <p className="text-xs font-medium text-slate-500">{f.label}</p>
                </div>
                <p className="relative mt-1 text-sm font-semibold text-slate-900 pl-5">
                  {f.value || "-"}
                </p>
              </div>
            ))}
            <div className="group relative overflow-hidden rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-50/80 to-white px-4 py-3.5 transition-all duration-200 hover:shadow-md hover:border-slate-300/80 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative flex items-center gap-2">
                <Award className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-xs font-medium text-slate-500">
                  Status de Disponibilidade
                </p>
              </div>
              <div className="relative mt-1 pl-5">
                <SituationBadge situacao={beneficiador.situacao_capacidade} />
              </div>
            </div>
          </div>

          {/* Individual chart */}
          <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-50/30 to-white p-5 transition-all duration-200 hover:border-slate-300/80">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
                <BarChart2 className="h-4 w-4 text-blue-600" />
              </div>
              <h4 className="text-sm font-semibold text-slate-700">
                Visão Geral
              </h4>
              <span className="ml-auto text-[10px] font-medium text-slate-400">
                Distribuição de capacidade
              </span>
            </div>
            
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={chartData}
                margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
                barSize={48}
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0.05} />
                  </linearGradient>
                  <filter id="barGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15" />
                  </filter>
                </defs>

                <CartesianGrid 
                  strokeDasharray="4 4" 
                  stroke="#e2e8f0" 
                  strokeOpacity={0.4}
                  vertical={false}
                />
                
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                  axisLine={{ stroke: '#e2e8f0', strokeWidth: 0.5 }}
                  tickLine={false}
                />
                
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatNumber(value)}
                />
                
                <Tooltip
                  formatter={(value: number) => formatNumber(value)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    backgroundColor: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(8px)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                    padding: "8px 12px",
                    fontSize: 12,
                  }}
                  labelStyle={{ fontWeight: 600, color: "#1e293b" }}
                  cursor={{ 
                    fill: "url(#chartGradient)",
                    radius: 8,
                  }}
                />
                
                <Bar 
                  dataKey="value" 
                  radius={[8, 8, 0, 0]}
                  filter="url(#barGlow)"
                  animationDuration={800}
                  animationBegin={200}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-200/60 bg-gradient-to-r from-slate-50/30 to-white px-6 py-4 rounded-b-2xl">
          <Button 
            variant="secondary" 
            onClick={onClose}
            className="rounded-xl px-6 font-medium transition-all duration-200 hover:scale-105"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
