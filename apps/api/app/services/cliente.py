"""
ClienteService — Perfil · direcciones · pedidos · carrito · imagen.
"""

from uuid import UUID

from app.core.exceptions import NotFoundException, ValidationException
from app.events.bus import event_bus
from app.events.cliente_perfil import (
    ClienteImagenPerfilSubida,
    ClientePerfilActualizado,
    ClientePerfilConsultado,
)
from app.infrastructure.database import DatabaseSession
from app.infrastructure.storage import StorageAdapter
from app.repositories.cliente import ClienteRepo
from app.repositories.usuario import UsuarioRepo
from app.schemas.cliente import (
    CarritoItemResponse,
    CarritoResponse,
    ClientePerfilResponse,
    ClientePerfilUpdateRequest,
    DireccionResponse,
    ImagenPerfilResponse,
    PedidoResumenResponse,
)


class ClienteService:
    """Lógica de negocio para clientes autenticados."""

    ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

    def __init__(self, db: DatabaseSession, storage: StorageAdapter | None = None):
        self.db = db
        self.usuario_repo = UsuarioRepo(db)
        self.cliente_repo = ClienteRepo(db)
        self.storage = storage

    # ── Perfil ─────────────────────────────────────────────────────

    async def get_perfil(self, usuario_id: UUID) -> ClientePerfilResponse:
        """Obtiene el perfil del cliente autenticado."""
        usuario = await self.usuario_repo.get_by_id(usuario_id)
        if not usuario:
            raise NotFoundException("Cliente no encontrado")

        # Publicar evento de consulta
        await event_bus.publish(
            ClientePerfilConsultado(usuario_id=usuario_id)
        )

        return ClientePerfilResponse(
            id=usuario["id"],
            nombre=usuario["nombre"],
            email=usuario["email"],
            telefono=usuario.get("telefono"),
            imagen_perfil=usuario.get("imagen_perfil"),
            es_verificado=usuario.get("es_verificado", False),
            fecha_creacion=usuario.get("fecha_creacion"),
        )

    async def actualizar_perfil(
        self, usuario_id: UUID, data: ClientePerfilUpdateRequest
    ) -> ClientePerfilResponse:
        """
        Actualiza parcialmente el perfil del cliente.
        Solo actualiza los campos que se envían (exclude_unset).
        """
        # Obtener solo los campos enviados
        campos = data.model_dump(exclude_unset=True)

        if not campos:
            raise ValidationException("No se enviaron campos para actualizar")

        # Actualizar en DB
        await self.usuario_repo.update_partial(usuario_id, campos)

        # Publicar evento
        await event_bus.publish(
            ClientePerfilActualizado(
                usuario_id=usuario_id,
                campos_actualizados=list(campos.keys()),
            )
        )

        # Retornar perfil actualizado
        return await self.get_perfil(usuario_id)

    # ── Imagen de perfil ───────────────────────────────────────────

    async def subir_imagen_perfil(
        self, usuario_id: UUID, file_data: bytes, content_type: str, filename: str
    ) -> ImagenPerfilResponse:
        """
        Sube la imagen de perfil a Supabase Storage y actualiza la URL en la DB.
        """
        # Validar tipo de archivo
        if content_type not in self.ALLOWED_IMAGE_TYPES:
            raise ValidationException(
                f"Tipo de archivo no permitido: {content_type}. "
                f"Permitidos: {', '.join(self.ALLOWED_IMAGE_TYPES)}"
            )

        # Validar tamaño
        if len(file_data) > self.MAX_IMAGE_SIZE:
            raise ValidationException(
                f"La imagen excede el tamaño máximo de {self.MAX_IMAGE_SIZE // (1024 * 1024)} MB"
            )

        # Determinar extensión
        ext = content_type.split("/")[-1]
        if ext == "jpeg":
            ext = "jpg"
        path = f"avatars/{usuario_id}.{ext}"

        # Subir a Supabase Storage
        url = await self.storage.upload("avatars", path, file_data, content_type)

        # Actualizar URL en la DB
        await self.usuario_repo.update_partial(usuario_id, {"imagen_perfil": url})

        # Publicar evento
        await event_bus.publish(
            ClienteImagenPerfilSubida(
                usuario_id=usuario_id,
                url_imagen=url,
            )
        )

        return ImagenPerfilResponse(imagen_perfil=url)

    # ── Direcciones ────────────────────────────────────────────────

    async def get_direcciones(self, cliente_id: UUID) -> list[DireccionResponse]:
        """Obtiene todas las direcciones del cliente."""
        rows = await self.cliente_repo.get_direcciones(cliente_id)
        return [DireccionResponse(**row) for row in rows]

    async def crear_direccion(self,cliente_id: UUID,direccion)->DireccionResponse:
        # TODO : aqui deberia de ir un algoritmo de verificacion de direccion, queremos saber que es real.
        response = await self.cliente_repo.crear_direccion(cliente_id,direccion.model_dump())
        if response.get("id") == None:
            raise Exception(f"No se creo correctamente la direccion para el cliente {cliente_id}")
        return DireccionResponse(
            id=response.get('id'),
            calle=response.get("calle"),
            ciudad=response.get('ciudad'),
            estado=response.get('estado'),
            codigo_postal=response.get('codigo_postal'),
            es_predeterminada=response.get('es_predeterminada')
        )
        

    # ── Pedidos ────────────────────────────────────────────────────

    async def get_pedidos(self, cliente_id: UUID) -> list[PedidoResumenResponse]:
        """Obtiene todas las órdenes de pedido del cliente."""
        rows = await self.cliente_repo.get_pedidos(cliente_id)
        return [PedidoResumenResponse(**row) for row in rows]

    # ── Carrito ────────────────────────────────────────────────────

    async def get_carritos(self, cliente_id: UUID) -> list[CarritoResponse]:
        """Obtiene todos los carritos del cliente con sus items."""
        rows = await self.cliente_repo.get_carritos(cliente_id)
        carritos = []
        for row in rows:
            items_data = row.get("carrito_item", [])
            items = [CarritoItemResponse(**item) for item in items_data]
            carritos.append(
                CarritoResponse(
                    id=row["id"],
                    distribuidor_id=row["distribuidor_id"],
                    fecha_actualizacion=row.get("fecha_actualizacion"),
                    items=items,
                )
            )
        return carritos
