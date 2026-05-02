import uuid
from typing import Any

from app.models.carrito import Carrito, CarritoItem
from app.repositories.base import BaseRepository
from app.events.bus import event_bus
from app.events.carrito_eventos import ItemCarritoInvalidado

class CarritoRepo(BaseRepository[Carrito]):
    table = "carrito"

    def _to_aggregate(self, row: dict) -> Carrito:
        id_obj = uuid.UUID(row["id"]) if isinstance(row["id"], str) else row["id"]
        cliente_id = uuid.UUID(row["cliente_id"]) if isinstance(row["cliente_id"], str) else row["cliente_id"]
        distribuidor_id = uuid.UUID(row["distribuidor_id"]) if isinstance(row["distribuidor_id"], str) else row["distribuidor_id"]
        
        items_data = row.get("carrito_item", [])
        if not isinstance(items_data, list):
            items_data = [items_data] if items_data else []
            
        items = []
        for item_row in items_data:
            producto_data = item_row.get("producto", {})
            # Extraer existencias y disponibilidad del producto real
            # Si el join falló o no viene, asumimos un default seguro o 0
            disponible = producto_data.get("disponible", True)
            existencias = producto_data.get("existencias", 0)
            

            
            """
            TODO :creo que esto es un edge case en el cual podria ocurrir un error, la logica puede que este mal, hay que probarlo
                1. 0 existencias (en teoria no llegaria aqui, ya que el metodo get_* lo eliminaria del carrito, pero... que pasa si no?)
            """

            # Si no está disponible, el máximo es 0
            cantidad_maxima = existencias if disponible else 0
            cantidad_minima = 1 # Por defecto 1 como mínimo

            items.append(
                CarritoItem(
                    producto_id=uuid.UUID(item_row["producto_id"]) if isinstance(item_row["producto_id"], str) else item_row["producto_id"],
                    cantidad=item_row["cantidad"],
                    cantidad_minima=cantidad_minima,
                    cantidad_maxima=cantidad_maxima
                )
            )

        return Carrito(
            id=id_obj,
            cliente_id=cliente_id,
            distribuidor_id=distribuidor_id,
            items=items,
            fecha_actualizacion=row.get("fecha_actualizacion")
        )

    async def get_by_cliente_and_distribuidor(self, cliente_id: uuid.UUID, distribuidor_id: uuid.UUID) -> Carrito | None:
        """Obtiene un carrito por cliente y distribuidor."""
        results = await self.db.select(
            self.table,
            "*, carrito_item(*, producto(existencias, disponible))",
            {"cliente_id": str(cliente_id), "distribuidor_id": str(distribuidor_id)}
        )
        if not results:
            return None
            
        row = results[0]
        items_data = row.get("carrito_item", [])
        if not isinstance(items_data, list):
            items_data = [items_data] if items_data else []
        
        # Este check es importante hacerlo aqui porque puede cambiar el estado del carrito por factores externos (cambios en el producto)
        valid_items = []
        for item_row in items_data:
            producto_data = item_row.get("producto", {})
            disponible = producto_data.get("disponible", True)
            existencias = producto_data.get("existencias", 0)
            
            if not disponible or existencias == 0:
                # El producto ya no está disponible o no tiene stock, eliminamos el item
                await self.db.delete("carrito_item", {
                    "carrito_id": str(row["id"]), 
                    "producto_id": str(item_row["producto_id"])
                })
                await event_bus.publish(ItemCarritoInvalidado(
                    carrito_id=uuid.UUID(row["id"]) if isinstance(row["id"], str) else row["id"],
                    cliente_id=uuid.UUID(row["cliente_id"]) if isinstance(row["cliente_id"], str) else row["cliente_id"],
                    distribuidor_id=uuid.UUID(row["distribuidor_id"]) if isinstance(row["distribuidor_id"], str) else row["distribuidor_id"],
                    producto_id=uuid.UUID(item_row["producto_id"]) if isinstance(item_row["producto_id"], str) else item_row["producto_id"],
                    motivo="Producto no disponible o sin existencias"
                ))
            elif item_row["cantidad"] > existencias:
                # Ajustamos la cantidad al máximo disponible
                    # Aunque esto no deberia de ser posible si el cliente lo manejara bien, no puedes confiar en el cliente, por eso se hace ese ajuste aqui
                await self.db.update(
                    "carrito_item", 
                    {"cantidad": existencias}, 
                    {"carrito_id": str(row["id"]), "producto_id": str(item_row["producto_id"])}
                )
                item_row["cantidad"] = existencias
                valid_items.append(item_row)
            else:
                valid_items.append(item_row)
                
        row["carrito_item"] = valid_items
        return self._to_aggregate(row)

    async def save(self, aggregate: Carrito) -> Carrito:
        # Upsert de la tabla carrito 
            # Esto deberia de poder cambiar?? no me suena eh eh ehhhhh.
        carrito_dict = {
            "id": str(aggregate.id),
            "cliente_id": str(aggregate.cliente_id),
            "distribuidor_id": str(aggregate.distribuidor_id)
        }
        await self.db.upsert(self.table, carrito_dict)

        # Sync de items
        # 1. Obtener los items actuales en la BD
        current_items = await self.db.select("carrito_item", "producto_id", {"carrito_id": str(aggregate.id)})
        current_product_ids = {item["producto_id"] for item in current_items} 
        
        # 2. Identificar qué productos están en el aggregate
        aggregate_product_ids = {str(item.producto_id) for item in aggregate.items}
        
        # 3. Eliminar los que ya no están en el aggregate
        to_delete = current_product_ids - aggregate_product_ids # Diferencia de conjuntos, por eso funciona :>
        for prod_id in to_delete:
            await self.db.delete("carrito_item", {"carrito_id": str(aggregate.id), "producto_id": prod_id})
            
        # 4. Upsert de los items actuales
        for item in aggregate.items:
            item_dict = {
                "carrito_id": str(aggregate.id),
                "producto_id": str(item.producto_id),
                "cantidad": item.cantidad
            }
            await self.db.upsert("carrito_item", item_dict)

        return aggregate
