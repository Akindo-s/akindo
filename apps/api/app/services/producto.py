from app.schemas.distribuidor import CatalogoPaginatedResponse
from app.repositories.distribuidor import DistribuidorRepo
from uuid import UUID
import uuid
from typing import Any

from app.infrastructure.database import DatabaseSession
from app.repositories.producto import ProductoRepo
from app.models.producto import Producto
from app.events.bus import event_bus
from app.events.producto_eventos import ProductoCreado, ProductoActualizado, ProductoArchivado
from app.core.exceptions import NotFoundException

class ProductoService:
    def __init__(self, db: DatabaseSession):
        self.db = db
        self.repo = ProductoRepo(db)
        self.__distribuidor_repo = DistribuidorRepo(db)

    async def get_unidades_medida(self) -> list[dict[str, Any]]:
        return await self.repo.get_unidades_medida()

    async def crear_producto(
        self,
        distribuidor_id: uuid.UUID,
        nombre: str,
        costo: float,
        medida: uuid.UUID,
        existencias: int,
        atributos_extra: dict[str, Any] | None
    ) -> Producto:
        # Aquí se podría validar si la unidad de medida existe llamando a la BD
        # Por ahora asumimos que el UUID que viene del front existe (ya que lo sacan del catálogo) si todo sale mal, llamen a dios...
        
        producto = Producto.crear(
            distribuidor_id=distribuidor_id,
            nombre=nombre,
            costo=costo,
            medida=medida,
            existencias=existencias,
            atributos_extra=atributos_extra
        )
        await self.repo.save(producto)
        
        await event_bus.publish(ProductoCreado(
            producto_id=producto.id,
            distribuidor_id=producto.distribuidor_id,
            nombre_producto=producto.nombre
        ))
        
        return producto

    async def actualizar_producto(
        self,
        producto_id: uuid.UUID,
        distribuidor_id: uuid.UUID,
        nombre: str,
        costo: float,
        medida: uuid.UUID,
        existencias: int,
        atributos_extra: dict[str, Any] | None
    ) -> Producto:
        producto = await self.repo.get(producto_id)
        if not producto or producto.distribuidor_id != distribuidor_id:
            raise NotFoundException("Producto no encontrado o no pertenece a este distribuidor")
            
        producto.actualizar_datos(
            nombre=nombre,
            costo=costo,
            medida=medida,
            atributos_extra=atributos_extra
        )
        
        # Ajustamos existencias también
        if producto.existencias != existencias:
            producto.ajustar_existencias(existencias)

        await self.repo.save(producto)
        
        await event_bus.publish(ProductoActualizado(
            producto_id=producto.id,
            distribuidor_id=producto.distribuidor_id
        ))
        
        return producto

    async def archivar_producto(self, producto_id: uuid.UUID, distribuidor_id: uuid.UUID) -> None:
        producto = await self.repo.get(producto_id)
        if not producto or producto.distribuidor_id != distribuidor_id:
            raise NotFoundException("Producto no encontrado o no pertenece a este distribuidor")
            
        producto.archivar()
        await self.repo.save(producto)
        
        await event_bus.publish(ProductoArchivado(
            producto_id=producto.id,
            distribuidor_id=producto.distribuidor_id
        ))

    async def get_catalogo(self,numero_pagina:int,cantidad_pagina:int,categorias:list[UUID]|None=None,id_distribuidor:UUID|None = None,nombre:str|None=None)->CatalogoPaginatedResponse:
        if id_distribuidor != None:
            distribuidor = await self.__distribuidor_repo.get_by_id(id_distribuidor)
            if not distribuidor : raise NotFoundException("Distribuidor no encontrado")

        limit = max(1, cantidad_pagina)
        offset = max(0, (numero_pagina - 1) * limit)
        
        catalogo_dict = await self.repo.get_catalogo(limit, offset,categorias,nombre,id_distribuidor)
        return CatalogoPaginatedResponse(**catalogo_dict)
