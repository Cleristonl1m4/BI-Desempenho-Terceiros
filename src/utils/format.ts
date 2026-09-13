import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value == null || Number.isNaN(value)) return '-';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function normalizePercent(value: number | string | null | undefined): number {
  if (value == null || value === '') return 0;

  const raw = typeof value === 'string' ? value.replace('%', '').trim() : value;
  const normalized = Number(raw);

  if (!Number.isFinite(normalized)) return 0;

  if (normalized >= 0 && normalized <= 1) {
    return normalized * 100;
  }

  return Math.min(Math.max(normalized, 0), 100);
}

export function formatPercent(value: number | string | null | undefined, decimals = 1): string {
  if (value == null || Number.isNaN(value)) return '-';

  const normalized = normalizePercent(value);
  return `${normalized.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  const date = parseISO(iso);
  if (!isValid(date)) return '-';
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
}

export function abbreviateName(name: string | null | undefined, max = 15): string {
  const safe = (name ?? "").trim();
  if (safe.length <= max) return safe;
  return `${safe.slice(0, max - 1)}…`;
}
