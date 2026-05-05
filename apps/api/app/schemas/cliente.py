"""
Schemas de cliente — perfil, actualización, imagen, direcciones, pedidos, carrito.
"""

from uuid import UUID
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


# ── Perfil ─────────────────────────────────────────────────────────


class ClientePerfilResponse(BaseModel):
    """Información del perfil del cliente."""
    id: UUID
    nombre: str
    email: str
    telefono: str | None
    imagen_perfil: str | None
    es_verificado: bool
    fecha_creacion: datetime | None

    model_config = {"from_attributes": True}


class ClientePerfilUpdateRequest(BaseModel):
    """Campos actualizables del perfil (todos opcionales → PATCH)."""
    nombre: str | None = None
    telefono: str | None = None


# ── Imagen de perfil ───────────────────────────────────────────────


class ImagenPerfilResponse(BaseModel):
    """Respuesta tras subir/actualizar la imagen de perfil."""
    imagen_perfil: str


# ── Direcciones ────────────────────────────────────────────────────

class DireccionClienteRequest(BaseModel):
    calle:str
    ciudad:str
    estado:str
    codigo_postal:str
    es_predeterminada:bool = False


class DireccionResponse(BaseModel):
    """Dirección de un cliente."""
    id: UUID
    calle: str
    ciudad: str
    estado: str
    codigo_postal: str
    es_predeterminada: bool




# ── Pedidos (orden_pedido vista desde el cliente) ──────────────────


class PedidoResumenResponse(BaseModel):
    """Resumen de una orden de pedido del cliente."""
    id: UUID
    distribuidor_id: UUID
    direccion_id: UUID
    estado: str
    motivo_rechazo: str | None
    fecha_creacion: datetime | None


