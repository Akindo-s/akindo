from dataclasses import dataclass, field
import uuid
from datetime import datetime

from app.models.base import Aggregate, ValueObject
from app.core.exceptions import AggregateNoValido

@dataclass(frozen=True)
class CarritoItem(ValueObject):
    producto_id: uuid.UUID
    cantidad: int
    cantidad_minima: int
    cantidad_maxima: int

@dataclass
class Carrito(Aggregate):
    cliente_id: uuid.UUID
    distribuidor_id: uuid.UUID
    items: list[CarritoItem] = field(default_factory=list)
    fecha_actualizacion: datetime | None = None

    def __check_ids(self)->None:
        if not self.cliente_id: # ? Tambien podria verificar que existan
            raise AggregateNoValido("El carrito debe pertenecer a un cliente")
        if not self.distribuidor_id:
            raise AggregateNoValido("El carrito debe pertenecer a un distribuidor")

    def __check_carrito_items(self)->None:
        for item in self.items:
            if item.cantidad <= 0:
                raise AggregateNoValido("La cantidad de un producto en el carrito debe ser mayor a 0")
            if item.cantidad < item.cantidad_minima:
                raise AggregateNoValido(f"La cantidad solicitada ({item.cantidad}) es menor al mínimo permitido ({item.cantidad_minima}) para este producto")
            if item.cantidad > item.cantidad_maxima:
                raise AggregateNoValido(f"La cantidad solicitada ({item.cantidad}) supera las existencias disponibles ({item.cantidad_maxima})")

    def check(self) -> None:
        self.__check_ids()
        self.__check_carrito_items()


    @classmethod
    def crear(
        cls,
        cliente_id: uuid.UUID,
        distribuidor_id: uuid.UUID,
    ) -> "Carrito":
        carrito = cls(
            id=uuid.uuid4(),
            cliente_id=cliente_id,
            distribuidor_id=distribuidor_id,
            items=[]
        )
        carrito.check()
        return carrito

    def agregar_item(self, producto_id: uuid.UUID, cantidad: int, cantidad_minima: int, cantidad_maxima: int) -> None:
        if cantidad <= 0:
            raise AggregateNoValido("La cantidad a agregar debe ser mayor a 0")
            
        # si existe se agrega la nueva cantidad y actualizamos los limites
        for i, item in enumerate(self.items): # TODO : podriamos guardar un conjunto con los ids y sus indices para facilitar la busqueda
            if item.producto_id == producto_id:
                self.items[i] = CarritoItem( # TODO : esto deberia de solo cambiar la nueva propiedad, porque una instancia distinta?? inclusive si es por el check esto ya se hace y mucho 
                    producto_id=producto_id, 
                    cantidad=cantidad,
                    cantidad_minima=cantidad_minima,
                    cantidad_maxima=cantidad_maxima
                )
                self.__check_carrito_items() # TODO : prodria ser mas eficiente si solo hacemos check al nuevo item
                return

        # si no existe se agrega al carrito
        
        self.items.append(CarritoItem(
            producto_id=producto_id, 
            cantidad=cantidad,
            cantidad_minima=cantidad_minima,
            cantidad_maxima=cantidad_maxima
        ))
        self.__check_carrito_items()

    def modificar_cantidad(self, producto_id: uuid.UUID, nueva_cantidad: int, cantidad_minima: int, cantidad_maxima: int) -> None:
        """Modifica la cantidad de un item. Si es <= 0, lo remueve."""
        if nueva_cantidad <= 0:
            self.remover_item(producto_id)
            return

        for i, item in enumerate(self.items):
            if item.producto_id == producto_id:
                self.items[i] = CarritoItem(
                    producto_id=producto_id, 
                    cantidad=nueva_cantidad,
                    cantidad_minima=cantidad_minima,
                    cantidad_maxima=cantidad_maxima
                )
                self.__check_carrito_items()
                return
        
        # Si llega aquí, significa que intentaron modificar un item que no existe, por eso el raise.
        raise AggregateNoValido("El producto no existe en el carrito")

    def remover_item(self, producto_id: uuid.UUID) -> None:
        self.items = [item for item in self.items if item.producto_id != producto_id]
        self.__check_carrito_items()

    def esta_vacio(self) -> bool:
        return len(self.items) == 0

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "cliente_id": str(self.cliente_id),
            "distribuidor_id": str(self.distribuidor_id),
            "items": [
                {
                    "producto_id": str(i.producto_id), 
                    "cantidad": i.cantidad,
                    "cantidad_minima": i.cantidad_minima,
                    "cantidad_maxima": i.cantidad_maxima
                } 
                for i in self.items
            ],
            "fecha_actualizacion": str(self.fecha_actualizacion) if self.fecha_actualizacion else None
        }
