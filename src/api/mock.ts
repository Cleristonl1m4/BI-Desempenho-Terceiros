import type { BeneficiadorIndicador, SituacaoCapacidade } from '@/types';

function classify(disponibilidadePercentual: number | null): SituacaoCapacidade {
  if (disponibilidadePercentual == null) return 'Baixa';
  if (disponibilidadePercentual > 40) return 'Alta';
  if (disponibilidadePercentual >= 20) return 'Média';
  return 'Baixa';
}

const nomes = [
  'Beneficiador XPTO', 'Beneficiador ABC', 'Beneficiador DEF', 'Beneficiador Metalúrgica Sul',
  'Beneficiador Aço Forte', 'Beneficiador Irmãos Silva', 'Beneficiador Norte Indústria',
  'Beneficiador Ferro & Cia', 'Beneficiador Tekno Rodas', 'Beneficiador VRF Components',
  'Beneficiador Forja Brasil', 'Beneficiador Rápido Usinagem', 'Beneficiador Precision Parts',
  'Beneficiador Alpha Tratamentos', 'Beneficiador Beta Manufatura', 'Beneficiador Gamma Forjas',
  'Beneficiador Delta Indústria', 'Beneficiador Epsilon Peças', 'Beneficiador Zeta Mecânica',
  'Beneficiador Omega Metal', 'Beneficiador Sigma Forjados', 'Beneficiador Theta Componentes',
  'Beneficiador Lambda Usinagem', 'Beneficiador Kappa Peças', 'Beneficiador Rho Metalúrgica',
  'Beneficiador Phi Indústria', 'Beneficiador Chi Mecânica', 'Beneficiador Psi Forjados',
  'Beneficiador Omega Components', 'Beneficiador Atlas Metal',
];

function seedRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

export function generateMockIndicadores(count = 30): BeneficiadorIndicador[] {
  const rand = seedRandom(42);
  const referenceDate = new Date();
  return Array.from({ length: count }, (_, i) => {
    const capacidade = Math.round((rand() * 20000 + 3000) * 100) / 100;
    const producao = Math.round(rand() * capacidade * 100) / 100;
    const disponibilidade = Math.round((capacidade - producao) * 100) / 100;
    const percentual = Math.round((disponibilidade / capacidade) * 1000) / 10;
    const mediaPecas = Math.round((producao / 30) * 100) / 100;
    const mediaTempo = Math.floor(rand() * 15) + 1;
    const diasAtras = Math.floor(rand() * 60);
    const data = new Date(referenceDate);
    data.setDate(data.getDate() - diasAtras);

    return {
      beneficiador_id: String(10000 + i * 137),
      beneficiador_nome: nomes[i % nomes.length],
      capacidade_media_mensal: capacidade,
      producao_total_alocada: producao,
      disponibilidade,
      disponibilidade_percentual: percentual,
      ultima_data_inicio: data.toISOString().slice(0, 10),
      media_pecas_dia: mediaPecas,
      media_tempo_producao_dias: mediaTempo,
      situacao_capacidade: classify(percentual),
    };
  });
}

export const MOCK_INDICADORES = generateMockIndicadores();
