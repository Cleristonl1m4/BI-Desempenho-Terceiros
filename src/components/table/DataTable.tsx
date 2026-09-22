import { Fragment, useState, useMemo, type ReactNode } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Inbox,
  Trophy,
  TrendingUp,
  Users,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react";
import type {
  BeneficiadorIndicador,
  SortState,
  SortableColumn,
  SortDirection,
} from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { PAGE_SIZES, DEFAULT_PAGE_SIZE } from "@/utils/constants";
import { formatNumber, formatPercent, formatDate } from "@/utils/format";
import { exportToCsv } from "@/utils/csv";
import { cn } from "@/utils/cn";

interface DataTableProps {
  data: BeneficiadorIndicador[];
  materialDetails: Record<string, BeneficiadorIndicador[]>;
  materialDescriptions: Record<string, string>;
  loading: boolean;
  onRowClick: (row: BeneficiadorIndicador) => void;
  page: number;
  onPageChange: (page: number) => void;
}

interface ColumnDef {
  key: string;
  label: string;
  align: "left" | "right" | "center";
  sortable: boolean;
  sortKey?: SortableColumn;
  render: (row: BeneficiadorIndicador) => ReactNode;
}

function getMedal(
  rank: number,
): { emoji: string; gradient: string; text: string; glow: string } | null {
  if (rank === 1)
    return {
      emoji: "🥇",
      gradient: "bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-200",
      text: "text-amber-700",
      glow: "shadow-[0_0_20px_rgba(251,191,36,0.4)]",
    };
  if (rank === 2)
    return {
      emoji: "🥈",
      gradient: "bg-gradient-to-br from-slate-300 via-slate-200 to-gray-100",
      text: "text-slate-600",
      glow: "shadow-[0_0_20px_rgba(148,163,184,0.3)]",
    };
  if (rank === 3)
    return {
      emoji: "🥉",
      gradient: "bg-gradient-to-br from-orange-300 via-orange-200 to-amber-100",
      text: "text-orange-700",
      glow: "shadow-[0_0_20px_rgba(251,146,60,0.3)]",
    };
  return null;
}

function getSituacaoBadge(disponibilidadePercentual: number): {
  label: string;
  gradient: string;
  text: string;
  icon: string;
} {
  if (disponibilidadePercentual >= 40) {
    return {
      label: "Alta Capacidade",
      gradient: "bg-gradient-to-r from-emerald-400/20 to-emerald-500/10",
      text: "text-emerald-700",
      icon: "bg-emerald-500",
    };
  }
  if (disponibilidadePercentual >= 20) {
    return {
      label: "Média Capacidade",
      gradient: "bg-gradient-to-r from-amber-400/20 to-amber-500/10",
      text: "text-amber-700",
      icon: "bg-amber-500",
    };
  }
  return {
    label: "Baixa Capacidade",
    gradient: "bg-gradient-to-r from-red-400/20 to-red-500/10",
    text: "text-red-700",
    icon: "bg-red-500",
  };
}

function ProportionalBar({
  value,
  max,
  color,
  bgColor,
}: {
  value: number;
  max: number;
  color: string;
  bgColor: string;
}) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className={`relative h-2 flex-1 overflow-hidden rounded-full ${bgColor}`}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{ 
            width: `${percent}%`, 
            backgroundColor: color,
            boxShadow: `0 0 12px ${color}40`,
          }}
        />
      </div>
      <span className="w-20 text-right text-xs font-semibold tabular-nums text-slate-700">
        {formatNumber(value)}
      </span>
    </div>
  );
}

export function DataTable({
  data,
  materialDetails,
  materialDescriptions,
  loading,
  onRowClick,
  page,
  onPageChange,
}: DataTableProps) {
  const [sort, setSort] = useState<SortState>({
    column: "capacidade_media_mensal",
    direction: "desc",
  });
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const proximityRankMap = useMemo(() => {
    const sorted = [...data]
      .filter(
        (item) =>
          typeof item.capacidade_media_mensal === "number" &&
          Number.isFinite(item.capacidade_media_mensal),
      )
      .sort(
        (a, b) =>
          (b.capacidade_media_mensal ?? 0) - (a.capacidade_media_mensal ?? 0),
      );

    const map: Record<string, number> = {};
    sorted.forEach((item, index) => {
      map[String(item.beneficiador_id)] = index + 1;
    });
    return map;
  }, [data]);

  const maxValues = useMemo(
    () => ({
      capacidade: Math.max(
        ...data.map((d) => d.capacidade_media_mensal ?? 0),
        1,
      ),
      producao: Math.max(...data.map((d) => d.producao_total_alocada ?? 0), 1),
      disponibilidade: Math.max(...data.map((d) => d.disponibilidade ?? 0), 1),
    }),
    [data],
  );

  const columns: ColumnDef[] = [
    {
      key: "ranking",
      label: "Ranking",
      align: "center",
      sortable: false,
      render: (r) => {
        const rank = proximityRankMap[String(r.beneficiador_id)];
        if (!rank) return <span className="text-slate-300">-</span>;

        const medal = getMedal(rank);
        if (medal) {
          return (
            <span
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all duration-300 hover:scale-110",
                medal.gradient,
                medal.text,
                medal.glow,
              )}
              title={`${rank}º lugar`}
            >
              {medal.emoji}
            </span>
          );
        }

        return (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 transition-all duration-300 hover:bg-slate-200">
            {rank}º
          </span>
        );
      },
    },
    {
      key: "beneficiador_nome",
      label: "Beneficiador",
      align: "left",
      sortable: true,
      sortKey: "beneficiador_nome",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 hover:text-blue-600 transition-colors">
            {r.beneficiador_nome?.trim()}
          </span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Users className="h-3 w-3" />
            ID: {String(r.beneficiador_id).trim()}
          </span>
        </div>
      ),
    },
    {
      key: "capacidade_media_mensal",
      label: "Capacidade Mensal",
      align: "left",
      sortable: true,
      sortKey: "capacidade_media_mensal",
      render: (r) => (
        <ProportionalBar
          value={r.capacidade_media_mensal ?? 0}
          max={maxValues.capacidade}
          color="#6366F1"
          bgColor="bg-indigo-50/50"
        />
      ),
    },
    {
      key: "producao_total_alocada",
      label: "Produção Alocada",
      align: "left",
      sortable: true,
      sortKey: "producao_total_alocada",
      render: (r) => (
        <ProportionalBar
          value={r.producao_total_alocada ?? 0}
          max={maxValues.producao}
          color="#F59E0B"
          bgColor="bg-amber-50/50"
        />
      ),
    },
    {
      key: "disponibilidade",
      label: "Disponível p/ Novos Produtos",
      align: "left",
      sortable: true,
      sortKey: "disponibilidade",
      render: (r) => (
        <ProportionalBar
          value={r.disponibilidade ?? 0}
          max={maxValues.disponibilidade}
          color="#10B981"
          bgColor="bg-emerald-50/50"
        />
      ),
    },
    {
      key: "disponibilidade_percentual",
      label: "Disp. %",
      align: "center",
      sortable: true,
      sortKey: "disponibilidade_percentual",
      render: (r) => {
        const fallbackPercent =
          r.capacidade_media_mensal && r.capacidade_media_mensal > 0
            ? ((r.disponibilidade ?? 0) / r.capacidade_media_mensal) * 100
            : 0;
        const pct = r.disponibilidade_percentual ?? fallbackPercent;
        return (
          <span className="inline-block rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1 text-xs font-bold tabular-nums text-indigo-700 border border-indigo-100">
            {formatPercent(pct)}
          </span>
        );
      },
    },
    {
      key: "media_tempo_producao_dias",
      label: "Tempo Médio (dias)",
      align: "center",
      sortable: false,
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tabular-nums text-slate-700 bg-slate-50 px-3 py-1 rounded-full">
          <Calendar className="h-3 w-3 text-slate-400" />
          {r.media_tempo_producao_dias != null ? `${r.media_tempo_producao_dias} dias` : '-'}
        </span>
      ),
    },
    {
      key: "media_pecas_dia",
      label: "Peças/dia",
      align: "center",
      sortable: false,
      render: (r) => {
        const media =
          Math.round(((r.capacidade_media_mensal ?? 0) / 30) * 100) / 100;
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tabular-nums text-slate-700 bg-slate-50 px-3 py-1 rounded-full">
            <TrendingUp className="h-3 w-3 text-slate-400" />
            {formatNumber(media)}
          </span>
        );
      },
    },
    {
      key: "ultima_data_inicio",
      label: "Última Entrega",
      align: "center",
      sortable: true,
      sortKey: "ultima_data_inicio",
      render: (r) => (
        <span className="text-xs font-semibold tabular-nums text-slate-700 bg-slate-50 px-3 py-1 rounded-full">
          {formatDate(r.ultima_data_inicio)}
        </span>
      ),
    },
    {
      key: "situacao_capacidade",
      label: "Situação",
      align: "center",
      sortable: true,
      sortKey: "situacao_capacidade",
      render: (r) => {
        const fallbackPercent =
          r.capacidade_media_mensal && r.capacidade_media_mensal > 0
            ? ((r.disponibilidade ?? 0) / r.capacidade_media_mensal) * 100
            : 0;
        const pct = r.disponibilidade_percentual ?? fallbackPercent;
        const badge = getSituacaoBadge(pct);
        return (
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition-all duration-300 hover:scale-105",
              badge.gradient,
              badge.text,
            )}
          >
            <span className={cn("h-2 w-2 rounded-full animate-pulse", badge.icon)} />
            {badge.label}
          </span>
        );
      },
    },
  ];

  const sortedData = useMemo(() => {
    if (!sort) return data;
    const dir = sort.direction === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      const col = sort.column as SortableColumn;
      const av = col === "ranking" ? 0 : a[col];
      const bv = col === "ranking" ? 0 : b[col];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string" && typeof bv === "string")
        return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });
  }, [data, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const pageData = sortedData.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );

  const handleSort = (col: string) => {
    const sortCol = columns.find((c) => c.key === col);
    if (!sortCol?.sortKey) return;
    setSort((prev) => {
      if (prev.column === sortCol.sortKey) {
        const nextDir: SortDirection =
          prev.direction === "asc" ? "desc" : "asc";
        return { column: sortCol.sortKey!, direction: nextDir };
      }
      return { column: sortCol.sortKey!, direction: "asc" };
    });
    onPageChange(0);
  };

  const handlePageSize = (size: number) => {
    setPageSize(size);
    onPageChange(0);
  };

  const getMaterialRows = (beneficiadorId: string | number) =>
    Object.entries(materialDetails)
      .filter(([material]) => !material.includes("::"))
      .flatMap(([material, rows]) =>
        rows
          .filter((row) => String(row.beneficiador_id).trim() === String(beneficiadorId).trim())
          .map((row) => ({
            ...row,
            material,
            material_descricao: materialDescriptions[material],
          })),
      );

  const SortIcon = ({ col }: { col: string }) => {
    const sortCol = columns.find((c) => c.key === col);
    if (!sortCol?.sortKey) return null;
    if (sort.column !== sortCol.sortKey)
      return <ArrowUpDown className="h-3 w-3 text-white/40" />;
    return sort.direction === "asc" ? (
      <ArrowUp className="h-3 w-3 text-white" />
    ) : (
      <ArrowDown className="h-3 w-3 text-white" />
    );
  };

  return (
    <Card className="overflow-hidden border-0 shadow-2xl shadow-slate-200/50 backdrop-blur-sm bg-white/90">
      {/* Header */}
      <div
        className="relative flex items-center justify-between px-8 py-5 overflow-hidden"
        style={{ 
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
        
        <div className="relative flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-500/10 backdrop-blur-sm">
            <Trophy className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Dados dos Beneficiadores
            </h3>
            <p className="text-xs text-slate-400">
              {data.length} registros encontrados
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => exportToCsv(sortedData)}
          disabled={data.length === 0}
          className="relative gap-2 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/30 transition-all duration-300"
        >
          <Download className="h-4 w-4" />
          Exportar XLSX
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b-2 border-slate-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-600",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.align === "left" && "text-left",
                    col.sortKey &&
                      "cursor-pointer select-none hover:text-slate-900 transition-colors duration-200 group",
                  )}
                  onClick={col.sortKey ? () => handleSort(col.key) : undefined}
                >
                  <span
                    className={cn(
                      "inline-flex items-center gap-2",
                      col.align === "right" && "flex-row-reverse",
                    )}
                  >
                    {col.label}
                    {col.sortKey && (
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <SortIcon col={col.key} />
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-4">
                      <Skeleton className="h-5 w-full rounded-lg" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-20">
                  <div className="flex flex-col items-center justify-center gap-4 text-slate-400">
                    <div className="rounded-full bg-slate-50 p-4">
                      <Inbox className="h-12 w-12" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">
                      Nenhum resultado encontrado
                    </p>
                    <p className="text-xs text-slate-400">
                      Tente ajustar os filtros aplicados
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              pageData.map((row, rowIndex) => {
                const rank = proximityRankMap[String(row.beneficiador_id)];
                const isTop3 = rank && rank <= 3;
                const globalIndex = currentPage * pageSize + rowIndex;
                const rowId = String(row.beneficiador_id).trim();
                const isExpanded = expandedId === rowId;
                const materialRows = isExpanded ? getMaterialRows(row.beneficiador_id) : [];

                return (
                  <Fragment key={row.beneficiador_id}>
                    <tr
                      className={cn(
                        "cursor-pointer border-b border-slate-100 transition-all duration-300",
                        "hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/40 hover:shadow-sm",
                        isTop3 &&
                          "bg-gradient-to-r from-amber-50/60 via-amber-50/30 to-transparent border-l-4 border-l-amber-400",
                        !isTop3 && globalIndex % 2 === 0 && "bg-slate-50/30",
                        "group",
                      )}
                      onClick={() => onRowClick(row)}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "px-4 py-4 text-slate-700 transition-colors duration-200",
                            col.align === "right" && "text-right",
                            col.align === "center" && "text-center",
                          )}
                        >
                          {col.key === "beneficiador_nome" ? (
                            <div className="flex items-start gap-2">
                              <button
                                type="button"
                                aria-label={isExpanded ? "Ocultar materiais" : "Exibir materiais"}
                                title={isExpanded ? "Ocultar materiais" : "Exibir materiais"}
                                className="mt-0.5 rounded-md p-1 text-slate-400 transition hover:bg-blue-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setExpandedId(isExpanded ? null : rowId);
                                }}
                              >
                                {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                              {col.render(row)}
                            </div>
                          ) : (
                            col.render(row)
                          )}
                        </td>
                      ))}
                    </tr>
                    {isExpanded && (
                      <tr key={`${row.beneficiador_id}-details`} className="border-b border-blue-100 bg-blue-50/30">
                        <td colSpan={columns.length} className="px-6 py-3 sm:px-10">
                          <div className="overflow-x-auto rounded-lg border border-blue-100 bg-white/80 p-2 shadow-inner">
                            {materialRows.length === 0 ? (
                              <p className="px-4 py-3 text-xs text-slate-500">
                                Nenhum material vinculado encontrado.
                              </p>
                            ) : (
                              <table className="w-full min-w-[1100px] text-sm">
                                <thead>
                                  <tr className="border-b border-blue-100 bg-blue-50/70">
                                    {columns
                                      .filter((col) => col.key !== "ranking")
                                      .map((col) => (
                                        <th
                                          key={col.key}
                                          className={cn(
                                            "px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-blue-900/70",
                                            col.align === "right" && "text-right",
                                            col.align === "center" && "text-center",
                                            col.align === "left" && "text-left",
                                          )}
                                        >
                                          {col.key === "beneficiador_nome" ? "Material / Descrição" : col.label}
                                        </th>
                                      ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {materialRows.map((materialRow, materialIndex) => (
                                    <tr key={`${materialRow.material}-${materialIndex}`} className="border-b border-slate-100 last:border-0">
                                      {columns
                                        .filter((col) => col.key !== "ranking")
                                        .map((col) => (
                                          <td
                                            key={col.key}
                                            className={cn(
                                              "px-3 py-3 text-slate-700",
                                              col.align === "right" && "text-right",
                                              col.align === "center" && "text-center",
                                            )}
                                          >
                                            {col.key === "beneficiador_nome"
                                              ? (
                                                <span className="flex flex-col">
                                                  <span className="font-medium text-blue-800">{materialRow.material}</span>
                                                  <span className="text-[11px] text-slate-500">
                                                    {materialRow.material_descricao || "Descrição não informada"}
                                                  </span>
                                                </span>
                                              )
                                              : col.render(materialRow)}
                                          </td>
                                        ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-gradient-to-r from-slate-50/50 to-white px-8 py-4 sm:flex-row">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span className="font-medium">Itens por página:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSize(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all duration-200"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="ml-2 bg-white px-3 py-1 rounded-lg border border-slate-200">
            {sortedData.length > 0
              ? `${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, sortedData.length)} de ${sortedData.length}`
              : "0 itens"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage === 0}
            onClick={() => onPageChange(currentPage - 1)}
            className="hover:bg-slate-200/50 transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                Math.abs(p - (currentPage + 1)) <= 2 ||
                p === 1 ||
                p === totalPages,
            )
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center">
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="px-1 text-slate-400">…</span>
                )}
                <button
                  onClick={() => onPageChange(p - 1)}
                  className={cn(
                    "h-9 w-9 rounded-lg text-sm font-medium transition-all duration-200",
                    p - 1 === currentPage
                      ? "bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-lg shadow-slate-200"
                      : "text-slate-600 hover:bg-slate-200/50 hover:scale-105",
                  )}
                >
                  {p}
                </button>
              </span>
            ))}
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage >= totalPages - 1}
            onClick={() => onPageChange(currentPage + 1)}
            className="hover:bg-slate-200/50 transition-all duration-200"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
