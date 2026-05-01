"""
EventBus — sistema pub/sub in-process.
Publica eventos y despacha a los suscriptores registrados.
"""

import logging
from collections import defaultdict

from .base import Evento, Suscriptor

logger = logging.getLogger("akindo.events")


class EventBus:
    """Bus de eventos in-process (singleton por convención)."""

    def __init__(self):
        # tipo_evento → [suscriptor1, suscriptor2, ...]
        self._suscriptores: dict[str, list[Suscriptor]] = defaultdict(list)

    def subscribe(self, tipo_evento: str, suscriptor: Suscriptor) -> None:
        """Registra un suscriptor para un tipo de evento."""
        self._suscriptores[tipo_evento].append(suscriptor)
        logger.info(
            "Suscriptor %s registrado para '%s'",
            suscriptor.__class__.__name__,
            tipo_evento,
        )

    async def publish(self, evento: Evento) -> None:
        """Publica un evento y lo despacha a todos sus suscriptores."""
        tipo = evento.nombre
        handlers = self._suscriptores.get(tipo, [])
        logger.info("Publicando '%s' → %d suscriptor(es)", tipo, len(handlers))

        for handler in handlers:
            try:
                await handler.handle(evento)
            except Exception:
                logger.exception(
                    "Error en suscriptor %s al manejar '%s'",
                    handler.__class__.__name__,
                    tipo,
                )


# ── Instancia global ──────────────────────────────────────────────
event_bus = EventBus()
