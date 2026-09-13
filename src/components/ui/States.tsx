import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-100 text-danger-600">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">Ops! Algo deu errado</h3>
      <p className="mt-1 text-sm text-slate-500">
        Não foi possível carregar os dados. Tente novamente.
      </p>
      <Button variant="primary" className="mt-4" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" />
        Tentar Novamente
      </Button>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <span className="text-2xl">📭</span>
      </div>
      <h3 className="text-lg font-bold text-slate-900">Nenhum resultado encontrado</h3>
      <p className="mt-1 text-sm text-slate-500">Tente ajustar os filtros aplicados</p>
    </div>
  );
}
