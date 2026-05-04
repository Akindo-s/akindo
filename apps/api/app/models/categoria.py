"""
Aggregates root — CategoriaProducto y CategoriaDistribuidor.
"""

from dataclasses import dataclass

from .base import Aggregate

@dataclass(kw_only=True)
class CategoriaDistribuidor(Aggregate):
    nombre: str
    imagen: str | None = None

    def check(self) -> None:
        from app.core.exceptions.base import AggregateNoValido
        if not self.nombre or not self.nombre.strip():
            raise AggregateNoValido("El nombre de la categoría de distribuidor no puede estar vacío")

    @classmethod
    def crear(cls, nombre: str, imagen: str | None = None) -> "CategoriaDistribuidor":
        return cls(nombre=nombre, imagen=imagen)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "nombre": self.nombre,
            "imagen": self.imagen
        }


@dataclass(kw_only=True)
class CategoriaProducto(Aggregate):
    nombre: str
    imagen: str | None = None

    def check(self) -> None:
        from app.core.exceptions.base import AggregateNoValido
        if not self.nombre or not self.nombre.strip():
            raise AggregateNoValido("El nombre de la categoría de producto no puede estar vacío")

    @classmethod
    def crear(cls, nombre: str, imagen: str | None = None) -> "CategoriaProducto":
        return cls(nombre=nombre, imagen=imagen)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "nombre": self.nombre,
            "imagen": self.imagen
        }
