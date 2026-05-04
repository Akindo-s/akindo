"""
Lógica de negocio para las categorías de Producto y Distribuidor.
"""

import uuid
from app.infrastructure.database import DatabaseSession
from app.infrastructure.storage import StorageAdapter
from app.models.categoria import CategoriaProducto, CategoriaDistribuidor
from app.repositories.categoria import CategoriaProductoRepo, CategoriaDistribuidorRepo
from app.schemas.categoria import CategoriaBatchCreate, CategoriaBatchResponse, CategoriaBatchError
from app.core.exceptions import NotFoundException, ValidationException

class CategoriaProductoService:
    ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

    def __init__(self, db: DatabaseSession, storage: StorageAdapter):
        self.repo = CategoriaProductoRepo(db)
        self.storage = storage

    async def get_all(self) -> list[CategoriaProducto]:
        return await self.repo.get_all()

    async def get_by_id(self, id: uuid.UUID) -> CategoriaProducto:
        categoria = await self.repo.get_by_id(id)
        if not categoria:
            raise NotFoundException("Categoría de producto no encontrada")
        return categoria

    async def create(self, nombre: str, file_data: bytes | None = None, content_type: str | None = None) -> CategoriaProducto:
        categoria = CategoriaProducto.crear(nombre=nombre)
        
        guardada = await self.repo.save(categoria)
        
        if file_data and content_type:
            guardada = await self._subir_imagen(guardada, file_data, content_type)
        
        return guardada

    async def create_batch(self, data: CategoriaBatchCreate) -> CategoriaBatchResponse:
        exitosas = []
        fallidas = []
        for cat_data in data.categorias:
            try:
                categoria = CategoriaProducto.crear(nombre=cat_data.nombre, imagen=cat_data.imagen)
                guardada = await self.repo.save(categoria)
                exitosas.append(guardada)
            except Exception as e:
                fallidas.append(CategoriaBatchError(nombre=cat_data.nombre, razon=str(e)))
        
        return CategoriaBatchResponse(
            categorias=[{ "id": c.id, "nombre": c.nombre, "imagen": c.imagen } for c in exitosas],
            categorias_fallidas=fallidas
        )

    async def update(self, id: uuid.UUID, nombre: str | None = None, file_data: bytes | None = None, content_type: str | None = None) -> CategoriaProducto:
        categoria = await self.get_by_id(id)
        if nombre is not None:
            categoria.nombre = nombre
        
        if file_data and content_type:
            categoria = await self._subir_imagen(categoria, file_data, content_type)
            
        categoria.check()
        return await self.repo.save(categoria)

    async def delete(self, id: uuid.UUID) -> None:
        categoria = await self.get_by_id(id)
        # Opcionalmente se puede borrar la imagen de storage
        await self.repo.delete(categoria.id)

    async def _subir_imagen(self, categoria: CategoriaProducto, file_data: bytes, content_type: str) -> CategoriaProducto:
        if content_type not in self.ALLOWED_IMAGE_TYPES:
            raise ValidationException(f"Tipo de archivo no permitido: {content_type}. Permitidos: {', '.join(self.ALLOWED_IMAGE_TYPES)}")
        
        if len(file_data) > self.MAX_IMAGE_SIZE:
            raise ValidationException(f"La imagen excede el tamaño máximo de {self.MAX_IMAGE_SIZE // (1024 * 1024)} MB")
            
        ext = content_type.split("/")[-1]
        if ext == "jpeg": ext = "jpg"
        
        path = f"productos/{categoria.id}/principal.{ext}"
        url = await self.storage.upload("categorias", path, file_data, content_type)
        categoria.imagen = url
        return await self.repo.save(categoria)


class CategoriaDistribuidorService:
    ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

    def __init__(self, db: DatabaseSession, storage: StorageAdapter):
        self.repo = CategoriaDistribuidorRepo(db)
        self.storage = storage

    async def get_all(self) -> list[CategoriaDistribuidor]:
        return await self.repo.get_all()

    async def get_by_id(self, id: uuid.UUID) -> CategoriaDistribuidor:
        categoria = await self.repo.get_by_id(id)
        if not categoria:
            raise NotFoundException("Categoría de distribuidor no encontrada")
        return categoria

    async def create(self, nombre: str, file_data: bytes | None = None, content_type: str | None = None) -> CategoriaDistribuidor:
        categoria = CategoriaDistribuidor.crear(nombre=nombre)
        guardada = await self.repo.save(categoria)
        
        if file_data and content_type:
            guardada = await self._subir_imagen(guardada, file_data, content_type)
            
        return guardada

    async def create_batch(self, data: CategoriaBatchCreate) -> CategoriaBatchResponse:
        exitosas = []
        fallidas = []
        for cat_data in data.categorias:
            try:
                categoria = CategoriaDistribuidor.crear(nombre=cat_data.nombre, imagen=cat_data.imagen)
                guardada = await self.repo.save(categoria)
                exitosas.append(guardada)
            except Exception as e:
                fallidas.append(CategoriaBatchError(nombre=cat_data.nombre, razon=str(e)))
        
        return CategoriaBatchResponse(
            categorias=[{ "id": c.id, "nombre": c.nombre, "imagen": c.imagen } for c in exitosas],
            categorias_fallidas=fallidas
        )

    async def update(self, id: uuid.UUID, nombre: str | None = None, file_data: bytes | None = None, content_type: str | None = None) -> CategoriaDistribuidor:
        categoria = await self.get_by_id(id)
        if nombre is not None:
            categoria.nombre = nombre
        
        if file_data and content_type:
            categoria = await self._subir_imagen(categoria, file_data, content_type)
            
        categoria.check()
        return await self.repo.save(categoria)

    async def delete(self, id: uuid.UUID) -> None:
        categoria = await self.get_by_id(id)
        await self.repo.delete(categoria.id)

    async def _subir_imagen(self, categoria: CategoriaDistribuidor, file_data: bytes, content_type: str) -> CategoriaDistribuidor:
        if content_type not in self.ALLOWED_IMAGE_TYPES:
            raise ValidationException(f"Tipo de archivo no permitido: {content_type}. Permitidos: {', '.join(self.ALLOWED_IMAGE_TYPES)}")
        
        if len(file_data) > self.MAX_IMAGE_SIZE:
            raise ValidationException(f"La imagen excede el tamaño máximo de {self.MAX_IMAGE_SIZE // (1024 * 1024)} MB")
            
        ext = content_type.split("/")[-1]
        if ext == "jpeg": ext = "jpg"
        
        path = f"distribuidores/{categoria.id}/principal.{ext}"
        url = await self.storage.upload("categorias", path, file_data, content_type)
        
        categoria.imagen = url
        return await self.repo.update(categoria)
