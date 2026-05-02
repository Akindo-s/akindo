from uuid import UUID
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

    async def get_catalogo(self,limit:int, offset:int,categorias:list[UUID]|None=None,nombre:str|None = None,id_distribuidor:UUID|None = None)->dict:
        pagina = (offset // limit) + 1 if limit > 0 else 1
        
        params = {
            "p_distribuidor_id": str(id_distribuidor) if id_distribuidor else None,
            "p_pagina": pagina,
            "p_por_pagina": limit,
            "p_categorias": categorias,
            'p_nombre':nombre
        }
        
        
        
        data = await self.db.rpc("mini_catalogo_productos", params)
        
        if not data:
            return {
                "total_productos": 0,
                "total_paginas": 0,
                "pagina_actual": pagina,
                "tiene_siguiente": False,
                "tiene_anterior": False,
                "productos": []
            }
            
        # Extraer metadata de paginación de la primera fila
        first = data[0]
        metadata = {
            "total_productos": first.get("total_productos", 0),
            "total_paginas": first.get("total_paginas", 0),
            "pagina_actual": first.get("pagina_actual", pagina),
            "tiene_siguiente": first.get("tiene_siguiente", False),
            "tiene_anterior": first.get("tiene_anterior", False),
        }
        
        # Limpiar los campos de cada producto omitiendo los de paginación
        productos = []
        for row in data:
            productos.append({
                "producto_id": row["producto_id"],
                "nombre": row["nombre"],
                "costo": row["costo"],
                "disponible": row["disponible"],
                "unidad": row["unidad"]
            })
            
        metadata["productos"] = productos
        return metadata
