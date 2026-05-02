"""
Evento: ClienteRegistrado
Se emite cuando un nuevo cliente completa su registro exitosamente.

Suscriptores:
  - EventoEnviarMensajeBienvenidaCliente
"""

from uuid import UUID

from .base import Evento, Suscriptor

import logging
logger = logging.getLogger("akindo.events.cliente")

# ── Evento ─────────────────────────────────────────────────────────

class ClienteRegistrado(Evento):
    """Un nuevo cliente se registró en la plataforma."""

    usuario_id: UUID
    email: str
    nombre_cliente: str

    @property
    def nombre(self) -> str:
        return "cliente.registrado"


# ── Suscriptores ───────────────────────────────────────────────────

class EventoEnviarMensajeBienvenidaCliente(Suscriptor):
    """Envía un mensaje/correo de bienvenida al nuevo cliente."""

    async def handle(self, evento: ClienteRegistrado) -> None:
        # TODO: implementar envío de correo / notificación de bienvenida
        logger.info("----  [simulacion] Se envio correo de bienvenida al cliente")
        
        pass
