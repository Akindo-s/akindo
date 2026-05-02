"""
Productos router — /productos/*
"""

from fastapi import APIRouter, Depends, status, HTTPException
from uuid import UUID
from typing import Any

from app.schemas.producto import ProductoCreateRequest, ProductoUpdateRequest, ProductoResponse, UnidadMedidaResponse
from app.services.producto import ProductoService
from app.infrastructure.database import DatabaseSession
from app.core.dependencies import get_db, get_current_distribuidor
from app.models.usuario import Usuario

router = APIRouter(prefix="/productos", tags=["Productos"])

# publico
@router.get("/unidades-medida", response_model=list[UnidadMedidaResponse])
async def listar_unidades_medida(
    db: DatabaseSession = Depends(get_db)
):
    """Obtiene el catálogo de unidades de medida para productos."""
    service = ProductoService(db)
    return await service.get_unidades_medida()

# solo para usuarios autenticados

"""
    - los endpoints para visualizar los productos y los productos de un distribuidor en especifico
        NO EXISTE, lo vamos a poner AQUI!
"""

# solo para distribuidores autenticados

@router.post("/", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
async def crear_producto(
    data: ProductoCreateRequest,
    distribuidor: Usuario = Depends(get_current_distribuidor),
    db: DatabaseSession = Depends(get_db)
):
    """Crea un nuevo producto en el catálogo del distribuidor."""
    service = ProductoService(db)
    return await service.crear_producto(
        distribuidor_id=distribuidor.id,
        nombre=data.nombre,
        costo=data.costo,
        medida=data.medida,
        existencias=data.existencias,
        atributos_extra=data.atributos_extra
    )


@router.put("/{producto_id}", response_model=ProductoResponse)
async def actualizar_producto(
    producto_id: UUID,
    data: ProductoUpdateRequest,
    distribuidor: Usuario = Depends(get_current_distribuidor),
    db: DatabaseSession = Depends(get_db)
):
    """Actualiza toda la información de un producto."""
    service = ProductoService(db)
    return await service.actualizar_producto(
        producto_id=producto_id,
        distribuidor_id=distribuidor.id,
        nombre=data.nombre,
        costo=data.costo,
        medida=data.medida,
        existencias=data.existencias,
        atributos_extra=data.atributos_extra
    )


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_producto(
    producto_id: UUID,
    distribuidor: Usuario = Depends(get_current_distribuidor),
    db: DatabaseSession = Depends(get_db)
):
    """Archiva un producto (borrado lógico)."""
    service = ProductoService(db)
    await service.archivar_producto(producto_id, distribuidor.id)
    return None
