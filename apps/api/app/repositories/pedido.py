"""
PedidoRepo — acceso a datos de pedido + pedido_actualizacion.
"""

import uuid
from app.models.pedido import Pedido, EstadoPedido
from app.repositories.base import BaseRepository


class PedidoRepo(BaseRepository[Pedido]):
    table = "pedido"

    def _to_aggregate(self, row: dict) -> Pedido:
        return Pedido(
            id=uuid.UUID(row["id"]) if isinstance(row["id"], str) else row["id"],
            orden_id=uuid.UUID(row["orden_id"]) if isinstance(row["orden_id"], str) else row["orden_id"],
            estado=EstadoPedido(row["estado"]),
            total=float(row["total"]),
            comision_servicio=float(row.get("comision_servicio", 0.0)),
            confirmado_at=row.get("confirmado_at"),
            entregado_at=row.get("entregado_at"),
        )

    async def get_by_id(self, pedido_id: uuid.UUID) -> Pedido | None:
        results = await self.db.select(self.table, "*", {"id": str(pedido_id)})
        if not results:
            return None
        return self._to_aggregate(results[0])

    async def get_by_orden(self, orden_id: uuid.UUID) -> Pedido | None:
        results = await self.db.select(self.table, "*", {"orden_id": str(orden_id)})
        if not results:
            return None
        return self._to_aggregate(results[0])

    async def save(self, pedido: Pedido) -> Pedido:
        pedido_dict = {
            "id": str(pedido.id),
            "orden_id": str(pedido.orden_id),
            "estado": pedido.estado.value,
            "total": pedido.total,
            "comision_servicio": pedido.comision_servicio,
        }
        if pedido.entregado_at:
            pedido_dict["entregado_at"] = pedido.entregado_at.isoformat()
        await self.db.upsert(self.table, pedido_dict)
        return pedido

    async def agregar_actualizacion(
        self,
        pedido_id: uuid.UUID,
        estado_nuevo: str,
        descripcion: str | None,
    ) -> dict:
        """Inserta un entry en el timeline de actualizaciones."""
        return await self.db.insert("pedido_actualizacion", {
            "pedido_id": str(pedido_id),
            "estado_nuevo": estado_nuevo,
            "descripcion": descripcion,
        })

    async def get_actualizaciones(self, pedido_id: uuid.UUID) -> list[dict]:
        results = await self.db.select(
            "pedido_actualizacion", "*", {"pedido_id": str(pedido_id)}
        )
        return results or []

    async def crear_valoracion(
        self,
        pedido_id: uuid.UUID,
        cliente_id: uuid.UUID,
        distribuidor_id: uuid.UUID,
        puntuacion: int,
        comentario: str | None,
    ) -> dict:
        """Inserta una valoración de un pedido."""
        return await self.db.insert("valoracion", {
            "pedido_id": str(pedido_id),
            "cliente_id": str(cliente_id),
            "distribuidor_id": str(distribuidor_id),
            "puntuacion": puntuacion,
            "comentario": comentario,
        })

    async def listar_por_distribuidor(
        self,
        distribuidor_id: uuid.UUID,
        estado: str | None = None,
    ) -> list[dict]:
        """Lista pedidos de un distribuidor con datos de la orden."""
        results = await self.db.select(
            self.table,
            "*, orden_pedido!inner(cliente_id, distribuidor_id, paquete_pedido(*, producto(nombre, imagen)), cliente!inner(usuario(nombre)), distribuidor!inner(nombre_negocio, usuario!inner(imagen_perfil, es_verificado)))",
            {"orden_pedido.distribuidor_id": str(distribuidor_id)},
        )
        if estado:
            results = [r for r in (results or []) if r.get("estado") == estado]
        return results or []

    async def listar_por_cliente(
        self,
        cliente_id: uuid.UUID,
        estado: str | None = None,
    ) -> list[dict]:
        """Lista pedidos de un cliente con datos de la orden."""
        results = await self.db.select(
            self.table,
            "*, orden_pedido!inner(cliente_id, distribuidor_id, paquete_pedido(*, producto(nombre, imagen)), cliente!inner(usuario(nombre)), distribuidor!inner(nombre_negocio, usuario!inner(imagen_perfil, es_verificado)))",
            {"orden_pedido.cliente_id": str(cliente_id)},
        )
        if estado:
            results = [r for r in (results or []) if r.get("estado") == estado]
        return results or []

    async def tiene_valoracion(self, pedido_id: uuid.UUID) -> bool:
        results = await self.db.select("valoracion", "id", {"pedido_id": str(pedido_id)})
        return bool(results)

    async def get_valoracion(self, pedido_id: uuid.UUID) -> dict | None:
        results = await self.db.select("valoracion", "*", {"pedido_id": str(pedido_id)})
        return results[0] if results else None
