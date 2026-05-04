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
from app.services.usuario import UsuarioService


class ClienteService:
    """Lógica de negocio para clientes autenticados."""

    ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

    def __init__(self, db: DatabaseSession, storage: StorageAdapter | None = None):
        self.db = db
        self.usuario_repo = UsuarioRepo(db)
        self.cliente_repo = ClienteRepo(db)
        self.storage = storage
        self.usuario_service = UsuarioService(db, storage) if storage else None

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
            id=usuario.id,
            nombre=usuario.nombre,
            email=usuario.email,
            telefono=usuario.telefono,
            imagen_perfil=usuario.imagen_perfil,
            es_verificado=usuario.es_verificado,
            fecha_creacion=usuario.fecha_creacion,
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

        # Obtener aggregate
        usuario = await self.usuario_repo.get_by_id(usuario_id)
        if not usuario:
            raise NotFoundException("Cliente no encontrado")

        # Actualizar usando la lógica de dominio
        usuario.actualizar_datos(**campos)

        # Guardar cambios
        await self.usuario_repo.save(usuario)

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
        Sube la imagen de perfil del cliente delegando a UsuarioService.
        """
        if not self.usuario_service:
            raise Exception("Storage provider not configured")
        return await self.usuario_service.subir_imagen_perfil(
            usuario_id=usuario_id,
            file_data=file_data,
            content_type=content_type,
            filename=filename,
        )

    # ── Direcciones ────────────────────────────────────────────────

    async def get_direcciones(self, cliente_id: UUID) -> list[DireccionResponse]:
        """Obtiene todas las direcciones del cliente usando Aggregates."""
        direcciones_agg = await self.cliente_repo.get_direcciones(cliente_id)
        return [DireccionResponse(
            id=d.id,
            calle=d.calle,
            ciudad=d.ciudad,
            estado=d.estado,
            codigo_postal=d.codigo_postal,
            es_predeterminada=d.es_predeterminada
        ) for d in direcciones_agg]

    async def crear_direccion(self, cliente_id: UUID, direccion) -> DireccionResponse:
        from app.models.direccion import DireccionCliente
        
        # 1. Crear el Aggregate (se ejecuta check() en el constructor)
        nueva_direccion = DireccionCliente.crear(
            calle=direccion.calle,
            estado=direccion.estado,
            ciudad=direccion.ciudad,
            codigo_postal=direccion.codigo_postal,
            es_predeterminada=direccion.es_predeterminada
        )
        
        # 2. Persistir
        guardada = await self.cliente_repo.crear_direccion(cliente_id, nueva_direccion)
        
        return DireccionResponse(
            id=guardada.id,
            calle=guardada.calle,
            ciudad=guardada.ciudad,
            estado=guardada.estado,
            codigo_postal=guardada.codigo_postal,
            es_predeterminada=guardada.es_predeterminada
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
