"""
Eventos de imagen de usuario:
  - UsuarioImagenSubida

Evento genérico para subida de imagen de perfil/negocio.
"""

from uuid import UUID

from .base import Evento, Suscriptor
from app.models.base import TipoUsuario

import logging
logger = logging.getLogger("akindo.events.usuario")


# ── Eventos ────────────────────────────────────────────────────────


class UsuarioImagenSubida(Evento):
    """Un usuario (cliente o distribuidor) subió o actualizó su imagen de perfil/negocio."""

    usuario_id: UUID
    tipo_usuario: TipoUsuario
    url_imagen: str
    bucket: str

    @property
    def nombre(self) -> str:
        return "usuario.imagen_subida"


# ── Suscriptores ────────────────────────────────────────────────────


class UsuarioImagenSubidaSuscriptor(Suscriptor):
    """Auditoría/logging para subida de imagen de usuario."""

    async def handle(self, evento: UsuarioImagenSubida) -> None:
        logger.info(
            f"Usuario {evento.usuario_id} ({evento.tipo_usuario.value}) subió imagen a {evento.bucket}: {evento.url_imagen}"
        )