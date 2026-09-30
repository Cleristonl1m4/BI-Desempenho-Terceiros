import { AlertTriangle, LoaderCircle, RefreshCw } from 'lucide-react';
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

export function LoadingState() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-slate-50 px-6"
      role="status"
      aria-live="polite"
      aria-label="Carregando indicadores"
    >
      <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-slate-200 bg-white px-8 py-12 text-center shadow-xl shadow-slate-200/50">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <LoaderCircle className="h-8 w-8 animate-spin" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Carregando indicadores</h2>
        <p className="mt-2 text-sm text-slate-500">
          Aguarde enquanto consultamos os dados dos beneficiadores.
        </p>
        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-500" />
        </div>
      </div>
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
