"""
JWTProvider — firma y validación de tokens JWT.
Usa python-jose con algoritmo configurable desde settings.
"""

from datetime import datetime, timedelta, timezone

from jose import ExpiredSignatureError, JWTError, jwt

from app.core.config import settings
from app.core.exceptions import TokenExpiredException, InvalidTokenException


class JWTProvider:
    """Proveedor de tokens JWT."""

    def __init__(self):
        self._secret = settings.SECRET_KEY
        self._algorithm = settings.JWT_ALGORITHM
        self._expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES

    def create_access_token(self, data: dict) -> str:
        """
        Genera un token de acceso firmado.

        El payload debe contener al menos:
          - sub: str(user_id)
          - tipo: "cliente" | "distribuidor" | "admin"
        Se agrega automáticamente `exp`.
        """
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=self._expire_minutes)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self._secret, algorithm=self._algorithm)

    def verify_token(self, token: str) -> dict:
        """
        Valida un token y retorna su payload.

        Raises:
            TokenExpiredException: si el token ha expirado.
            InvalidTokenException: si el token es inválido o malformado.
        """
        try:
            payload = jwt.decode(token, self._secret, algorithms=[self._algorithm])
            if payload.get("sub") is None:
                raise InvalidTokenException("Token sin identificador de usuario")
            return payload
        except ExpiredSignatureError:
            raise TokenExpiredException()
        except JWTError:
            raise InvalidTokenException()
