"""
Aggregate root — Cliente.
Extiende Usuario usando herencia class table (tabla `usuario` + tabla `cliente`).
"""

from datetime import datetime
from dataclasses import dataclass

from app.core.hashing import Hasher

from .base import TipoUsuario
from .usuario import Usuario


@dataclass(kw_only=True)
class Cliente(Usuario):
    """
    Aggregate root del contexto de Cliente.
    Hereda de Usuario (class table inheritance) y encapsula
    toda la lógica de creación y serialización del dominio.
    """

    @classmethod
    def crear(
        cls,
        nombre: str,
        email: str,
        password: str,
        telefono: str | None = None,
        fecha_creacion:datetime | None = None
    ) -> "Cliente":
        """
        Factory method — crea un nuevo Cliente con password hasheado.
        Encapsula la lógica de dominio para la creación de un cliente.
        """
        return cls(
            nombre=nombre,
            email=email,
            password_hash=Hasher.hash(password),
            telefono=telefono,
            tipo=TipoUsuario.CLIENTE,
            fecha_creacion=fecha_creacion
        )

    def to_dict(self) -> dict:
        """Serializa el aggregate a un diccionario plano."""
        return {
            "id": str(self.id),
            "nombre": self.nombre,
            "email": self.email,
            "password_hash": self.password_hash,
            "telefono": self.telefono,
            "imagen_perfil": self.imagen_perfil,
            "es_verificado": self.es_verificado,
            "tipo": self.tipo.value,
            'fecha_creacion':str(self.fehca_creacion)
        }
