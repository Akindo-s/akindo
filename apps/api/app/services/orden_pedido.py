"""
OrdenPedidoService — Lógica de negocio para órdenes de compra.
"""

import uuid
from app.infrastructure.database import DatabaseSession
from app.repositories.orden_pedido import OrdenPedidoRepo
from app.repositories.pedido import PedidoRepo
from app.repositories.producto import ProductoRepo
from app.models.orden_pedido import OrdenPedido, PaquetePedido, EstadoOrden
from app.models.pedido import Pedido, EstadoPedido
from app.schemas.orden_pedido import (
    CrearOrdenRequest,
    RechazarOrdenRequest,
    OrdenPedidoResponse,
    OrdenPedidoListItem,
    PaquetePedidoResponse,
    PreOrdenResponse,
    PreOrdenProducto,
)
from app.events.bus import event_bus
from app.events.pedido_eventos import (
    OrdenPedidoCreada,
    OrdenPedidoAceptada,
    OrdenPedidoRechazada,
    PedidoCreado,
)
from app.core.exceptions import NotFoundException, ForbiddenException, AggregateNoValido
import logging

logger = logging.getLogger("akindo.orden_pedido")


def _paquete_to_response(p: PaquetePedido, orden_id: uuid.UUID) -> PaquetePedidoResponse:
    return PaquetePedidoResponse(
        id=uuid.uuid4(),  # los paquetes no tienen id accesible en el model
        producto_id=p.producto_id,
        cantidad=p.cantidad,
        costo_unitario=p.costo_unitario,
        subtotal=p.subtotal,
        medida_snapshot=p.medida_snapshot,
    )


def _orden_to_response(orden: OrdenPedido | dict) -> OrdenPedidoResponse:
    if isinstance(orden, dict):
        orden_dict = orden
        paquetes_raw = orden_dict.get("paquete_pedido", []) or []
        paquetes = []
        for p in paquetes_raw:
            prod_data = p.get("producto") or {}
            if isinstance(prod_data, list):
                prod_data = prod_data[0] if prod_data else {}
                
            paquetes.append(PaquetePedidoResponse(
                id=uuid.UUID(p["id"]) if isinstance(p.get("id"), str) else (p.get("id") or uuid.uuid4()),
                producto_id=uuid.UUID(p["producto_id"]) if isinstance(p["producto_id"], str) else p["producto_id"],
                cantidad=p["cantidad"],
                costo_unitario=float(p["costo_unitario"]),
                subtotal=float(p["costo_unitario"]) * int(p["cantidad"]),
                medida_snapshot=p.get("medida_snapshot") or {},
                nombre_producto=prod_data.get("nombre"),
                imagen_producto=prod_data.get("imagen"),
            ))

        # Extraer datos del cliente
        cliente_data = orden_dict.get("cliente") or {}
        if isinstance(cliente_data, list):
            cliente_data = cliente_data[0] if cliente_data else {}
        usuario_data = cliente_data.get("usuario") or {}
        if isinstance(usuario_data, list):
            usuario_data = usuario_data[0] if usuario_data else {}

        return OrdenPedidoResponse(
            id=uuid.UUID(orden_dict["id"]) if isinstance(orden_dict["id"], str) else orden_dict["id"],
            cliente_id=uuid.UUID(orden_dict["cliente_id"]) if isinstance(orden_dict["cliente_id"], str) else orden_dict["cliente_id"],
            distribuidor_id=uuid.UUID(orden_dict["distribuidor_id"]) if isinstance(orden_dict["distribuidor_id"], str) else orden_dict["distribuidor_id"],
            direccion_id=uuid.UUID(orden_dict["direccion_id"]) if isinstance(orden_dict["direccion_id"], str) else orden_dict["direccion_id"],
            estado=orden_dict["estado"],
            pre_autorizado=orden_dict.get("pre_autorizado", False),
            motivo_rechazo=orden_dict.get("motivo_rechazo"),
            total=sum(p.subtotal for p in paquetes),
            paquetes=paquetes,
            cliente_nombre=usuario_data.get("nombre"),
            cliente_email=usuario_data.get("email"),
            cliente_imagen=usuario_data.get("imagen_perfil"),
            created_at=orden_dict.get("created_at"),
        )
    else:
        # Es un objeto OrdenPedido (domain)
        return OrdenPedidoResponse(
            id=orden.id,
            cliente_id=orden.cliente_id,
            distribuidor_id=orden.distribuidor_id,
            direccion_id=orden.direccion_id,
            estado=orden.estado.value,
            pre_autorizado=orden.pre_autorizado,
            motivo_rechazo=orden.motivo_rechazo,
            total=orden.total,
            paquetes=[_paquete_to_response(p, orden.id) for p in orden.paquetes],
            created_at=orden.created_at,
        )


class OrdenPedidoService:
    """Lógica de negocio para órdenes de compra."""

    def __init__(self, db: DatabaseSession):
        self.db = db
        self.repo = OrdenPedidoRepo(db)
        self.pedido_repo = PedidoRepo(db)
        self.producto_repo = ProductoRepo(db)

    async def get_preorden(
        self,
        cliente_id: uuid.UUID,
        distribuidor_id: uuid.UUID,
    ) -> PreOrdenResponse:
        """
        Genera el snapshot del carrito para mostrar en la pantalla de pre-orden.
        No crea nada en la BD.
        """
        # Obtener carrito
        carritos = await self.db.select(
            "carrito",
            "*, carrito_item(*, producto(nombre, costo, disponible, existencias, imagen, unidad_medida_producto(unidad, nombre)))",
            {"cliente_id": str(cliente_id), "distribuidor_id": str(distribuidor_id)},
        )
        if not carritos:
            raise NotFoundException("No tienes un carrito con este distribuidor")

        carrito = carritos[0]
        items = carrito.get("carrito_item", []) or []
        if not isinstance(items, list):
            items = [items] if items else []

        # Obtener distribuidor
        dist_rows = await self.db.select(
            "usuario", "nombre", {"id": str(distribuidor_id)}
        )
        distribuidor_nombre = dist_rows[0]["nombre"] if dist_rows else "Distribuidor"

        # Obtener direcciones del cliente
        direcciones = await self.db.select(
            "direccion_cliente", "*", {"cliente_id": str(cliente_id)}
        )

        # Construir productos
        productos: list[PreOrdenProducto] = []
        subtotal = 0.0
        for item in items:
            prod = item.get("producto") or {}
            costo = float(prod.get("costo", 0))
            cantidad = int(item.get("cantidad", 1))
            item_subtotal = costo * cantidad
            subtotal += item_subtotal

            # Extraer unidad de medida del join
            medida_data = prod.get("unidad_medida_producto") or {}
            if isinstance(medida_data, list):
                medida_data = medida_data[0] if medida_data else {}
            unidad = medida_data.get("unidad", "pz") if isinstance(medida_data, dict) else "pz"

            productos.append(PreOrdenProducto(
                producto_id=uuid.UUID(item["producto_id"]) if isinstance(item["producto_id"], str) else item["producto_id"],
                nombre=prod.get("nombre", "Producto"),
                sku=None,
                imagen=prod.get("imagen"),
                cantidad=cantidad,
                costo_unitario=costo,
                subtotal=item_subtotal,
                unidad=unidad,
            ))

        costo_envio = 0.0
        impuestos = 0.0
        total = subtotal + costo_envio + impuestos

        return PreOrdenResponse(
            distribuidor_id=distribuidor_id,
            distribuidor_nombre=distribuidor_nombre,
            productos=productos,
            subtotal=subtotal,
            costo_envio=costo_envio,
            impuestos=impuestos,
            total=total,
            direcciones_disponibles=[
                {
                    "id": str(d["id"]),
                    "calle": d["calle"],
                    "ciudad": d["ciudad"],
                    "estado": d["estado"],
                    "codigo_postal": d["codigo_postal"],
                    "es_predeterminada": d.get("es_predeterminada", False),
                }
                for d in (direcciones or [])
            ],
        )

    async def crear_orden(
        self,
        cliente_id: uuid.UUID,
        data: CrearOrdenRequest,
    ) -> OrdenPedidoResponse:
        """
        Crea una OrdenPedido a partir del carrito del cliente.
        Hace snapshot de los productos en paquete_pedido.
        """
        paquetes: list[PaquetePedido] = []
        for req_paquete in data.paquetes:
            # Obtener producto real para snapshot
            prod_rows = await self.db.select(
                "producto",
                "id, costo, medida, disponible, existencias",
                {"id": str(req_paquete.producto_id)},
            )
            if not prod_rows:
                raise NotFoundException(f"Producto {req_paquete.producto_id} no encontrado")
            prod = prod_rows[0]
            if not prod.get("disponible") or prod.get("existencias", 0) < req_paquete.cantidad:
                raise AggregateNoValido(
                    f"Producto {req_paquete.producto_id} no tiene stock suficiente"
                )

            # Obtener medida para snapshot
            medida_rows = await self.db.select(
                "unidad_medida_producto", "*", {"id": str(prod["medida"])}
            ) if prod.get("medida") else []
            medida_snap = medida_rows[0] if medida_rows else {}

            paquetes.append(PaquetePedido(
                producto_id=req_paquete.producto_id,
                cantidad=req_paquete.cantidad,
                costo_unitario=float(prod["costo"]),
                medida_snapshot={"unidad": medida_snap.get("unidad", ""), "nombre": medida_snap.get("nombre", "")},
            ))

        orden = OrdenPedido.crear(
            cliente_id=cliente_id,
            distribuidor_id=data.distribuidor_id,
            direccion_id=data.direccion_id,
            paquetes=paquetes,
            pre_autorizado=data.pre_autorizado,
        )
        await self.repo.save(orden)

        # Vaciar el carrito de este distribuidor
        carritos = await self.db.select(
            "carrito",
            "id",
            {"cliente_id": str(cliente_id), "distribuidor_id": str(data.distribuidor_id)},
        )
        if carritos:
            carrito_id = carritos[0]["id"]
            await self.db.delete("carrito_item", {"carrito_id": str(carrito_id)})

        await event_bus.publish(OrdenPedidoCreada(
            orden_id=orden.id,
            cliente_id=orden.cliente_id,
            distribuidor_id=orden.distribuidor_id,
            total=orden.total,
        ))

        logger.info("Orden %s creada por cliente %s", orden.id, cliente_id)
        return _orden_to_response(orden)

    async def aceptar_orden(
        self,
        distribuidor_id: uuid.UUID,
        orden_id: uuid.UUID,
    ) -> OrdenPedidoResponse:
        """
        Distribuidor acepta la orden.
        Si pre_autorizado=True, crea el pedido automáticamente.
        """
        orden = await self.repo.get_by_id(orden_id)
        if not orden:
            raise NotFoundException("Orden no encontrada")
        if orden.distribuidor_id != distribuidor_id:
            raise ForbiddenException("No puedes gestionar órdenes de otro distribuidor")

        orden.aceptar()
        await self.repo.save(orden)

        await event_bus.publish(OrdenPedidoAceptada(
            orden_id=orden.id,
            cliente_id=orden.cliente_id,
            distribuidor_id=orden.distribuidor_id,
            pre_autorizado=orden.pre_autorizado,
        ))

        # Si pre-autorizado, crear pedido automáticamente
        if orden.pre_autorizado:
            await self._crear_pedido_desde_orden(orden)

        return _orden_to_response(orden)

    async def rechazar_orden(
        self,
        distribuidor_id: uuid.UUID,
        orden_id: uuid.UUID,
        data: RechazarOrdenRequest,
    ) -> OrdenPedidoResponse:
        """Distribuidor rechaza la orden con motivo opcional."""
        orden = await self.repo.get_by_id(orden_id)
        if not orden:
            raise NotFoundException("Orden no encontrada")
        if orden.distribuidor_id != distribuidor_id:
            raise ForbiddenException("No puedes gestionar órdenes de otro distribuidor")

        orden.rechazar(data.motivo_rechazo)
        await self.repo.save(orden)

        await event_bus.publish(OrdenPedidoRechazada(
            orden_id=orden.id,
            cliente_id=orden.cliente_id,
            distribuidor_id=orden.distribuidor_id,
            motivo=orden.motivo_rechazo,
        ))

        return _orden_to_response(orden)

    async def pagar_orden(
        self,
        cliente_id: uuid.UUID,
        orden_id: uuid.UUID,
    ) -> OrdenPedidoResponse:
        """
        Cliente paga una orden aceptada. Se crea el pedido.
        (Pago simulado — integración de pasarela futura.)
        """
        orden = await self.repo.get_by_id(orden_id)
        if not orden:
            raise NotFoundException("Orden no encontrada")
        if orden.cliente_id != cliente_id:
            raise ForbiddenException("Esta orden no es tuya")
        if orden.estado != EstadoOrden.ACEPTADA:
            raise AggregateNoValido("Solo puedes pagar una orden aceptada por el distribuidor")

        # Verificar que no haya pedido ya creado (pre_autorizado)
        pedido_existente = await self.pedido_repo.get_by_orden(orden_id)
        if pedido_existente:
            raise AggregateNoValido("Esta orden ya tiene un pedido asociado")

        await self._crear_pedido_desde_orden(orden)
        return _orden_to_response(orden)

    async def cancelar_orden(
        self,
        cliente_id: uuid.UUID,
        orden_id: uuid.UUID,
    ) -> OrdenPedidoResponse:
        """Cliente cancela su propia orden pendiente."""
        orden = await self.repo.get_by_id(orden_id)
        if not orden:
            raise NotFoundException("Orden no encontrada")
        if orden.cliente_id != cliente_id:
            raise ForbiddenException("No puedes cancelar una orden que no es tuya")

        orden.cancelar()
        await self.repo.save(orden)

        logger.info("Orden %s cancelada por cliente %s", orden.id, cliente_id)
        return _orden_to_response(orden)

    async def _crear_pedido_desde_orden(self, orden: OrdenPedido) -> Pedido:
        """Privado: crea un Pedido desde una OrdenPedido aceptada."""
        pedido = Pedido.crear_desde_orden(
            orden_id=orden.id,
            total=orden.total,
        )
        await self.pedido_repo.save(pedido)

        # Restar existencias de los productos
        for paquete in orden.paquetes:
            producto = await self.producto_repo.get(paquete.producto_id)
            if producto:
                if producto.existencias >= paquete.cantidad:
                    producto.existencias -= paquete.cantidad
                else:
                    raise AggregateNoValido(f"No hay existencias suficientes para el producto {producto.nombre}")
                await self.producto_repo.save(producto)

        # Registrar primera actualización en el timeline
        await self.pedido_repo.agregar_actualizacion(
            pedido_id=pedido.id,
            estado_nuevo=EstadoPedido.PENDIENTE_ENVIO.value,
            descripcion="Pedido creado. Pendiente de envío.",
        )

        # Obtener ids de cliente y distribuidor desde la orden para el evento
        await event_bus.publish(PedidoCreado(
            pedido_id=pedido.id,
            orden_id=orden.id,
            cliente_id=orden.cliente_id,
            distribuidor_id=orden.distribuidor_id,
            total=orden.total,
        ))

        logger.info("Pedido %s creado desde orden %s", pedido.id, orden.id)
        return pedido

    async def get_orden(
        self,
        orden_id: uuid.UUID,
        usuario_id: uuid.UUID,
    ) -> OrdenPedidoResponse:
        """Obtiene una orden (cliente o distribuidor propietario)."""
        orden_dict = await self.repo.get_by_id_raw(orden_id)
        if not orden_dict:
            raise NotFoundException("Orden no encontrada")
            
        if uuid.UUID(str(orden_dict["cliente_id"])) != usuario_id and uuid.UUID(str(orden_dict["distribuidor_id"])) != usuario_id:
            raise ForbiddenException("No tienes acceso a esta orden")
            
        return _orden_to_response(orden_dict)

    async def listar_ordenes_distribuidor(
        self,
        distribuidor_id: uuid.UUID,
        estado: str | None = None,
    ) -> list[OrdenPedidoListItem]:
        """Lista órdenes de compra del distribuidor."""
        rows = await self.repo.listar_por_distribuidor(distribuidor_id, estado)
        result = []
        for row in rows:
            # Name comes from cliente!inner(usuario(nombre))
            cliente_data = row.get("cliente") or {}
            if isinstance(cliente_data, list):
                cliente_data = cliente_data[0] if cliente_data else {}
            usuario_data = cliente_data.get("usuario") or {}
            if isinstance(usuario_data, list):
                usuario_data = usuario_data[0] if usuario_data else {}
            paquetes_raw = row.get("paquete_pedido", []) or []
            total = sum(float(p["costo_unitario"]) * int(p["cantidad"]) for p in paquetes_raw)
            paquetes = [
                PaquetePedidoResponse(
                    id=uuid.UUID(p["id"]) if isinstance(p.get("id"), str) else (p.get("id") or uuid.uuid4()),
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
            result.append(OrdenPedidoListItem(
                id=uuid.UUID(row["id"]) if isinstance(row["id"], str) else row["id"],
                estado=row["estado"],
                total=total,
                pre_autorizado=row.get("pre_autorizado", False),
                cliente_nombre=usuario_data.get("nombre"),
                created_at=row.get("created_at"),
                paquetes=paquetes,
            ))
        return result

    async def listar_ordenes_cliente(
        self,
        cliente_id: uuid.UUID,
        estado: str | None = None,
    ) -> list[OrdenPedidoListItem]:
        """Lista órdenes de compra del cliente."""
        rows = await self.repo.listar_por_cliente(cliente_id, estado)
        result = []
        for row in rows:
            # distribuidor join returns nombre_negocio directly; imagen_perfil is on nested usuario
            dist_data = row.get("distribuidor") or {}
            if isinstance(dist_data, list):
                dist_data = dist_data[0] if dist_data else {}
            
            dist_user_data = dist_data.get("usuario") or {}
            if isinstance(dist_user_data, list):
                dist_user_data = dist_user_data[0] if dist_user_data else {}

            paquetes_raw = row.get("paquete_pedido", []) or []
            total = sum(float(p["costo_unitario"]) * int(p["cantidad"]) for p in paquetes_raw)
            # Build paquete responses with product name and image from join
            paquetes = [
                PaquetePedidoResponse(
                    id=uuid.UUID(p["id"]) if isinstance(p.get("id"), str) else (p.get("id") or uuid.uuid4()),
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
            result.append(OrdenPedidoListItem(
                id=uuid.UUID(row["id"]) if isinstance(row["id"], str) else row["id"],
                estado=row["estado"],
                total=total,
                pre_autorizado=row.get("pre_autorizado", False),
                distribuidor_nombre=dist_data.get("nombre_negocio"),
                distribuidor_imagen=dist_user_data.get("imagen_perfil"),
                created_at=row.get("created_at"),
                paquetes=paquetes,
            ))
        return result

