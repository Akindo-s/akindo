from typing import Any
from dataclasses import dataclass
from uuid import UUID

from app.events.base import Evento

@dataclass
class ProductoCreado(Evento):
    producto_id: UUID
    distribuidor_id: UUID
    nombre: str
    
    @property
    def nombre(self) -> str:
        return "producto.creado"

@dataclass
class ProductoActualizado(Evento):
    producto_id: UUID
    distribuidor_id: UUID
    
    @property
    def nombre(self) -> str:
        return "producto.actualizado"

@dataclass
class ProductoActualizadoNuevasPropiedades(ProductoActualizado):
    mensaje: str
    clave: str
    valor: Any

@dataclass
class ProductoArchivado(Evento):
    producto_id: UUID
    distribuidor_id: UUID
    
    @property
    def nombre(self) -> str:
        return "producto.archivado"
