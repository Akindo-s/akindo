"""
Carrito router — /carrito/*

Endpoints:
  GET /                            → Obtener todos los carritos (autenticado)
  GET /{distribuidor_id}           → Obtener carrito por distribuidor (autenticado)
  PUT /{distribuidor_id}/items/{producto_id} → Agregar o modificar item (autenticado)
  DELETE /{distribuidor_id}/items/{producto_id} → Eliminar item (autenticado)
"""

from uuid import UUID
from fastapi import APIRouter, Depends, status
from app.infrastructure.database import DatabaseSession, get_db
from app.core.dependencies import get_current_cliente
from app.models.cliente import Cliente
from app.services.carrito import CarritoService
from app.services.cliente import ClienteService
from app.schemas.carrito import CarritoItemRequest, CarritoResponse
from app.schemas.carrito import CarritoResponse as CarritoResumenResponse

router = APIRouter(prefix="/carrito", tags=["Carrito"])

@router.get(
    "/",
    response_model=list[CarritoResumenResponse],
    summary="Obtener mis carritos (Todos)",
)
async def get_mis_carritos(
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db),
):
    """Retorna todos los carritos del cliente autenticado con sus items."""
    service = ClienteService(db)
    return await service.get_carritos(cliente.id)


@router.get(
    "/{distribuidor_id}",
    response_model=CarritoResponse,
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
    "/{distribuidor_id}/items/{producto_id}",
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
    "/{distribuidor_id}/items/{producto_id}",
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

@router.get(
    "/items/{producto_id}",
    summary="Obtener un item específico del carrito"
)
async def get_item_carrito(
    producto_id: UUID,
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db)
):
    """Verifica si un producto está en el carrito y retorna sus datos si existe."""
    service = CarritoService(db)
    item = await service.get_item_del_carrito(cliente.id, producto_id)
    if not item:
        return {"en_carrito": False}
    return {"en_carrito": True, "item": item}