"""
Schemas para el módulo de estadísticas de distribuidores.
"""

from pydantic import BaseModel
from typing import Any
from enum import Enum

class TipoEstadistica(str, Enum):
    PRODUCTOS_MAS_VENDIDOS = "productos_mas_vendidos"
    PRODUCTOS_BAJO_STOCK = "productos_bajo_stock"
    TOTAL_PRODUCTOS = "total_productos"

class EstadisticasDistribuidorResponse(BaseModel):
    """Respuesta con las estadísticas de un distribuidor."""
    total_productos: int | None = None
    productos_mas_vendidos: list[dict[str, Any]] | None = None
    productos_bajo_stock: list[dict[str, Any]] | None = None
