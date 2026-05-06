"""
OrdenPedidoRepo — acceso a datos de orden_pedido + paquete_pedido.
"""

import uuid
from app.models.orden_pedido import OrdenPedido, PaquetePedido, EstadoOrden
from app.repositories.base import BaseRepository


class OrdenPedidoRepo(BaseRepository[OrdenPedido]):
    table = "orden_pedido"

    def _to_aggregate(self, row: dict) -> OrdenPedido:
        paquetes_data = row.get("paquete_pedido", [])
        if not isinstance(paquetes_data, list):
            paquetes_data = [paquetes_data] if paquetes_data else []

        paquetes = [
            PaquetePedido(
                producto_id=uuid.UUID(p["producto_id"]) if isinstance(p["producto_id"], str) else p["producto_id"],
                cantidad=p["cantidad"],
                costo_unitario=float(p["costo_unitario"]),
                medida_snapshot=p.get("medida_snapshot") or {},
            )
            for p in paquetes_data
        ]

        return OrdenPedido(
            id=uuid.UUID(row["id"]) if isinstance(row["id"], str) else row["id"],
            cliente_id=uuid.UUID(row["cliente_id"]) if isinstance(row["cliente_id"], str) else row["cliente_id"],
            distribuidor_id=uuid.UUID(row["distribuidor_id"]) if isinstance(row["distribuidor_id"], str) else row["distribuidor_id"],
            direccion_id=uuid.UUID(row["direccion_id"]) if isinstance(row["direccion_id"], str) else row["direccion_id"],
            estado=EstadoOrden(row["estado"]),
            pre_autorizado=row.get("pre_autorizado", False),
            motivo_rechazo=row.get("motivo_rechazo"),
            paquetes=paquetes,
            created_at=row.get("created_at"),
        )

    async def get_by_id_raw(self, orden_id: uuid.UUID) -> dict | None:
        """Obtiene la orden con sus paquetes y datos de producto."""
        results = await self.db.select(
            self.table,
            "*, paquete_pedido(*, producto(nombre, imagen)), cliente!inner(usuario(nombre, email, imagen_perfil))",
            {"id": str(orden_id)}
        )
        return results[0] if results else None

    async def get_by_id(self, orden_id: uuid.UUID) -> OrdenPedido | None:
        """Obtiene la orden con sus paquetes."""
        results = await self.db.select(
            self.table,
            "*, paquete_pedido(*)",
            {"id": str(orden_id)}
        )
        if not results:
            return None
        return self._to_aggregate(results[0])

    async def save(self, orden: OrdenPedido) -> OrdenPedido:
        """Upsert de la orden y sync de paquetes."""
        orden_dict = {
            "id": str(orden.id),
            "cliente_id": str(orden.cliente_id),
            "distribuidor_id": str(orden.distribuidor_id),
            "direccion_id": str(orden.direccion_id),
            "estado": orden.estado.value,
            "pre_autorizado": orden.pre_autorizado,
            "motivo_rechazo": orden.motivo_rechazo,
        }
        await self.db.upsert(self.table, orden_dict)

        # Sync paquetes: eliminar y reinsertar (son inmutables tras creación)
        await self.db.delete("paquete_pedido", {"orden_id": str(orden.id)})
        for p in orden.paquetes:
            await self.db.insert("paquete_pedido", {
                "orden_id": str(orden.id),
                "producto_id": str(p.producto_id),
                "cantidad": p.cantidad,
                "costo_unitario": p.costo_unitario,
                "medida_snapshot": p.medida_snapshot,
            })
        return orden

    async def listar_por_distribuidor(
        self,
        distribuidor_id: uuid.UUID,
        estado: str | None = None
    ) -> list[dict]:
        """Lista órdenes de un distribuidor con datos del cliente."""
        filters: dict = {"distribuidor_id": str(distribuidor_id)}
        if estado:
            filters["estado"] = estado
        results = await self.db.select(
            self.table,
            "*, paquete_pedido(*, producto(nombre, imagen)), cliente!inner(usuario(nombre))",
            filters,
        )
        return results or []

    async def listar_por_cliente(
        self,
        cliente_id: uuid.UUID,
        estado: str | None = None
    ) -> list[dict]:
        """Lista órdenes de un cliente con datos del distribuidor."""
        filters: dict = {"cliente_id": str(cliente_id)}
        if estado:
            filters["estado"] = estado
        results = await self.db.select(
            self.table,
            "*, paquete_pedido(*, producto(nombre, imagen)), distribuidor!inner(nombre_negocio, usuario!inner(imagen_perfil, es_verificado))",
            filters,
        )
        return results or []
