"""
Suscriptores de eventos de órdenes y pedidos.
Por ahora solo registran logs. Son extensibles para notificaciones push/email.
"""

import logging
from app.events.base import Evento, Suscriptor
from app.events.pedido_eventos import (
    OrdenPedidoCreada,
    OrdenPedidoAceptada,
    OrdenPedidoRechazada,
    PedidoCreado,
    PedidoActualizado,
    PedidoFinalizado,
)

logger = logging.getLogger("akindo.pedido.eventos")


class RegistrarOrdenCreada(Suscriptor):
    async def handle(self, evento: Evento) -> None:
        if isinstance(evento, OrdenPedidoCreada):
            logger.info(
                "📦 Orden %s creada — cliente=%s distribuidor=%s total=%.2f",
                evento.orden_id, evento.cliente_id, evento.distribuidor_id, evento.total,
            )


class NotificarOrdenAceptada(Suscriptor):
    async def handle(self, evento: Evento) -> None:
        if isinstance(evento, OrdenPedidoAceptada):
            accion = "→ pedido creado automáticamente" if evento.pre_autorizado else "→ esperando pago del cliente"
            logger.info(
                "✅ Orden %s ACEPTADA por distribuidor=%s — %s",
                evento.orden_id, evento.distribuidor_id, accion,
            )


class NotificarOrdenRechazada(Suscriptor):
    async def handle(self, evento: Evento) -> None:
        if isinstance(evento, OrdenPedidoRechazada):
            logger.info(
                "❌ Orden %s RECHAZADA — motivo: %s",
                evento.orden_id, evento.motivo or "sin motivo",
            )


class RegistrarPedidoCreado(Suscriptor):
    async def handle(self, evento: Evento) -> None:
        if isinstance(evento, PedidoCreado):
            logger.info(
                "🚚 Pedido %s creado desde orden %s — total=%.2f",
                evento.pedido_id, evento.orden_id, evento.total,
            )


class RegistrarActualizacionPedido(Suscriptor):
    async def handle(self, evento: Evento) -> None:
        if isinstance(evento, PedidoActualizado):
            logger.info(
                "📍 Pedido %s → nuevo estado: %s",
                evento.pedido_id, evento.estado_nuevo,
            )


class SolicitarValoracionPedido(Suscriptor):
    async def handle(self, evento: Evento) -> None:
        if isinstance(evento, PedidoFinalizado):
            logger.info(
                "⭐ Pedido %s ENTREGADO — solicitando valoración al cliente=%s",
                evento.pedido_id, evento.cliente_id,
            )
            # TODO: enviar push notification o email al cliente para valorar
