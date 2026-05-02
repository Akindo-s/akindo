from uuid import UUID
from datetime import datetime

from app.events.base import Evento

class CarritoActualizado(Evento):
    carrito_id: UUID
    cliente_id: UUID
    distribuidor_id: UUID
    
    @property
    def nombre(self) -> str:
        return "carrito.actualizado"

class CarritoEliminado(Evento):
    carrito_id: UUID
    cliente_id: UUID
    distribuidor_id: UUID
    ultimo_producto_id: UUID
    fecha_eliminacion: datetime
    
    @property
    def nombre(self) -> str:
        return "carrito.eliminado"

class ItemCarritoInvalidado(Evento):
    carrito_id: UUID
    cliente_id: UUID
    distribuidor_id: UUID
    producto_id: UUID
    motivo: str
    
    @property
    def nombre(self) -> str:
        return "carrito.item_invalidado"
