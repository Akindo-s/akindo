import uuid
from datetime import datetime

from app.infrastructure.database import DatabaseSession
from app.models.distribuidor import Distribuidor
from app.models.base import TipoUsuario
from app.models.distribuidor import DireccionDistribuidor

from .base import BaseRepository


class DistribuidorRepo(BaseRepository[Distribuidor]):
    table = "distribuidor"

    def _to_aggregate(self, row: dict) -> Distribuidor:
        """Hidrata un Aggregate Distribuidor desde los datos combinados de usuario y distribuidor."""
        usuario_data = row.get("usuario", row) # PostgREST hace join y mete todo en "usuario"
        
        id_obj = uuid.UUID(usuario_data["id"]) if isinstance(usuario_data["id"], str) else usuario_data["id"]
        fecha_obj = datetime.fromisoformat(usuario_data["created_at"]) if "created_at" in usuario_data and usuario_data["created_at"] else None
        
        direcciones_data = row.get("direccion_distribuidor", [])
        if not isinstance(direcciones_data, list):
            direcciones_data = [direcciones_data] if direcciones_data else []
            
        direcciones = []
        for dir_row in direcciones_data:
            direcciones.append(
                DireccionDistribuidor(
                    id=uuid.UUID(dir_row["id"]) if isinstance(dir_row["id"], str) else dir_row["id"],
                    calle=dir_row["calle"],
                    ciudad=dir_row["ciudad"],
                    estado=dir_row["estado"],
                    codigo_postal=dir_row["codigo_postal"],
                    es_predeterminada=dir_row.get("es_predeterminada", False)
                )
            )
        from app.models.categoria import CategoriaDistribuidor
        categorias_data = row.get("categoria_distribuidor", [])
        categorias = [
            CategoriaDistribuidor(
                id=uuid.UUID(c["id"]) if isinstance(c["id"], str) else c["id"],
                nombre=c["nombre"],
                imagen=c.get("imagen")
            ) for c in categorias_data
        ]

        return Distribuidor(
            id=id_obj,
            nombre=usuario_data["nombre"],
            email=usuario_data["email"],
            password_hash=usuario_data["password_hash"],
            telefono=usuario_data.get("telefono"),
            imagen_perfil=usuario_data.get("imagen_perfil"),
            es_verificado=usuario_data.get("es_verificado", False),
            tipo=TipoUsuario(usuario_data.get("tipo", "distribuidor")),
            fecha_creacion=fecha_obj,
            rfc=row.get("rfc"),
            nombre_negocio=row.get("nombre_negocio"),
            direcciones=direcciones,
            imagen_fondo=row.get("imagen_fondo"),
            valoracion_promedio=row.get("valoracion_promedio", 0.0),
            total_valoraciones=row.get("total_valoraciones", 0),
            categorias=categorias,
        )

    async def save(self, aggregate: Distribuidor) -> Distribuidor:
        """
        Guarda o actualiza un Distribuidor.
        Se hace UPSERT primero en 'usuario' y luego en 'distribuidor'.
        """
        
        usuario_dict = {
            "id": str(aggregate.id),
            "nombre": aggregate.nombre,
            "email": aggregate.email,
            "password_hash": aggregate.password_hash,
            "telefono": aggregate.telefono,
            "imagen_perfil": aggregate.imagen_perfil,
            "es_verificado": aggregate.es_verificado,
            "tipo": aggregate.tipo.value,
        }
        if aggregate.fecha_creacion:
            usuario_dict["created_at"] = str(aggregate.fecha_creacion)

        
        distribuidor_dict = {
            "usuario_id": str(aggregate.id),
            "rfc": aggregate.rfc,
            "nombre_negocio": aggregate.nombre_negocio,
            "imagen_fondo": aggregate.imagen_fondo,
            "valoracion_promedio": aggregate.valoracion_promedio,
            "total_valoraciones": aggregate.total_valoraciones,
        }

        
        await self.db.upsert("usuario", usuario_dict)
        
        
        await self.db.upsert("distribuidor", distribuidor_dict)

        # 3. UPSERT direcciones
        for direccion in aggregate.direcciones:
            dir_dict = {
                "id": str(direccion.id),
                "distribuidor_id": str(aggregate.id),
                "calle": direccion.calle,
                "ciudad": direccion.ciudad,
                "estado": direccion.estado,
                "codigo_postal": direccion.codigo_postal,
                "es_predeterminada": direccion.es_predeterminada
            }
            await self.db.upsert("direccion_distribuidor", dir_dict)

        return aggregate

    async def get_by_id(self, id: uuid.UUID) -> Distribuidor | None:
        """Obtiene un Distribuidor reconstruyendo el aggregate desde ambas tablas."""
        results = await self.db.select(
            "distribuidor",
            "*, usuario(*), direccion_distribuidor(*), categoria_distribuidor(*)",
            {"usuario_id": str(id)},
        )
        if not results:
            return None

        return self._to_aggregate(results[0])

    async def set_categorias(self, distribuidor_id: uuid.UUID, categorias: list[uuid.UUID]) -> None:
        await self.db.delete("distribuidor_con_categoria", {"distribuidor_id": str(distribuidor_id)})
        for cat_id in categorias:
            await self.db.insert("distribuidor_con_categoria", {
                "distribuidor_id": str(distribuidor_id),
                "categoria_id": str(cat_id)
            })

    async def obtener_todos_paginados(
        self,
        limite: int,
        offset: int,
        categorias: list[uuid.UUID] | None = None,
        valoracion_min: float | None = None,
        valoracion_max: float | None = None
    ) -> dict:
        """
        Obtiene el catálogo paginado de distribuidores utilizando el RPC mini_catalogo_distribuidores.
        Permite filtrar por categorías y rango de valoración.
        """
        pagina = (offset // limite) + 1 if limite > 0 else 1
        
        # El RPC espera UUID[], pero el driver de supabase a veces requiere pasarlo como lista
        params = {
            "p_pagina": pagina,
            "p_por_pagina": limite,
            "p_categorias": [str(c) for c in categorias] if categorias else None,
            "p_valoracion_min": valoracion_min,
            "p_valoracion_max": valoracion_max
        }
        
        try:
            data = await self.db.rpc("mini_catalogo_distribuidores", params)
            
            if not data:
                return {
                    "total_distribuidores": 0,
                    "total_paginas": 0,
                    "pagina_actual": pagina,
                    "tiene_siguiente": False,
                    "tiene_anterior": False,
                    "distribuidores": []
                }
                
            first = data[0]
            metadata = {
                "total_distribuidores": first.get("total_distribuidores", 0),
                "total_paginas": first.get("total_paginas", 0),
                "pagina_actual": first.get("pagina_actual", pagina),
                "tiene_siguiente": first.get("tiene_siguiente", False),
                "tiene_anterior": first.get("tiene_anterior", False),
            }
            
            distribuidores = []
            for row in data:
                distribuidores.append({
                    "distribuidor_id": row["distribuidor_id"],
                    "nombre_negocio": row["nombre_negocio"],
                    "imagen_fondo": row["imagen_fondo"],
                    "valoracion_promedio": row["valoracion_promedio"],
                    "total_valoraciones": row["total_valoraciones"],
                    "categorias": row.get("categorias", [])
                })
                
            metadata["distribuidores"] = distribuidores
            return metadata
        except Exception as e:
            raise e

    async def get_catalogo(self, distribuidor_id: uuid.UUID, limit: int, offset: int) -> dict:
        """
        Llama al RPC mini_catalogo_productos para obtener el catálogo paginado.
        El RPC de supabase devuelve {total_productos, total_paginas, pagina_actual, tiene_siguiente, tiene_anterior, producto_id, nombre, costo, disponible, unidad}
        """
        # Calcular página
        # El RPC pide la página, no el offset. (pagina empieza en 1) Osea estamos bien birotes pues, cortamos un arbol para quemarlo y despues plantar otro arbol donde mismo...
        pagina = (offset // limit) + 1 if limit > 0 else 1
        
        params = {
            "p_distribuidor_id": str(distribuidor_id),
            "p_pagina": pagina,
            "p_por_pagina": limit
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
                "existencias": row.get("existencias", 0),
                "imagen": row.get("imagen")
            })
            
        metadata["productos"] = productos
        return metadata
        

    async def get_valoraciones(self, distribuidor_id: uuid.UUID) -> list[dict]:
        """Obtiene todas las valoraciones del distribuidor."""
        results = await self.db.select(
            "valoracion",
            "*",
            {"distribuidor_id": str(distribuidor_id)},
        )
        return results
