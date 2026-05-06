"""
OrdenPedido — Aggregate root para la orden de compra propuesta por el cliente.
PaquetePedido — Value Object que representa un item de la orden.
"""

from dataclasses import dataclass, field
import uuid
from datetime import datetime
from enum import Enum

from app.models.base import Aggregate, ValueObject
from app.core.exceptions import AggregateNoValido


class EstadoOrden(str, Enum):
    """Refleja el enum estado_orden de PostgreSQL."""
    PENDIENTE = "pendiente"
    ACEPTADA = "aceptada"
    RECHAZADA = "rechazada"
    CANCELADA = "cancelada"


@dataclass(frozen=True)
class PaquetePedido(ValueObject):
    """Value Object — ítem snapshot de la orden de compra."""
    producto_id: uuid.UUID
    cantidad: int
    costo_unitario: float
    medida_snapshot: dict  # JSON snapshot de la medida al momento de la orden

    @property
    def subtotal(self) -> float:
        return self.costo_unitario * self.cantidad


@dataclass(kw_only=True)
class OrdenPedido(Aggregate):
    """
    Aggregate root de Orden de Compra.
    Una propuesta del cliente, pendiente de aceptación/rechazo por el distribuidor.
    """
    cliente_id: uuid.UUID
    distribuidor_id: uuid.UUID
    direccion_id: uuid.UUID
    estado: EstadoOrden = EstadoOrden.PENDIENTE
    paquetes: list[PaquetePedido] = field(default_factory=list)
    pre_autorizado: bool = False
    motivo_rechazo: str | None = None
    created_at: datetime | None = None

    @property
    def total(self) -> float:
        return sum(p.subtotal for p in self.paquetes)

    def check(self) -> None:
        if not self.cliente_id:
            raise AggregateNoValido("La orden debe pertenecer a un cliente")
        if not self.distribuidor_id:
            raise AggregateNoValido("La orden debe pertenecer a un distribuidor")
        if not self.direccion_id:
            raise AggregateNoValido("La orden debe tener una dirección de entrega")
        if not self.paquetes:
            raise AggregateNoValido("La orden debe tener al menos un producto")
        for paquete in self.paquetes:
            if paquete.cantidad <= 0:
                raise AggregateNoValido("La cantidad de cada paquete debe ser mayor a 0")
            if paquete.costo_unitario < 0:
                raise AggregateNoValido("El costo unitario no puede ser negativo")

    @classmethod
    def crear(
        cls,
        cliente_id: uuid.UUID,
        distribuidor_id: uuid.UUID,
        direccion_id: uuid.UUID,
        paquetes: list[PaquetePedido],
        pre_autorizado: bool = False,
    ) -> "OrdenPedido":
        """Factory method — crea una nueva OrdenPedido en estado pendiente."""
        orden = cls(
            cliente_id=cliente_id,
            distribuidor_id=distribuidor_id,
            direccion_id=direccion_id,
            paquetes=paquetes,
            estado=EstadoOrden.PENDIENTE,
            pre_autorizado=pre_autorizado,
        )
        orden.check()
        return orden

    def aceptar(self) -> None:
        """Distribuidor acepta la orden."""
        if self.estado != EstadoOrden.PENDIENTE:
            raise AggregateNoValido(f"Solo se puede aceptar una orden pendiente (actual: {self.estado})")
        self.estado = EstadoOrden.ACEPTADA

    def rechazar(self, motivo: str | None = None) -> None:
        """Distribuidor rechaza the orden con motivo opcional."""
        if self.estado != EstadoOrden.PENDIENTE:
            raise AggregateNoValido(f"Solo se puede rechazar una orden pendiente (actual: {self.estado})")
        self.estado = EstadoOrden.RECHAZADA
        self.motivo_rechazo = motivo

    def cancelar(self) -> None:
        """Cliente cancela su propia orden."""
        if self.estado != EstadoOrden.PENDIENTE:
            raise AggregateNoValido(f"Solo se puede cancelar una orden pendiente (actual: {self.estado})")
        self.estado = EstadoOrden.CANCELADA

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "cliente_id": str(self.cliente_id),
            "distribuidor_id": str(self.distribuidor_id),
            "direccion_id": str(self.direccion_id),
            "estado": self.estado.value,
            "pre_autorizado": self.pre_autorizado,
            "motivo_rechazo": self.motivo_rechazo,
            "created_at": str(self.created_at) if self.created_at else None,
        }
