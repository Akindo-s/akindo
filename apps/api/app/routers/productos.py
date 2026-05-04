"""
Productos router — /productos/*
"""

from app.core.dependencies import get_current_user
from fastapi import File, Request, UploadFile
from app.infrastructure import storage
from app.infrastructure.storage import StorageAdapter, get_storage
from app.schemas.distribuidor import CatalogoPaginatedResponse
from fastapi import APIRouter, Depends, status, HTTPException
from uuid import UUID
from typing import Any

from app.schemas.producto import ProductoCreateRequest, ProductoUpdateRequest, ProductoResponse, UnidadMedidaResponse, ProductoImagenResponse
from app.services.producto import ProductoService
from app.infrastructure.database import DatabaseSession
from app.core.dependencies import get_db, get_current_distribuidor
from app.models.usuario import Usuario

router = APIRouter(prefix="/productos", tags=["Productos"])

# publico
@router.get("/unidades-medida", response_model=list[UnidadMedidaResponse])
async def listar_unidades_medida(
    db: DatabaseSession = Depends(get_db),
    storage: StorageAdapter = Depends(get_storage)
):
    """Obtiene el catálogo de unidades de medida para productos."""
    service = ProductoService(db,storage)
    return await service.get_unidades_medida()

@router.get('/catalogo',response_model=CatalogoPaginatedResponse)
async def get_catalogo(
    request: Request,
    distribuidor_id: UUID|None = None,
    numero_pagina: int = 1,
    cantidad_pagina: int = 20,
    nombre: str = "",
    categorias: list[UUID]|None = None,
    db: DatabaseSession = Depends(get_db),
    storage: StorageAdapter = Depends(get_storage)
):
    """ Obtiene una mini versión paginada de todos los productos de un distribuidor"""
    service = ProductoService(db,storage)
    response = await service.get_catalogo(numero_pagina,cantidad_pagina,categorias,distribuidor_id,nombre)
    
    if response.tiene_siguiente and request is not None:
        response.siguiente_url = str(request.url.include_query_params(numero_pagina=numero_pagina + 1))
    if response.tiene_anterior and request is not None:
        response.anterior_url = str(request.url.include_query_params(numero_pagina=numero_pagina - 1))
        
    return response

# solo para distribuidores autenticados

@router.post("/", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
async def crear_producto(
    data: ProductoCreateRequest,
    distribuidor: Usuario = Depends(get_current_distribuidor),
    db: DatabaseSession = Depends(get_db),
    storage: StorageAdapter = Depends(get_storage)
):
    """Crea un nuevo producto en el catálogo del distribuidor."""
    service = ProductoService(db,storage)
    return await service.crear_producto(
        distribuidor_id=distribuidor.id,
        nombre=data.nombre,
        costo=data.costo,
        medida=data.medida,
        existencias=data.existencias,
        atributos_extra=data.atributos_extra,
        categorias=data.categorias,
        es_borrador=data.es_borrador
    )


@router.put("/{producto_id}", response_model=ProductoResponse)
async def actualizar_producto(
    producto_id: UUID,
    data: ProductoUpdateRequest,
    distribuidor: Usuario = Depends(get_current_distribuidor),
    db: DatabaseSession = Depends(get_db),
    storage: StorageAdapter = Depends(get_storage)
):
    """Actualiza toda la información de un producto."""
    service = ProductoService(db,storage)
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
    db: DatabaseSession = Depends(get_db),
    storage: StorageAdapter = Depends(get_storage)
):
    """Archiva un producto (borrado lógico)."""
    service = ProductoService(db, storage)
    await service.archivar_producto(producto_id, distribuidor.id)
    return None

@router.post("/{producto_id}/imagen", response_model=ProductoImagenResponse, status_code=status.HTTP_200_OK)
async def subir_imagen_producto(
    producto_id: UUID,
    file: UploadFile = File(...),
    distribuidor: Usuario = Depends(get_current_distribuidor),
    db: DatabaseSession = Depends(get_db),
    storage: StorageAdapter = Depends(get_storage)
):
    service = ProductoService(db, storage)
    file_data = await file.read()
    content_type = file.content_type or "image/jpeg"
    url = await service.subir_imagen_producto(producto_id, distribuidor.id, file_data, content_type)
    return ProductoImagenResponse(detail="Imagen subida exitosamente", url=url)