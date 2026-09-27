"""
PedidoRepo — acceso a datos de pedido + pedido_actualizacion.
"""

import uuid
from collections import Counter
from app.models.pedido import Pedido, EstadoPedido
from app.repositories.base import BaseRepository


class PedidoRepo(BaseRepository[Pedido]):
    table = "pedido"

    def _to_aggregate(self, row: dict) -> Pedido:
        return Pedido(
            id=uuid.UUID(row["id"]) if isinstance(row["id"], str) else row["id"],
            orden_id=uuid.UUID(row["orden_id"]) if isinstance(row["orden_id"], str) else row["orden_id"],
            estado=EstadoPedido(row["estado"]),
            total=float(row["total"]),
            comision_servicio=float(row.get("comision_servicio", 0.0)),
            confirmado_at=row.get("confirmado_at"),
            entregado_at=row.get("entregado_at"),
        )

    async def get_by_id(self, pedido_id: uuid.UUID) -> Pedido | None:
        results = await self.db.select(self.table, "*", {"id": str(pedido_id)})
        if not results:
            return None
        return self._to_aggregate(results[0])

    async def get_by_orden(self, orden_id: uuid.UUID) -> Pedido | None:
        results = await self.db.select(self.table, "*", {"orden_id": str(orden_id)})
        if not results:
            return None
        return self._to_aggregate(results[0])

    async def save(self, pedido: Pedido) -> Pedido:
        pedido_dict = {
            "id": str(pedido.id),
            "orden_id": str(pedido.orden_id),
            "estado": pedido.estado.value,
            "total": pedido.total,
            "comision_servicio": pedido.comision_servicio,
        }
        if pedido.entregado_at:
            pedido_dict["entregado_at"] = pedido.entregado_at.isoformat()
        await self.db.upsert(self.table, pedido_dict)
        return pedido

    async def agregar_actualizacion(
        self,
        pedido_id: uuid.UUID,
        estado_nuevo: str,
        descripcion: str | None,
    ) -> dict:
        """Inserta un entry en el timeline de actualizaciones."""
        return await self.db.insert("pedido_actualizacion", {
            "pedido_id": str(pedido_id),
            "estado_nuevo": estado_nuevo,
            "descripcion": descripcion,
        })

    async def get_actualizaciones(self, pedido_id: uuid.UUID) -> list[dict]:
        results = await self.db.select(
            "pedido_actualizacion", "*", {"pedido_id": str(pedido_id)}
        )
        return results or []

    async def crear_valoracion(
        self,
        pedido_id: uuid.UUID,
        cliente_id: uuid.UUID,
        distribuidor_id: uuid.UUID,
        puntuacion: int,
        comentario: str | None,
    ) -> dict:
        """Inserta una valoración de un pedido."""
        return await self.db.insert("valoracion", {
            "pedido_id": str(pedido_id),
            "cliente_id": str(cliente_id),
            "distribuidor_id": str(distribuidor_id),
            "puntuacion": puntuacion,
            "comentario": comentario,
        })

    async def listar_por_distribuidor(
        self,
        distribuidor_id: uuid.UUID,
        estado: str | None = None,
    ) -> list[dict]:
        """Lista pedidos de un distribuidor con datos de la orden."""
        results = await self.db.select(
            self.table,
            "*, orden_pedido!inner(cliente_id, distribuidor_id, paquete_pedido(*, producto(nombre, imagen)), cliente!inner(usuario(nombre)), distribuidor!inner(nombre_negocio, usuario!inner(imagen_perfil, es_verificado)))",
            {"orden_pedido.distribuidor_id": str(distribuidor_id)},
        )
        if estado:
            results = [r for r in (results or []) if r.get("estado") == estado]
        return results or []

    async def listar_por_cliente(
        self,
        cliente_id: uuid.UUID,
        estado: str | None = None,
    ) -> list[dict]:
        """Lista pedidos de un cliente con datos de la orden."""
        results = await self.db.select(
            self.table,
            "*, orden_pedido!inner(cliente_id, distribuidor_id, paquete_pedido(*, producto(nombre, imagen)), cliente!inner(usuario(nombre)), distribuidor!inner(nombre_negocio, usuario!inner(imagen_perfil, es_verificado)))",
            {"orden_pedido.cliente_id": str(cliente_id)},
        )
        if estado:
            results = [r for r in (results or []) if r.get("estado") == estado]
        return results or []

    # ── Listado paginado del cliente ───────────────────────────────

    # Tope de filas de una exportacion, para no armar un libro infinito.
    LIMITE_EXPORTACION = 1000

    # Lo que necesita la pantalla de pedidos del cliente. Ademas de la orden
    # (de donde salen distribuidor, productos y direccion), viene el timeline:
    # es lo que pinta la barra de progreso del envio con fechas reales.
    COLUMNAS_LISTADO = (
        "*, "
        "pedido_actualizacion(estado_nuevo, descripcion, creado_at), "
        "orden_pedido!inner(cliente_id, distribuidor_id, "
        "paquete_pedido(*, producto(nombre, imagen)), "
        "direccion_cliente(ciudad, estado), "
        "cliente!inner(usuario(nombre)), "
        "distribuidor!inner(nombre_negocio, usuario!inner(imagen_perfil, es_verificado)))"
    )

    async def _ids_por_texto(self, base: dict, texto: str) -> list[str]:
        """Ids de los pedidos del cliente que coinciden con el texto buscado.

        Busca por el id del pedido (basta con el principio, que es lo que la
        UI muestra) y por nombre de producto. Son dos consultas porque
        PostgREST no puede hacer un `or` entre la tabla y un recurso embebido,
        y el id tampoco se puede filtrar en SQL: es uuid y no admite `ilike`.
        El resultado se pasa despues como filtro `in`, asi el `count` sigue
        siendo exacto.
        """
        termino = texto.strip().lower()

        por_id = await self.db.select(
            self.table, "id, orden_pedido!inner(cliente_id)", base
        )
        ids = {f["id"] for f in por_id if f["id"].lower().startswith(termino)}

        por_producto = await self.db.select(
            self.table,
            "id, orden_pedido!inner(cliente_id, paquete_pedido!inner(producto!inner(nombre)))",
            base,
            filtros_texto={"orden_pedido.paquete_pedido.producto.nombre": texto.strip()},
        )
        ids.update(f["id"] for f in por_producto)
        return list(ids)

    async def listar_por_cliente_paginado(
        self,
        cliente_id: uuid.UUID,
        estado: str | None = None,
        limit: int = 10,
        offset: int = 0,
        q: str | None = None,
        distribuidor_id: uuid.UUID | None = None,
        fecha_desde: str | None = None,
        fecha_hasta: str | None = None,
        descendente: bool = True,
    ) -> tuple[list[dict], int]:
        """Lista pedidos de un cliente, paginados, con el total sin paginar.

        El cliente y el distribuidor no son columnas de `pedido`: cuelgan de la
        orden, asi que se filtran por el recurso embebido `orden_pedido!inner`.
        La fecha del pedido es `confirmado_at` (la tabla no tiene `created_at`),
        y es tambien la columna por la que se ordena.
        """
        filters: dict = {"orden_pedido.cliente_id": str(cliente_id)}
        if estado:
            filters["estado"] = estado
        if distribuidor_id:
            filters["orden_pedido.distribuidor_id"] = str(distribuidor_id)

        # La busqueda por texto no se puede expresar en SQL, asi que se
        # resuelve antes como una lista de ids y se aplica con un `in`.
        ids: list[str] | None = None
        if q:
            ids = await self._ids_por_texto(filters, q)
            if not ids:
                return [], 0

        return await self.db.select_con_total(
            self.table,
            self.COLUMNAS_LISTADO,
            filters,
            limit=limit,
            offset=offset,
            ids=ids,
            rangos={"confirmado_at": (fecha_desde, fecha_hasta)},
            ordenar_por="confirmado_at",
            descendente=descendente,
        )

    async def contar_por_estado(
        self,
        cliente_id: uuid.UUID,
        q: str | None = None,
        distribuidor_id: uuid.UUID | None = None,
        fecha_desde: str | None = None,
        fecha_hasta: str | None = None,
    ) -> dict[str, int]:
        """Cuántos pedidos hay en cada estado, con el resto de los filtros.

        El estado **no** se filtra a propósito: esto alimenta los contadores de
        las pestañas, y una pestaña tiene que decir cuántos hay en ese estado
        aunque ahora mismo estés viendo otro.

        Es una sola consulta que trae `id` y `estado` y cuenta en Python. Con
        `count="exact"` harían falta cuatro (una por estado) y cada una
        repetiría la búsqueda por texto.
        """
        filters: dict = {"orden_pedido.cliente_id": str(cliente_id)}
        if distribuidor_id:
            filters["orden_pedido.distribuidor_id"] = str(distribuidor_id)

        ids: list[str] | None = None
        if q:
            ids = await self._ids_por_texto(filters, q)
            if not ids:
                return {}

        filas = await self.db.select(
            self.table,
            "id, estado, orden_pedido!inner(cliente_id)",
            filters,
            ids=ids,
            rangos={"confirmado_at": (fecha_desde, fecha_hasta)},
            limit=self.LIMITE_EXPORTACION,
        )
        return Counter(f["estado"] for f in filas)

    async def listar_todos_por_cliente(
        self,
        cliente_id: uuid.UUID,
        estado: str | None = None,
        q: str | None = None,
        distribuidor_id: uuid.UUID | None = None,
        fecha_desde: str | None = None,
        fecha_hasta: str | None = None,
        descendente: bool = True,
    ) -> list[dict]:
        """Los pedidos del cliente sin paginar, para exportarlos."""
        filas, _ = await self.listar_por_cliente_paginado(
            cliente_id,
            estado,
            limit=self.LIMITE_EXPORTACION,
            offset=0,
            q=q,
            distribuidor_id=distribuidor_id,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            descendente=descendente,
        )
        return filas

    async def tiene_valoracion(self, pedido_id: uuid.UUID) -> bool:
        results = await self.db.select("valoracion", "id", {"pedido_id": str(pedido_id)})
        return bool(results)

    async def get_valoracion(self, pedido_id: uuid.UUID) -> dict | None:
        results = await self.db.select("valoracion", "*", {"pedido_id": str(pedido_id)})
        return results[0] if results else None
