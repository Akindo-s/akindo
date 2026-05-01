"""
PedidoService — Crear orden · estados · rechazar.
"""

from app.infrastructure.database import DatabaseSession


class PedidoService:
    """Lógica de negocio para pedidos."""

    def __init__(self, db: DatabaseSession):
        self.db = db

    async def crear_orden(self):
        pass

    async def aceptar_orden(self):
        pass

    async def rechazar_orden(self):
        pass

    async def actualizar_estado(self):
        pass
