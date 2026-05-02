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
from app.repositories.cliente import ClienteRepo
from app.models.cliente import Cliente
from app.repositories.distribuidor import DistribuidorRepo
from app.models.distribuidor import Distribuidor

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

_jwt = JWTProvider()


from app.models.usuario import Usuario

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: DatabaseSession = Depends(get_db),
) -> Usuario:
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
    user: Usuario = Depends(get_current_user),
    db: DatabaseSession = Depends(get_db)
) -> Cliente:
    """
    Pre-filtra: solo permite acceso a usuarios de tipo 'cliente' y retorna el Aggregate Cliente.

    Raises:
        ForbiddenException: si el usuario no es de tipo cliente.
        NotFoundException: si no se encuentra la entidad Cliente.
    """
    if user.tipo != TipoUsuario.CLIENTE:
        raise ForbiddenException("Solo los clientes autenticados pueden acceder a este recurso")
    
    repo = ClienteRepo(db)
    cliente = await repo.get_by_id(user.id)
    if not cliente:
        raise NotFoundException("Entidad Cliente no encontrada para este usuario")
        
    return cliente

async def get_current_distribuidor(
    user: Usuario = Depends(get_current_user),
    db: DatabaseSession = Depends(get_db)
) -> Distribuidor:
    """
    Pre-filtra: solo permite acceso a usuarios de tipo 'distribuidor' y retorna el Aggregate Distribuidor.
    """
    if user.tipo != TipoUsuario.DISTRIBUIDOR:
        raise ForbiddenException("Solo los distribuidores autenticados pueden acceder a este recurso")
    
    repo = DistribuidorRepo(db)
    distribuidor = await repo.get_by_id(user.id)
    if not distribuidor:
        raise NotFoundException("Entidad Distribuidor no encontrada para este usuario")
        
    return distribuidor