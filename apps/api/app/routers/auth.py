"""
Auth router — /auth/*
Endpoints de autenticación: registro, login, refresh.
"""

from fastapi import APIRouter, Depends, status

from app.infrastructure.database import DatabaseSession, get_db
from app.schemas.auth import RegistroClienteRequest, RegistroClienteResponse
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/registro/cliente",
    response_model=RegistroClienteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo cliente",
)
async def registrar_cliente(
    data: RegistroClienteRequest,
    db: DatabaseSession = Depends(get_db),
):
    """
    Registra un nuevo usuario de tipo cliente.

    - Valida que el email no esté en uso.
    - Crea registros en `usuario` y `cliente`.
    - Emite evento `ClienteRegistrado`.
    """
    service = AuthService(db)
    return await service.registrar_cliente(data)


@router.post("/login")
async def login():
    """Inicia sesión con email y contraseña."""
    pass


@router.post("/refresh")
async def refresh_token():
    """Refresca el token de acceso."""
    pass
