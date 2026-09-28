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
    # ── Solo en la bandeja del distribuidor ──────────────────────────
    #: Las existencias que le quedan al producto al llegar a esta orden, ya
    #: descontado lo que comprometieron las órdenes anteriores. `None` fuera
    #: de esa vista.
    existencias: float | None = None
    #: Si con esas existencias alcanza para esta partida.
    suficiente: bool | None = None

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
    cliente_id: UUID | None = None
    cliente_nombre: str | None = None
    cliente_imagen: str | None = None
    distribuidor_nombre: str | None = None
    distribuidor_imagen: str | None = None
    created_at: datetime | None
    #: El pedido que salió de esta orden, si ya se pagó. Sirve para linkear al
    #: detalle del pedido desde el listado.
    pedido_id: UUID | None = None
    paquetes: list[PaquetePedidoResponse] = []

    # ── Solo en la bandeja del distribuidor ──────────────────────────
    #: Ciudad y estado de la dirección de entrega, ya formateados.
    destino: str | None = None
    #: Si el inventario alcanza para surtirla: "completo", "parcial" o
    #: "sin_stock". `None` fuera de esa vista.
    cobertura: str | None = None
    #: Cuántas órdenes de este cliente aceptó antes este distribuidor.
    cliente_ordenes_previas: int | None = None
    #: Cuánto suman esas órdenes previas.
    cliente_monto_historico: float | None = None

    model_config = {"from_attributes": True}


class ResumenOrdenesResponse(BaseModel):
    """Cuántas órdenes hay en cada estado.

    Alimenta las tarjetas del resumen y los contadores de las pestañas, así
    que siempre trae los cuatro estados —con 0 cuando no hay ninguna— y el
    total. Respeta todos los filtros del listado menos el estado.
    """
    total: int
    por_estado: dict[str, int]
    #: De las pendientes, cuántas alcanza a surtir con el inventario que le
    #: queda una vez descontado lo ya comprometido.
    surtibles: int = 0
    #: Las pendientes a las que les falta algo.
    con_faltantes: int = 0

class ListadoOrdenesResponse(BaseModel):
    """Respuesta para listar órdenes de compra del cliente."""
    total_ordenes: int
    total_paginas: int
    pagina_actual: int
    tiene_siguiente: bool
    tiene_anterior: bool
    siguiente_url: str | None = None
    anterior_url: str | None = None
    ordenes: list[OrdenPedidoListItem]

class PreOrdenProducto(BaseModel):
    """Producto snapshot para la pantalla de pre-orden."""
    producto_id: UUID
    nombre: str
    sku: str | None
    imagen: str | None
    cantidad: int | float
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
