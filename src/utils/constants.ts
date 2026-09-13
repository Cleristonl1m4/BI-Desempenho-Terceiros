import type { SituacaoCapacidade } from '@/types';

export const SITUACAO_COLORS: Record<SituacaoCapacidade, string> = {
  Alta: '#22C55E',
  Média: '#EAB308',
  Baixa: '#EF4444',
};

export const SITUACAO_BADGE: Record<SituacaoCapacidade, string> = {
  Alta: 'bg-success-100 text-success-700',
  Média: 'bg-warning-100 text-warning-700',
  Baixa: 'bg-danger-100 text-danger-700',
};

export const SITUACAO_DOT: Record<SituacaoCapacidade, string> = {
  Alta: 'bg-success-500',
  Média: 'bg-warning-500',
  Baixa: 'bg-danger-500',
};

export const CHART_COLORS = {
  capacidade: '#3B82F6',
  producao: '#F59E0B',
  disponibilidade: '#8B5CF6',
} as const;

export const PAGE_SIZES = [6, 10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = 6;
export const TOP_CHART_ITEMS = 15;
export const DEBOUNCE_MS = 500;
