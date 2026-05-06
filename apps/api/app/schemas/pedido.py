"""
Schemas Pydantic para Pedido y sus actualizaciones.
"""

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


# ── Request ───────────────────────────────────────────────────────

class ActualizarEstadoPedidoRequest(BaseModel):
    """Body para PATCH /pedidos/{id}/estado."""
    estado: str  # 'en envio' | 'entregado' | 'cancelado'
    descripcion: str | None = None


class CrearValoracionRequest(BaseModel):
    """Body para POST /pedidos/{id}/valoracion."""
    puntuacion: int  # 1–5
    comentario: str | None = None


class ValoracionResponse(BaseModel):
    """Respuesta de una valoración."""
    id: UUID
    pedido_id: UUID
    cliente_id: UUID
    distribuidor_id: UUID
    puntuacion: int
    comentario: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Response ──────────────────────────────────────────────────────

class PedidoItemResponse(BaseModel):
    """Ítem de un pedido."""
    producto_id: UUID
    cantidad: int
    costo_unitario: float
    subtotal: float
    medida_snapshot: dict
    nombre_producto: str | None = None
    imagen_producto: str | None = None

    model_config = {"from_attributes": True}


class PedidoActualizacionResponse(BaseModel):
    """Un entry del timeline de actualizaciones del pedido."""
    id: UUID
    estado_nuevo: str
    descripcion: str | None
    creado_at: datetime

    model_config = {"from_attributes": True}


class PedidoResponse(BaseModel):
    """Respuesta completa de un pedido con timeline."""
    id: UUID
    orden_id: UUID
    estado: str
    total: float
    comision_servicio: float
    confirmado_at: datetime | None
    entregado_at: datetime | None
    # Datos enriquecidos de la orden
    cliente_id: UUID | None = None
    distribuidor_id: UUID | None = None
    cliente_nombre: str | None = None
    cliente_imagen: str | None = None
    distribuidor_nombre: str | None = None
    distribuidor_imagen: str | None = None
    distribuidor_verificado: bool | None = None
    direccion_entrega: dict | None = None
    paquetes: list[PedidoItemResponse] = []
    actualizaciones: list[PedidoActualizacionResponse] = []
    tiene_valoracion: bool = False
    valoracion: ValoracionResponse | None = None

    model_config = {"from_attributes": True}


class PedidoListItem(BaseModel):
    """Versión compacta para listar pedidos."""
    id: UUID
    orden_id: UUID
    estado: str
    total: float
    confirmado_at: datetime | None
    entregado_at: datetime | None
    cliente_nombre: str | None = None
    distribuidor_nombre: str | None = None
    # Primer producto de la orden (para el card de la lista)
    primer_producto_nombre: str | None = None

    model_config = {"from_attributes": True}
