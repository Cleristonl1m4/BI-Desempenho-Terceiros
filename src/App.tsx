import { useState, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { FilterBar } from "@/components/filters/FilterBar";
import { CapacityVsProductionChart } from "@/components/charts/CapacityVsProductionChart";
import { SituationDistributionChart } from "@/components/charts/SituationDistributionChart";
import { ProductionTimeChart } from "@/components/charts/ProductionTimeChart";

import { DataTable } from "@/components/table/DataTable";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { DetailModal } from "@/components/modal/DetailModal";
import { ErrorState } from "@/components/ui/States";
import { useIndicadores, useApiHealth } from "@/hooks/useIndicadores";
import { BeneficiadorIndicador, IndicadorFilters, ChartTotals } from "@/types";
import { DEFAULT_PAGE_SIZE } from "@/utils/constants";
import type { IndicadoresPayload } from "@/api/endpoints";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60_000,
    },
  },
});

function DashboardContent() {
  const [filters, setFilters] = useState<IndicadorFilters>({});
  const [selected, setSelected] = useState<BeneficiadorIndicador | null>(null);
  const [page, setPage] = useState(0);

  // Health check
  const { data: healthData } = useApiHealth();
  const online = healthData?.status === "online";

  const { data: apiData, isLoading, isError, refetch } = useIndicadores();

  const payload = apiData as IndicadoresPayload | undefined;
  const rawData: BeneficiadorIndicador[] = useMemo(
    () => payload?.indicadores ?? [],
    [payload],
  );
  const materialData = useMemo(() => {
    if (!filters.material) return rawData;
    const especif1 = filters.especif1?.trim();
    const selectedMaterials = filters.material
      .split(",")
      .map((material) => material.trim())
      .filter(Boolean);
    const relatedBeneficiadores = new Set(
      selectedMaterials.flatMap((material) => {
        const key = especif1 ? `${material}::${especif1}` : material;
        return payload?.material_index?.[key] ?? [];
      }),
    );
    return selectedMaterials.flatMap((material) => {
      const key = especif1 ? `${material}::${especif1}` : material;
      return (payload?.indicadores_material?.[key] ?? []).filter((indicador) =>
        relatedBeneficiadores.has(String(indicador.beneficiador_id).trim()),
      );
    });
  }, [filters.material, filters.especif1, payload, rawData]);

  const loading = isLoading && !isError;

  const data = useMemo(() => {
    let filtered = materialData;

    if (filters.beneficiador_id) {
      const searchId = filters.beneficiador_id.toLowerCase().trim();
      filtered = filtered.filter(
        (d) =>
          String(d.beneficiador_id).toLowerCase().includes(searchId) ||
          d.beneficiador_nome?.toLowerCase().includes(searchId),
      );
    }

    if (filters.situacao) {
      filtered = filtered.filter(
        (d) => d.situacao_capacidade === filters.situacao,
      );
    }

    return filtered;
  }, [materialData, filters]);

  const sortedData = useMemo(
    () =>
      [...data].sort(
        (a, b) =>
          (b.capacidade_media_mensal ?? 0) - (a.capacidade_media_mensal ?? 0),
      ),
    [data],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(sortedData.length / DEFAULT_PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages - 1);
  const pageData = sortedData.slice(
    currentPage * DEFAULT_PAGE_SIZE,
    (currentPage + 1) * DEFAULT_PAGE_SIZE,
  );

  const chartTotals: ChartTotals = useMemo(
    () => ({
      capacidade: pageData.reduce(
        (s, d) => s + (d.capacidade_media_mensal ?? 0),
        0,
      ),
      producao: pageData.reduce(
        (s, d) => s + (d.producao_total_alocada ?? 0),
        0,
      ),
      disponibilidade: pageData.reduce(
        (s, d) => s + (d.disponibilidade ?? 0),
        0,
      ),
    }),
    [pageData],
  );

  const showError = isError && !apiData && rawData.length === 0;

  const handleApplyFilters = (newFilters: IndicadorFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleRowClick = (row: BeneficiadorIndicador) => {
    setSelected(row);
  };

  const handleCloseModal = () => {
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
        <Header online={online} />

      <main className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 sm:px-6">
        <FilterBar
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          initial={filters}
        />

        {showError ? (
          <ErrorState
            onRetry={() => {
              refetch();
            }}
          />
        ) : (
          <>
            <KpiCards data={filters.material ? data : rawData} />

            <DataTable
              data={data}
              loading={loading}
              onRowClick={handleRowClick}
              page={page}
              onPageChange={setPage}
            />

            {/* Gráficos */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <CapacityVsProductionChart
                data={pageData}
                loading={loading}
                totals={chartTotals}
              />
              <SituationDistributionChart data={pageData} loading={loading} />
              <ProductionTimeChart data={pageData} loading={loading} />
            </div>
          </>
        )}
      </main>

      <DetailModal beneficiador={selected} onClose={handleCloseModal} />
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        Dashboard de Indicadores de Capacidade - Beneficiadores
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  );
}
