"""
AuthService — Login · registro.

Implementación de los use cases: RegistroCliente, LoginCliente.
"""

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
from app.schemas.auth import (
    LoginRequest,
    RegistroClienteRequest,
    RegistroClienteResponse,
    TokenResponse,
)
logger = logging.getLogger("akindo.clientes")

class AuthService:
    """Servicio de autenticación y registro."""

    def __init__(self, db: DatabaseSession):
        self.db = db
        self.usuario_repo = UsuarioRepo(db)
        self.cliente_repo = ClienteRepo(db)
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
        await self.cliente_repo.save(cliente)

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

    # ── Login ──────────────────────────────────────────────────────

    async def login(self, data: LoginRequest) -> TokenResponse:
        """
        Autentica al usuario con email y contraseña:
        1. Busca al usuario por email.
        2. Verifica la contraseña con bcrypt.
        3. Genera un JWT con sub, tipo y exp.
        4. Publica evento ClienteInicioSesion.
        """

        # 1 — Buscar usuario
        usuario = await self.usuario_repo.get_by_email(data.email)
        if not usuario:
            raise UnauthorizedException("Credenciales inválidas")

        # 2 — Verificar contraseña
        if not Hasher.verificar(data.password, usuario.password_hash):
            raise UnauthorizedException("Credenciales inválidas")

        # 3 — Generar token
        token = self._jwt.create_access_token(
            data={
                "sub": str(usuario.id),
                "tipo": usuario.tipo.value,
            }
        )

        # 4 — Publicar evento
        await event_bus.publish(
            ClienteInicioSesion(
                usuario_id=usuario.id,
                email=usuario.email,
            )
        )

        return TokenResponse(access_token=token)
