"""
Evento: PedidoCreado
Se emite cuando se crea una nueva orden de pedido.
"""

from uuid import UUID

from .base import Evento, Suscriptor


class PedidoCreado(Evento):
    """Se creó una nueva orden de pedido."""

    pedido_id: UUID
    cliente_id: UUID
    distribuidor_id: UUID

    @property
    def nombre(self) -> str:
        return "pedido.creado"
