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


class SeguimientoPedido(BaseModel):
    """Un paso del timeline, en la versión compacta del listado.

    Es el mismo dato que `PedidoActualizacionResponse` sin el id: en la lista
    solo se usa para pintar la barra de progreso del envío con fechas reales.
    """
    estado_nuevo: str
    descripcion: str | None = None
    creado_at: datetime

    model_config = {"from_attributes": True}


class PedidoProductoListItem(BaseModel):
    """Un producto del pedido, en la versión compacta del listado.

    Es lo mínimo para pintar la tarjeta: la lista de productos y el resumen de
    carga ("2 partidas · 512 kg") salen de acá.
    """
    nombre: str | None = None
    imagen: str | None = None
    cantidad: float
    unidad: str | None = None
    subtotal: float

    model_config = {"from_attributes": True}


class PedidoListItem(BaseModel):
    """Versión compacta para listar pedidos."""
    id: UUID
    orden_id: UUID
    estado: str
    total: float
    confirmado_at: datetime | None
    entregado_at: datetime | None
    cliente_id: UUID | None = None
    cliente_nombre: str | None = None
    cliente_imagen: str | None = None
    distribuidor_id: UUID | None = None
    distribuidor_nombre: str | None = None
    distribuidor_imagen: str | None = None
    distribuidor_verificado: bool | None = None
    # Primer producto de la orden (para el card de la lista)
    primer_producto_nombre: str | None = None
    primer_producto_imagen: str | None = None
    # Cuántas partidas trae la orden, para el resumen de la tarjeta.
    total_partidas: int = 0
    # Los productos del pedido. La tarjeta pinta los primeros y resume el resto.
    productos: list[PedidoProductoListItem] = []
    # Ciudad y estado de la dirección de entrega, ya formateados.
    destino: str | None = None
    # El timeline real del envío. Vacío si el pedido no tiene actualizaciones.
    seguimiento: list[SeguimientoPedido] = []

    model_config = {"from_attributes": True}


class ResumenPedidosResponse(BaseModel):
    """Cuántos pedidos hay en cada estado.

    Alimenta las tarjetas del resumen y los contadores de las pestañas, así
    que siempre trae los cuatro estados —con 0 cuando no hay ninguno— y el
    total. Respeta todos los filtros del listado menos el estado.
    """
    total: int
    por_estado: dict[str, int]


class ListadoPedidosResponse(BaseModel):
    """Respuesta paginada de `GET /pedidos/`. Misma forma que la de órdenes."""
    total_pedidos: int
    total_paginas: int
    pagina_actual: int
    tiene_siguiente: bool
    tiene_anterior: bool
    siguiente_url: str | None = None
    anterior_url: str | None = None
    pedidos: list[PedidoListItem]
