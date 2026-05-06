from uuid import UUID
import uuid
from typing import Any

from app.models.producto import Producto, Medida
from app.repositories.base import BaseRepository

class ProductoRepo(BaseRepository[Producto]):
    table = "producto"

    def _to_aggregate(self, row: dict) -> Producto:
        id_obj = uuid.UUID(row["id"]) if isinstance(row["id"], str) else row["id"]
        dist_obj = uuid.UUID(row["distribuidor_id"]) if isinstance(row["distribuidor_id"], str) else row["distribuidor_id"]
        
        medida_data = row.get("unidad_medida_producto")
        if medida_data:
            medida_obj = Medida(
                id=uuid.UUID(medida_data["id"]) if isinstance(medida_data["id"], str) else medida_data["id"],
                unidad=medida_data["unidad"],
                nombre=medida_data["nombre"]
            )
        else:
            # Fallback por si no viene el join (aunque debería)
            medida_id = uuid.UUID(row["medida"]) if isinstance(row["medida"], str) else row["medida"]
            medida_obj = Medida(id=medida_id, unidad="N/A", nombre="N/A")

        from app.models.categoria import CategoriaProducto
        categorias_data = row.get("categoria_producto", [])
        categorias = [
            CategoriaProducto(
                id=uuid.UUID(c["id"]) if isinstance(c["id"], str) else c["id"],
                nombre=c["nombre"],
                imagen=c.get("imagen")
            ) for c in categorias_data
        ]

        return Producto(
            id=id_obj,
            distribuidor_id=dist_obj,
            nombre=row["nombre"],
            costo=row["costo"],
            medida=medida_obj,
            existencias=row["existencias"],
            disponible=row["disponible"],
            atributos_extra=row.get("atributos_extra"),
            imagen=row.get("imagen"),
            categorias=categorias,
        )

    async def save(self, aggregate: Producto) -> Producto:
        data = aggregate.to_dict()
        data.pop('categorias')
        # Mapeamos el Value Object de vuelta al ID para la base de datos
        if isinstance(data["medida"], dict):
            data["medida"] = data["medida"]["id"]
            
        await self.db.upsert(self.table, data)
        return aggregate

    async def get_unidades_medida(self) -> list[dict[str, Any]]:
        """Obtiene todas las unidades de medida disponibles."""
        return await self.db.select("unidad_medida_producto", "*")

    async def get_unidad_medida_por_id(self, id: UUID) -> Medida | None:
        """Obtiene una unidad de medida por su ID."""
        result = await self.db.select("unidad_medida_producto", "*", filters={"id": str(id)})
        if not result:
            return None
        row = result[0]
        return Medida(
            id=uuid.UUID(row["id"]) if isinstance(row["id"], str) else row["id"],
            unidad=row["unidad"],
            nombre=row["nombre"]
        )
    
    async def get(self, id: UUID) -> Producto | None:
        result = await self.db.select(self.table, "*, categoria_producto(*), unidad_medida_producto(*)", filters={"id": str(id)})
        if not result:
            return None
        return self._to_aggregate(result[0])

    async def set_categorias(self, producto_id: UUID, categorias: list[UUID]) -> None:
        await self.db.delete("producto_con_categoria", {"producto_id": str(producto_id)})
        for cat_id in categorias:
            await self.db.insert("producto_con_categoria", {
                "producto_id": str(producto_id),
                "categoria_id": str(cat_id)
            })

    async def get_catalogo(self,limit:int, offset:int,categorias:list[UUID]|None=None,nombre:str|None = None,id_distribuidor:UUID|None = None)->dict:
        pagina = (offset // limit) + 1 if limit > 0 else 1
        
        params = {
            "p_distribuidor_id": str(id_distribuidor) if id_distribuidor else None,
            "p_pagina": pagina,
            "p_por_pagina": limit,
            "p_categorias": [str(c) for c in categorias] if categorias else None,
            'p_nombre':nombre,
            'p_disponible':True
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
                "unidad": row["unidad"],
                'existencias': row["existencias"],
                'imagen': row.get("imagen")
            })
            
        metadata["productos"] = productos
        return metadata
