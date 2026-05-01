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
    ) -> list[dict]:
        """Selecciona registros de la tabla indicada."""
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
    async def upsert(self,table:str,data:dict) -> Coroutine:
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

    async def select(
        self,
        table: str,
        columns: str = "*",
        filters: dict | None = None,
    ) -> list[dict]:
        query = self._client.table(table).select(columns)
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        response = await query.execute()
        return response.data

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
    
    async def upsert(self,table:str,data:dict)->Coroutine:
        query = self._client.table(table).upsert(data)
        response = query.execute()
        return response

        



# ── Dependency de FastAPI ──────────────────────────────────────────

_instance: SupabaseDb | None = None


async def get_db() -> DatabaseSession:
    """Dependency de FastAPI — retorna la instancia singleton de SupabaseDb."""
    global _instance
    if _instance is None:
        _instance = await SupabaseDb.create()
    return _instance
