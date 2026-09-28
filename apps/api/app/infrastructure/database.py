"""
DatabaseSession — interfaz abstracta para sesiones de base de datos.
SupabaseDb — implementación concreta usando supabase-py (async).
"""

from typing import Coroutine
from httpx import ResponseNotRead
from fastapi import datastructures
from fastapi import datastructures
from annotated_types import T
from abc import ABC, abstractmethod
from typing import Any

from supabase._async.client import AsyncClient, create_client

from app.core.config import settings


# ── Interfaz ───────────────────────────────────────────────────────


class DatabaseSession(ABC):
    """Contrato que debe cumplir cualquier adaptador de base de datos."""

    @abstractmethod
    async def insert(self, table: str, data: dict) -> dict:
        """Inserta un registro en la tabla indicada."""
        ...

    @abstractmethod
    async def select(
        self,
        table: str,
        columns: str = "*",
        filters: dict | None = None,
        limit: int | None = None,
        offset: int | None = None,
        filtros_texto: dict[str, str] | None = None,
        ids: list[str] | None = None,
        rangos: dict[str, tuple[Any, Any]] | None = None,
        columna_ids: str = "id",
        ordenar_por: str | None = None,
        descendente: bool = False,
    ) -> list[dict]:
        """Selecciona registros de la tabla indicada.

        `filters` son igualdades. `filtros_texto` son busquedas parciales sin
        distinguir mayusculas (`ilike`), y la clave puede ser la ruta de un
        recurso embebido con `!inner` (p. ej. "paquete_pedido.producto.nombre").
        `ids` limita a esos valores con un `in` sobre `columna_ids` (`id` por
        defecto), util cuando el filtro se calculo antes en Python porque no se
        puede expresar en SQL. `rangos` son intervalos
        cerrados por columna, `{"columna": (desde, hasta)}`, y cualquiera de
        los dos extremos puede ser `None` para dejar ese lado abierto.
        `ordenar_por` es la columna por la que se ordena y `descendente`
        invierte el sentido.
        """
        ...

    @abstractmethod
    async def select_con_total(
        self,
        table: str,
        columns: str = "*",
        filters: dict | None = None,
        limit: int | None = None,
        offset: int | None = None,
        filtros_texto: dict[str, str] | None = None,
        ids: list[str] | None = None,
        rangos: dict[str, tuple[Any, Any]] | None = None,
        columna_ids: str = "id",
        ordenar_por: str | None = None,
        descendente: bool = False,
    ) -> tuple[list[dict], int]:
        """Igual que `select`, mas cuantas filas hay en total.

        El total ignora `limit`/`offset`: es el de todas las filas que cumplen
        los filtros, que es lo que hace falta para paginar. `select` no sirve
        para esto porque devuelve `list[dict]` y no tiene donde traerlo.
        """
        ...

    @abstractmethod
    async def update(self, table: str, data: dict, filters: dict) -> dict:
        """Actualiza registros que coincidan con los filtros."""
        ...

    @abstractmethod
    async def delete(self, table: str, filters: dict) -> None:
        """Elimina registros que coincidan con los filtros."""
        ...

    @abstractmethod
    async def rpc(self, function_name: str, params: dict | None = None) -> Any:
        """Ejecuta una función RPC de PostgreSQL."""
        ...


    @abstractmethod
    async def upsert(
        self,
        table: str,
        data: dict,
        on_conflict: str | None = None,
        ignore_duplicates: bool = False,
        default_to_null: bool = False,
    ) -> dict:
        """Inserta o actualiza el registro en la tabla"""
        ...


# ── Implementación Supabase ────────────────────────────────────────


class SupabaseDb(DatabaseSession):
    """Implementación de DatabaseSession usando supabase-py async."""

    def __init__(self, client: AsyncClient):
        self._client = client

    @classmethod
    async def create(cls) -> "SupabaseDb":
        """Factory async — inicializa el cliente de Supabase."""
        client = await create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY,
        )
        return cls(client)

    # ── CRUD ───────────────────────────────────────────────────────

    async def insert(self, table: str, data: dict) -> dict:
        response = await self._client.table(table).insert(data).execute()
        return response.data[0] if response.data else {}

    @staticmethod
    def _aplicar_filtros(
        query,
        filters: dict | None,
        filtros_texto: dict[str, str] | None,
        ids: list[str] | None,
        limit: int | None,
        offset: int | None,
        rangos: dict[str, tuple[Any, Any]] | None = None,
        columna_ids: str = "id",
        ordenar_por: str | None = None,
        descendente: bool = False,
    ):
        """Arma los filtros comunes de `select` y `select_con_total`."""
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        if filtros_texto:
            for key, value in filtros_texto.items():
                query = query.ilike(key, f"%{value}%")
        if ids is not None:
            query = query.in_(columna_ids, ids)
        # Un rango con un extremo en `None` queda abierto de ese lado, asi el
        # llamador no tiene que armar dos casos para "desde X" y "hasta Y".
        if rangos:
            for key, (desde, hasta) in rangos.items():
                if desde is not None:
                    query = query.gte(key, desde)
                if hasta is not None:
                    query = query.lte(key, hasta)
        # El orden va antes del limit/offset: paginar sin ordenar devuelve las
        # filas en el orden que quiera Postgres, y una pagina podria repetir
        # filas de otra.
        if ordenar_por:
            query = query.order(ordenar_por, desc=descendente)
        if limit is not None:
            query = query.limit(limit)
        if offset is not None:
            query = query.offset(offset)
        return query

    async def select(
        self,
        table: str,
        columns: str = "*",
        filters: dict | None = None,
        limit: int | None = None,
        offset: int | None = None,
        filtros_texto: dict[str, str] | None = None,
        ids: list[str] | None = None,
        rangos: dict[str, tuple[Any, Any]] | None = None,
        columna_ids: str = "id",
        ordenar_por: str | None = None,
        descendente: bool = False,
    ) -> list[dict]:
        query = self._aplicar_filtros(
            self._client.table(table).select(columns),
            filters, filtros_texto, ids, limit, offset, rangos, columna_ids, ordenar_por, descendente,
        )
        response = await query.execute()
        return response.data

    async def select_con_total(
        self,
        table: str,
        columns: str = "*",
        filters: dict | None = None,
        limit: int | None = None,
        offset: int | None = None,
        filtros_texto: dict[str, str] | None = None,
        ids: list[str] | None = None,
        rangos: dict[str, tuple[Any, Any]] | None = None,
        columna_ids: str = "id",
        ordenar_por: str | None = None,
        descendente: bool = False,
    ) -> tuple[list[dict], int]:
        # `count="exact"` va en el select y no en los filtros: un filtro se
        # traduce a `.eq(columna, valor)`, asi que pasarlo ahi haria que
        # PostgREST buscara una columna llamada `count`. El total llega en
        # `response.count` (header Content-Range), no en `response.data`, y es
        # el de todas las filas que hacen match, no el de la pagina.
        query = self._aplicar_filtros(
            self._client.table(table).select(columns, count="exact"),
            filters, filtros_texto, ids, limit, offset, rangos, columna_ids, ordenar_por, descendente,
        )
        response = await query.execute()
        return (response.data or []), (response.count or 0)

    async def update(self, table: str, data: dict, filters: dict) -> dict:
        query = self._client.table(table).update(data)
        for key, value in filters.items():
            query = query.eq(key, value)
        response = await query.execute()
        return response.data[0] if response.data else {}

    async def delete(self, table: str, filters: dict) -> None:
        query = self._client.table(table).delete()
        for key, value in filters.items():
            query = query.eq(key, value)
        await query.execute()

    async def rpc(self, function_name: str, params: dict | None = None) -> Any:
        response = await self._client.rpc(function_name, params or {}).execute()
        return response.data
    
    async def upsert(
        self,
        table: str,
        data: dict,
        on_conflict: str | None = None,
        ignore_duplicates: bool = False,
        default_to_null: bool = False,
    ) -> dict:
        query = self._client.table(table).upsert(
            data,
            on_conflict=on_conflict,
            ignore_duplicates=ignore_duplicates,
            default_to_null=default_to_null,
        )
        response = await query.execute()
        return response.data[0] if response.data else {}

        



# ── Dependency de FastAPI ──────────────────────────────────────────

_instance: SupabaseDb | None = None


async def get_db() -> DatabaseSession:
    """Dependency de FastAPI — retorna la instancia singleton de SupabaseDb."""
    global _instance
    if _instance is None:
        _instance = await SupabaseDb.create()
    return _instance
