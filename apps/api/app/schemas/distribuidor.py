"""
Schemas de distribuidor.
"""

from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from app.schemas.categoria import CategoriaResponse

# ── Perfil y Configuración ────────────────────────────────────────

class DistribuidorResponse(BaseModel):
    """Información pública o privada del distribuidor."""
    id: UUID
    nombre: str
    nombre_negocio: str
    rfc: str
    direcciones: list["DireccionDistribuidorResponse"]
    imagen_perfil: str | None
    imagen_fondo: str | None
    valoracion_promedio: float
    total_valoraciones: int
    fecha_creacion: datetime | None
    categorias: list[CategoriaResponse] | None = None

    model_config = {"from_attributes": True}


class DistribuidorUpdateInfo(BaseModel):
    """Campos permitidos para actualización por el distribuidor."""
    nombre_negocio: str | None = None
    telefono: str | None = None
    categorias: list[UUID] | None = None

# ── Direcciones ───────────────────────────────────────────────────

# RegistroDireccionDistribuidorRequest -> esta en schema/auth porque se me antojo algun problema?????!!!

class DireccionDistribuidorResponse(BaseModel):
    """Información de la dirección física del distribuidor."""
    id: UUID
    calle: str
    ciudad: str
    estado: str
    codigo_postal: str
    es_predeterminada: bool

    model_config = {"from_attributes": True}



class UpsertDireccionDistribuidorRequest(BaseModel):
    """Datos para crear o actualizar una dirección del distribuidor."""
    calle: str
    ciudad: str
    estado: str
    codigo_postal: str
    es_predeterminada: bool = False


# ── Catálogo de Productos del Distribuidor ────────────────────────

class ProductoCatalogoResponse(BaseModel):
    """Producto en el catálogo minificado."""
    producto_id: UUID
    nombre: str
    costo: float
    disponible: bool
    unidad: str
    existencias: int
    imagen: str | None = None


class CatalogoPaginatedResponse(BaseModel):
    """Respuesta paginada del catálogo de un distribuidor."""
    total_productos: int
    total_paginas: int
    pagina_actual: int
    tiene_siguiente: bool
    tiene_anterior: bool
    siguiente_url: str | None = None
    anterior_url: str | None = None
    productos: list[ProductoCatalogoResponse]


# ── Valoraciones ──────────────────────────────────────────────────

class ValoracionResponse(BaseModel):
    """Respuesta de una valoración de un distribuidor."""
    id: UUID
    cliente_id: UUID
    puntuacion: int
    comentario: str | None
    created_at: datetime




# ── Catálogo Global de Distribuidores ─────────────────────────────

class MiniDistribuidorResponse(BaseModel):
    """Respuesta minificada de un distribuidor para el catálogo."""
    distribuidor_id: UUID
    nombre_negocio: str
    imagen_fondo: str | None
    valoracion_promedio: float | None
    total_valoraciones: int | None
    categorias: list[str] | None


class DistribuidoresPaginatedResponse(BaseModel):
    """Respuesta paginada del catálogo de distribuidores."""
    total_distribuidores: int
    total_paginas: int
    pagina_actual: int
    tiene_siguiente: bool
    tiene_anterior: bool
    siguiente_url: str | None = None
    anterior_url: str | None = None
    distribuidores: list[MiniDistribuidorResponse]


# ── Dashboard y Alertas ───────────────────────────────────────────

class ResumenDashboardResponse(BaseModel):
    """Resumen para el dashboard del distribuidor."""
    volumen_bruto_mes: float
    pedidos_activos: int
    productos_poco_stock: int


class AlertaExistenciaResponse(BaseModel):
    """Alerta de existencias bajas para un producto."""
    producto_id: UUID
    nombre: str
    sku: str
    existencias: int
    costo: float
    unidad: str
    imagen: str | None = None
    disponible: bool
    estado_stock: str


class PedidoActivoDistribuidorResponse(BaseModel):
    """Información de un pedido activo de un distribuidor."""
    pedido_id: UUID
    orden_id: UUID
    cliente_nombre: str
    cliente_email: str
    total: float
    estado: str
    confirmado_at: datetime


