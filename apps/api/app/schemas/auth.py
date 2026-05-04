"""
Schemas de autenticación — registro, login, tokens.
"""

from uuid import UUID
from datetime import datetime

from pydantic import BaseModel


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
    tipo_usuario:str


class RegistroDireccionDistribuidorRequest(BaseModel):
    """Datos de la dirección física del distribuidor."""
    calle: str
    ciudad: str
    estado: str
    codigo_postal: str


class RegistroDistribuidorRequest(BaseModel):
    """Datos requeridos para registrar un nuevo distribuidor."""
    nombre: str
    email: str
    password: str
    telefono: str | None = None
    rfc: str
    nombre_negocio: str
    direccion: RegistroDireccionDistribuidorRequest


class RegistroDistribuidorResponse(BaseModel):
    """Respuesta tras un registro de distribuidor exitoso."""
    id: UUID
    nombre: str
    email: str
    rfc: str
    nombre_negocio: str
    fecha_creacion: datetime | None

    model_config = {"from_attributes": True}

class RegistroAdministradorResponse(BaseModel):
    """Respuesta tras un registro de administrador exitoso."""
    id:UUID
    nombre:str
    email: str
    fecha_creacion: datetime | None


class RegistroAdministradorRequest(BaseModel):
    nombre:str
    email:str
    password:str