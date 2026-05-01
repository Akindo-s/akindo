"""
StorageAdapter — cliente para Supabase Storage API.
Maneja subida, descarga y eliminación de archivos (imágenes de perfil, productos, etc.).
"""


class StorageAdapter:
    """Adaptador para Supabase Storage."""

    async def upload(self, bucket: str, path: str, data: bytes) -> str:
        """Sube un archivo y retorna la URL pública."""
        pass

    async def download(self, bucket: str, path: str) -> bytes:
        """Descarga un archivo por su path."""
        pass

    async def delete(self, bucket: str, path: str) -> None:
        """Elimina un archivo."""
        pass

    def get_public_url(self, bucket: str, path: str) -> str:
        """Genera la URL pública de un archivo."""
        pass
