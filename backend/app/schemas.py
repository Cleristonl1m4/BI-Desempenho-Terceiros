from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import date
from decimal import Decimal

class CapacidadeIndicadores(BaseModel):
    beneficiador_id: str
    beneficiador_nome: str
    capacidade_media_mensal: Optional[float] = Field(None, description="Média da capacidade mensal")
    producao_total_alocada: float = Field(0.0, description="Total de produção alocada")
    disponibilidade: Optional[float] = Field(None, description="Capacidade livre para novos materiais")
    disponibilidade_percentual: Optional[float] = Field(None, description="% de disponibilidade")
    ultima_data_inicio: Optional[date] = Field(None, description="Última data de início entre os materiais alocados")
    media_pecas_dia: float = Field(0.0, description="Média de peças produzidas por dia")
    media_tempo_producao_dias: Optional[int] = Field(None, description="Tempo médio de produção em dias")
    situacao_capacidade: Literal["Alta", "Média", "Baixa"] = Field("Baixa", description="Classificação textual da capacidade")

class ErrorResponse(BaseModel):
    detail: str

class FiltrosIndicadores(BaseModel):
    beneficiador_id: Optional[str] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    material: Optional[str] = None