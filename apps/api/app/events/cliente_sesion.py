"""
Evento: ClienteInicioSesion
Se emite cuando un cliente inicia sesión exitosamente.

Suscriptores:
  - RegistrarUltimoAccesoCliente
"""

from uuid import UUID

from .base import Evento, Suscriptor

import logging
logger = logging.getLogger("akindo.events.cliente")


# ── Evento ─────────────────────────────────────────────────────────

class ClienteInicioSesion(Evento):
    """Un cliente inició sesión en la plataforma."""

    usuario_id: UUID
    email: str

    @property
    def nombre(self) -> str:
        return "cliente.inicio_sesion"


# ── Suscriptores ───────────────────────────────────────────────────

class RegistrarUltimoAccesoCliente(Suscriptor):
    """Registra el último acceso del cliente (logging de auditoría)."""

    async def handle(self, evento: ClienteInicioSesion) -> None:
        logger.info(
            "---- [auditoría] Cliente %s (%s) inició sesión",
            evento.usuario_id,
            evento.email,
        )
