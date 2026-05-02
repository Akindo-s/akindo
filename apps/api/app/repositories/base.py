"""
BaseRepository — repositorio genérico abstracto.
Define operaciones CRUD comunes que todos los repos concretos heredan.
Usa DatabaseSession (interfaz) para desacoplarse de la implementación.
"""

from typing import Coroutine
from abc import ABC,abstractmethod
from typing import Generic, TypeVar
from uuid import UUID

from app.infrastructure.database import DatabaseSession
from app.models.base import Aggregate

T = TypeVar("T", bound=Aggregate)


class BaseRepository(ABC, Generic[T]):
    """Repositorio base genérico. Subclases definen `table` y lógica de mapeo."""

    table: str  # nombre de la tabla en Supabase

    def __init__(self, db: DatabaseSession):
        self.db = db

    async def get(self, id: UUID) -> T | None:
        """Obtiene un registro por su ID primario e hidrata el Aggregate."""
        results = await self.db.select(self.table, "*", {"id": str(id)})
        return self._to_aggregate(results[0]) if results else None

    async def get_all(self) -> list[T]:
        """Retorna todos los registros hidratados como Aggregates."""
        results = await self.db.select(self.table)
        return [self._to_aggregate(row) for row in results]

    @abstractmethod
    def _to_aggregate(self, row: dict) -> T:
        """Convierte una fila de la base de datos a una instancia de Aggregate."""
        ...

    async def upsert(self, data: dict) -> Coroutine:
        """Guarda o actualiza el registro en la tabla"""
        return self.db.upsert(self.table, data)

    @abstractmethod
    async def save(self, aggregate: T) -> Coroutine:
        """Guarda o actualiza el registro en la tabla """
        raise Exception("El metodo save de algun repositorio no esta delcarado y se esta usando!")


    async def delete(self, id: UUID) -> None:
        """Elimina un registro por su ID."""
        await self.db.delete(self.table, {"id": str(id)})

    
