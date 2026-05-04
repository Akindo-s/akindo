"""
UsuarioService — Acciones compartidas por todos los tipos de usuario.
"""

import logging
from uuid import UUID

from app.core.exceptions import NotFoundException, ValidationException
from app.events.bus import event_bus
from app.infrastructure.database import DatabaseSession
from app.infrastructure.storage import StorageAdapter
from app.models.base import TipoUsuario
from app.repositories.usuario import UsuarioRepo
from app.schemas.cliente import ImagenPerfilResponse
logger = logging.getLogger("akindo.services.usuario")

class UsuarioService:
    """Lógica de negocio compartida para usuarios (clientes, distribuidores, etc.)."""

    ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

    def __init__(self, db: DatabaseSession, storage: StorageAdapter):
        self.db = db
        self.usuario_repo = UsuarioRepo(db)
        self.storage = storage

    async def subir_imagen_perfil(
        self, usuario_id: UUID, file_data: bytes, content_type: str, filename: str
    ) -> ImagenPerfilResponse:
        """
        Sube la imagen de perfil/negocio a Supabase Storage y actualiza la URL en la DB.
        Para clientes: sube a 'avatars' y actualiza imagen_perfil.
        Para distribuidores: sube a 'negocios' y actualiza imagen_fondo.
        """
        # Validar tipo de archivo
        if content_type not in self.ALLOWED_IMAGE_TYPES:
            raise ValidationException(
                f"Tipo de archivo no permitido: {content_type}. "
                f"Permitidos: {', '.join(self.ALLOWED_IMAGE_TYPES)}"
            )

        # Validar tamaño
        if len(file_data) > self.MAX_IMAGE_SIZE:
            raise ValidationException(
                f"La imagen excede el tamaño máximo de {self.MAX_IMAGE_SIZE // (1024 * 1024)} MB"
            )

        # Obtener usuario para determinar tipo
        usuario = await self.usuario_repo.get_by_id(usuario_id)
        if not usuario:
            raise NotFoundException("Usuario no encontrado")

        # Determinar bucket y campo según tipo de usuario
        if usuario.tipo == TipoUsuario.CLIENTE or usuario.tipo == TipoUsuario.DISTRIBUIDOR:
            bucket = "avatars"
    
        else:
            raise ValidationException(f"Tipo de usuario no soportado: {usuario.tipo}")

        # Determinar extensión
        ext = content_type.split("/")[-1]
        if ext == "jpeg":
            ext = "jpg"
        path = f"/{usuario_id}.{ext}"

        # Subir a Supabase Storage
        url:str = await self.storage.upload(bucket, path, file_data, content_type)

        
        usuario.imagen_perfil = url
        logger.info(f'\n\n USUARIO QUE SUBIO IMAGEN {usuario_id} - URL: {url} \n\n')
        await self.usuario_repo.save(usuario)

        # Publicar evento genérico
        from app.events.usuario_imagen import UsuarioImagenSubida
        await event_bus.publish(
            UsuarioImagenSubida(
                usuario_id=usuario_id,
                tipo_usuario=usuario.tipo,
                url_imagen=url,
                bucket=bucket,
            )
        )

        return ImagenPerfilResponse(imagen_perfil=url)