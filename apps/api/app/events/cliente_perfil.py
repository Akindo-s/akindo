"""
Eventos de perfil del cliente:
  - ClientePerfilConsultado
  - ClientePerfilActualizado
  - ClienteImagenPerfilSubida

Cada evento tiene un suscriptor de auditoría/logging.
"""

from uuid import UUID

from .base import Evento, Suscriptor

import logging
logger = logging.getLogger("akindo.events.cliente")


# ── Eventos ────────────────────────────────────────────────────────


class ClientePerfilConsultado(Evento):
    """Un cliente consultó su perfil."""

    usuario_id: UUID

    @property
    def nombre(self) -> str:
        return "cliente.perfil_consultado"


class ClientePerfilActualizado(Evento):
    """Un cliente actualizó su perfil."""

    usuario_id: UUID
    campos_actualizados: list[str]

    @property
    def nombre(self) -> str:
        return "cliente.perfil_actualizado"


class ClienteImagenPerfilSubida(Evento):
    """Un cliente subió o actualizó su imagen de perfil."""

    usuario_id: UUID
    url_imagen: str

    @property
    def nombre(self) -> str:
        return "cliente.imagen_perfil_subida"


# ── Suscriptores ───────────────────────────────────────────────────


class RegistrarConsultaPerfil(Suscriptor):
    """Registra la consulta de perfil (logging de auditoría)."""

    async def handle(self, evento: ClientePerfilConsultado) -> None:
        logger.info(
            "---- [auditoría] Cliente %s consultó su perfil",
            evento.usuario_id,
        )


class NotificarCambioPerfilCliente(Suscriptor):
    """Notifica/registra los cambios en el perfil del cliente."""

    async def handle(self, evento: ClientePerfilActualizado) -> None:
        logger.info(
            "---- [auditoría] Cliente %s actualizó su perfil — campos: %s",
            evento.usuario_id,
            ", ".join(evento.campos_actualizados),
        )


class RegistrarCambioImagenPerfil(Suscriptor):
    """Registra el cambio de imagen de perfil."""

    async def handle(self, evento: ClienteImagenPerfilSubida) -> None:
        logger.info(
            "---- [auditoría] Cliente %s subió imagen de perfil → %s",
            evento.usuario_id,
            evento.url_imagen,
        )
