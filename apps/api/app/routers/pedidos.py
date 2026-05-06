"""
Pedidos router — /pedidos/*
Maneja: órdenes de compra (cliente crea, distribuidor gestiona) y pedidos activos.
"""

from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_current_cliente, get_current_distribuidor, get_current_user, get_db
from app.infrastructure.database import DatabaseSession
from app.models.usuario import Usuario
from app.models.cliente import Cliente
from app.models.distribuidor import Distribuidor
from app.schemas.orden_pedido import (
    CrearOrdenRequest,
    RechazarOrdenRequest,
    OrdenPedidoResponse,
    OrdenPedidoListItem,
    PreOrdenResponse,
)
from app.schemas.pedido import (
    ActualizarEstadoPedidoRequest,
    CrearValoracionRequest,
    PedidoResponse,
    PedidoListItem,
    ValoracionResponse,
)
from app.services.orden_pedido import OrdenPedidoService
from app.services.pedido import PedidoService

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


# ── Pre-orden (snapshot del carrito) ─────────────────────────────

@router.get(
    "/preorden",
    response_model=PreOrdenResponse,
    summary="Snapshot del carrito para la pantalla de pre-orden",
)
async def get_preorden(
    distribuidor_id: UUID = Query(..., description="ID del distribuidor del carrito"),
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db),
):
    """
    Genera el snapshot del carrito de un distribuidor para mostrar en la pantalla
    de pre-orden (confirmación). No crea ningún registro.
    """
    service = OrdenPedidoService(db)
    return await service.get_preorden(cliente.id, distribuidor_id)


# ── Órdenes de compra — cliente ───────────────────────────────────

@router.post(
    "/ordenes",
    response_model=OrdenPedidoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cliente: crear orden de compra",
)
async def crear_orden(
    data: CrearOrdenRequest,
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db),
):
    """Cliente crea una orden de compra desde su carrito."""
    service = OrdenPedidoService(db)
    return await service.crear_orden(cliente.id, data)


@router.post(
    "/ordenes/{orden_id}/pagar",
    response_model=OrdenPedidoResponse,
    summary="Cliente: pagar una orden aceptada",
)
async def pagar_orden(
    orden_id: UUID,
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db),
):
    """
    Cliente paga una orden que el distribuidor ya aceptó.
    Se crea el pedido y empieza el flujo de entrega.
    """
    service = OrdenPedidoService(db)
    return await service.pagar_orden(cliente.id, orden_id)


@router.get(
    "/mis-ordenes",
    response_model=list[OrdenPedidoListItem],
    summary="Cliente: listar mis órdenes de compra",
)
async def listar_mis_ordenes(
    estado: Optional[str] = Query(None, description="pendiente | aceptada | rechazada | cancelada"),
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db),
):
    """Lista todas las órdenes de compra del cliente autenticado."""
    service = OrdenPedidoService(db)
    return await service.listar_ordenes_cliente(cliente.id, estado)


@router.patch(
    "/ordenes/{orden_id}/cancelar",
    response_model=OrdenPedidoResponse,
    summary="Cliente: cancelar mi orden de compra",
)
async def cancelar_orden(
    orden_id: UUID,
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db),
):
    """
    Cliente cancela su propia orden. Solo funciona si la orden está 'pendiente'.
    """
    service = OrdenPedidoService(db)
    return await service.cancelar_orden(cliente.id, orden_id)


# ── Pedidos — cliente ─────────────────────────────────────────────

@router.get(
    "/",
    response_model=list[PedidoListItem],
    summary="Cliente: listar mis pedidos",
)
async def listar_mis_pedidos(
    estado: Optional[str] = Query(None, description="pendiente de envio | en envio | entregado | cancelado"),
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db),
):
    """Lista todos los pedidos del cliente autenticado."""
    service = PedidoService(db)
    return await service.listar_mis_pedidos_cliente(cliente.id, estado)


@router.get(
    "/{pedido_id}",
    response_model=PedidoResponse,
    summary="Ver detalle y seguimiento de un pedido",
)
async def obtener_pedido(
    pedido_id: UUID,
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db),
):
    """Devuelve el detalle completo del pedido con su timeline de actualizaciones."""
    service = PedidoService(db)
    return await service.obtener_pedido(pedido_id, cliente.id)


@router.post(
    "/{pedido_id}/valoracion",
    status_code=status.HTTP_201_CREATED,
    summary="Cliente: valorar un pedido entregado",
)
async def crear_valoracion(
    pedido_id: UUID,
    data: CrearValoracionRequest,
    cliente: Cliente = Depends(get_current_cliente),
    db: DatabaseSession = Depends(get_db),
):
    """Cliente valora un pedido que ya fue entregado (1-5 estrellas)."""
    service = PedidoService(db)
    return await service.crear_valoracion(cliente.id, pedido_id, data)


# ── Órdenes de compra — distribuidor ─────────────────────────────

@router.get(
    "/distribuidor/ordenes",
    response_model=list[OrdenPedidoListItem],
    summary="Distribuidor: listar órdenes de compra recibidas",
)
async def listar_ordenes_distribuidor(
    estado: Optional[str] = Query(None, description="pendiente | aceptada | rechazada"),
    distribuidor: Distribuidor = Depends(get_current_distribuidor),
    db: DatabaseSession = Depends(get_db),
):
    """Lista todas las órdenes de compra recibidas por el distribuidor."""
    service = OrdenPedidoService(db)
    return await service.listar_ordenes_distribuidor(distribuidor.id, estado)


@router.patch(
    "/distribuidor/ordenes/{orden_id}/aceptar",
    response_model=OrdenPedidoResponse,
    summary="Distribuidor: aceptar una orden de compra",
)
async def aceptar_orden(
    orden_id: UUID,
    distribuidor: Distribuidor = Depends(get_current_distribuidor),
    db: DatabaseSession = Depends(get_db),
):
    """Distribuidor acepta la orden. Si tiene pre_autorizado=true, crea el pedido automáticamente."""
    service = OrdenPedidoService(db)
    return await service.aceptar_orden(distribuidor.id, orden_id)


@router.patch(
    "/distribuidor/ordenes/{orden_id}/rechazar",
    response_model=OrdenPedidoResponse,
    summary="Distribuidor: rechazar una orden de compra",
)
async def rechazar_orden(
    orden_id: UUID,
    data: RechazarOrdenRequest,
    distribuidor: Distribuidor = Depends(get_current_distribuidor),
    db: DatabaseSession = Depends(get_db),
):
    """Distribuidor rechaza la orden con motivo opcional."""
    service = OrdenPedidoService(db)
    return await service.rechazar_orden(distribuidor.id, orden_id, data)


# ── Pedidos — distribuidor ────────────────────────────────────────

@router.get(
    "/distribuidor/pedidos",
    response_model=list[PedidoListItem],
    summary="Distribuidor: listar sus pedidos",
)
async def listar_pedidos_distribuidor(
    estado: Optional[str] = Query(None),
    distribuidor: Distribuidor = Depends(get_current_distribuidor),
    db: DatabaseSession = Depends(get_db),
):
    """Lista todos los pedidos del distribuidor (activos y finalizados)."""
    service = PedidoService(db)
    return await service.listar_pedidos_distribuidor(distribuidor.id, estado)


@router.patch(
    "/distribuidor/pedidos/{pedido_id}/estado",
    response_model=PedidoResponse,
    summary="Distribuidor: enviar actualización de estado del pedido",
)
async def actualizar_estado_pedido(
    pedido_id: UUID,
    data: ActualizarEstadoPedidoRequest,
    distribuidor: Distribuidor = Depends(get_current_distribuidor),
    db: DatabaseSession = Depends(get_db),
):
    """
    Distribuidor actualiza el estado del pedido y registra en el timeline.
    Al marcar 'entregado' se dispara el flujo de valoración.
    """
    service = PedidoService(db)
    return await service.actualizar_estado(distribuidor.id, pedido_id, data)


@router.get(
    "/distribuidor/pedidos/{pedido_id}",
    response_model=PedidoResponse,
    summary="Distribuidor: ver detalle de un pedido",
)
async def obtener_pedido_distribuidor(
    pedido_id: UUID,
    distribuidor: Distribuidor = Depends(get_current_distribuidor),
    db: DatabaseSession = Depends(get_db),
):
    """Distribuidor obtiene el detalle completo de uno de sus pedidos."""
    service = PedidoService(db)
    return await service.obtener_pedido(pedido_id, distribuidor.id)


@router.get(
    "/distribuidor/valoraciones",
    response_model=list[ValoracionResponse],
    summary="Distribuidor: ver sus valoraciones recibidas",
)
async def listar_valoraciones_distribuidor(
    distribuidor: Distribuidor = Depends(get_current_distribuidor),
    db: DatabaseSession = Depends(get_db),
):
    """Lista todas las valoraciones de clientes que ha recibido el distribuidor."""
    service = PedidoService(db)
    return await service.listar_valoraciones_distribuidor(distribuidor.id)


# ── Orden individual (compartida cliente/distribuidor) ────────────

@router.get(
    "/ordenes/{orden_id}",
    response_model=OrdenPedidoResponse,
    summary="Ver detalle de una orden de compra",
)
async def obtener_orden(
    orden_id: UUID,
    user: Usuario = Depends(get_current_user),
    db: DatabaseSession = Depends(get_db),
):
    """Consulta el detalle de una orden de compra (cliente o distribuidor)."""
    service = OrdenPedidoService(db)
    return await service.get_orden(orden_id, user.id)
