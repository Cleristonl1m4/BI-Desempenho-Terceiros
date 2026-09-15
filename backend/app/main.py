from datetime import date
from typing import List
import logging
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
from starlette.staticfiles import StaticFiles

from .config import PROJECT_ROOT, settings
from .database import get_db, SessionLocal
from .exceptions import DatabaseError
from .schemas import CapacidadeIndicadores, ErrorResponse
from .services import BeneficiadorService
from .cache import BeneficiadoresCache, BackgroundRefresher

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

cache = BeneficiadoresCache(ttl_seconds=3600)
refresher = BackgroundRefresher(cache, interval_seconds=3600)


def _load_cache_data() -> dict:
    db = SessionLocal()
    try:
        service = BeneficiadorService(db)
        raw = service.load_all_data()
        resultados = service.processar_indicadores(
            raw["capacidades"], raw["alocamentos"], raw["tempos"]
        )
        indicadores_material: dict[str, list] = {}
        materiais = {
            str(capacidade.cd_material).strip()
            for capacidade in raw["capacidades"]
        }
        for material in materiais:
            indicadores_material[material] = service.processar_indicadores(
                raw["capacidades"], raw["alocamentos"], raw["tempos"],
                material=material,
            )
            especificadores = {
                str(capacidade.especif1).strip()
                for capacidade in raw["capacidades"]
                if str(capacidade.cd_material).strip() == material
                and capacidade.especif1
            }
            for especif1 in especificadores:
                indicadores_material[f"{material}::{especif1}"] = service.processar_indicadores(
                    raw["capacidades"], raw["alocamentos"], raw["tempos"],
                    material=material,
                    especif1=especif1,
                )
        material_index: dict[str, set[str]] = {}
        beneficiadores_capacidade = {
            str(capacidade.cd_beneficiador).strip()
            for capacidade in raw["capacidades"]
        }
        beneficiadores_alocados: set[str] = set()
        for relacao in raw["material_relacoes"]:
            material = str(relacao.CD_MATERIAL).strip()
            beneficiador = str(relacao.cd_beneficiador).strip()
            if beneficiador not in beneficiadores_capacidade:
                continue
            material_index.setdefault(material, set()).add(beneficiador)
            especif1 = str(relacao.ESPECIF1 or '').strip()
            if especif1:
                chave_especificada = f"{material}::{especif1}"
                material_index.setdefault(chave_especificada, set()).add(beneficiador)
            beneficiadores_alocados.add(beneficiador)
        return {
            "indicadores": resultados,
            "indicadores_material": indicadores_material,
            "material_index": material_index,
            "beneficiadores_alocados_count": len(beneficiadores_alocados),
        }
    finally:
        db.close()


cache.set_loader(_load_cache_data)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Aplicacao iniciando - carregando cache")
    cache.invalidate()
    refresher.start()
    yield
    refresher.stop()
    logger.info("Aplicacao encerrando")


app = FastAPI(
    title=settings.app_title,
    version=settings.api_version,
    description="API para indicadores de capacidade de producao dos beneficiadores",
    lifespan=lifespan,
)

ALLOWED_ORIGINS = ["http://192.168.0.217:5008"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=dict)
async def health_check():
    return {
        "status": "online",
        "version": settings.api_version,
        "timestamp": date.today().isoformat(),
    }


@app.get(
    "/api/beneficiadores/indicadores",
    response_model=dict,
    responses={
        500: {"model": ErrorResponse, "description": "Erro interno do servidor"},
    },
)
async def get_indicadores_beneficiadores():
    """Retorna indicadores e o índice material-beneficiador do cache."""

    cached = cache.get("indicadores")
    if cached is not None:
        return {
            "indicadores": cached,
            "indicadores_material": cache.get("indicadores_material") or {},
            "material_index": cache.get_material_index(),
            "beneficiadores_alocados_count": cache.get("beneficiadores_alocados_count") or 0,
        }

    try:
        logger.info("Cache miss - executando queries no banco")
        resultados = await run_in_threadpool(_load_cache_data)
        cache.set("indicadores", resultados["indicadores"])
        cache.set("indicadores_material", resultados["indicadores_material"])
        cache.set_material_index(resultados["material_index"])
        return {
            "indicadores": resultados["indicadores"],
            "indicadores_material": resultados["indicadores_material"],
            "material_index": cache.get_material_index(),
            "beneficiadores_alocados_count": resultados["beneficiadores_alocados_count"],
        }

    except DatabaseError as e:
        logger.error("Erro no banco de dados: %s", str(e), exc_info=True)
        return JSONResponse(status_code=500, content={"detail": str(e.detail)})

    except Exception as e:
        logger.exception("Erro inesperado ao buscar indicadores")
        return JSONResponse(status_code=500, content={"detail": "Erro interno do servidor"})


DIST_DIR = PROJECT_ROOT / "dist"
ASSETS_DIR = DIST_DIR / "assets"
if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")


@app.get("/{path:path}", include_in_schema=False)
async def serve_frontend(path: str):
    """Serve arquivos compilados e permite o fallback das rotas da SPA."""
    requested_file = DIST_DIR / path
    if path and requested_file.is_file():
        return FileResponse(requested_file)

    index_file = DIST_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)

    return JSONResponse(
        status_code=503,
        content={"detail": "Frontend ainda não foi compilado. Execute npm run build."},
    )
