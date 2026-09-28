"""
OrdenPedidoService — Lógica de negocio para órdenes de compra.
"""

import uuid
from collections import Counter
from io import BytesIO

from rich.json import JSON
from app.infrastructure.database import DatabaseSession
from app.models.producto import Medida, Producto
from app.repositories.orden_pedido import OrdenPedidoRepo
from app.repositories.pedido import PedidoRepo
from app.repositories.producto import ProductoRepo
from app.models.orden_pedido import OrdenPedido, PaquetePedido, EstadoOrden
from app.models.pedido import Pedido, EstadoPedido
from app.schemas.orden_pedido import (
    CrearOrdenRequest,
    ListadoOrdenesResponse,
    ResumenOrdenesResponse,
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


def _primero(valor) -> dict:
    """Un recurso embebido de PostgREST llega como dict, como lista de uno o
    como `None`. Esto devuelve siempre un dict."""
    if isinstance(valor, list):
        return valor[0] if valor else {}
    return valor or {}


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
            "*, carrito_item(*, producto(nombre, costo, disponible, existencias, imagen, unidad_medida_producto(unidad, nombre),atributos_extra))",
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
            
            if item.get('producto_id') is None:
                raise NotFoundException(f"Producto {item.get('producto_id')} no encontrado")
            
            producto = Producto(
                id=uuid.UUID(item.get("producto_id") if isinstance(item.get("producto_id"), str) else item.get("producto_id")),
                costo=float(prod.get("costo", 0)),
                medida=Medida(id=uuid.uuid4(), nombre='medida', unidad=prod.get("unidad_medida_producto", "pz")),
                disponible=bool(prod.get("disponible", False)),
                existencias=int(prod.get("existencias", 0)),
                nombre=prod.get("nombre", "Producto"),
                distribuidor_id=distribuidor_id,
                atributos_extra=prod.get("atributos_extra"),
                imagen=prod.get("imagen"),
            )
            



            
            cantidad = float(item.get("cantidad", 0))
            # analizar si hay niveles de precio en el producto y aplicar descuento según cantidad
            if producto.atributos_extra and isinstance(producto.atributos_extra, dict):
                niveles_precio = producto.atributos_extra.get("niveles_precio")
                if niveles_precio and isinstance(niveles_precio, list):
                    niveles_precio = sorted(niveles_precio, key=lambda x: x.get("cantidad_minima", 0),reverse=False)
                    for nivel in niveles_precio:
                        if cantidad < nivel.get("cantidad_minima", 0):
                            producto.costo = float(nivel.get("costo_por_medida", producto.costo))
                            break
                    else:
                        producto.costo = niveles_precio[-1].get('costo_por_medida')

            item_subtotal = producto.costo * cantidad
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
                costo_unitario=producto.costo,
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
                "id, costo, medida, disponible, existencias,nombre,atributos_extra",
                {"id": str(req_paquete.producto_id)},
            )
            if not prod_rows:
                raise NotFoundException(f"Producto {req_paquete.producto_id} no encontrado")
            prod_data = prod_rows[0]
            # Obtener medida para snapshot
            medida_rows = await self.db.select(
                "unidad_medida_producto", "*", {"id": str(prod_data["medida"])}
            ) if prod_data.get("medida") else []
            medida_snap = medida_rows[0] if medida_rows else {}

            producto = Producto(
                id=uuid.UUID(prod_data["id"]) if isinstance(prod_data["id"], str) else prod_data["id"],
                costo=float(prod_data["costo"]),
                medida=Medida(id=uuid.UUID(prod_data["medida"]) if isinstance(prod_data["medida"], str) else prod_data["medida"], nombre=medida_snap.get("nombre", ""), unidad=medida_snap.get("unidad", "")),
                disponible=bool(prod_data["disponible"]),
                existencias=int(prod_data["existencias"]),
                nombre=prod_data["nombre"],
                distribuidor_id=data.distribuidor_id,
                atributos_extra=prod_data.get("atributos_extra")
            )
            if not producto.disponible or producto.existencias < req_paquete.cantidad:
                raise AggregateNoValido(
                    f"Producto {req_paquete.producto_id} no tiene stock suficiente"
                )

            # analizar si hay niveles de precio en el producto y aplicar descuento según cantidad
            if producto.atributos_extra and isinstance(producto.atributos_extra, dict):
                niveles_precio = producto.atributos_extra.get("niveles_precio")
                if niveles_precio and isinstance(niveles_precio, list):
                    niveles_precio = sorted(niveles_precio, key=lambda x: x.get("cantidad_minima", 0),reverse=False)
                    for nivel in niveles_precio:
                        if req_paquete.cantidad < nivel.get("cantidad_minima", 0):
                            producto.costo = float(nivel.get("costo_por_medida", producto.costo))
                            break
                    else:
                        producto.costo = niveles_precio[-1].get('costo_por_medida')

            paquetes.append(PaquetePedido(
                producto_id=req_paquete.producto_id,
                cantidad=req_paquete.cantidad,
                costo_unitario=producto.costo,
                medida_snapshot={"unidad": producto.medida.unidad, "nombre": producto.medida.nombre},
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
        cantidad_pagina: int = 10,
        numero_pagina: int = 1,
        q: str | None = None,
        distribuidor_id: uuid.UUID | None = None,
        monto_min: float | None = None,
        monto_max: float | None = None,
        orden: str = "desc",
    ) -> ListadoOrdenesResponse:
        """Lista órdenes de compra del cliente.

        `orden` ordena por fecha de emisión: `desc` (lo más nuevo primero, el
        default) o `asc`.
        """
        limit = max(1, cantidad_pagina)
        offset = max(0, (numero_pagina - 1) * limit)

        rows, total_ordenes = await self.repo.listar_por_cliente_paginado(
            cliente_id, estado, limit, offset, q, distribuidor_id, monto_min, monto_max,
            descendente=(orden != "asc"),
        )

        result: list[OrdenPedidoListItem] = []
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
            # `pedido` es la relación inversa: llega como dict, como lista de
            # uno o como None si la orden todavía no se pagó.
            pedido_data = row.get("pedido") or {}
            if isinstance(pedido_data, list):
                pedido_data = pedido_data[0] if pedido_data else {}
            pedido_id = pedido_data.get("id")

            result.append(OrdenPedidoListItem(
                id=uuid.UUID(row["id"]) if isinstance(row["id"], str) else row["id"],
                estado=row["estado"],
                total=total,
                pre_autorizado=row.get("pre_autorizado", False),
                distribuidor_nombre=dist_data.get("nombre_negocio"),
                distribuidor_imagen=dist_user_data.get("imagen_perfil"),
                created_at=row.get("created_at"),
                pedido_id=uuid.UUID(pedido_id) if isinstance(pedido_id, str) else pedido_id,
                paquetes=paquetes,
            ))
        # `siguiente_url` / `anterior_url` los arma el router, que es el unico
        # que conoce la URL real del endpoint.
        return ListadoOrdenesResponse(
            total_ordenes=total_ordenes,
            total_paginas=(total_ordenes + limit - 1) // limit if limit > 0 else 1,
            pagina_actual=numero_pagina,
            tiene_siguiente=(offset + limit) < total_ordenes,
            tiene_anterior=offset > 0,
            siguiente_url=None,
            anterior_url=None,
            ordenes=result
        )


    # ── Bandeja del distribuidor ──────────────────────────────────────────

    #: Los estados que siempre salen en el resumen, en el orden en que la
    #: pantalla los muestra. Van todos aunque valgan 0.
    ESTADOS_RESUMEN = ("pendiente", "aceptada", "rechazada", "cancelada")

    async def listar_ordenes_distribuidor_paginado(
        self,
        distribuidor_id: uuid.UUID,
        estado: str | None = None,
        cantidad_pagina: int = 10,
        numero_pagina: int = 1,
        q: str | None = None,
        cliente_id: uuid.UUID | None = None,
        fecha_desde: str | None = None,
        fecha_hasta: str | None = None,
        orden: str = "desc",
    ) -> ListadoOrdenesResponse:
        """La bandeja de órdenes del distribuidor.

        Además del listado paginado, cada orden llega respondiendo tres cosas
        que el vendedor necesita para decidir sin salir de la pantalla: si le
        alcanza el inventario (`cobertura` y el detalle por partida), si el
        cliente ya le compró antes (`cliente_ordenes_previas`) y a dónde hay
        que entregar (`destino`).
        """
        limit = max(1, cantidad_pagina)
        offset = max(0, (numero_pagina - 1) * limit)

        rows, total_ordenes = await self.repo.listar_por_distribuidor_paginado(
            distribuidor_id, estado, limit, offset, q, cliente_id,
            fecha_desde, fecha_hasta, descendente=(orden != "asc"),
        )

        # Dos consultas más para toda la página, no una por orden.
        cobertura, veredictos = await self._cobertura_de_stock(distribuidor_id)
        historial = await self._historial_de_clientes(distribuidor_id, rows)

        ordenes = [
            self._orden_de_distribuidor(row, cobertura, veredictos, historial)
            for row in rows
        ]

        return ListadoOrdenesResponse(
            total_ordenes=total_ordenes,
            total_paginas=(total_ordenes + limit - 1) // limit if limit > 0 else 1,
            pagina_actual=numero_pagina,
            tiene_siguiente=(offset + limit) < total_ordenes,
            tiene_anterior=offset > 0,
            siguiente_url=None,
            anterior_url=None,
            ordenes=ordenes,
        )

    async def resumen_ordenes_distribuidor(
        self,
        distribuidor_id: uuid.UUID,
        q: str | None = None,
        cliente_id: uuid.UUID | None = None,
        fecha_desde: str | None = None,
        fecha_hasta: str | None = None,
    ) -> ResumenOrdenesResponse:
        """Cuántas órdenes del distribuidor hay en cada estado, y de las
        pendientes, cuántas puede surtir con el inventario que le queda."""
        filas = await self.repo.contar_por_estado_distribuidor(
            distribuidor_id, q, cliente_id, fecha_desde, fecha_hasta,
        )
        conteos = Counter(f["estado"] for f in filas)
        por_estado = {estado: conteos.get(estado, 0) for estado in self.ESTADOS_RESUMEN}

        # El veredicto se calcula sobre **todas** las pendientes (el inventario
        # es uno solo), pero solo se cuentan las que pasaron los filtros.
        _, veredictos = await self._cobertura_de_stock(distribuidor_id)
        pendientes = [str(f["id"]) for f in filas if f["estado"] == "pendiente"]
        surtibles = sum(1 for oid in pendientes if veredictos.get(oid) == "completo")

        return ResumenOrdenesResponse(
            total=sum(conteos.values()),
            por_estado=por_estado,
            surtibles=surtibles,
            con_faltantes=len(pendientes) - surtibles,
        )

    # ── ¿Puedo surtir esta orden? ─────────────────────────────────────────

    async def _cobertura_de_stock(
        self, distribuidor_id: uuid.UUID
    ) -> tuple[dict[str, dict], dict[str, str]]:
        """Cuánto inventario le queda a cada orden cuando le toca su turno.

        Las existencias son una sola bolsa: dos órdenes pendientes pueden ser
        surtibles por separado y no a la vez. Por eso no se compara cada orden
        contra el inventario completo, sino contra **lo que queda**:

        1. Se parte de `producto.existencias`.
        2. Se descuenta todo lo que comprometieron las órdenes **aceptadas**,
           que se van a surtir sí o sí.
        3. Se recorren las **pendientes** de la más vieja a la más nueva,
           anotando qué le quedaba a cada una y descontando lo suyo antes de
           pasar a la siguiente.

        Devuelve dos mapas por id de orden: qué existencias vio cada partida y
        el veredicto de la orden completa.
        """
        productos = await self.db.select(
            "producto", "id, existencias, disponible", {"distribuidor_id": str(distribuidor_id)},
        ) or []
        # Un producto marcado como no disponible no se puede surtir aunque el
        # almacén diga que hay piezas.
        restante: dict[str, float] = {
            p["id"]: float(p.get("existencias") or 0) if p.get("disponible") else 0.0
            for p in productos
        }

        ordenes = await self.repo.compromisos_de_stock(distribuidor_id)
        aceptadas = [o for o in ordenes if o.get("estado") == "aceptada"]
        pendientes = [o for o in ordenes if o.get("estado") == "pendiente"]

        for orden in aceptadas:
            for paq in orden.get("paquete_pedido") or []:
                pid = str(paq["producto_id"])
                restante[pid] = restante.get(pid, 0.0) - float(paq["cantidad"])

        por_orden: dict[str, dict] = {}
        veredictos: dict[str, str] = {}
        for orden in pendientes:
            disponible_aqui: dict[str, float] = {}
            paquetes = orden.get("paquete_pedido") or []
            suficientes = 0
            for paq in paquetes:
                pid = str(paq["producto_id"])
                queda = restante.get(pid, 0.0)
                disponible_aqui[pid] = queda
                if queda >= float(paq["cantidad"]):
                    suficientes += 1
                restante[pid] = queda - float(paq["cantidad"])

            por_orden[str(orden["id"])] = disponible_aqui
            # Una orden sin partidas no tiene nada que surtir, así que no
            # estorba: cuenta como completa.
            if not paquetes or suficientes == len(paquetes):
                veredictos[str(orden["id"])] = "completo"
            elif suficientes == 0:
                veredictos[str(orden["id"])] = "sin_stock"
            else:
                veredictos[str(orden["id"])] = "parcial"

        return por_orden, veredictos

    async def _historial_de_clientes(
        self, distribuidor_id: uuid.UUID, rows: list[dict]
    ) -> dict[str, tuple[int, float]]:
        """Cuántas órdenes le aceptó antes este distribuidor a cada cliente de
        la página, y por cuánto dinero."""
        cliente_ids = list({str(r["cliente_id"]) for r in rows if r.get("cliente_id")})
        previas = await self.repo.historial_por_cliente(distribuidor_id, cliente_ids)

        historial: dict[str, tuple[int, float]] = {}
        for orden in previas:
            cid = str(orden["cliente_id"])
            total = sum(
                float(p["costo_unitario"]) * int(p["cantidad"])
                for p in (orden.get("paquete_pedido") or [])
            )
            veces, monto = historial.get(cid, (0, 0.0))
            historial[cid] = (veces + 1, monto + total)
        return historial

    def _orden_de_distribuidor(
        self,
        row: dict,
        cobertura: dict[str, dict],
        veredictos: dict[str, str],
        historial: dict[str, tuple[int, float]],
    ) -> OrdenPedidoListItem:
        """Arma una orden de la bandeja, con stock, cliente y destino."""
        cliente = _primero(row.get("cliente"))
        usuario = _primero(cliente.get("usuario"))
        direccion = _primero(row.get("direccion_cliente"))
        pedido = _primero(row.get("pedido"))

        partes = [direccion.get("ciudad"), direccion.get("estado")]
        destino = ", ".join(x for x in partes if x) or None

        disponible_aqui = cobertura.get(str(row["id"]), {})
        # Solo las pendientes tienen turno en el reparto de inventario; en las
        # demás la pregunta ya no aplica.
        evalua_stock = row.get("estado") == "pendiente"

        paquetes: list[PaquetePedidoResponse] = []
        total = 0.0
        for paq in row.get("paquete_pedido") or []:
            producto = _primero(paq.get("producto"))
            cantidad = int(paq["cantidad"])
            costo = float(paq["costo_unitario"])
            total += cantidad * costo

            existencias = disponible_aqui.get(str(paq["producto_id"])) if evalua_stock else None
            suficiente = None if existencias is None else existencias >= cantidad

            paquetes.append(PaquetePedidoResponse(
                id=uuid.UUID(paq["id"]) if isinstance(paq.get("id"), str) else (paq.get("id") or uuid.uuid4()),
                producto_id=uuid.UUID(paq["producto_id"]) if isinstance(paq["producto_id"], str) else paq["producto_id"],
                cantidad=cantidad,
                costo_unitario=costo,
                subtotal=cantidad * costo,
                medida_snapshot=paq.get("medida_snapshot") or {},
                nombre_producto=producto.get("nombre"),
                imagen_producto=producto.get("imagen"),
                existencias=existencias,
                suficiente=suficiente,
            ))

        cobertura_orden = veredictos.get(str(row["id"])) if evalua_stock else None

        cliente_id = row.get("cliente_id")
        veces, monto = historial.get(str(cliente_id), (0, 0.0))

        return OrdenPedidoListItem(
            id=uuid.UUID(row["id"]) if isinstance(row["id"], str) else row["id"],
            estado=row["estado"],
            total=total,
            pre_autorizado=row.get("pre_autorizado", False),
            cliente_id=cliente_id,
            cliente_nombre=usuario.get("nombre"),
            cliente_imagen=usuario.get("imagen_perfil"),
            created_at=row.get("created_at"),
            pedido_id=pedido.get("id"),
            paquetes=paquetes,
            destino=destino,
            cobertura=cobertura_orden,
            cliente_ordenes_previas=veces,
            cliente_monto_historico=monto,
        )

    # ── Exportación contable ──────────────────────────────────────────────

    #: Formatos que el front puede pedir. Mientras uno no esté acá, la pantalla
    #: lo muestra deshabilitado en vez de ofrecer una descarga que falla.
    FORMATOS_EXPORTACION = ("xlsx",)

    ENCABEZADOS_EXPORTACION = (
        "ID de la orden",
        "Fecha de emisión",
        "Distribuidor",
        "Estado",
        "Pre autorizado",
        "Partidas",
        "Producto",
        "Cantidad",
        "Unidad",
        "Costo unitario",
        "Subtotal",
        "Total de la orden",
    )

    async def exportar_ordenes_cliente(
        self,
        cliente_id: uuid.UUID,
        estado: str | None = None,
        q: str | None = None,
        distribuidor_id: uuid.UUID | None = None,
        monto_min: float | None = None,
        monto_max: float | None = None,
        orden: str = "desc",
    ) -> bytes:
        """Arma el libro de Excel con las órdenes del cliente (una fila por
        partida) y lo devuelve en memoria, listo para que el router lo sirva.

        Respeta los mismos filtros que el listado: lo que se exporta es lo que
        el usuario está viendo, no toda su historia.
        """
        from openpyxl import Workbook

        filas = await self.repo.listar_todas_por_cliente(
            cliente_id, estado, q, distribuidor_id, monto_min, monto_max,
            descendente=(orden != "asc"),
        )

        libro = Workbook()
        hoja = libro.active
        hoja.title = "Órdenes de compra"
        hoja.append(list(self.ENCABEZADOS_EXPORTACION))

        for row in filas:
            paquetes = row.get("paquete_pedido") or []
            total = sum(float(p["costo_unitario"]) * int(p["cantidad"]) for p in paquetes)
            dist = row.get("distribuidor") or {}
            if isinstance(dist, list):
                dist = dist[0] if dist else {}
            identificador = str(row["id"])
            fecha = str(row.get("created_at") or "")[:10]

            if not paquetes:
                hoja.append([identificador, fecha, dist.get("nombre_negocio"), row.get("estado"),
                             bool(row.get("pre_autorizado")), 0, None, None, None, None, None, total])
                continue

            for p in paquetes:
                producto = p.get("producto") or {}
                if isinstance(producto, list):
                    producto = producto[0] if producto else {}
                medida = p.get("medida_snapshot") or {}
                cantidad = int(p["cantidad"])
                costo = float(p["costo_unitario"])
                hoja.append([
                    identificador,
                    fecha,
                    dist.get("nombre_negocio"),
                    row.get("estado"),
                    bool(row.get("pre_autorizado")),
                    len(paquetes),
                    producto.get("nombre") or medida.get("nombre"),
                    cantidad,
                    medida.get("unidad"),
                    costo,
                    cantidad * costo,
                    total,
                ])

        # Un ancho fijo por columna: openpyxl no mide el texto solo.
        for columna, ancho in zip(hoja.columns, (38, 16, 26, 14, 14, 10, 34, 10, 10, 16, 14, 18)):
            hoja.column_dimensions[columna[0].column_letter].width = ancho

        buffer = BytesIO()
        libro.save(buffer)
        return buffer.getvalue()
