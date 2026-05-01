"""
EntregaService — Estado entrega · confirmación.
"""

from app.infrastructure.database import DatabaseSession


class EntregaService:
    """Lógica de negocio para entregas."""

    def __init__(self, db: DatabaseSession):
        self.db = db

    async def actualizar_estado(self):
        pass

    async def confirmar_entrega(self):
        pass
