"""
ClienteRepo — acceso a datos para el aggregate Cliente.
Maneja la persistencia en ambas tablas (usuario + cliente)
siguiendo el patrón class table inheritance.
Incluye queries para sub-recursos: direcciones, pedidos, carrito.
"""

import uuid

from app.infrastructure.database import DatabaseSession
from app.models.cliente import Cliente
from app.models.base import TipoUsuario

from .base import BaseRepository


class ClienteRepo(BaseRepository[Cliente]):
    table = "cliente"

    async def save(self, aggregate: Cliente) -> Cliente:
        """
        Persiste un Cliente en ambas tablas (class table inheritance).
        1. Inserta en `usuario`.
        2. Inserta en `cliente` con FK → usuario.
        """
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

        # Tabla cliente (FK → usuario)
        await self.db.insert("cliente", {"usuario_id": data["id"]})

        return aggregate

    async def get_by_id(self, id: uuid.UUID) -> Cliente | None:
        """
        Obtiene un Cliente reconstruyendo el aggregate desde ambas tablas.
        Usa select con join implícito vía PostgREST.
        """
        results = await self.db.select(
            "cliente",
            "usuario_id, usuario(*)",
            {"usuario_id": str(id)},
        )
        if not results:
            return None

        row = results[0]
        usuario_data = row["usuario"]

        return Cliente(
            id=uuid.UUID(usuario_data["id"]),
            nombre=usuario_data["nombre"],
            email=usuario_data["email"],
            password_hash=usuario_data["password_hash"],
            telefono=usuario_data.get("telefono"),
            imagen_perfil=usuario_data.get("imagen_perfil"),
            es_verificado=usuario_data.get("es_verificado", False),
            tipo=TipoUsuario(usuario_data.get("tipo", "cliente")),
            fecha_creacion=usuario_data.get("fecha_creacion"),
        )

    # ── Sub-recursos ───────────────────────────────────────────────

    async def get_direcciones(self, cliente_id: uuid.UUID) -> list[dict]:
        """Obtiene todas las direcciones del cliente."""
        return await self.db.select(
            "direccion_cliente",
            "*",
            {"cliente_id": str(cliente_id)},
        )

    async def crear_direccion(self,cliente_id:uuid.UUID,direccion:dict)->dict:
        """Registra una nueva direccion para el cliente"""
        direccion['cliente_id'] = cliente_id
        return await self.db.insert(
            "direccion_cliente",
            direccion
        )

    async def get_pedidos(self, cliente_id: uuid.UUID) -> list[dict]:
        """Obtiene todas las órdenes de pedido del cliente."""
        return await self.db.select(
            "orden_pedido",
            "*",
            {"cliente_id": str(cliente_id)},
        )

    async def get_carritos(self, cliente_id: uuid.UUID) -> list[dict]:
        """
        Obtiene todos los carritos del cliente con sus items.
        Usa join implícito vía PostgREST para traer carrito_item.
        """
        return await self.db.select(
            "carrito",
            "*, carrito_item(*)",
            {"cliente_id": str(cliente_id)},
        )
