from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    # Database credentials must be provided through the environment.
    database_url: str
    
    # Configurações da API
    api_version: str = "v1"
    app_title: str = "Beneficiadores API"
    
    # Configurações da aplicação
    app_name: str = "BI Desempenho Terceiros"
    debug: bool = False
    
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

settings = Settings()
