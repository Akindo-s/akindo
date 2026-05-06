"""
Eventos de dominio para órdenes de compra y pedidos.
"""

from uuid import UUID
from datetime import datetime
from app.events.base import Evento


class OrdenPedidoCreada(Evento):
    orden_id: UUID
    cliente_id: UUID
    distribuidor_id: UUID
    total: float

    @property
    def nombre(self) -> str:
        return "orden_pedido.creada"


class OrdenPedidoAceptada(Evento):
    orden_id: UUID
    cliente_id: UUID
    distribuidor_id: UUID
    pre_autorizado: bool

    @property
    def nombre(self) -> str:
        return "orden_pedido.aceptada"


class OrdenPedidoRechazada(Evento):
    orden_id: UUID
    cliente_id: UUID
    distribuidor_id: UUID
    motivo: str | None

    @property
    def nombre(self) -> str:
        return "orden_pedido.rechazada"


class PedidoCreado(Evento):
    pedido_id: UUID
    orden_id: UUID
    cliente_id: UUID
    distribuidor_id: UUID
    total: float

    @property
    def nombre(self) -> str:
        return "pedido.creado"


class PedidoActualizado(Evento):
    pedido_id: UUID
    cliente_id: UUID
    distribuidor_id: UUID
    estado_nuevo: str
    descripcion: str | None

    @property
    def nombre(self) -> str:
        return "pedido.actualizado"


class PedidoFinalizado(Evento):
    """Se emite cuando el pedido llega a estado 'entregado'. Dispara solicitud de valoración."""
    pedido_id: UUID
    orden_id: UUID
    cliente_id: UUID
    distribuidor_id: UUID
    total: float

    @property
    def nombre(self) -> str:
        return "pedido.finalizado"
