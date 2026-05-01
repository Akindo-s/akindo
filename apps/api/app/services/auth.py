"""
AuthService — Login · registro · refresh token.

Implementación completa del use case: RegistroCliente.
"""

from app.core.exceptions import ConflictException
from app.events.bus import event_bus
from app.events.cliente_registrado import ClienteRegistrado
from app.infrastructure.database import DatabaseSession
from app.models.cliente import Cliente
from app.repositories.cliente import ClienteRepo
from app.repositories.usuario import UsuarioRepo
from app.schemas.auth import RegistroClienteRequest, RegistroClienteResponse


class AuthService:
    """Servicio de autenticación y registro."""

    def __init__(self, db: DatabaseSession):
        self.db = db
        self.usuario_repo = UsuarioRepo(db)
        self.cliente_repo = ClienteRepo(db)

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

        return RegistroClienteResponse( # TODO deberiamos de hacer auto login
            id=cliente.id,
            nombre=cliente.nombre,
            email=cliente.email,
            telefono=cliente.telefono,
            es_verificado=cliente.es_verificado,
            created_at=cliente.fecha_creacion,
        )

    # ── Login ──────────────────────────────────────────────────────

    async def login(self):
        pass

    # ── Refresh token ──────────────────────────────────────────────

    async def refresh_token(self):
        pass
