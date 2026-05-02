"""
Evento — DistribuidorRegistrado.
Emitido cuando un nuevo distribuidor se registra en el sistema.
"""
import logging
from uuid import UUID

from app.events.base import Evento, Suscriptor
logger = logging.getLogger("akindo.events.distribuidor")

class DistribuidorRegistrado(Evento):
    """Datos emitidos al registrar un distribuidor."""
    usuario_id: UUID
    email: str
    nombre_negocio: str

    @property
    def nombre(self) -> str:
        return "distribuidor.registrado"


class EventoEnviarMensajeBienvenidaDistribuidor(Suscriptor):
    """Manejador: simula el envío de un email de bienvenida."""

    @property
    def nombre(self) -> str:
        return "distribuidor.registrado"

    async def handle(self, evento: DistribuidorRegistrado) -> None:
        logger.info(f"[MAIL] Enviando bienvenida a distribuidor {evento.nombre_negocio} ({evento.email})")
