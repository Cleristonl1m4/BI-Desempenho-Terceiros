import pytest
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session
from backend.app.services import BeneficiadorService
from backend.app.schemas import CapacidadeIndicadores
from backend.app.exceptions import BeneficiadorNotFoundError

class TestBeneficiadorService:
    
    @pytest.fixture
    def service(self):
        mock_db = Mock(spec=Session)
        return BeneficiadorService(mock_db)
    
    def test_classificar_capacidade_alta(self, service):
        """Teste para classificação 'Alta' (disponibilidade > 40%)"""
        assert service._classificar_capacidade(50.0) == "Alta"
        assert service._classificar_capacidade(41.0) == "Alta"
        assert service._classificar_capacidade(100.0) == "Alta"
    
    def test_classificar_capacidade_media(self, service):
        """Teste para classificação 'Média' (disponibilidade entre 20% e 40%)"""
        assert service._classificar_capacidade(20.0) == "Média"
        assert service._classificar_capacidade(30.0) == "Média"
        assert service._classificar_capacidade(40.0) == "Média"
    
    def test_classificar_capacidade_baixa(self, service):
        """Teste para classificação 'Baixa' (disponibilidade < 20%)"""
        assert service._classificar_capacidade(0.0) == "Baixa"
        assert service._classificar_capacidade(19.99) == "Baixa"
        assert service._classificar_capacidade(-10.0) == "Baixa"
        assert service._classificar_capacidade(None) == "Baixa"
    
    def test_round_decimal(self, service):
        """Teste para arredondamento decimal com ROUND_HALF_UP"""
        assert service._round_decimal(10.565) == 10.57
        assert service._round_decimal(10.564) == 10.56
        assert service._round_decimal(None) is None
        assert service._round_decimal(0.0) == 0.0
    
    def test_calcular_dias_periodo(self, service):
        """Teste para cálculo de dias no período"""
        hoje = date.today()
        inicio = hoje - timedelta(days=30)
        dias = service._calcular_dias_periodo(inicio, hoje)
        assert dias == 31  # 30 dias + 1 dia inclusive
        
    def test_processar_sem_capacidade(self, service):
        """Nenhum registro de capacidade deve produzir uma lista vazia."""
        assert service.processar_indicadores([], [], []) == []

if __name__ == "__main__":
    pytest.main()
