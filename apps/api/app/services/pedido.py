"""
PedidoService — Lógica de negocio para la gestión de pedidos activos.
"""

import uuid
from app.infrastructure.database import DatabaseSession
from app.repositories.pedido import PedidoRepo
from app.repositories.orden_pedido import OrdenPedidoRepo
from app.models.pedido import EstadoPedido
from app.schemas.pedido import (
    PedidoResponse,
    PedidoListItem,
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

            # primer producto nombre from join
            primer_prod_nombre = None
            if primer_prod:
                prod_join = primer_prod.get("producto") or {}
                if isinstance(prod_join, list):
                    prod_join = prod_join[0] if prod_join else {}
                primer_prod_nombre = prod_join.get("nombre") if prod_join else primer_prod.get("medida_snapshot", {}).get("nombre")

            items.append(PedidoListItem(
                id=uuid.UUID(row["id"]) if isinstance(row["id"], str) else row["id"],
                orden_id=uuid.UUID(row["orden_id"]) if isinstance(row["orden_id"], str) else row["orden_id"],
                estado=row["estado"],
                total=float(row["total"]),
                confirmado_at=row.get("confirmado_at"),
                entregado_at=row.get("entregado_at"),
                cliente_nombre=cliente_user.get("nombre"),
                distribuidor_nombre=dist_nombre,
                primer_producto_nombre=primer_prod_nombre,
            ))
        return items

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
