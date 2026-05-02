"""
Evento: PedidoConfirmado
Se emite cuando un distribuidor acepta una orden y se convierte en pedido.
"""

from uuid import UUID

from .base import Evento, Suscriptor


class PedidoConfirmado(Evento):
    """Una orden de pedido fue aceptada por el distribuidor."""

    pedido_id: UUID
    distribuidor_id: UUID

    @property
    def nombre(self) -> str:
        return "pedido.confirmado"
