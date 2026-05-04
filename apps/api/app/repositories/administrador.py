"""
AdministradorRepo — acceso a datos para el aggregate Administrador.
Maneja la persistencia en ambas tablas (usuario + administrador).
"""

import uuid
from datetime import datetime

from app.infrastructure.database import DatabaseSession
from app.models.administrador import Administrador
from app.models.base import TipoUsuario

from .base import BaseRepository


class AdministradorRepo(BaseRepository[Administrador]):
    table = "administrador"

    async def save(self, aggregate: Administrador) -> Administrador:
        data = aggregate.to_dict()

        # Tabla usuario
        usuario_data = {
            "id": data["id"],
            "nombre": data["nombre"],
            "email": data["email"],
            "password_hash": data["password_hash"],
            "telefono": data["telefono"],
            "imagen_perfil": data["imagen_perfil"],
            "es_verificado": data["es_verificado"],
            "tipo": data["tipo"],
        }
        await self.db.insert("usuario", usuario_data)

        # Tabla administrador (FK → usuario)
        await self.db.insert("administrador", {"usuario_id": data["id"]})

        return aggregate

    def _to_aggregate(self, row: dict) -> Administrador:
        usuario_data = row.get("usuario", row)
        
        id_obj = uuid.UUID(usuario_data["id"]) if isinstance(usuario_data["id"], str) else usuario_data["id"]
        fecha_obj = datetime.fromisoformat(usuario_data["created_at"]) if "created_at" in usuario_data and usuario_data["created_at"] else None
        
        return Administrador(
            id=id_obj,
            nombre=usuario_data["nombre"],
            email=usuario_data["email"],
            password_hash=usuario_data["password_hash"],
            telefono=usuario_data.get("telefono"),
            imagen_perfil=usuario_data.get("imagen_perfil"),
            es_verificado=usuario_data.get("es_verificado", False),
            tipo=TipoUsuario(usuario_data.get("tipo", "admin")),
            fecha_creacion=fecha_obj
        )

    async def get_by_id(self, id: uuid.UUID) -> Administrador | None:
        results = await self.db.select(
            "administrador",
            "usuario_id, usuario(*)",
            {"usuario_id": str(id)},
        )
        if not results:
            return None

        return self._to_aggregate(results[0])
