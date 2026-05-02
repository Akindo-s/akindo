"""
Schemas de carrito de compras.
"""

from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime

class CarritoItemRequest(BaseModel):
    """Datos para agregar o modificar un item en el carrito."""
    cantidad: int = Field(..., ge=0)

class CarritoItemResponse(BaseModel):
    """Respuesta con los datos de un item del carrito."""
    producto_id: UUID
    cantidad: int
    cantidad_minima: int
    cantidad_maxima: int

    model_config = {"from_attributes": True}

class CarritoResponse(BaseModel):
    """Respuesta con los datos completos del carrito."""
    id: UUID
    cliente_id: UUID
    distribuidor_id: UUID
    items: list[CarritoItemResponse]
    fecha_actualizacion: datetime | None

    model_config = {"from_attributes": True}
