"""
Schemas de producto.
"""

from pydantic import BaseModel, Field
from uuid import UUID
from typing import Any
from app.schemas.categoria import CategoriaResponse

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
    categorias: list[UUID] | None = None
    es_borrador:bool = False


class ProductoUpdateRequest(BaseModel):
    """Datos para actualizar un producto."""
    nombre: str = Field(..., min_length=1)
    costo: float = Field(..., ge=0)
    medida: UUID
    existencias: int = Field(..., ge=0)
    atributos_extra: dict[str, Any] | None = None
    categorias: list[UUID] | None = None
    

class ProductoResponse(BaseModel):
    """Respuesta con los datos de un producto."""
    id: UUID
    distribuidor_id: UUID
    nombre: str
    costo: float
    medida: UnidadMedidaResponse
    existencias: int
    disponible: bool
    atributos_extra: dict[str, Any] | None
    imagen: str | None = None
    categorias: list[CategoriaResponse] | None = None
    model_config = {"from_attributes": True}


class ProductoImagenResponse(BaseModel):
    """Respuesta de la subida de imagen de producto."""
    detail: str
    url: str
