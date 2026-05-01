"""
UsuarioRepo — acceso a datos de la tabla `usuario`.
"""

from uuid import UUID

from app.infrastructure.database import DatabaseSession
from app.models.usuario import Usuario

from .base import BaseRepository


class UsuarioRepo(BaseRepository[Usuario]):
    table = "usuario"

    async def get_by_email(self, email: str) -> dict | None:
        """Busca un usuario por su email (unique)."""
        results = await self.db.select(self.table, "*", {"email": email})
        return results[0] if results else None

    async def save(self, aggregate: Usuario) -> Usuario:
        """Persiste un usuario en la tabla `usuario`."""
        data = aggregate.to_dict()
        await self.db.insert(self.table, data)
        return aggregate

    async def get_by_id(self, id: UUID) -> dict | None:
        """Obtiene un usuario por su ID."""
        results = await self.db.select(self.table, "*", {"id": str(id)})
        return results[0] if results else None