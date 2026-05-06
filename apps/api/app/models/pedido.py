"""
Pedido — Aggregate root. Existe solo tras el pago de una orden aceptada.
"""

from dataclasses import dataclass, field
import uuid
from datetime import datetime
from enum import Enum

from app.models.base import Aggregate
from app.core.exceptions import AggregateNoValido


class EstadoPedido(str, Enum):
    """Refleja el enum estado_pedido de PostgreSQL."""
    PENDIENTE_ENVIO = "pendiente de envio"
    EN_ENVIO = "en envio"
    ENTREGADO = "entregado"
    CANCELADO = "cancelado"


@dataclass(kw_only=True)
class Pedido(Aggregate):
    """
    Aggregate root del Pedido.
    Nace cuando el cliente paga una OrdenPedido aceptada.
    El distribuidor actualiza su estado hasta marcarlo entregado o cancelado.
    """
    orden_id: uuid.UUID
    estado: EstadoPedido = EstadoPedido.PENDIENTE_ENVIO
    total: float = 0.0
    comision_servicio: float = 0.0
    confirmado_at: datetime | None = None
    entregado_at: datetime | None = None

    def check(self) -> None:
        if not self.orden_id:
            raise AggregateNoValido("El pedido debe referenciar una orden")
        if self.total < 0:
            raise AggregateNoValido("El total del pedido no puede ser negativo")

    @classmethod
    def crear(cls, **kwargs) -> "Pedido":
        """Factory method base."""
        return cls(**kwargs)

    @classmethod
    def crear_desde_orden(
        cls,
        orden_id: uuid.UUID,
        total: float,
        comision_servicio: float = 0.0,
    ) -> "Pedido":
        """Factory method — crea un Pedido a partir de una OrdenPedido ya aceptada."""
        pedido = cls(
            orden_id=orden_id,
            total=total,
            comision_servicio=comision_servicio,
            estado=EstadoPedido.PENDIENTE_ENVIO,
            confirmado_at=datetime.now(),
        )
        pedido.check()
        return pedido

    def actualizar_estado(self, nuevo_estado: EstadoPedido) -> None:
        """
        Distribuidor actualiza el estado del pedido.
        Valida transiciones válidas.
        """
        transiciones_validas: dict[EstadoPedido, list[EstadoPedido]] = {
            EstadoPedido.PENDIENTE_ENVIO: [EstadoPedido.EN_ENVIO, EstadoPedido.CANCELADO],
            EstadoPedido.EN_ENVIO: [EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO],
            EstadoPedido.ENTREGADO: [],
            EstadoPedido.CANCELADO: [],
        }
        if nuevo_estado not in transiciones_validas[self.estado]:
            raise AggregateNoValido(
                f"Transición inválida: {self.estado} → {nuevo_estado}"
            )
        self.estado = nuevo_estado
        if nuevo_estado == EstadoPedido.ENTREGADO:
            self.entregado_at = datetime.now()

    @property
    def esta_activo(self) -> bool:
        return self.estado in (EstadoPedido.PENDIENTE_ENVIO, EstadoPedido.EN_ENVIO)

    @property
    def esta_finalizado(self) -> bool:
        return self.estado in (EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "orden_id": str(self.orden_id),
            "estado": self.estado.value,
            "total": self.total,
            "comision_servicio": self.comision_servicio,
            "confirmado_at": str(self.confirmado_at) if self.confirmado_at else None,
            "entregado_at": str(self.entregado_at) if self.entregado_at else None,
        }
