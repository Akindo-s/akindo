"""
Schemas Pydantic para OrdenPedido.
"""

from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime


# ── Request ───────────────────────────────────────────────────────

class PaquetePedidoRequest(BaseModel):
    """Un ítem del carrito al crear la orden."""
    producto_id: UUID
    cantidad: int = Field(..., ge=1)


class CrearOrdenRequest(BaseModel):
    """Body para POST /pedidos/ordenes."""
    distribuidor_id: UUID
    direccion_id: UUID
    paquetes: list[PaquetePedidoRequest] = Field(..., min_length=1)
    pre_autorizado: bool = False


class RechazarOrdenRequest(BaseModel):
    """Body para PATCH /pedidos/ordenes/{id}/rechazar."""
    motivo_rechazo: str | None = None


# ── Response ──────────────────────────────────────────────────────

class PaquetePedidoResponse(BaseModel):
    """Ítem de una orden de compra."""
    id: UUID
    producto_id: UUID
    cantidad: int
    costo_unitario: float
    subtotal: float
    medida_snapshot: dict
    nombre_producto: str | None = None
    imagen_producto: str | None = None

    model_config = {"from_attributes": True}


class OrdenPedidoResponse(BaseModel):
    """Respuesta completa de una orden de compra."""
    id: UUID
    cliente_id: UUID
    distribuidor_id: UUID
    direccion_id: UUID
    estado: str
    pre_autorizado: bool
    motivo_rechazo: str | None
    total: float
    paquetes: list[PaquetePedidoResponse]
    cliente_nombre: str | None = None
    cliente_email: str | None = None
    cliente_imagen: str | None = None
    created_at: datetime | None

    model_config = {"from_attributes": True}


class OrdenPedidoListItem(BaseModel):
    """Versión compacta para listar órdenes."""
    id: UUID
    estado: str
    total: float
    pre_autorizado: bool
    cliente_nombre: str | None = None
    distribuidor_nombre: str | None = None
    distribuidor_imagen: str | None = None
    created_at: datetime | None
    paquetes: list[PaquetePedidoResponse] = []

    model_config = {"from_attributes": True}


class PreOrdenProducto(BaseModel):
    """Producto snapshot para la pantalla de pre-orden."""
    producto_id: UUID
    nombre: str
    sku: str | None
    imagen: str | None
    cantidad: int
    costo_unitario: float
    subtotal: float
    unidad: str


class PreOrdenResponse(BaseModel):
    """Snapshot del carrito para mostrar en la pantalla de pre-orden."""
    distribuidor_id: UUID
    distribuidor_nombre: str
    productos: list[PreOrdenProducto]
    subtotal: float
    costo_envio: float
    impuestos: float
    total: float
    direcciones_disponibles: list[dict]
