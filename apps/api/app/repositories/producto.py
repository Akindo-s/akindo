import uuid
from typing import Any

from app.models.producto import Producto
from app.repositories.base import BaseRepository

class ProductoRepo(BaseRepository[Producto]):
    table = "producto"

    def _to_aggregate(self, row: dict) -> Producto:
        id_obj = uuid.UUID(row["id"]) if isinstance(row["id"], str) else row["id"]
        dist_obj = uuid.UUID(row["distribuidor_id"]) if isinstance(row["distribuidor_id"], str) else row["distribuidor_id"]
        medida_obj = uuid.UUID(row["medida"]) if isinstance(row["medida"], str) else row["medida"]
        
        return Producto(
            id=id_obj,
            distribuidor_id=dist_obj,
            nombre=row["nombre"],
            costo=row["costo"],
            medida=medida_obj,
            existencias=row["existencias"],
            disponible=row["disponible"],
            atributos_extra=row.get("atributos_extra")
        )

    async def save(self, aggregate: Producto) -> Producto:
        data = aggregate.to_dict()
        await self.db.upsert(self.table, data)
        return aggregate

    async def get_unidades_medida(self) -> list[dict[str, Any]]:
        """Obtiene todas las unidades de medida disponibles."""
        return await self.db.select("unidad_medida_producto", "*")
