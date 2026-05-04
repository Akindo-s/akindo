"""
Aggregate root — Administrador.
Extiende Usuario usando herencia class table (tabla `usuario` + tabla `administrador`).
"""

from datetime import datetime
from dataclasses import dataclass

from app.core.hashing import Hasher

from .base import TipoUsuario
from .usuario import Usuario


@dataclass(kw_only=True)
class Administrador(Usuario):
    """
    Aggregate root del contexto de Administrador.
    """

    def check(self) -> None:
        super().check()
        from app.core.exceptions.base import AggregateNoValido
        if self.tipo != TipoUsuario.ADMIN:
            raise AggregateNoValido("El tipo de usuario debe ser admin")

    @classmethod
    def crear(
        cls,
        nombre: str,
        email: str,
        password: str,
        telefono: str | None = None,
        fecha_creacion: datetime | None = None
    ) -> "Administrador":
        return cls(
            nombre=nombre,
            email=email,
            password_hash=Hasher.hash(password),
            telefono=telefono,
            tipo=TipoUsuario.ADMIN,
            fecha_creacion=fecha_creacion
        )

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "nombre": self.nombre,
            "email": self.email,
            "password_hash": self.password_hash,
            "telefono": self.telefono,
            "imagen_perfil": self.imagen_perfil,
            "es_verificado": self.es_verificado,
            "tipo": self.tipo.value,
            'fecha_creacion': str(self.fecha_creacion) if self.fecha_creacion else None
        }
