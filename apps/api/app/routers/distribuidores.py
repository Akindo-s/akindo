"""
Distribuidores router — /distribuidores/*
"""
from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile, status, HTTPException, Query, Request

from app.core.dependencies import get_current_user, get_current_distribuidor, get_db
from app.infrastructure.database import DatabaseSession
from app.infrastructure.storage import StorageAdapter, get_storage
from app.models.usuario import Usuario
from app.models.distribuidor import Distribuidor
from app.schemas.auth import RegistroDistribuidorRequest, RegistroDistribuidorResponse
from app.schemas.distribuidor import (
    DistribuidorResponse,
    DistribuidorUpdateInfo,
    CatalogoPaginatedResponse,
    DistribuidoresPaginatedResponse,
    ValoracionResponse,
    UpsertDireccionDistribuidorRequest,
    DireccionDistribuidorResponse
)
from app.services.auth import AuthService
from app.services.distribuidor import DistribuidorService
from app.services.estadisticas import EstadisticasService
from app.schemas.estadisticas import TipoEstadistica, EstadisticasDistribuidorResponse

router = APIRouter(prefix="/distribuidores", tags=["Distribuidores"])

# ── Público ────────────────────────────────────────────────────────

@router.post('/', summary="Registra un nuevo distribuidor", response_model=RegistroDistribuidorResponse, status_code=status.HTTP_201_CREATED)
async def registrar_distribuidor(
    data: RegistroDistribuidorRequest,
    db: DatabaseSession = Depends(get_db)
):
    """ Registra un distribuidor en el servicio """
    service = AuthService(db)
    return await service.registrar_distribuidor(data)


# ── Para clientes y/o distribuidores ───────────────────────────────

@router.get("/", response_model=DistribuidoresPaginatedResponse)
async def listar_distribuidores(
    request: Request,
    numero_pagina: int = Query(1, ge=1, description="Número de página"),
    cantidad_pagina: int = Query(5, ge=1, le=100, description="Cantidad de resultados por página"),
    categorias: list[UUID] | None = Query(None, description="Lista de UUIDs de categorías para filtrar"),
    valoracion_min: float | None = Query(None, ge=0, le=5, description="Valoración mínima (0-5)"),
    valoracion_max: float | None = Query(None, ge=0, le=5, description="Valoración máxima (0-5)"),
    user: Usuario = Depends(get_current_user),
    db: DatabaseSession = Depends(get_db)
):
    """ Obtiene un catálogo minificado y paginado de distribuidores.
    Permite filtrar por categorías y rango de valoración.
    Requiere autenticación (cliente o distribuidor).
    """
    service = DistribuidorService(db)
    response = await service.listar_distribuidores(
        numero_pagina=numero_pagina,
        cantidad_pagina=cantidad_pagina,
        categorias=categorias,
        valoracion_min=valoracion_min,
        valoracion_max=valoracion_max
    )
    
    if response.tiene_siguiente and request is not None:
        response.siguiente_url = str(request.url.include_query_params(numero_pagina=numero_pagina + 1))
    if response.tiene_anterior and request is not None:
        response.anterior_url = str(request.url.include_query_params(numero_pagina=numero_pagina - 1))
        
    return response


@router.get("/other/{distribuidor_id}", response_model=DistribuidorResponse) # TODO : este endpoint esta MUY mal, pero tenemos que arreglarlo despues
async def obtener_distribuidor(
    distribuidor_id: UUID,
    user: Usuario = Depends(get_current_user),
    db: DatabaseSession = Depends(get_db)
):
    """ Obtiene los detalles de un distribuidor """
    service = DistribuidorService(db)
    return await service.obtener_distribuidor(distribuidor_id)


@router.get("/{distribuidor_id}/catalogo", response_model=CatalogoPaginatedResponse)
async def get_catalogo(
    request: Request,
    distribuidor_id: UUID,
    numero_pagina: int = 1,
    cantidad_pagina: int = 20,
    user: Usuario = Depends(get_current_user),
    db: DatabaseSession = Depends(get_db)
):
    """ Obtiene una mini versión paginada de todos los productos de un distribuidor"""
    service = DistribuidorService(db)
    response = await service.get_catalogo(distribuidor_id, numero_pagina, cantidad_pagina)
    
    if response.tiene_siguiente and request is not None:
        response.siguiente_url = str(request.url.include_query_params(numero_pagina=numero_pagina + 1))
    if response.tiene_anterior and request is not None:
        response.anterior_url = str(request.url.include_query_params(numero_pagina=numero_pagina - 1))
        
    return response


@router.get("/{distribuidor_id}/valoraciones", response_model=list[ValoracionResponse])
async def get_valoraciones(
    distribuidor_id: UUID,
    user: Usuario = Depends(get_current_user),
    db: DatabaseSession = Depends(get_db)
):
    """Obtiene las valoraciones de un distribuidor."""
    service = DistribuidorService(db)
    return await service.get_valoraciones(distribuidor_id)


# ── Solo para el propio distribuidor ───────────────────────────────

@router.get('/me', response_model=DistribuidorResponse, summary="Obtener mi perfil")
async def get_mi_perfil_distribuidor(
    distribuidor_auth: Distribuidor = Depends(get_current_distribuidor),
    db: DatabaseSession = Depends(get_db),
):
    """Obtiene el perfil del distribuidor autenticado."""
    service = DistribuidorService(db)
    return await service.obtener_distribuidor(distribuidor_auth.id)


@router.patch('/me', response_model=DistribuidorResponse, summary="Actualizar mi perfil")
async def actualizar_mi_perfil_distribuidor(
    data: DistribuidorUpdateInfo,
    distribuidor_auth: Distribuidor = Depends(get_current_distribuidor),
    db: DatabaseSession = Depends(get_db),
):
    """Actualiza la información del distribuidor autenticado."""
    service = DistribuidorService(db)
    return await service.actualizar_informacion_distribuidor(distribuidor_auth.id, data)


@router.get('/me/estadisticas', response_model=EstadisticasDistribuidorResponse)
async def obtener_estadisticas_distribuidor(
    tipo: TipoEstadistica = Query(..., description="Tipo de estadística a consultar"),
    distribuidor_auth: Distribuidor = Depends(get_current_distribuidor),
    db: DatabaseSession = Depends(get_db)
):
    """Obtiene estadísticas del negocio del distribuidor."""
    service = EstadisticasService(db)
    return await service.obtener_estadistica(distribuidor_auth.id, tipo)


@router.patch('/{distribuidor_id}', response_model=DistribuidorResponse)
async def actualizar_informacion_distribuidor(
    distribuidor_id: UUID,
    data: DistribuidorUpdateInfo,
    distribuidor_auth: Distribuidor = Depends(get_current_distribuidor),
    db: DatabaseSession = Depends(get_db)
):
    """Actualiza la información pública del negocio del distribuidor."""
    if distribuidor_auth.id != distribuidor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes modificar la información de otro distribuidor"
        )
    service = DistribuidorService(db)
    return await service.actualizar_informacion_distribuidor(distribuidor_id, data)


@router.post('/{distribuidor_id}/imagen-negocio', response_model=DistribuidorResponse)
async def subir_imagen_negocio(
    distribuidor_id: UUID,
    file: UploadFile = File(...),
    distribuidor_auth: Distribuidor = Depends(get_current_distribuidor),
    db: DatabaseSession = Depends(get_db),
    storage: StorageAdapter = Depends(get_storage)
):
    """ Sube a supabase storage la imagen del negocio del distribuidor """
    if distribuidor_auth.id != distribuidor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes modificar la imagen de otro distribuidor LARGATE DE AQUI MALDITO!"
        )
    
    file_data = await file.read()
    service = DistribuidorService(db, storage)
    return await service.subir_imagen_negocio(
        distribuidor_id=distribuidor_id,
        file_data=file_data,
        content_type=file.content_type or "image/jpeg",
        filename=file.filename or "fondo"
    )

@router.put('/{distribuidor_id}/direccion', response_model=list[DireccionDistribuidorResponse])
async def upsert_direccion_distribuidor(
    distribuidor_id: UUID,
    data: UpsertDireccionDistribuidorRequest,
    distribuidor_auth: Distribuidor = Depends(get_current_distribuidor),
    db: DatabaseSession = Depends(get_db)
):
    """ Añade o actualiza una dirección para el distribuidor. """
    if distribuidor_auth.id != distribuidor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes modificar las direcciones de otro distribuidor"
        )
    
    service = DistribuidorService(db)
    return await service.upsert_direccion(distribuidor_id, data)
