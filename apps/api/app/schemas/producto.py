"""
Schemas de producto.
"""

from pydantic import BaseModel, Field
from uuid import UUID
from typing import Any

class UnidadMedidaResponse(BaseModel):
    """Información de una unidad de medida."""
    id: UUID
    unidad: str
    nombre: str

    model_config = {"from_attributes": True}

class ProductoCreateRequest(BaseModel):
    """Datos para crear un producto."""
    nombre: str = Field(..., min_length=1)
    costo: float = Field(..., ge=0)
    medida: UUID
    existencias: int = Field(0, ge=0)
    atributos_extra: dict[str, Any] | None = None

class ProductoUpdateRequest(BaseModel):
    """Datos para actualizar un producto."""
    nombre: str = Field(..., min_length=1)
    costo: float = Field(..., ge=0)
    medida: UUID
    existencias: int = Field(..., ge=0)
    atributos_extra: dict[str, Any] | None = None

class ProductoResponse(BaseModel):
    """Respuesta con los datos de un producto."""
    id: UUID
    distribuidor_id: UUID
    nombre: str
    costo: float
    medida: UUID
    existencias: int
    disponible: bool
    atributos_extra: dict[str, Any] | None

    model_config = {"from_attributes": True}
