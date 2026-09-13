import { useState } from "react";
import { Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { IndicadorFilters, SituacaoCapacidade } from "@/types";

interface FilterBarProps {
  onApply: (filters: IndicadorFilters) => void;
  onClear: () => void;
  initial?: IndicadorFilters;
}

const REFERENCE_YEAR = new Date().getFullYear();

function semestreToDateRange(value: string): { data_inicio: string; data_fim: string } {
  if (value === "1") {
    return { data_inicio: `${REFERENCE_YEAR}-01-01`, data_fim: `${REFERENCE_YEAR}-06-30` };
  }
  if (value === "2") {
    return { data_inicio: `${REFERENCE_YEAR}-07-01`, data_fim: `${REFERENCE_YEAR}-12-31` };
  }
  return { data_inicio: `${REFERENCE_YEAR}-01-01`, data_fim: `${REFERENCE_YEAR}-12-31` };
}

export function FilterBar({ onApply, onClear, initial = {} }: FilterBarProps) {
  const [beneficiadorId, setBeneficiadorId] = useState(initial.beneficiador_id ?? "");
  const [material, setMaterial] = useState(initial.material ?? "");
  const [especif1, setEspecif1] = useState(initial.especif1 ?? "");
  const [semestre, setSemestre] = useState<string>(() => {
    if (!initial.data_inicio || !initial.data_fim) return "1,2";
    const jan = initial.data_inicio.includes("-01-01");
    const jun = initial.data_fim.includes("-06-30");
    const jul = initial.data_inicio.includes("-07-01");
    const dez = initial.data_fim.includes("-12-31");
    if (jan && jun) return "1";
    if (jul && dez) return "2";
    return "1,2";
  });
  const [situacao, setSituacao] = useState<SituacaoCapacidade | "Todas">(initial.situacao ?? "Todas");

  const buildFilters = (): IndicadorFilters => {
    const dates = semestreToDateRange(semestre);
    return {
      beneficiador_id: beneficiadorId || undefined,
      material: material || undefined,
      especif1: especif1 || undefined,
      data_inicio: dates.data_inicio,
      data_fim: dates.data_fim,
      situacao: situacao === "Todas" ? undefined : situacao,
    };
  };

  const handleApply = () => {
    onApply(buildFilters());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApply();
    }
  };

  const handleClear = () => {
    setBeneficiadorId("");
    setMaterial("");
    setEspecif1("");
    setSemestre("1,2");
    setSituacao("Todas");
    onClear();
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors";

  const selectClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors";

  const hasActiveFilters = beneficiadorId || material || especif1 || semestre !== "1,2" || situacao !== "Todas";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={beneficiadorId}
            onChange={(e) => setBeneficiadorId(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Codigo beneficiador..."
            className={inputClass}
            aria-label="Buscar beneficiador"
          />
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Codigo material..."
            className={inputClass}
            aria-label="Buscar material"
          />
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={especif1}
            onChange={(e) => setEspecif1(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Especificador..."
            className={inputClass}
            aria-label="Buscar especificador do material"
          />
        </div>

        <select
          value={semestre}
          onChange={(e) => setSemestre(e.target.value)}
          className={selectClass}
          aria-label="Semestre de pesquisa"
        >
          <option value="1,2">1º e 2º Semestre ({REFERENCE_YEAR})</option>
          <option value="1">1º Semestre ({REFERENCE_YEAR})</option>
          <option value="2">2º Semestre ({REFERENCE_YEAR})</option>
        </select>

        <select
          value={situacao}
          onChange={(e) => setSituacao(e.target.value as SituacaoCapacidade | "Todas")}
          className={selectClass}
          aria-label="Situação da capacidade"
        >
          <option value="Todas">Todas as Situações</option>
          <option value="Alta">Alta Capacidade</option>
          <option value="Média">Média Capacidade</option>
          <option value="Baixa">Baixa Capacidade</option>
        </select>

        <div className="flex items-end gap-2">
          <Button variant="primary" size="sm" onClick={handleApply} className="flex-1">
            <Filter className="h-4 w-4" />
            Aplicar
          </Button>
          {hasActiveFilters && (
            <Button variant="secondary" size="sm" onClick={handleClear}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
