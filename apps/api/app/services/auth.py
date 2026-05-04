"""
AuthService — Login · registro.

Implementación de los use cases: RegistroCliente, LoginCliente.
"""

from app.repositories.administrador import AdministradorRepo
from app.models.administrador import Administrador
from app.schemas.auth import RegistroAdministradorResponse
from app.schemas.auth import RegistroAdministradorRequest
from app.models import TipoUsuario
import logging
from app.core.exceptions import ConflictException, NotFoundException, UnauthorizedException
from app.core.hashing import Hasher
from app.events.bus import event_bus
from app.events.cliente_registrado import ClienteRegistrado
from app.events.cliente_sesion import ClienteInicioSesion
from app.infrastructure.database import DatabaseSession
from app.infrastructure.jwt import JWTProvider
from app.models.cliente import Cliente
from app.repositories.cliente import ClienteRepo
from app.repositories.usuario import UsuarioRepo
from app.repositories.distribuidor import DistribuidorRepo
from app.schemas.auth import (
    LoginRequest,
    RegistroClienteRequest,
    RegistroClienteResponse,
    TokenResponse,
    RegistroDistribuidorRequest,
    RegistroDistribuidorResponse,
)
logger = logging.getLogger("akindo.clientes")

class AuthService:
    """Servicio de autenticación y registro."""

    def __init__(self, db: DatabaseSession):
        self.db = db
        self.usuario_repo = UsuarioRepo(db)
        self.cliente_repo = ClienteRepo(db)
        self.distribuidor_repo = DistribuidorRepo(db)
        self._jwt = JWTProvider()

    # ── Registro de cliente ────────────────────────────────────────

    async def registrar_cliente(
        self, data: RegistroClienteRequest
    ) -> RegistroClienteResponse:
        """
        Registra un nuevo cliente:
        1. Verifica que el email no exista.
        2. Crea el aggregate Cliente vía factory method (hashea password internamente).
        3. Persiste en ambas tablas (usuario + cliente) vía el repo.
        4. Publica el evento ClienteRegistrado.
        """

        # 1 — Verificar email duplicado
        existente = await self.usuario_repo.get_by_email(data.email)
        if existente:
            raise ConflictException("El email ya está registrado")

        # 2 — Crear aggregate vía factory method
        cliente = Cliente.crear(
            nombre=data.nombre,
            email=data.email,
            password=data.password,
            telefono=data.telefono,
        )
        logger.info(f"\n-- Cliente registrado con ID {cliente.id}\n")
        
        # 3 — Persistir (class table: usuario + cliente)
        cliente = await self.cliente_repo.save(cliente)

        # 4 — Publicar evento
        await event_bus.publish(
            ClienteRegistrado(
                usuario_id=cliente.id,
                email=cliente.email,
                nombre_cliente=cliente.nombre,
            )
        )

        return RegistroClienteResponse(
            id=cliente.id,
            nombre=cliente.nombre,
            email=cliente.email,
            telefono=cliente.telefono,
            es_verificado=cliente.es_verificado,
            fecha_creacion=cliente.fecha_creacion,
        )

    # -- Registro de administrador

    async def registrar_administrador(self,data:RegistroAdministradorRequest)->RegistroAdministradorResponse:
        existente = await self.usuario_repo.get_by_email(data.email)
        if existente:
            raise ConflictException("El email ya esta registrado")
        repo = AdministradorRepo(self.db)
        administrador = Administrador.crear(
            nombre=data.nombre,
            email=data.email,
            password = data.password
        )
        await repo.save(administrador)


        return RegistroAdministradorResponse(
            id=administrador.id,
            nombre=administrador.nombre,
            email=administrador.email,
            fecha_creacion=administrador.fecha_creacion
        )

    # ── Registro de distribuidor ────────────────────────────────────────

    async def registrar_distribuidor(
        self, data: RegistroDistribuidorRequest
    ) -> RegistroDistribuidorResponse:
        """
        Registra un nuevo distribuidor:
        1. Verifica que el email no exista.
        2. Crea el aggregate Distribuidor vía factory method.
        3. Persiste en ambas tablas (usuario + distribuidor) vía el repo.
        4. Publica el evento DistribuidorRegistrado.
        """

        # 1 — Verificar email duplicado
        existente = await self.usuario_repo.get_by_email(data.email)
        if existente:
            raise ConflictException("El email ya está registrado")

        from app.models.distribuidor import Distribuidor, DireccionDistribuidor
        from app.events.distribuidor_registrado import DistribuidorRegistrado

        # 2 — Crear aggregate vía factory method
        direccion = DireccionDistribuidor(
            calle=data.direccion.calle,
            ciudad=data.direccion.ciudad,
            estado=data.direccion.estado,
            codigo_postal=data.direccion.codigo_postal,
            es_predeterminada=True
        )

        distribuidor = Distribuidor.crear(
            nombre=data.nombre,
            email=data.email,
            password=data.password,
            telefono=data.telefono,
            rfc=data.rfc,
            nombre_negocio=data.nombre_negocio,
            direccion=direccion,
        )
        logger.info(f"\n-- Distribuidor registrado con ID {distribuidor.id}\n")
        
        # 3 — Persistir (class table: usuario + distribuidor)
        await self.distribuidor_repo.save(distribuidor)
        
        if data.categorias:
            await self.distribuidor_repo.set_categorias(distribuidor.id, data.categorias)

        # 4 — Publicar evento
        await event_bus.publish(
            DistribuidorRegistrado(
                usuario_id=distribuidor.id,
                email=distribuidor.email,
                nombre_negocio=distribuidor.nombre_negocio,
            )
        )

        return RegistroDistribuidorResponse(
            id=distribuidor.id,
            nombre=distribuidor.nombre,
            email=distribuidor.email,
            rfc=distribuidor.rfc,
            nombre_negocio=distribuidor.nombre_negocio,
            fecha_creacion=distribuidor.fecha_creacion,
        )

    # ── Login ──────────────────────────────────────────────────────

    async def login(self, data: LoginRequest) -> TokenResponse:
        """
        Autentica al usuario con email y contraseña:
        1. Busca al usuario por email.
        2. Verifica la contraseña con bcrypt.
        3. Genera un JWT con sub, tipo y exp.
        4. Publica evento ClienteInicioSesion.
        """

        usuario = await self.usuario_repo.get_by_email(data.email)
        if not usuario:
            raise UnauthorizedException("Credenciales inválidas")

        if not Hasher.verificar(data.password, usuario.password_hash):
            raise UnauthorizedException("Credenciales inválidas")

        
        token = self._jwt.create_access_token(
            data={
                "sub": str(usuario.id),
                "tipo": usuario.tipo.value,
            }
        )

        
        await event_bus.publish(
            ClienteInicioSesion(
                usuario_id=usuario.id,
                email=usuario.email,
            )
        )

        return TokenResponse(access_token=token, tipo_usuario=usuario.tipo.value)
