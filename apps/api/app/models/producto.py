from app.events.producto_eventos import ProductoActualizadoNuevasPropiedades
from app.events.producto_eventos import ProductoActualizado
from app.events.bus import event_bus
from dataclasses import dataclass, field
import uuid
from typing import Any

from app.models.base import Aggregate
from app.core.exceptions import AggregateNoValido

@dataclass
class Producto(Aggregate):
    distribuidor_id: uuid.UUID
    nombre: str
    costo: float
    medida: uuid.UUID
    existencias: int = 0
    disponible: bool = True
    atributos_extra: dict[str, Any] | None = None
    imagen: str | None = None

    def __check_nombre(self)->None:
        if not self.nombre or not self.nombre.strip():
            raise AggregateNoValido("El nombre del producto no puede estar vacío")
    def __check_costo(self)->None:
        if self.costo < 0:
            raise AggregateNoValido("El costo del producto no puede ser negativo")
    def __check_existencias(self)->None:
        if self.existencias < 0:
            raise AggregateNoValido("Las existencias del producto no pueden ser negativas")

    def check(self) -> None:
        self.__check_nombre()
        self.__check_costo()
        self.__check_existencias()


    @classmethod
    def crear(
        cls,
        distribuidor_id: uuid.UUID,
        nombre: str,
        costo: float,
        medida: uuid.UUID,
        existencias: int = 0,
        atributos_extra: dict[str, Any] | None = None
    ) -> "Producto":
        producto = cls(
            id=uuid.uuid4(),
            distribuidor_id=distribuidor_id,
            nombre=nombre,
            costo=costo,
            medida=medida,
            existencias=existencias,
            disponible=True,
            atributos_extra=atributos_extra,
            imagen=None,
        )
        producto.check()
        return producto

    def actualizar_datos(
        self,
        nombre: str | None = None,
        costo: float | None = None,
        medida: uuid.UUID | None = None,
        atributos_extra: dict[str, Any] | None = None
    ) -> None:
        if nombre is not None:
            self.nombre = nombre
            self.__check_nombre()

        if costo is not None:
            self.costo = costo
            self.__check_costo()

        if medida is not None:
            self.medida = medida

        if atributos_extra is not None:
            self.atributos_extra = atributos_extra

    def ajustar_existencias(self, nuevas_existencias: int) -> None:
        """Ajusta o reemplaza el total de existencias manualmente."""
        self.existencias = nuevas_existencias
        self.__check_existencias()

    def archivar(self) -> None:
        """Borrado lógico del producto."""
        self.disponible = False

    def __check_atributo_extra(self,clave:str,valor:Any)->None:
        ...

    async def insertar_atributos(self,**kwargs)->None:
        if self.atributos_extra is None:
            
            self.atributos_extra = dict()

        for c,v in kwargs.items():
            self.__check_atributo_extra(c,v)
            await event_bus.publish(
                ProductoActualizadoNuevasPropiedades(
                    producto_id=self.id,
                    distribuidor_id=self.distribuidor_id,
                    mensaje=f"Se agrego la propiedad {c} con un valor {v}",
                    clave=c,
                    valor=v
                )
            )
            self.atributos_extra[c] = v


    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "distribuidor_id": str(self.distribuidor_id),
            "nombre": self.nombre,
            "costo": self.costo,
            "medida": str(self.medida),
            "existencias": self.existencias,
            "disponible": self.disponible,
            "atributos_extra": self.atributos_extra,
            "imagen": self.imagen,
        }
