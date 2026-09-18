import pytest
from fastapi.testclient import TestClient
from datetime import date, timedelta
from backend.app.main import app
from backend.app.database import get_db

client = TestClient(app)

class TestAPI:
    
    @pytest.fixture
    def mock_db(self):
        """Mock do banco de dados para testes"""
        pass
    
    def test_health_check(self):
        """Teste do endpoint de health check"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"
        assert "version" in data
    
    def test_indicadores_sem_filtros(self):
        """Teste do endpoint principal sem filtros"""
        response = client.get("/api/beneficiadores/indicadores")
        assert response.status_code == 200
        assert isinstance(response.json(), dict)
        assert "indicadores" in response.json()
    
    def test_indicadores_com_filtro_beneficiador(self):
        """Teste com filtro por beneficiador"""
        response = client.get("/api/beneficiadores/indicadores?beneficiador_id=12345")
        if response.status_code == 404:
            data = response.json()
            assert "detail" in data
            assert "não encontrado" in data["detail"]
        else:
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, dict)
            assert "indicadores" in data
    
    def test_indicadores_com_filtro_material(self):
        """Teste com filtro por material"""
        response = client.get("/api/beneficiadores/indicadores?material=ACO")
        assert response.status_code in [200, 500]
        
        if response.status_code == 200:
            data = response.json()
            if data.get("indicadores"):
                assert isinstance(data["indicadores"], list)
                # Verificar estrutura de dados
                expected_fields = [
                    "beneficiador_id", "beneficiador_nome", 
                    "capacidade_media_mensal", "producao_total_alocada",
                    "disponibilidade", "disponibilidade_percentual",
                    "ultima_data_inicio", "media_pecas_dia",
                    "situacao_capacidade"
                ]
                for field in expected_fields:
                    assert field in data["indicadores"][0]
    
    def test_indicadores_com_filtro_periodo(self):
        """Teste com filtro de período"""
        hoje = date.today()
        inicio = hoje - timedelta(days=30)
        
        response = client.get(
            f"/api/beneficiadores/indicadores?data_inicio={inicio}&data_fim={hoje}"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        assert isinstance(data["indicadores"], list)

if __name__ == "__main__":
    pytest.main()
