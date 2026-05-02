"""
Auth router — /auth/*
Endpoint de autenticación: login (generación de token JWT).
"""

from fastapi import APIRouter, Depends, status

from app.infrastructure.database import DatabaseSession, get_db
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/token",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Iniciar sesión",
)
async def login(
    data: LoginRequest,
    db: DatabaseSession = Depends(get_db),
):
    """
    Autentica al usuario con email y contraseña.

    - Verifica credenciales contra la base de datos.
    - Genera un JWT con el tipo de usuario y expiración.
    - Retorna el token de acceso.
    """
    service = AuthService(db)
    return await service.login(data)
