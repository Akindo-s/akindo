"""
Clientes router — /clientes/*

Endpoints:
  POST /clientes                   → Registrar cliente (público)
  GET  /clientes/me                → Obtener perfil (autenticado)
  PATCH /clientes/me               → Actualizar perfil (autenticado)
  GET  /clientes/me/direcciones    → Obtener direcciones (autenticado)
  GET  /clientes/me/pedidos        → Obtener pedidos (autenticado)
"""

from app.schemas.cliente import DireccionClienteRequest
from uuid import UUID
from app.models.cliente import Cliente

from fastapi import APIRouter, Depends, UploadFile, File, status

from app.core.dependencies import get_current_cliente
from app.infrastructure.database import DatabaseSession, get_db
from app.infrastructure.storage import StorageAdapter, get_storage
from app.schemas.auth import RegistroClienteRequest, RegistroClienteResponse
from app.schemas.cliente import (
    ClientePerfilResponse,
    ClientePerfilUpdateRequest,
    DireccionResponse,
    ImagenPerfilResponse,
    PedidoResumenResponse,
)
from app.services.auth import AuthService
from app.services.cliente import ClienteService

router = APIRouter(prefix="/clientes", tags=["Clientes"])



# ── Público ────────────────────────────────────────────────────────


@router.post(
    "",
    response_model=RegistroClienteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo cliente",
)
async def registrar_cliente(
    data: RegistroClienteRequest,
    db: DatabaseSession = Depends(get_db),
):
    """
    Registra un nuevo usuario de tipo cliente.

    - Valida que el email no esté en uso.
    - Crea registros en `usuario` y `cliente`.
    - Emite evento `ClienteRegistrado`.
    """
    service = AuthService(db)
    return await service.registrar_cliente(data)


# ── Autenticado (requiere JWT de tipo cliente) ─────────────────────


@router.get(
    "/me",
    response_model=ClientePerfilResponse,
    summary="Obtener mi perfil",
)
async def get_mi_perfil(
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db),
):
    """Retorna la información del perfil del cliente autenticado."""
    service = ClienteService(db)
    return await service.get_perfil(cliente.id)


@router.patch(
    "/me",
    response_model=ClientePerfilResponse,
    summary="Actualizar mi perfil",
)
async def actualizar_mi_perfil(
    data: ClientePerfilUpdateRequest,
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db),
):
    """
    Actualiza parcialmente el perfil del cliente autenticado.
    Solo se actualizan los campos enviados en el body.
    """
    service = ClienteService(db)
    return await service.actualizar_perfil(cliente.id, data)


# ── Sub-recursos del cliente autenticado ───────────────────────────

@router.get(
    "/me/direcciones",
    response_model=list[DireccionResponse],
    summary="Obtener mis direcciones",
)
async def get_mis_direcciones(
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db),
):
    """Retorna todas las direcciones del cliente autenticado."""
    service = ClienteService(db)
    return await service.get_direcciones(cliente.id)

@router.post(
    '/me/direcciones',
    response_model=DireccionResponse,
    summary="Registrar nueva direccion"
)


async def subir_direccion(
    direccion : DireccionClienteRequest,
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db)
):

    service = ClienteService(db)
    return await service.crear_direccion(cliente.id,direccion)

@router.patch(
    "/me/direcciones/{direccion_id}",
    response_model=DireccionResponse,
    summary="Actualizar una dirección"
)
async def actualizar_direccion(
    direccion_id: UUID,
    data: DireccionClienteRequest,
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db)
):
    service = ClienteService(db)
    return await service.actualizar_direccion(cliente.id, direccion_id, data)

@router.delete(
    "/me/direcciones/{direccion_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar una dirección"
)
async def eliminar_direccion(
    direccion_id: UUID,
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db)
):
    service = ClienteService(db)
    await service.eliminar_direccion(cliente.id, direccion_id)



@router.get(
    "/me/pedidos",
    response_model=list[PedidoResumenResponse],
    summary="Obtener mis pedidos",
)
async def get_mis_pedidos(
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db),
):
    """Retorna todas las órdenes de pedido del cliente autenticado."""
    service = ClienteService(db)
    return await service.get_pedidos(cliente.id)


