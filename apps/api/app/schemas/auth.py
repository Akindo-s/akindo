"""
Schemas de autenticación — registro, login, tokens.
"""

from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, EmailStr


class RegistroClienteRequest(BaseModel):
    """Datos requeridos para registrar un nuevo cliente."""
    nombre: str
    email: str
    password: str
    telefono: str | None = None


class RegistroClienteResponse(BaseModel):
    """Respuesta tras un registro exitoso."""
    id: UUID
    nombre: str
    email: str
    telefono: str | None
    es_verificado: bool
    fecha_creacion: datetime | None

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    """Datos para iniciar sesión."""
    email: str
    password: str


class TokenResponse(BaseModel):
    """Respuesta tras login exitoso — contiene el JWT."""
    access_token: str
    token_type: str = "bearer"
