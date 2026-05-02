"""
Clientes router — /clientes/*

Endpoints:
  POST /clientes                   → Registrar cliente (público)
  GET  /clientes/me                → Obtener perfil (autenticado)
  PATCH /clientes/me               → Actualizar perfil (autenticado)
  PUT  /clientes/me/imagen-perfil  → Subir imagen de perfil (autenticado)
  GET  /clientes/me/direcciones    → Obtener direcciones (autenticado)
  GET  /clientes/me/pedidos        → Obtener pedidos (autenticado)
  GET  /clientes/me/carrito        → Obtener carritos (autenticado)
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
    CarritoResponse,
    ClientePerfilResponse,
    ClientePerfilUpdateRequest,
    DireccionResponse,
    ImagenPerfilResponse,
    PedidoResumenResponse,
)
from app.services.auth import AuthService
from app.services.cliente import ClienteService
from app.services.carrito import CarritoService
from app.schemas.carrito import CarritoItemRequest, CarritoResponse as CarritoResponseNew

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


@router.put(
    "/me/imagen-perfil",
    response_model=ImagenPerfilResponse,
    summary="Subir imagen de perfil",
)
async def subir_imagen_perfil(
    file: UploadFile = File(...),
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db),
    storage: StorageAdapter = Depends(get_storage),
):
    """
    Sube o reemplaza la imagen de perfil del cliente autenticado.

    - Acepta: JPEG, PNG, WebP.
    - Tamaño máximo: 5 MB.
    """
    file_data = await file.read()
    service = ClienteService(db, storage)
    return await service.subir_imagen_perfil(
        usuario_id=cliente.id,
        file_data=file_data,
        content_type=file.content_type or "image/jpeg",
        filename=file.filename or "avatar",
    )


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


@router.get(
    "/me/carrito",
    response_model=list[CarritoResponse],
    summary="Obtener mis carritos (Todos)",
)
async def get_mi_carrito(
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db),
):
    """Retorna todos los carritos del cliente autenticado con sus items."""
    service = ClienteService(db)
    return await service.get_carritos(cliente.id)

@router.get(
    "/me/carritos/{distribuidor_id}",
    response_model=CarritoResponseNew,
    summary="Obtener carrito por distribuidor"
)
async def get_carrito_distribuidor(
    distribuidor_id: UUID,
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db)
):
    """Obtiene el carrito con un distribuidor específico."""
    service = CarritoService(db)
    return await service.get_carrito(cliente.id, distribuidor_id)

@router.put(
    "/me/carritos/{distribuidor_id}/items/{producto_id}",
    summary="Agregar o modificar item en carrito"
)
async def upsert_carrito_item(
    distribuidor_id: UUID,
    producto_id: UUID,
    data: CarritoItemRequest,
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db)
):
    """Agrega o modifica la cantidad de un producto. Si la cantidad es 0, lo elimina."""
    service = CarritoService(db)
    return await service.agregar_o_modificar_producto(
        cliente_id=cliente.id,
        distribuidor_id=distribuidor_id,
        producto_id=producto_id,
        cantidad=data.cantidad
    )

@router.delete(
    "/me/carritos/{distribuidor_id}/items/{producto_id}",
    summary="Eliminar item del carrito"
)
async def eliminar_carrito_item(
    distribuidor_id: UUID,
    producto_id: UUID,
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db)
):
    """Remueve explícitamente un producto del carrito."""
    service = CarritoService(db)
    return await service.remover_producto(
        cliente_id=cliente.id,
        distribuidor_id=distribuidor_id,
        producto_id=producto_id
    )
