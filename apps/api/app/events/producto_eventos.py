from typing import Any
from uuid import UUID

from app.events.base import Evento

class ProductoCreado(Evento):
    producto_id: UUID
    distribuidor_id: UUID
    nombre_producto: str
    
    @property
    def nombre(self) -> str:
        return "producto.creado"


class ProductoActualizado(Evento):
    producto_id: UUID
    distribuidor_id: UUID
    
    @property
    def nombre(self) -> str:
        return "producto.actualizado"


class ProductoActualizadoNuevasPropiedades(ProductoActualizado):
    mensaje: str
    clave: str
    valor: Any


class ProductoArchivado(Evento):
    producto_id: UUID
    distribuidor_id: UUID
    
    @property
    def nombre(self) -> str:
        return "producto.archivado"
