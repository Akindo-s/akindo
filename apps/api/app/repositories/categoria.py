"""
Repositorios para el dominio de categorías (Producto y Distribuidor).
"""

import uuid
from app.infrastructure.database import DatabaseSession
from app.models.categoria import CategoriaProducto, CategoriaDistribuidor

class CategoriaProductoRepo:
    def __init__(self, db: DatabaseSession):
        self.db = db
        self.table = "categoria_producto"

    async def get_all(self) -> list[CategoriaProducto]:
        results = await self.db.select(self.table)
        return [self._to_aggregate(row) for row in results]

    async def get_by_id(self, id: uuid.UUID) -> CategoriaProducto | None:
        results = await self.db.select(self.table, "*", {"id": str(id)})
        if not results:
            return None
        return self._to_aggregate(results[0])

    async def save(self, aggregate: CategoriaProducto) -> CategoriaProducto:
        data = aggregate.to_dict()
        await self.db.upsert(self.table, data)
        return aggregate

    async def update(self, aggregate: CategoriaProducto) -> CategoriaProducto:
        data = aggregate.to_dict()
        await self.db.update(self.table, data, {"id": str(aggregate.id)})
        return aggregate

    async def delete(self, id: uuid.UUID) -> None:
        await self.db.delete(self.table, {"id": str(id)})

    async def get_featured(self, cliente_id: uuid.UUID | None = None, limite: int = 10) -> list[dict]:
        params = {
            "p_cliente_id": str(cliente_id) if cliente_id else None,
            "p_limite": limite
        }
        return await self.db.rpc("get_categorias_destacadas", params)


    def _to_aggregate(self, row: dict) -> CategoriaProducto:
        id_obj = uuid.UUID(row["id"]) if isinstance(row["id"], str) else row["id"]
        return CategoriaProducto(
            id=id_obj,
            nombre=row["nombre"],
            imagen=row.get("imagen")
        )

class CategoriaDistribuidorRepo:
    def __init__(self, db: DatabaseSession):
        self.db = db
        self.table = "categoria_distribuidor"

    async def get_all(self) -> list[CategoriaDistribuidor]:
        results = await self.db.select(self.table)
        return [self._to_aggregate(row) for row in results]

    async def get_by_id(self, id: uuid.UUID) -> CategoriaDistribuidor | None:
        results = await self.db.select(self.table, "*", {"id": str(id)})
        if not results:
            return None
        return self._to_aggregate(results[0])

    async def save(self, aggregate: CategoriaDistribuidor) -> CategoriaDistribuidor:
        data = aggregate.to_dict()
        await self.db.upsert(self.table, data)
        return aggregate

    async def update(self, aggregate: CategoriaDistribuidor) -> CategoriaDistribuidor:
        data = aggregate.to_dict()
        await self.db.update(self.table, data, {"id": str(aggregate.id)})
        return aggregate

    async def delete(self, id: uuid.UUID) -> None:
        await self.db.delete(self.table, {"id": str(id)})

    def _to_aggregate(self, row: dict) -> CategoriaDistribuidor:
        id_obj = uuid.UUID(row["id"]) if isinstance(row["id"], str) else row["id"]
        return CategoriaDistribuidor(
            id=id_obj,
            nombre=row["nombre"],
            imagen=row.get("imagen")
        )
