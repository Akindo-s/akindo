"""
DistribuidorService — Perfil · catálogo · valoraciones.
"""

from app.infrastructure.database import DatabaseSession


class DistribuidorService:
    """Lógica de negocio para distribuidores."""

    def __init__(self, db: DatabaseSession):
        self.db = db

    async def get_perfil(self):
        pass

    async def get_catalogo(self):
        pass

    async def get_valoraciones(self):
        pass
