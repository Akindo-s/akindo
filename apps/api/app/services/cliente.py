"""
ClienteService — Perfil · direcciones · carrito.
"""

from app.infrastructure.database import DatabaseSession


class ClienteService:
    """Lógica de negocio para clientes."""

    def __init__(self, db: DatabaseSession):
        self.db = db

    async def get_perfil(self):
        pass

    async def actualizar_perfil(self):
        pass

    async def get_direcciones(self):
        pass

    async def agregar_direccion(self):
        pass

    async def get_carrito(self):
        pass
