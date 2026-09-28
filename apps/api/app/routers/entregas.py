"""
Entregas router — /entregas/*

Endpoints:
  GET /resumen               → Cumplimiento de entregas por día, paginable (autenticado)
  GET /pedidos/{pedido_id}   → Información de entrega de un pedido (autenticado)

Sirve igual al cliente que compró el pedido y al distribuidor que lo vende: el
servicio comprueba que el usuario sea uno de los dos. Por eso depende de
`get_current_user` y no de `get_current_cliente` / `get_current_distribuidor`,
que además de filtrar por tipo dejarían fuera a la otra mitad.

Los datos que devuelve son **de muestra** (ver `app/services/entrega.py`); la
forma de la respuesta ya es la definitiva.
"""

from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_user
from app.infrastructure.database import DatabaseSession, get_db
from app.models.usuario import Usuario
from app.schemas.entrega import DiaEntregas, EntregaResponse
from app.services.entrega import EntregaService

router = APIRouter(prefix="/entregas", tags=["Entregas"])


@router.get(
    "/resumen",
    response_model=list[DiaEntregas],
    summary="Cumplimiento de entregas por día",
)
async def entregas_por_dia(
    dias: int = Query(7, ge=1, le=31, description="Tamaño de la ventana, en días"),
    hasta: Optional[date] = Query(None, description="Último día de la ventana. Por defecto, hoy"),
    usuario: Usuario = Depends(get_current_user),
    db: DatabaseSession = Depends(get_db),
):
    """Cuántas entregas hubo cada día y cuántas llegaron antes, a tiempo o
    tarde respecto a la fecha comprometida.

    `hasta` mueve la ventana sin cambiar su tamaño, que es como la pantalla
    pagina entre periodos. Sirve igual al cliente (sus compras) que al
    distribuidor (sus ventas).
    """
    service = EntregaService(db)
    return await service.entregas_por_dia(usuario.id, dias, hasta)


@router.get(
    "/pedidos/{pedido_id}",
    response_model=EntregaResponse,
    summary="Información de entrega de un pedido",
)
async def obtener_entrega(
    pedido_id: UUID,
    usuario: Usuario = Depends(get_current_user),
    db: DatabaseSession = Depends(get_db),
):
    """Fecha de entrega aproximada, transportista y evidencias de la entrega.

    Responde 404 si el pedido no existe y 403 si no es del usuario que
    pregunta.
    """
    service = EntregaService(db)
    return await service.obtener_entrega(pedido_id, usuario.id)
