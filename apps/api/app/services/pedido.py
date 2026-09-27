"""
PedidoService — Lógica de negocio para la gestión de pedidos activos.
"""

import uuid
from io import BytesIO
from app.infrastructure.database import DatabaseSession
from app.repositories.pedido import PedidoRepo
from app.repositories.orden_pedido import OrdenPedidoRepo
from app.models.pedido import EstadoPedido
from app.schemas.pedido import (
    PedidoResponse,
    PedidoListItem,
    ListadoPedidosResponse,
    PedidoProductoListItem,
    ResumenPedidosResponse,
    SeguimientoPedido,
    ActualizarEstadoPedidoRequest,
    PedidoActualizacionResponse,
    PedidoItemResponse,
    CrearValoracionRequest,
    ValoracionResponse,
)
from app.events.bus import event_bus
from app.events.pedido_eventos import PedidoActualizado, PedidoFinalizado
from app.core.exceptions import NotFoundException, ForbiddenException, AggregateNoValido
import logging

logger = logging.getLogger("akindo.pedido")


def _build_pedido_response(
    row: dict, 
    actualizaciones: list[dict], 
    tiene_valoracion: bool,
    valoracion: dict | None = None
) -> PedidoResponse:
    orden = row.get("orden_pedido") or {}
    if isinstance(orden, list):
        orden = orden[0] if orden else {}

    paquetes_raw = orden.get("paquete_pedido", []) or []
    paquetes = [
        PedidoItemResponse(
            producto_id=uuid.UUID(p["producto_id"]) if isinstance(p["producto_id"], str) else p["producto_id"],
            cantidad=p["cantidad"],
            costo_unitario=float(p["costo_unitario"]),
            subtotal=float(p["costo_unitario"]) * int(p["cantidad"]),
            medida_snapshot=p.get("medida_snapshot") or {},
            nombre_producto=(
                (p.get("producto") or {}).get("nombre")
                if isinstance(p.get("producto"), dict)
                else ((p.get("producto") or [{}])[0].get("nombre") if isinstance(p.get("producto"), list) else None)
            ),
            imagen_producto=(
                (p.get("producto") or {}).get("imagen")
                if isinstance(p.get("producto"), dict)
                else ((p.get("producto") or [{}])[0].get("imagen") if isinstance(p.get("producto"), list) else None)
            ),
        )
        for p in paquetes_raw
    ]

    updates = [
        PedidoActualizacionResponse(
            id=uuid.UUID(a["id"]) if isinstance(a["id"], str) else a["id"],
            estado_nuevo=a["estado_nuevo"],
            descripcion=a.get("descripcion"),
            creado_at=a["creado_at"],
        )
        for a in actualizaciones
    ]

    # Extraer datos del distribuidor directamente (nombre_negocio, imagen_perfil)
    cliente_data = orden.get("cliente") or {}
    if isinstance(cliente_data, list):
        cliente_data = cliente_data[0] if cliente_data else {}
    cliente_user = cliente_data.get("usuario") or {}
    if isinstance(cliente_user, list):
        cliente_user = cliente_user[0] if cliente_user else {}

    dist_data = orden.get("distribuidor") or {}
    if isinstance(dist_data, list):
        dist_data = dist_data[0] if dist_data else {}
    # nombre_negocio is on distribuidor; imagen_perfil and es_verificado are on usuario
    dist_nombre = dist_data.get("nombre_negocio")
    dist_user_data = dist_data.get("usuario") or {}
    if isinstance(dist_user_data, list):
        dist_user_data = dist_user_data[0] if dist_user_data else {}
    dist_imagen = dist_user_data.get("imagen_perfil")
    dist_verificado = dist_user_data.get("es_verificado")
    cliente_nombre = cliente_user.get("nombre")
    cliente_imagen = cliente_user.get("imagen_perfil")

    return PedidoResponse(
        id=uuid.UUID(row["id"]) if isinstance(row["id"], str) else row["id"],
        orden_id=uuid.UUID(row["orden_id"]) if isinstance(row["orden_id"], str) else row["orden_id"],
        estado=row["estado"],
        total=float(row.get("total") or 0.0),
        comision_servicio=float(row.get("comision_servicio") or 0.0),
        confirmado_at=row.get("confirmado_at"),
        entregado_at=row.get("entregado_at"),
        cliente_id=uuid.UUID(str(orden["cliente_id"])) if orden.get("cliente_id") else None,
        distribuidor_id=uuid.UUID(str(orden["distribuidor_id"])) if orden.get("distribuidor_id") else None,
        cliente_nombre=cliente_nombre,
        cliente_imagen=cliente_imagen,
        distribuidor_nombre=dist_nombre,
        distribuidor_imagen=dist_imagen,
        distribuidor_verificado=dist_verificado,
        direccion_entrega=orden.get("direccion_cliente"),
        paquetes=paquetes,
        actualizaciones=updates,
        tiene_valoracion=tiene_valoracion,
        valoracion=ValoracionResponse.model_validate(valoracion) if valoracion else None,
    )


class PedidoService:
    """Lógica de negocio para pedidos activos."""

    def __init__(self, db: DatabaseSession):
        self.db = db
        self.repo = PedidoRepo(db)
        self.orden_repo = OrdenPedidoRepo(db)

    async def obtener_pedido(
        self,
        pedido_id: uuid.UUID,
        usuario_id: uuid.UUID,
    ) -> PedidoResponse:
        """Obtiene el detalle completo de un pedido (cliente o distribuidor propietario)."""
        rows = await self.db.select(
            "pedido",
            "*, orden_pedido!inner(cliente_id, distribuidor_id, paquete_pedido(*, producto(nombre, imagen)), direccion_cliente(*), cliente(usuario(nombre, imagen_perfil)), distribuidor(nombre_negocio, usuario(imagen_perfil, es_verificado)))",
            {"id": str(pedido_id)},
        )
        if not rows:
            raise NotFoundException("Pedido no encontrado")

        row = rows[0]
        orden = row.get("orden_pedido") or {}
        if isinstance(orden, list):
            orden = orden[0] if orden else {}

        cliente_id = orden.get("cliente_id")
        distribuidor_id = orden.get("distribuidor_id")
        if str(usuario_id) not in (str(cliente_id), str(distribuidor_id)):
            raise ForbiddenException("No tienes acceso a este pedido")

        actualizaciones = await self.repo.get_actualizaciones(pedido_id)
        tiene_val = await self.repo.tiene_valoracion(pedido_id)
        val_data = await self.repo.get_valoracion(pedido_id) if tiene_val else None
        
        return _build_pedido_response(row, actualizaciones, tiene_val, val_data)

    async def actualizar_estado(
        self,
        distribuidor_id: uuid.UUID,
        pedido_id: uuid.UUID,
        data: ActualizarEstadoPedidoRequest,
    ) -> PedidoResponse:
        """
        Distribuidor envía una actualización de estado al pedido.
        Registra en el timeline y actualiza el estado del aggregate.
        """
        pedido = await self.repo.get_by_id(pedido_id)
        if not pedido:
            raise NotFoundException("Pedido no encontrado")

        # Validar que sea el distribuidor correcto
        orden_rows = await self.db.select(
            "orden_pedido", "distribuidor_id, cliente_id", {"id": str(pedido.orden_id)}
        )
        if not orden_rows:
            raise NotFoundException("Orden asociada no encontrada")
        orden_row = orden_rows[0]

        if str(orden_row["distribuidor_id"]) != str(distribuidor_id):
            raise ForbiddenException("No puedes gestionar pedidos de otro distribuidor")

        try:
            nuevo_estado = EstadoPedido(data.estado)
        except ValueError:
            raise AggregateNoValido(f"Estado inválido: {data.estado}")

        pedido.actualizar_estado(nuevo_estado)
        await self.repo.save(pedido)
        await self.repo.agregar_actualizacion(
            pedido_id=pedido_id,
            estado_nuevo=nuevo_estado.value,
            descripcion=data.descripcion,
        )

        await event_bus.publish(PedidoActualizado(
            pedido_id=pedido.id,
            cliente_id=uuid.UUID(str(orden_row["cliente_id"])),
            distribuidor_id=distribuidor_id,
            estado_nuevo=nuevo_estado.value,
            descripcion=data.descripcion,
        ))

        # Si el pedido fue entregado, emitir evento de finalización para valoración
        if nuevo_estado == EstadoPedido.ENTREGADO:
            await event_bus.publish(PedidoFinalizado(
                pedido_id=pedido.id,
                orden_id=pedido.orden_id,
                cliente_id=uuid.UUID(str(orden_row["cliente_id"])),
                distribuidor_id=distribuidor_id,
                total=pedido.total,
            ))

        return await self.obtener_pedido(pedido_id, distribuidor_id)

    async def listar_mis_pedidos_cliente(
        self,
        cliente_id: uuid.UUID,
        estado: str | None = None,
    ) -> list[PedidoListItem]:
        """Lista pedidos del cliente con filtro opcional por estado."""
        rows = await self.repo.listar_por_cliente(cliente_id, estado)
        return self._rows_to_list_items(rows, es_cliente=True)

    async def listar_pedidos_distribuidor(
        self,
        distribuidor_id: uuid.UUID,
        estado: str | None = None,
    ) -> list[PedidoListItem]:
        """Lista pedidos del distribuidor con filtro opcional."""
        rows = await self.repo.listar_por_distribuidor(distribuidor_id, estado)
        return self._rows_to_list_items(rows, es_cliente=False)

    def _rows_to_list_items(self, rows: list[dict], es_cliente: bool) -> list[PedidoListItem]:
        items = []
        for row in rows:
            orden = row.get("orden_pedido") or {}
            if isinstance(orden, list):
                orden = orden[0] if orden else {}
            paquetes = orden.get("paquete_pedido", []) or []
            if not isinstance(paquetes, list):
                paquetes = [paquetes] if paquetes else []
            primer_prod = paquetes[0] if paquetes else {}

            # Extract from nested joins
            cliente_data = orden.get("cliente") or {}
            if isinstance(cliente_data, list):
                cliente_data = cliente_data[0] if cliente_data else {}
            cliente_user = cliente_data.get("usuario") or {}
            if isinstance(cliente_user, list):
                cliente_user = cliente_user[0] if cliente_user else {}

            dist_data = orden.get("distribuidor") or {}
            if isinstance(dist_data, list):
                dist_data = dist_data[0] if dist_data else {}
            # distribuidor table has nombre_negocio directly
            dist_nombre = dist_data.get("nombre_negocio")
            dist_user = dist_data.get("usuario") or {}
            if isinstance(dist_user, list):
                dist_user = dist_user[0] if dist_user else {}

            # La direccion solo viene en el listado paginado; en los otros
            # queda en None y la tarjeta no pinta el destino.
            direccion = orden.get("direccion_cliente") or {}
            if isinstance(direccion, list):
                direccion = direccion[0] if direccion else {}
            partes_destino = [direccion.get("ciudad"), direccion.get("estado")]
            destino = ", ".join(x for x in partes_destino if x) or None

            # El timeline, ordenado del paso mas viejo al mas nuevo: PostgREST
            # devuelve los embebidos sin garantia de orden.
            seguimiento = sorted(
                (
                    SeguimientoPedido(
                        estado_nuevo=a["estado_nuevo"],
                        descripcion=a.get("descripcion") or None,
                        creado_at=a["creado_at"],
                    )
                    for a in (row.get("pedido_actualizacion") or [])
                ),
                key=lambda a: a.creado_at,
            )

            # primer producto nombre from join
            # Todos los productos, para la tarjeta del listado. `producto`
            # llega como dict o como lista de uno, segun la consulta.
            productos: list[PedidoProductoListItem] = []
            for paq in paquetes:
                prod = paq.get("producto") or {}
                if isinstance(prod, list):
                    prod = prod[0] if prod else {}
                medida = paq.get("medida_snapshot") or {}
                cantidad = float(paq.get("cantidad") or 0)
                productos.append(PedidoProductoListItem(
                    nombre=prod.get("nombre") or medida.get("nombre"),
                    imagen=prod.get("imagen"),
                    cantidad=cantidad,
                    unidad=medida.get("unidad"),
                    subtotal=cantidad * float(paq.get("costo_unitario") or 0),
                ))

            primer_prod_nombre = None
            primer_prod_imagen = None
            if primer_prod:
                prod_join = primer_prod.get("producto") or {}
                if isinstance(prod_join, list):
                    prod_join = prod_join[0] if prod_join else {}
                primer_prod_nombre = prod_join.get("nombre") if prod_join else primer_prod.get("medida_snapshot", {}).get("nombre")
                primer_prod_imagen = prod_join.get("imagen") if prod_join else None

            items.append(PedidoListItem(
                id=uuid.UUID(row["id"]) if isinstance(row["id"], str) else row["id"],
                orden_id=uuid.UUID(row["orden_id"]) if isinstance(row["orden_id"], str) else row["orden_id"],
                estado=row["estado"],
                total=float(row["total"]),
                confirmado_at=row.get("confirmado_at"),
                entregado_at=row.get("entregado_at"),
                cliente_nombre=cliente_user.get("nombre"),
                distribuidor_id=orden.get("distribuidor_id"),
                distribuidor_nombre=dist_nombre,
                distribuidor_imagen=dist_user.get("imagen_perfil"),
                distribuidor_verificado=dist_user.get("es_verificado"),
                primer_producto_nombre=primer_prod_nombre,
                primer_producto_imagen=primer_prod_imagen,
                total_partidas=len(paquetes),
                productos=productos,
                destino=destino,
                seguimiento=seguimiento,
            ))
        return items

    async def listar_mis_pedidos_cliente_paginado(
        self,
        cliente_id: uuid.UUID,
        estado: str | None = None,
        cantidad_pagina: int = 10,
        numero_pagina: int = 1,
        q: str | None = None,
        distribuidor_id: uuid.UUID | None = None,
        fecha_desde: str | None = None,
        fecha_hasta: str | None = None,
        orden: str = "desc",
    ) -> ListadoPedidosResponse:
        """Lista los pedidos del cliente, paginados y filtrados.

        `orden` ordena por fecha de confirmación: `desc` (lo más nuevo
        primero, el default) o `asc`.
        """
        limit = max(1, cantidad_pagina)
        offset = max(0, (numero_pagina - 1) * limit)

        rows, total_pedidos = await self.repo.listar_por_cliente_paginado(
            cliente_id,
            estado,
            limit,
            offset,
            q=q,
            distribuidor_id=distribuidor_id,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            descendente=(orden != "asc"),
        )

        # `siguiente_url` / `anterior_url` los arma el router, que es el único
        # que conoce la URL real del endpoint.
        return ListadoPedidosResponse(
            total_pedidos=total_pedidos,
            total_paginas=(total_pedidos + limit - 1) // limit if limit > 0 else 1,
            pagina_actual=numero_pagina,
            tiene_siguiente=(offset + limit) < total_pedidos,
            tiene_anterior=offset > 0,
            siguiente_url=None,
            anterior_url=None,
            pedidos=self._rows_to_list_items(rows, es_cliente=True),
        )

    #: Los estados que siempre salen en el resumen, en el orden en que la
    #: pantalla los muestra. Van todos aunque valgan 0: una pestaña vacía
    #: tiene que poder decir "0" en vez de no decir nada.
    ESTADOS_RESUMEN = ("en envio", "pendiente de envio", "entregado", "cancelado")

    async def resumen_pedidos_cliente(
        self,
        cliente_id: uuid.UUID,
        q: str | None = None,
        distribuidor_id: uuid.UUID | None = None,
        fecha_desde: str | None = None,
        fecha_hasta: str | None = None,
    ) -> ResumenPedidosResponse:
        """Cuántos pedidos del cliente hay en cada estado."""
        conteos = await self.repo.contar_por_estado(
            cliente_id, q, distribuidor_id, fecha_desde, fecha_hasta,
        )
        por_estado = {estado: conteos.get(estado, 0) for estado in self.ESTADOS_RESUMEN}
        # El total sale de los conteos y no de otra consulta: así no puede
        # contradecir a la suma de las pestañas.
        return ResumenPedidosResponse(total=sum(conteos.values()), por_estado=por_estado)

    # ── Exportación del manifiesto ────────────────────────────────

    #: Formatos que el front puede pedir. Mientras uno no esté acá, la pantalla
    #: lo muestra deshabilitado en vez de ofrecer una descarga que falla.
    FORMATOS_EXPORTACION = ("xlsx",)

    ENCABEZADOS_EXPORTACION = (
        "ID del pedido",
        "ID de la orden",
        "Fecha de confirmación",
        "Fecha de entrega",
        "Distribuidor",
        "Destino",
        "Estado",
        "Partidas",
        "Producto",
        "Cantidad",
        "Unidad",
        "Costo unitario",
        "Subtotal",
        "Total del pedido",
    )

    async def exportar_pedidos_cliente(
        self,
        cliente_id: uuid.UUID,
        estado: str | None = None,
        q: str | None = None,
        distribuidor_id: uuid.UUID | None = None,
        fecha_desde: str | None = None,
        fecha_hasta: str | None = None,
        orden: str = "desc",
    ) -> bytes:
        """Arma el manifiesto de Excel con los pedidos del cliente (una fila
        por partida) y lo devuelve en memoria, listo para que el router lo
        sirva.

        Respeta los mismos filtros que el listado: lo que se exporta es lo que
        el usuario está viendo, no toda su historia.
        """
        from openpyxl import Workbook

        filas = await self.repo.listar_todos_por_cliente(
            cliente_id,
            estado,
            q=q,
            distribuidor_id=distribuidor_id,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            descendente=(orden != "asc"),
        )
        items = self._rows_to_list_items(filas, es_cliente=True)

        libro = Workbook()
        hoja = libro.active
        hoja.title = "Pedidos"
        hoja.append(list(self.ENCABEZADOS_EXPORTACION))

        for row, item in zip(filas, items):
            orden_row = row.get("orden_pedido") or {}
            if isinstance(orden_row, list):
                orden_row = orden_row[0] if orden_row else {}
            paquetes = orden_row.get("paquete_pedido") or []

            comunes = [
                str(item.id),
                str(item.orden_id),
                str(item.confirmado_at or "")[:10],
                str(item.entregado_at or "")[:10],
                item.distribuidor_nombre,
                item.destino,
                item.estado,
                item.total_partidas,
            ]

            if not paquetes:
                hoja.append(comunes + [None, None, None, None, None, item.total])
                continue

            for p in paquetes:
                producto = p.get("producto") or {}
                if isinstance(producto, list):
                    producto = producto[0] if producto else {}
                medida = p.get("medida_snapshot") or {}
                cantidad = int(p["cantidad"])
                costo = float(p["costo_unitario"])
                hoja.append(comunes + [
                    producto.get("nombre") or medida.get("nombre"),
                    cantidad,
                    medida.get("unidad"),
                    costo,
                    cantidad * costo,
                    item.total,
                ])

        # Un ancho fijo por columna: openpyxl no mide el texto solo.
        anchos = (38, 38, 18, 16, 26, 24, 16, 10, 34, 10, 10, 16, 14, 18)
        for columna, ancho in zip(hoja.columns, anchos):
            hoja.column_dimensions[columna[0].column_letter].width = ancho

        buffer = BytesIO()
        libro.save(buffer)
        return buffer.getvalue()

    async def crear_valoracion(
        self,
        cliente_id: uuid.UUID,
        pedido_id: uuid.UUID,
        data: CrearValoracionRequest,
    ) -> dict:
        """Cliente crea valoración de un pedido entregado."""
        pedido = await self.repo.get_by_id(pedido_id)
        if not pedido:
            raise NotFoundException("Pedido no encontrado")
        if pedido.estado != EstadoPedido.ENTREGADO:
            raise AggregateNoValido("Solo puedes valorar pedidos entregados")

        ya_tiene = await self.repo.tiene_valoracion(pedido_id)
        if ya_tiene:
            raise AggregateNoValido("Ya valoraste este pedido")

        # Obtener distribuidor_id
        orden_rows = await self.db.select(
            "orden_pedido", "distribuidor_id, cliente_id", {"id": str(pedido.orden_id)}
        )
        if not orden_rows:
            raise NotFoundException("Orden no encontrada")
        orden_row = orden_rows[0]
        if str(orden_row["cliente_id"]) != str(cliente_id):
            raise ForbiddenException("No puedes valorar el pedido de otro cliente")

        if not (1 <= data.puntuacion <= 5):
            raise AggregateNoValido("La puntuación debe estar entre 1 y 5")

        result = await self.db.insert("valoracion", {
            "pedido_id": str(pedido_id),
            "cliente_id": str(cliente_id),
            "distribuidor_id": str(orden_row["distribuidor_id"]),
            "puntuacion": data.puntuacion,
            "comentario": data.comentario,
        })
        return result

    async def listar_valoraciones_distribuidor(
        self,
        distribuidor_id: uuid.UUID,
    ) -> list[ValoracionResponse]:
        """Lista todas las valoraciones recibidas por un distribuidor."""
        results = await self.db.select(
            "valoracion", "*", {"distribuidor_id": str(distribuidor_id)}
        )
        return [ValoracionResponse.model_validate(r) for r in (results or [])]
