import uuid
from datetime import datetime

from app.infrastructure.database import DatabaseSession
from app.repositories.carrito import CarritoRepo
from app.models.carrito import Carrito
from app.events.bus import event_bus
from app.events.carrito_eventos import CarritoActualizado, CarritoEliminado, ItemCarritoInvalidado
from app.core.exceptions import NotFoundException, UnauthorizedException, AggregateNoValido

class CarritoService:
    def __init__(self, db: DatabaseSession):
        self.db = db
        self.repo = CarritoRepo(db)

    async def _get_or_create_carrito(self, cliente_id: uuid.UUID, distribuidor_id: uuid.UUID) -> Carrito:
        """
        # !Metodo privado.
        Si el carrito no existe se crea logicamente, pero necesita un .save() del repo para que se guarde en la base de datos
        """
        carrito = await self.repo.get_by_cliente_and_distribuidor(cliente_id, distribuidor_id)
        if not carrito:
            carrito = Carrito.crear(cliente_id=cliente_id, distribuidor_id=distribuidor_id)
        return carrito

    async def get_carrito(self, cliente_id: uuid.UUID, distribuidor_id: uuid.UUID) -> Carrito:
        carrito = await self.repo.get_by_cliente_and_distribuidor(cliente_id, distribuidor_id)
        if not carrito:
            raise NotFoundException("No tienes un carrito con este distribuidor")
        return carrito

    async def agregar_o_modificar_producto(
        self,
        cliente_id: uuid.UUID,
        distribuidor_id: uuid.UUID,
        producto_id: uuid.UUID,
        cantidad: int
    ) -> Carrito | dict:
        """Agrega o modifica cantidad. Si la cantidad es 0, lo remueve."""
        carrito = await self._get_or_create_carrito(cliente_id, distribuidor_id)

        if cantidad <= 0:
            return await self.remover_producto(cliente_id, distribuidor_id, producto_id, carrito)

        # Consultar la disponibilidad real del producto
        producto_results = await self.db.select(
            "producto", 
            "existencias, disponible", 
            {"id": str(producto_id)}
        )
        if not producto_results:
            raise NotFoundException("El producto no existe")
            
        producto_data = producto_results[0]
        if not producto_data["disponible"] or producto_data["existencias"] == 0:
            # Emitir evento y no agregar
            await event_bus.publish(ItemCarritoInvalidado(
                carrito_id=carrito.id,
                cliente_id=cliente_id,
                distribuidor_id=distribuidor_id,
                producto_id=producto_id,
                motivo="Intento de agregar producto no disponible o sin stock"
            ))
            raise AggregateNoValido("El producto no se encuentra disponible o no hay existencias.")

        cantidad_maxima = producto_data["existencias"]
        cantidad_minima = 1 # Por defecto

        # Usar agregar_item (que también modifica si ya existe)
        carrito.agregar_item(
            producto_id=producto_id, 
            cantidad=cantidad,
            cantidad_minima=cantidad_minima,
            cantidad_maxima=cantidad_maxima
        )
        
        await self.repo.save(carrito)
        
        await event_bus.publish(CarritoActualizado(
            carrito_id=carrito.id,
            cliente_id=carrito.cliente_id,
            distribuidor_id=carrito.distribuidor_id
        ))

        return carrito

    async def remover_producto(
        self,
        cliente_id: uuid.UUID,
        distribuidor_id: uuid.UUID,
        producto_id: uuid.UUID,
        carrito: Carrito | None = None
    ) -> Carrito | dict:
        """Remueve un producto explícitamente. Si el carrito queda vacío, lo elimina."""
        if not carrito:
            carrito = await self.repo.get_by_cliente_and_distribuidor(cliente_id, distribuidor_id)
            
        if not carrito:
            raise NotFoundException("No tienes un carrito con este distribuidor")

        carrito.remover_item(producto_id)

        if carrito.esta_vacio():
            # Si se vacía, lo eliminamos de BD y emitimos evento
            await self.repo.delete(carrito.id)
            
            await event_bus.publish(CarritoEliminado(
                carrito_id=carrito.id,
                cliente_id=carrito.cliente_id,
                distribuidor_id=carrito.distribuidor_id,
                ultimo_producto_id=producto_id,
                fecha_eliminacion=datetime.now()
            ))
            return {"mensaje": "Carrito eliminado porque quedó vacío"}

        # Si aún tiene ítems, solo lo actualizamos
        await self.repo.save(carrito)
        
        await event_bus.publish(CarritoActualizado(
            carrito_id=carrito.id,
            cliente_id=carrito.cliente_id,
            distribuidor_id=carrito.distribuidor_id
        ))

        return carrito
