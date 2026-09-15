import logging
import threading
import time
from typing import Any, Callable, Optional, Set

logger = logging.getLogger(__name__)


class CacheEntry:
    __slots__ = ("data", "loaded_at", "ttl_seconds")

    def __init__(self, data: Any, ttl_seconds: int):
        self.data = data
        self.loaded_at = time.monotonic()
        self.ttl_seconds = ttl_seconds

    @property
    def is_expired(self) -> bool:
        return (time.monotonic() - self.loaded_at) >= self.ttl_seconds

    @property
    def age_seconds(self) -> float:
        return time.monotonic() - self.loaded_at


class BeneficiadoresCache:
    """Cache em memória para dados dos beneficiadores.

    Armazena os resultados brutos das 3 queries principais.
    Filtros são aplicados in-memory sobre os dados cached.
    """

    def __init__(self, ttl_seconds: int = 3600):
        self._ttl = ttl_seconds
        self._lock = threading.Lock()
        self._entries: dict[str, CacheEntry] = {}
        self._refresh_lock = threading.Lock()
        self._stats = {"hits": 0, "misses": 0, "errors": 0}
        self._load_fn: Optional[Callable] = None
        self._material_index: dict[str, frozenset[str]] = {}

    def set_loader(self, fn: Callable):
        self._load_fn = fn

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._entries.get(key)
            if entry is None:
                self._stats["misses"] += 1
                logger.debug("Cache MISS: key=%s", key)
                return None
            if entry.is_expired:
                self._stats["misses"] += 1
                logger.debug("Cache EXPIRED: key=%s age=%.0fs", key, entry.age_seconds)
                return None
            self._stats["hits"] += 1
            logger.debug("Cache HIT: key=%s age=%.0fs", key, entry.age_seconds)
            return entry.data

    def set(self, key: str, data: Any):
        with self._lock:
            self._entries[key] = CacheEntry(data, self._ttl)
            logger.debug("Cache SET: key=%s records=%d", key, self._len(data))

    def set_material_index(self, index: dict[str, Set[str]]):
        """Substitui o índice para não manter dados de um refresh anterior."""
        normalized = {
            str(material).strip(): frozenset(str(beneficiador).strip() for beneficiador in beneficiadores)
            for material, beneficiadores in index.items()
        }
        with self._lock:
            self._material_index = normalized

    def get_beneficiadores_by_materials(self, materials: list[str]) -> Set[str]:
        """Retorna a união dos beneficiadores relacionados aos materiais."""
        with self._lock:
            beneficiadores: Set[str] = set()
            for material in materials:
                beneficiadores.update(self._material_index.get(str(material).strip(), ()))
            return beneficiadores

    def get_material_index(self) -> dict[str, list[str]]:
        with self._lock:
            return {material: sorted(beneficiadores) for material, beneficiadores in self._material_index.items()}

    def invalidate(self, key: Optional[str] = None):
        with self._lock:
            if key:
                self._entries.pop(key, None)
            else:
                self._entries.clear()
                self._material_index = {}
            logger.info("Cache INVALIDATED: key=%s", key or "ALL")

    def refresh(self):
        if self._load_fn is None:
            return
        if not self._refresh_lock.acquire(blocking=False):
            logger.debug("Cache refresh already in progress, skipping")
            return
        try:
            logger.info("Cache refresh STARTED")
            start = time.monotonic()
            data = self._load_fn()
            elapsed = time.monotonic() - start
            material_index = data.pop("material_index", None)
            with self._lock:
                for key, value in data.items():
                    self._entries[key] = CacheEntry(value, self._ttl)
                if material_index is not None:
                    self._material_index = {
                        str(material).strip(): frozenset(
                            str(beneficiador).strip()
                            for beneficiador in beneficiadores
                        )
                        for material, beneficiadores in material_index.items()
                    }
            total_records = sum(self._len(v) for v in data.values())
            logger.info(
                "Cache refresh COMPLETED: %d records in %.2fs",
                total_records,
                elapsed,
            )
        except Exception:
            self._stats["errors"] += 1
            logger.exception("Cache refresh FAILED")
        finally:
            self._refresh_lock.release()

    def get_stats(self) -> dict:
        with self._lock:
            total = self._stats["hits"] + self._stats["misses"]
            hit_rate = (self._stats["hits"] / total * 100) if total > 0 else 0
            return {
                **self._stats,
                "hit_rate_pct": round(hit_rate, 1),
                "entries": len(self._entries),
            }

    @staticmethod
    def _len(data: Any) -> int:
        if data is None:
            return 0
        if isinstance(data, (list, tuple)):
            return len(data)
        if isinstance(data, dict):
            return len(data)
        return 1


class BackgroundRefresher:
    """Thread daemon que atualiza o cache periodicamente."""

    def __init__(self, cache: BeneficiadoresCache, interval_seconds: int = 3600):
        self._cache = cache
        self._interval = interval_seconds
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None

    def start(self):
        self._cache.refresh()
        self._thread = threading.Thread(
            target=self._run, daemon=True, name="cache-refresher"
        )
        self._thread.start()
        logger.info(
            "Background refresher STARTED: interval=%ds", self._interval
        )

    def stop(self):
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=5)
        logger.info("Background refresher STOPPED")

    def _run(self):
        while not self._stop_event.wait(timeout=self._interval):
            try:
                self._cache.refresh()
            except Exception:
                logger.exception("Background refresh cycle failed")
