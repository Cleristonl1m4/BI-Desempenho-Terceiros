import { memo } from 'react';
import { TrendingUp, Clock, Wrench, Percent } from 'lucide-react';
import type { BeneficiadorIndicador } from '@/types';
import { Card } from '@/components/ui/Card';
import { formatNumber, formatPercent, normalizePercent } from '@/utils/format';

interface Props {
  data: BeneficiadorIndicador[];
}

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

function KpiCard({ title, value, icon, color, bg }: KpiCardProps) {
  return (
    <Card className="flex items-center gap-4 px-5 py-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 truncate">{title}</p>
        <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
      </div>
    </Card>
  );
}

function KpiCardsImpl({ data }: Props) {
  const total = data.length;

  const mediaCapacidade = total > 0
    ? data.reduce((s, d) => s + (d.capacidade_media_mensal ?? 0), 0) / total
    : 0;

  const mediaTempo = total > 0
    ? data.reduce((s, d) => s + (d.media_tempo_producao_dias ?? 0), 0) / total
    : 0;

  const mediaPecas = data.reduce((s, d) => s + (d.media_pecas_dia ?? 0), 0) / 30;

  const mediaDisp = total > 0
    ? data.reduce((s, d) => {
        const fallbackPercent = d.capacidade_media_mensal && d.capacidade_media_mensal > 0
          ? ((d.disponibilidade ?? 0) / d.capacidade_media_mensal) * 100
          : 0;
        return s + normalizePercent(d.disponibilidade_percentual ?? fallbackPercent);
      }, 0) / total
    : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Média Geral da Capacidade"
        value={formatNumber(mediaCapacidade)}
        icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
        color="text-blue-700"
        bg="bg-blue-50"
      />
      <KpiCard
        title="Tempo Médio Geral de Produção"
        value={`${formatNumber(mediaTempo, 0)} dias`}
        icon={<Clock className="h-5 w-5 text-violet-600" />}
        color="text-violet-700"
        bg="bg-violet-50"
      />
      <KpiCard
        title="Média Geral de Peças Produzidas/Dia"
        value={`${formatNumber(mediaPecas)} peças/dia`}
        icon={<Wrench className="h-5 w-5 text-amber-600" />}
        color="text-amber-700"
        bg="bg-amber-50"
      />
      <KpiCard
        title="Média Geral Disponibilidade dos Terceiros"
        value={formatPercent(mediaDisp)}
        icon={<Percent className="h-5 w-5 text-emerald-600" />}
        color="text-emerald-700"
        bg="bg-emerald-50"
      />
    </div>
  );
}

export const KpiCards = memo(KpiCardsImpl);
