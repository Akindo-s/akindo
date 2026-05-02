"""
UsuarioRepo — acceso a datos de la tabla `usuario`.
"""

from uuid import UUID

from app.models.usuario import Usuario
from app.models.base import TipoUsuario
from datetime import datetime

from .base import BaseRepository


class UsuarioRepo(BaseRepository[Usuario]):
    table = "usuario"
    def _to_aggregate(self, row: dict) -> Usuario:
        """Hidrata un Aggregate Usuario desde un diccionario de base de datos."""
        # Convertimos strings a tipos nativos
        id_obj = UUID(row["id"]) if isinstance(row["id"], str) else row["id"]
        fecha_obj = datetime.fromisoformat(row["created_at"]) if "created_at" in row and row["created_at"] else None
        
        return Usuario(
            id=id_obj,
            nombre=row["nombre"],
            email=row["email"],
            password_hash=row["password_hash"],
            telefono=row.get("telefono"),
            imagen_perfil=row.get("imagen_perfil"),
            es_verificado=row.get("es_verificado", False),
            tipo=TipoUsuario(row.get("tipo", "cliente")),
            fecha_creacion=fecha_obj
        )

    async def get_by_email(self, email: str) -> Usuario | None:
        """Busca un usuario por su email (unique)."""
        results = await self.db.select(self.table, "*", {"email": email})
        return self._to_aggregate(results[0]) if results else None

    async def save(self, aggregate: Usuario) -> Usuario:
        """Persiste o actualiza un usuario en la tabla `usuario` (Upsert)."""
        data = aggregate.to_dict()
        # Aseguramos que se actualicen todos los campos, o se inserten
        await self.db.upsert(self.table, data)
        return aggregate

    async def get_by_id(self, id: UUID) -> Usuario | None:
        """Obtiene un usuario por su ID y lo hidrata."""
        return await super().get(id)