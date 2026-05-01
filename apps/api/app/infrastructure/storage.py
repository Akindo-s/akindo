"""
StorageAdapter — cliente para Supabase Storage API.
Maneja subida, descarga y eliminación de archivos (imágenes de perfil, productos, etc.).
"""

import logging

from supabase._async.client import AsyncClient, create_client

from app.core.config import settings
from app.core.exceptions import StorageException

logger = logging.getLogger("akindo.storage")


class StorageAdapter:
    """Adaptador para Supabase Storage."""

    def __init__(self, client: AsyncClient):
        self._client = client

    @classmethod
    async def create(cls) -> "StorageAdapter":
        """Factory async — inicializa el cliente de Supabase."""
        client = await create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY,
        )
        return cls(client)

    async def upload(self, bucket: str, path: str, data: bytes, content_type: str = "image/jpeg") -> str:
        """
        Sube un archivo y retorna la URL pública.

        Args:
            bucket: nombre del bucket en Supabase Storage.
            path: ruta dentro del bucket (ej. "avatars/user-id.jpg").
            data: contenido del archivo en bytes.
            content_type: MIME type del archivo.

        Returns:
            URL pública del archivo subido.

        Raises:
            StorageException: si ocurre un error al subir.
        """
        try:
            await self._client.storage.from_(bucket).upload(
                path,
                data,
                file_options={"content-type": content_type, "upsert": "true"},
            )
            return self.get_public_url(bucket, path)
        except Exception as e:
            logger.error("Error subiendo archivo a %s/%s: %s", bucket, path, e)
            raise StorageException(f"Error al subir archivo: {str(e)}")

    async def download(self, bucket: str, path: str) -> bytes:
        """Descarga un archivo por su path."""
        try:
            return await self._client.storage.from_(bucket).download(path)
        except Exception as e:
            logger.error("Error descargando archivo de %s/%s: %s", bucket, path, e)
            raise StorageException(f"Error al descargar archivo: {str(e)}")

    async def delete(self, bucket: str, paths: list[str]) -> None:
        """Elimina uno o más archivos."""
        try:
            await self._client.storage.from_(bucket).remove(paths)
        except Exception as e:
            logger.error("Error eliminando archivos de %s: %s", bucket, e)
            raise StorageException(f"Error al eliminar archivo: {str(e)}")

    def get_public_url(self, bucket: str, path: str) -> str:
        """Genera la URL pública de un archivo."""
        return self._client.storage.from_(bucket).get_public_url(path)


# ── Dependency de FastAPI ──────────────────────────────────────────

_storage_instance: StorageAdapter | None = None


async def get_storage() -> StorageAdapter:
    """Dependency de FastAPI — retorna la instancia singleton de StorageAdapter."""
    global _storage_instance
    if _storage_instance is None:
        _storage_instance = await StorageAdapter.create()
    return _storage_instance
