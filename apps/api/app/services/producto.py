from app.infrastructure.storage import StorageAdapter
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
from app.core.exceptions import NotFoundException, ValidationException

class ProductoService:
    ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp","image/jpg"}
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

    def __init__(self, db: DatabaseSession,storage: StorageAdapter):
        self.db = db
        self.repo = ProductoRepo(db)
        self.__distribuidor_repo = DistribuidorRepo(db)
        self.storage = storage

    async def get_unidades_medida(self) -> list[dict[str, Any]]:
        return await self.repo.get_unidades_medida()

    async def crear_producto(
        self,
        distribuidor_id: uuid.UUID,
        nombre: str,
        costo: float,
        medida: uuid.UUID,
        existencias: int,
        atributos_extra: dict[str, Any] | None,
        categorias: list[uuid.UUID] | None,
        es_borrador: bool = False
    ) -> Producto:
        # Aquí se podría validar si la unidad de medida existe llamando a la BD
        # Por ahora asumimos que el UUID que viene del front existe (ya que lo sacan del catálogo) si todo sale mal, llamen a dios...
        
        producto = Producto.crear(
            distribuidor_id=distribuidor_id,
            nombre=nombre,
            costo=costo,
            medida=medida,
            existencias=existencias,
            atributos_extra=atributos_extra,
        )
        if es_borrador:
            producto.archivar()


        await self.repo.save(producto)

        if categorias:
            await self.repo.set_categorias(producto.id, categorias)

        
        
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
        atributos_extra: dict[str, Any] | None,
        categorias: list[uuid.UUID] | None = None
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
        
        import logging
        lo = logging.getLogger("akindo.producto")
        lo.info(f"{categorias=}")
        if categorias is not None:
            await self.repo.set_categorias(producto.id, categorias)
        
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

    async def subir_imagen_producto(self, product_id: UUID, distribuidor_id: UUID, file: bytes, content_type: str)-> str:
        # Verificar que el producto exista y pertenezca al distribuidor
        producto = await self.repo.get(product_id)
        if not producto or producto.distribuidor_id != distribuidor_id:
            raise NotFoundException("Producto no encontrado o no pertenece a este distribuidor")

        if content_type not in self.ALLOWED_IMAGE_TYPES:
            raise ValidationException(
                f"Tipo de archivo no permitido: {content_type}. Permitidos: {', '.join(self.ALLOWED_IMAGE_TYPES)}"
            )

        if len(file) > self.MAX_IMAGE_SIZE:
            raise ValidationException(
                f"La imagen excede el tamaño máximo de {self.MAX_IMAGE_SIZE // (1024 * 1024)} MB"
            )

        ext = content_type.split("/")[-1]  # Obtener la extensión del tipo MIME
        if ext == "jpeg":
            ext = "jpg"

        bucket = "productos"
        path = f"{distribuidor_id}/{product_id}/principal.{ext}"

        url: str = await self.storage.upload(bucket, path, file, content_type)
        producto.imagen = url
        await self.repo.save(producto)
        return url

    async def subir_imagen_extra_producto(self, product_id: UUID, distribuidor_id: UUID, file: bytes, content_type: str)->str:
        # Verificar que el producto exista y pertenezca al distribuidor
        producto = await self.repo.get(product_id)
        if not producto or producto.distribuidor_id != distribuidor_id:
            raise NotFoundException("Producto no encontrado o no pertenece a este distribuidor")

        if content_type not in self.ALLOWED_IMAGE_TYPES:
            raise ValidationException(
                f"Tipo de archivo no permitido: {content_type}. Permitidos: {', '.join(self.ALLOWED_IMAGE_TYPES)}"
            )

        if len(file) > self.MAX_IMAGE_SIZE:
            raise ValidationException(
                f"La imagen excede el tamaño máximo de {self.MAX_IMAGE_SIZE // (1024 * 1024)} MB"
            )

        ext = content_type.split("/")[-1]
        if ext == "jpeg":
            ext = "jpg"

        bucket = "productos"
        path = f"{distribuidor_id}/{product_id}/extra.{ext}"

        url: str = await self.storage.upload(bucket, path, file, content_type)
        return url
    
    async def obtener_producto(self,producto_id:UUID,distribuidor_id:UUID)->Producto:
        producto = await self.repo.get(producto_id)
        if not producto or producto.distribuidor_id != distribuidor_id:
            raise NotFoundException("Producto no encontrado")
        return producto

    async def obtener_producto_publico(self, producto_id: UUID) -> Producto:
        """Obtiene un producto por ID sin verificar propietario. Solo para lectura pública."""
        producto = await self.repo.get(producto_id)
        if not producto or not producto.disponible:
            raise NotFoundException("Producto no encontrado")
        return producto