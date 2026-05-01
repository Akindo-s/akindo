"""
ProductoService — CRUD · stock · búsqueda.
"""

from app.infrastructure.database import DatabaseSession


class ProductoService:
    """Lógica de negocio para productos."""

    def __init__(self, db: DatabaseSession):
        self.db = db

    async def crear(self):
        pass

    async def actualizar(self):
        pass

    async def eliminar(self):
        pass

    async def buscar(self):
        pass

    async def actualizar_stock(self):
        pass
