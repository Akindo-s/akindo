"""
Dependencies de autenticación — FastAPI Depends.

get_current_user: genérica, decodifica JWT y retorna datos del usuario.
get_current_cliente: pre-filtra, solo permite usuarios tipo 'cliente'.

La función get_current_user es reutilizable para Distribuidores y Admins.
"""

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

from app.core.exceptions import (
    ForbiddenException,
    InvalidTokenException,
    NotFoundException,
)
from app.infrastructure.database import DatabaseSession, get_db
from app.infrastructure.jwt import JWTProvider
from app.models.base import TipoUsuario
from app.repositories.usuario import UsuarioRepo

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

_jwt = JWTProvider()


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: DatabaseSession = Depends(get_db),
) -> dict:
    """
    Decodifica el JWT del header Authorization y retorna los datos
    del usuario desde la base de datos.

    Raises:
        InvalidTokenException: token inválido o sin 'sub'.
        NotFoundException: el usuario del token no existe en la DB.
    """
    payload = _jwt.verify_token(token)

    usuario_id = payload.get("sub")
    if not usuario_id:
        raise InvalidTokenException("Token sin identificador de usuario")

    repo = UsuarioRepo(db)
    usuario = await repo.get_by_id(usuario_id)
    if not usuario:
        raise NotFoundException("El usuario no existe")

    return usuario


async def get_current_cliente(
    user: dict = Depends(get_current_user),
) -> dict:
    """
    Pre-filtra: solo permite acceso a usuarios de tipo 'cliente'.

    Raises:
        ForbiddenException: si el usuario no es de tipo cliente.
    """
    if user.get("tipo") != TipoUsuario.CLIENTE.value:
        raise ForbiddenException("Solo los clientes autenticados pueden acceder a este recurso")
    return user
