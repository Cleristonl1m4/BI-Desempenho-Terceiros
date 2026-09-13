export type SituacaoCapacidade = 'Alta' | 'Média' | 'Baixa';

export interface BeneficiadorIndicador {
  beneficiador_id: string | number;  
  beneficiador_nome: string;
  capacidade_media_mensal: number;
  producao_total_alocada: number;
  disponibilidade: number;
  disponibilidade_percentual: number;
  ultima_data_inicio: string;
  media_pecas_dia: number;
  media_tempo_producao_dias: number;
  situacao_capacidade: 'Alta' | 'Média' | 'Baixa';
  material?: string;
  material_descricao?: string;
}

export interface IndicadorFilters {
  beneficiador_id?: string;
  material?: string;
  especif1?: string;
  data_inicio?: string;
  data_fim?: string;
  situacao?: SituacaoCapacidade | 'Todas';
}

export interface ApiHealth {
  status: 'online' | 'offline';
  version: string;
  timestamp: string;
}

export type SortDirection = 'asc' | 'desc';

export type SortableColumn =
  | 'beneficiador_nome'
  | 'capacidade_media_mensal'
  | 'producao_total_alocada'
  | 'disponibilidade'
  | 'disponibilidade_percentual'
  | 'ultima_data_inicio'
  | 'media_pecas_dia'
  | 'situacao_capacidade'
  | 'ranking';

export interface SortState {
  column: SortableColumn;
  direction: SortDirection;
}

export interface RankingItem {
  beneficiador_id: string | number;
  beneficiador_nome: string;
  distancia: number;
  rank: number;
}

export interface RankingAverages {
  mediaCapacidade: number;
  mediaProducao: number;
  mediaDisponibilidade: number;
}

export interface ChartTotals {
  capacidade: number;
  producao: number;
  disponibilidade: number;
  totalCapacidade?: number;
  totalProducao?: number;
}
