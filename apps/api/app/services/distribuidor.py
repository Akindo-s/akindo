"""
DistribuidorService — Lógica de negocio para los distribuidores.
"""

from uuid import UUID

from app.core.exceptions import NotFoundException, ValidationException
from app.infrastructure.database import DatabaseSession
from app.infrastructure.storage import StorageAdapter
from app.repositories.distribuidor import DistribuidorRepo
from app.schemas.distribuidor import (
    DistribuidorResponse,
    DistribuidorUpdateInfo,
    CatalogoPaginatedResponse,
    DistribuidoresPaginatedResponse,
    ValoracionResponse,
    UpsertDireccionDistribuidorRequest,
    DireccionDistribuidorResponse,
    ResumenDashboardResponse,
    AlertaExistenciaResponse,
    PedidoActivoDistribuidorResponse
)
from app.services.usuario import UsuarioService


class DistribuidorService:
    """Lógica de negocio para distribuidores."""

    ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

    def __init__(self, db: DatabaseSession, storage: StorageAdapter | None = None):
        self.db = db
        self.repo = DistribuidorRepo(db)
        self.storage = storage
        self.usuario_service = UsuarioService(db, storage) if storage else None

    async def listar_distribuidores(
        self,
        numero_pagina: int,
        cantidad_pagina: int,
        categorias: list[UUID] | None = None,
        valoracion_min: float | None = None,
        valoracion_max: float | None = None
    ) -> DistribuidoresPaginatedResponse:
        """Obtiene una lista paginada de distribuidores usando el RPC mini_catalogo_distribuidores."""
        if numero_pagina < 1:
            numero_pagina = 1
        if cantidad_pagina < 1:
            cantidad_pagina = 5
            
        limit = cantidad_pagina
        offset = (numero_pagina - 1) * limit
        
        resultado_dict = await self.repo.obtener_todos_paginados(
            limite=limit,
            offset=offset,
            categorias=categorias,
            valoracion_min=valoracion_min,
            valoracion_max=valoracion_max
        )
        return DistribuidoresPaginatedResponse(**resultado_dict)

    async def obtener_distribuidor(self, distribuidor_id: UUID) -> DistribuidorResponse:
        """Obtiene los detalles de un distribuidor específico."""
        distribuidor = await self.repo.get_by_id(distribuidor_id)
        if not distribuidor:
            raise NotFoundException("Distribuidor no encontrado")
        return DistribuidorResponse.model_validate(distribuidor)

    async def get_catalogo(self, distribuidor_id: UUID, numero_pagina: int, cantidad_pagina: int) -> CatalogoPaginatedResponse:
        """Obtiene el catálogo paginado llamando al RPC."""
        # Verificar que el distribuidor exista
        distribuidor = await self.repo.get_by_id(distribuidor_id)
        if not distribuidor:
            raise NotFoundException("Distribuidor no encontrado")

        limit = max(1, cantidad_pagina)
        offset = max(0, (numero_pagina - 1) * limit)
        
        catalogo_dict = await self.repo.get_catalogo(distribuidor_id, limit, offset)
        return CatalogoPaginatedResponse(**catalogo_dict)

    async def get_valoraciones(self, distribuidor_id: UUID) -> list[ValoracionResponse]:
        """Obtiene las valoraciones de un distribuidor."""
        # Verificar que el distribuidor exista
        distribuidor = await self.repo.get_by_id(distribuidor_id)
        if not distribuidor:
            raise NotFoundException("Distribuidor no encontrado")
            
        rows = await self.repo.get_valoraciones(distribuidor_id)
        return [ValoracionResponse(**row) for row in rows]

    async def actualizar_informacion_distribuidor(self, distribuidor_id: UUID, data: DistribuidorUpdateInfo) -> DistribuidorResponse:
        """Actualiza la información pública del negocio del distribuidor."""
        distribuidor = await self.repo.get_by_id(distribuidor_id)
        if not distribuidor:
            raise NotFoundException("Distribuidor no encontrado")

        campos = data.model_dump(exclude_unset=True)
        if not campos:
            raise ValidationException("No se enviaron campos para actualizar")

        # Usar lógica de dominio
        distribuidor.actualizar_informacion_negocio(
            nombre_negocio=campos.get("nombre_negocio"),
            # RFC is technically allowed in our method, but our schema doesn't allow changing it
        )
        if "telefono" in campos:
            # Reutilizando el método de Usuario (clase base)
            distribuidor.actualizar_datos(telefono=campos["telefono"])

        # Guardar en base de datos
        await self.repo.save(distribuidor)
        
        if "categorias" in campos and campos["categorias"] is not None:
            await self.repo.set_categorias(distribuidor.id, campos["categorias"])
        
        return DistribuidorResponse.model_validate(distribuidor)

    async def subir_imagen_negocio(self, distribuidor_id: UUID, file_data: bytes, content_type: str, filename: str) -> DistribuidorResponse:
        """Sube la imagen de negocio del distribuidor delegando a UsuarioService."""
        if not self.usuario_service:
            raise Exception("Storage provider not configured")
        # Delegar la subida a UsuarioService
        await self.usuario_service.subir_imagen_perfil(
            usuario_id=distribuidor_id,
            file_data=file_data,
            content_type=content_type,
            filename=filename,
        )
        # Retornar el distribuidor actualizado
        distribuidor = await self.repo.get_by_id(distribuidor_id)
        if not distribuidor:
            raise NotFoundException("Distribuidor no encontrado")
        return DistribuidorResponse.model_validate(distribuidor)

    async def upsert_direccion(self, distribuidor_id: UUID, data: UpsertDireccionDistribuidorRequest) -> list[DireccionDistribuidorResponse]:
        """Añade o actualiza una dirección para el distribuidor."""
        distribuidor = await self.repo.get_by_id(distribuidor_id)
        if not distribuidor:
            raise NotFoundException("Distribuidor no encontrado")

        from app.models.distribuidor import DireccionDistribuidor
        
        # En caso de marcarse como predeterminada, limpiar las otras
        if data.es_predeterminada:
            for d in distribuidor.direcciones:
                d.es_predeterminada = False
                
        # Agregar la nueva direccion al aggregate
        nueva_direccion = DireccionDistribuidor(
            calle=data.calle,
            ciudad=data.ciudad,
            estado=data.estado,
            codigo_postal=data.codigo_postal,
            es_predeterminada=data.es_predeterminada
        )
        distribuidor.direcciones.append(nueva_direccion)
        
        # Guardar cambios
        await self.repo.save(distribuidor)
        
        # Refrescar y validar
        return [DireccionDistribuidorResponse.model_validate(d) for d in distribuidor.direcciones]

    async def get_resumen_dashboard(self, distribuidor_id: UUID, umbral_stock: int = 67) -> ResumenDashboardResponse:
        """Obtiene el resumen del dashboard llamando al RPC."""
        distribuidor = await self.repo.get_by_id(distribuidor_id)
        if not distribuidor:
            raise NotFoundException("Distribuidor no encontrado")
            
        data = await self.db.rpc("get_resumen_distribuidor", {
            "p_distribuidor_id": str(distribuidor_id),
            "p_umbral_stock": umbral_stock
        })
        
        if not data:
            return ResumenDashboardResponse(volumen_bruto_mes=0.0, pedidos_activos=0, productos_poco_stock=0)
            
        return ResumenDashboardResponse(**data[0])

    async def get_alertas_existencias(self, distribuidor_id: UUID, umbral_stock: int = 67) -> list[AlertaExistenciaResponse]:
        """Obtiene las alertas de existencias llamando al RPC."""
        distribuidor = await self.repo.get_by_id(distribuidor_id)
        if not distribuidor:
            raise NotFoundException("Distribuidor no encontrado")
            
        data = await self.db.rpc("get_alertas_existencias", {
            "p_distribuidor_id": str(distribuidor_id),
            "p_umbral_stock": umbral_stock
        })
        
        return [AlertaExistenciaResponse(**row) for row in data]

    async def get_pedidos_activos(self, distribuidor_id: UUID) -> list[PedidoActivoDistribuidorResponse]:
        """Obtiene los pedidos activos llamando al RPC."""
        distribuidor = await self.repo.get_by_id(distribuidor_id)
        if not distribuidor:
            raise NotFoundException("Distribuidor no encontrado")
            
        data = await self.db.rpc("get_pedidos_activos_distribuidor", {
            "p_distribuidor_id": str(distribuidor_id)
        })
        
        return [PedidoActivoDistribuidorResponse(**row) for row in data]

