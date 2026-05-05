"""
Endpoints para la gestión de categorías (Productos y Distribuidores).
"""

import uuid
from fastapi import APIRouter, Depends, status, Form, File, UploadFile

from app.core.dependencies import get_db, get_current_admin
from app.infrastructure.database import DatabaseSession
from app.infrastructure.storage import StorageAdapter, get_storage
from app.schemas.categoria import (
    CategoriaBatchCreate,
    CategoriaResponse,
    CategoriaBatchResponse,
    CategoriaDestacadaResponse
)
from app.services.categoria import CategoriaProductoService, CategoriaDistribuidorService

router = APIRouter(prefix="/categorias", tags=["Categorias"])

# ==========================================
# ENDPOINTS PÚBLICOS
# ==========================================

@router.get("/productos", response_model=list[CategoriaResponse])
async def get_categorias_productos(
    db: DatabaseSession = Depends(get_db),
    storage: StorageAdapter = Depends(get_storage)
):
    """Obtiene todas las categorías de productos."""
    service = CategoriaProductoService(db, storage)
    categorias = await service.get_all()
    return [c.to_dict() for c in categorias]

@router.get("/productos/destacadas", response_model=list[CategoriaDestacadaResponse])
async def get_categorias_productos_destacadas(
    cliente_id: uuid.UUID | None = None,
    limite: int = 10,
    db: DatabaseSession = Depends(get_db),
    storage: StorageAdapter = Depends(get_storage)
):
    """Obtiene las categorías de productos más compradas en el mes actual."""
    service = CategoriaProductoService(db, storage)
    return await service.get_featured(cliente_id=cliente_id, limite=limite)

@router.get("/distribuidores", response_model=list[CategoriaResponse])
async def get_categorias_distribuidores(
    db: DatabaseSession = Depends(get_db),
    storage: StorageAdapter = Depends(get_storage)
):
    """Obtiene todas las categorías de distribuidores."""
    service = CategoriaDistribuidorService(db, storage)
    categorias = await service.get_all()
    return [c.to_dict() for c in categorias]

# ==========================================
# ENDPOINTS PROTEGIDOS (SOLO ADMIN)
# ==========================================

# --- Categorías de Productos ---

@router.post("/productos", response_model=CategoriaResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_admin)])
async def create_categoria_producto(
    nombre: str = Form(..., min_length=1, description="Nombre de la categoría"),
    imagen: UploadFile = File(None, description="Imagen de la categoría"),
    db: DatabaseSession = Depends(get_db),
    storage: StorageAdapter = Depends(get_storage)
):
    """Crea una nueva categoría de producto (Solo Admin)."""
    service = CategoriaProductoService(db, storage)
    file_data = await imagen.read() if imagen else None
    content_type = imagen.content_type if imagen else None
    categoria = await service.create(nombre=nombre, file_data=file_data, content_type=content_type)
    return categoria.to_dict()

@router.post("/productos/batch", response_model=CategoriaBatchResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_admin)])
async def create_batch_categoria_producto(
    data: CategoriaBatchCreate,
    db: DatabaseSession = Depends(get_db),
    storage: StorageAdapter = Depends(get_storage)
):
    """Crea múltiples categorías de producto a la vez (Solo Admin)."""
    service = CategoriaProductoService(db, storage)
    return await service.create_batch(data)

@router.put("/productos/{id}", response_model=CategoriaResponse, dependencies=[Depends(get_current_admin)])
async def update_categoria_producto(
    id: uuid.UUID,
    nombre: str | None = Form(None, min_length=1, description="Nuevo nombre"),
    imagen: UploadFile = File(None, description="Nueva imagen"),
    db: DatabaseSession = Depends(get_db),
    storage: StorageAdapter = Depends(get_storage)
):
    """Actualiza una categoría de producto (Solo Admin)."""
    service = CategoriaProductoService(db, storage)
    file_data = await imagen.read() if imagen else None
    content_type = imagen.content_type if imagen else None
    categoria = await service.update(id, nombre=nombre, file_data=file_data, content_type=content_type)
    return categoria.to_dict()

@router.delete("/productos/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_admin)])
async def delete_categoria_producto(
    id: uuid.UUID,
    db: DatabaseSession = Depends(get_db),
    storage: StorageAdapter = Depends(get_storage)
):
    """Elimina una categoría de producto (Solo Admin)."""
    service = CategoriaProductoService(db, storage)
    await service.delete(id)


# --- Categorías de Distribuidores ---

@router.post("/distribuidores", response_model=CategoriaResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_admin)])
async def create_categoria_distribuidor(
    nombre: str = Form(..., min_length=1, description="Nombre de la categoría"),
    imagen: UploadFile = File(None, description="Imagen de la categoría"),
    db: DatabaseSession = Depends(get_db),
    storage: StorageAdapter = Depends(get_storage)
):
    """Crea una nueva categoría de distribuidor (Solo Admin)."""
    service = CategoriaDistribuidorService(db, storage)
    file_data = await imagen.read() if imagen else None
    content_type = imagen.content_type if imagen else None
    categoria = await service.create(nombre=nombre, file_data=file_data, content_type=content_type)
    return categoria.to_dict()

@router.post("/distribuidores/batch", response_model=CategoriaBatchResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_admin)])
async def create_batch_categoria_distribuidor(
    data: CategoriaBatchCreate,
    db: DatabaseSession = Depends(get_db),
    storage: StorageAdapter = Depends(get_storage)
):
    """Crea múltiples categorías de distribuidor a la vez (Solo Admin)."""
    service = CategoriaDistribuidorService(db, storage)
    return await service.create_batch(data)

@router.put("/distribuidores/{id}", response_model=CategoriaResponse, dependencies=[Depends(get_current_admin)])
async def update_categoria_distribuidor(
    id: uuid.UUID,
    nombre: str | None = Form(None, min_length=1, description="Nuevo nombre"),
    imagen: UploadFile = File(None, description="Nueva imagen"),
    db: DatabaseSession = Depends(get_db),
    storage: StorageAdapter = Depends(get_storage)
):
    """Actualiza una categoría de distribuidor (Solo Admin)."""
    service = CategoriaDistribuidorService(db, storage)
    file_data = await imagen.read() if imagen else None
    content_type = imagen.content_type if imagen else None
    categoria = await service.update(id, nombre=nombre, file_data=file_data, content_type=content_type)
    return categoria.to_dict()

@router.delete("/distribuidores/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_admin)])
async def delete_categoria_distribuidor(
    id: uuid.UUID,
    db: DatabaseSession = Depends(get_db),
    storage: StorageAdapter = Depends(get_storage)
):
    """Elimina una categoría de distribuidor (Solo Admin)."""
    service = CategoriaDistribuidorService(db, storage)
    await service.delete(id)
