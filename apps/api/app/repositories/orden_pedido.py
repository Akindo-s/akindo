"""
OrdenPedidoRepo — acceso a datos de orden_pedido + paquete_pedido.
"""

import uuid
from app.models.orden_pedido import OrdenPedido, PaquetePedido, EstadoOrden
from app.repositories.base import BaseRepository


class OrdenPedidoRepo(BaseRepository[OrdenPedido]):
    table = "orden_pedido"

    def _to_aggregate(self, row: dict) -> OrdenPedido:
        paquetes_data = row.get("paquete_pedido", [])
        if not isinstance(paquetes_data, list):
            paquetes_data = [paquetes_data] if paquetes_data else []

        paquetes = [
            PaquetePedido(
                producto_id=uuid.UUID(p["producto_id"]) if isinstance(p["producto_id"], str) else p["producto_id"],
                cantidad=p["cantidad"],
                costo_unitario=float(p["costo_unitario"]),
                medida_snapshot=p.get("medida_snapshot") or {},
            )
            for p in paquetes_data
        ]

        return OrdenPedido(
            id=uuid.UUID(row["id"]) if isinstance(row["id"], str) else row["id"],
            cliente_id=uuid.UUID(row["cliente_id"]) if isinstance(row["cliente_id"], str) else row["cliente_id"],
            distribuidor_id=uuid.UUID(row["distribuidor_id"]) if isinstance(row["distribuidor_id"], str) else row["distribuidor_id"],
            direccion_id=uuid.UUID(row["direccion_id"]) if isinstance(row["direccion_id"], str) else row["direccion_id"],
            estado=EstadoOrden(row["estado"]),
            pre_autorizado=row.get("pre_autorizado", False),
            motivo_rechazo=row.get("motivo_rechazo"),
            paquetes=paquetes,
            created_at=row.get("created_at"),
        )

    async def get_by_id_raw(self, orden_id: uuid.UUID) -> dict | None:
        """Obtiene la orden con sus paquetes y datos de producto."""
        results = await self.db.select(
            self.table,
            "*, paquete_pedido(*, producto(nombre, imagen)), cliente!inner(usuario(nombre, email, imagen_perfil))",
            {"id": str(orden_id)}
        )
        return results[0] if results else None

    async def get_by_id(self, orden_id: uuid.UUID) -> OrdenPedido | None:
        """Obtiene la orden con sus paquetes."""
        results = await self.db.select(
            self.table,
            "*, paquete_pedido(*)",
            {"id": str(orden_id)}
        )
        if not results:
            return None
        return self._to_aggregate(results[0])

    async def save(self, orden: OrdenPedido) -> OrdenPedido:
        """Upsert de la orden y sync de paquetes."""
        orden_dict = {
            "id": str(orden.id),
            "cliente_id": str(orden.cliente_id),
            "distribuidor_id": str(orden.distribuidor_id),
            "direccion_id": str(orden.direccion_id),
            "estado": orden.estado.value,
            "pre_autorizado": orden.pre_autorizado,
            "motivo_rechazo": orden.motivo_rechazo,
        }
        await self.db.upsert(self.table, orden_dict)

        # Sync paquetes: eliminar y reinsertar (son inmutables tras creación)
        await self.db.delete("paquete_pedido", {"orden_id": str(orden.id)})
        for p in orden.paquetes:
            await self.db.insert("paquete_pedido", {
                "orden_id": str(orden.id),
                "producto_id": str(p.producto_id),
                "cantidad": p.cantidad,
                "costo_unitario": p.costo_unitario,
                "medida_snapshot": p.medida_snapshot,
            })
        return orden

    async def listar_por_distribuidor(
        self,
        distribuidor_id: uuid.UUID,
        estado: str | None = None
    ) -> list[dict]:
        """Lista órdenes de un distribuidor con datos del cliente."""
        filters: dict = {"distribuidor_id": str(distribuidor_id)}
        if estado:
            filters["estado"] = estado
        results = await self.db.select(
            self.table,
            "*, paquete_pedido(*, producto(nombre, imagen)), cliente!inner(usuario(nombre))",
            filters,
        )
        return results or []

    async def listar_por_cliente(
        self,
        cliente_id: uuid.UUID,
        estado: str | None = None
    ) -> list[dict]:
        """Lista órdenes de un cliente con datos del distribuidor."""
        filters: dict = {"cliente_id": str(cliente_id)}
        if estado:
            filters["estado"] = estado
        results = await self.db.select(
            self.table,
            "*, paquete_pedido(*, producto(nombre, imagen)), distribuidor!inner(nombre_negocio, usuario!inner(imagen_perfil, es_verificado))",
            filters,
        )
        return results or []

    # Tope de filas de una exportacion, para no armar un libro infinito.
    LIMITE_EXPORTACION = 1000

    # Columnas que necesita la pantalla de ordenes del cliente.
    COLUMNAS_LISTADO = (
        "*, paquete_pedido(*, producto(nombre, imagen)), "
        "distribuidor!inner(nombre_negocio, usuario!inner(imagen_perfil, es_verificado)), "
        # El pedido que nació de la orden (si ya se pagó). Es la relación
        # inversa por `pedido.orden_id`: viene en la misma consulta.
        "pedido(id)"
    )

    @staticmethod
    def _total_de(fila: dict) -> float:
        """Total de una orden: no es columna, sale de sus paquetes."""
        return sum(
            float(p["costo_unitario"]) * int(p["cantidad"])
            for p in (fila.get("paquete_pedido") or [])
        )

    async def _ids_por_texto(self, base: dict, texto: str) -> list[str]:
        """Ids de las ordenes del cliente que coinciden con el texto buscado.

        Busca por el id de la orden (basta con el principio, que es lo que la
        UI muestra) y por nombre de producto. Son dos consultas porque
        PostgREST no puede hacer un `or` entre la tabla y un recurso embebido,
        y el id no se puede filtrar en SQL: es uuid y no admite `ilike`.
        El resultado se pasa despues como filtro `in`, asi el `count` sigue
        siendo exacto.
        """
        termino = texto.strip().lower()

        por_id = await self.db.select(self.table, "id", base)
        ids = {f["id"] for f in por_id if f["id"].lower().startswith(termino)}

        por_producto = await self.db.select(
            self.table,
            "id, paquete_pedido!inner(producto!inner(nombre))",
            base,
            filtros_texto={"paquete_pedido.producto.nombre": texto.strip()},
        )
        ids.update(f["id"] for f in por_producto)
        return list(ids)

    async def _ids_por_monto(
        self, base: dict, monto_min: float | None, monto_max: float | None
    ) -> list[str]:
        """Ids cuyo total cae en el rango. El total sale de los paquetes, no de
        una columna, asi que se calcula aca y se filtra con un `in`."""
        filas = await self.db.select(self.table, "id, paquete_pedido(cantidad, costo_unitario)", base)
        return [
            f["id"]
            for f in filas
            if (monto_min is None or self._total_de(f) >= monto_min)
            and (monto_max is None or self._total_de(f) <= monto_max)
        ]

    async def listar_por_cliente_paginado(
        self,
        cliente_id: uuid.UUID,
        estado: str | None = None,
        limit: int = 10,
        offset: int = 0,
        q: str | None = None,
        distribuidor_id: uuid.UUID | None = None,
        monto_min: float | None = None,
        monto_max: float | None = None,
        descendente: bool = True,
    ) -> tuple[list[dict], int]:
        """Lista ordenes de un cliente con datos del distribuidor, paginadas.

        Devuelve las filas de la pagina y el total de ordenes que cumplen los
        filtros (sin paginar). La metadata de paginacion (total de paginas,
        pagina actual, etc.) la arma el service: aca solo salen filas.
        """
        filters: dict = {"cliente_id": str(cliente_id)}
        if estado:
            filters["estado"] = estado
        if distribuidor_id:
            filters["distribuidor_id"] = str(distribuidor_id)

        # Los filtros que no se pueden expresar en SQL se resuelven antes como
        # una lista de ids; si dos aplican a la vez, se intersectan.
        ids: set[str] | None = None
        if q:
            ids = set(await self._ids_por_texto(filters, q))
        if monto_min is not None or monto_max is not None:
            por_monto = set(await self._ids_por_monto(filters, monto_min, monto_max))
            ids = por_monto if ids is None else (ids & por_monto)
        if ids is not None and not ids:
            return [], 0

        return await self.db.select_con_total(
            self.table,
            self.COLUMNAS_LISTADO,
            filters,
            limit=limit,
            offset=offset,
            ids=None if ids is None else list(ids),
            ordenar_por="created_at",
            descendente=descendente,
        )

    async def listar_todas_por_cliente(
        self,
        cliente_id: uuid.UUID,
        estado: str | None = None,
        q: str | None = None,
        distribuidor_id: uuid.UUID | None = None,
        monto_min: float | None = None,
        monto_max: float | None = None,
        descendente: bool = True,
    ) -> list[dict]:
        """Las ordenes del cliente sin paginar, para exportarlas."""
        filas, _ = await self.listar_por_cliente_paginado(
            cliente_id,
            estado,
            limit=self.LIMITE_EXPORTACION,
            offset=0,
            q=q,
            distribuidor_id=distribuidor_id,
            monto_min=monto_min,
            monto_max=monto_max,
            descendente=descendente,
        )
        return filas
