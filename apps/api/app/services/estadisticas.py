import uuid
from typing import Any

from app.infrastructure.database import DatabaseSession
from app.schemas.estadisticas import TipoEstadistica, EstadisticasDistribuidorResponse

class EstadisticasService:
    """
    Este es el peor servicio que hemos escrito, y el mas importante...
    Tenemos que delegar esto a funciones de supabse para que funcione, de tal forma que esta clase
    solo se encarga de recibir y dar formato a los resultados dados por la api de supabase.
    """
    def __init__(self, db: DatabaseSession):
        self.db = db

    async def _get_total_productos(self, distribuidor_id: uuid.UUID) -> int:
        # Puesto que supabase_py no tiene un count directo fácil sin hack, podemos traer id
        results = await self.db.select("producto", "id", {"distribuidor_id": str(distribuidor_id), "disponible": "eq.true"})
        return len(results) if results else 0

    async def _get_productos_bajo_stock(self, distribuidor_id: uuid.UUID, umbral: int = 10) -> list[dict[str, Any]]:
        # producto?distribuidor_id=eq.X&existencias=lt.umbral
        """
        results = await self.db._client.table("producto") \
            .select("id, nombre, existencias, costo") \
            .eq("distribuidor_id", str(distribuidor_id)) \
            .eq("disponible", True) \
            .lt("existencias", umbral) \
            .order("existencias") \
            .limit(10) \
            .execute()
        return results.data if results.data else []
        """
        return []

    async def _get_productos_mas_vendidos(self, distribuidor_id: uuid.UUID) -> list[dict[str, Any]]:
        """
        TODO : Esto se tiene que hacer con una rpc ya que posgresql lo manejaria mejor
        """
        ...

    async def obtener_estadistica(self, distribuidor_id: uuid.UUID, tipo: TipoEstadistica) -> EstadisticasDistribuidorResponse:
        resp = EstadisticasDistribuidorResponse()
        
        if tipo == TipoEstadistica.TOTAL_PRODUCTOS:
            resp.total_productos = await self._get_total_productos(distribuidor_id)
            
        elif tipo == TipoEstadistica.PRODUCTOS_BAJO_STOCK:
            resp.productos_bajo_stock = await self._get_productos_bajo_stock(distribuidor_id)
            
        elif tipo == TipoEstadistica.PRODUCTOS_MAS_VENDIDOS:
            resp.productos_mas_vendidos = await self._get_productos_mas_vendidos(distribuidor_id)
            
        return resp
