"""
Entidad base — Usuario.
Refleja la tabla `usuario` como dataclass puro (sin ORM).
Clase abstracta: no se instancia directamente, se usa vía herencia (class table).
"""

from datetime import datetime
from dataclasses import dataclass

import re
from app.core.exceptions.base import AggregateNoValido
from .base import Aggregate, TipoUsuario


@dataclass(kw_only=True)
class Usuario(Aggregate):
    """
    Entidad base de usuario. Refleja la tabla `usuario`.
    Abstracta — las subclases concretas (Cliente, Distribuidor) la extienden.
    """

    nombre: str
    email: str
    password_hash: str
    telefono: str | None = None
    imagen_perfil: str | None = None
    es_verificado: bool = False
    tipo: TipoUsuario = TipoUsuario.CLIENTE
    fecha_creacion:datetime | None = None

    def check(self) -> None:
        """Verifica que el email no esté vacío y tenga un formato válido."""
        if not self.email:
            raise AggregateNoValido("El email no puede estar vacío")
        
        # Simple regex para validación de email
        email_regex = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        if not re.match(email_regex, self.email):
            raise AggregateNoValido(f"El email '{self.email}' no tiene un formato válido")

    def actualizar_datos(self, nombre: str | None = None, telefono: str | None = None) -> None:
        """Actualiza los datos del usuario asegurando que los invariantes se mantengan."""
        if nombre is not None:
            self.nombre = nombre
        if telefono is not None:
            self.telefono = telefono
        self.check()

    @classmethod
    def crear(cls, **kwargs) -> "Usuario":
        """Factory method base para crear un usuario."""
        return cls(**kwargs)

    def to_dict(self) -> dict:
        """Serializa los datos base del usuario."""
        return {
            "id": str(self.id),
            "nombre": self.nombre,
            "email": self.email,
            "password_hash": self.password_hash,
            "telefono": self.telefono,
            "imagen_perfil": self.imagen_perfil,
            "es_verificado": self.es_verificado,
            "tipo": self.tipo.value,
            "fecha_creacion": str(self.fecha_creacion) if self.fecha_creacion else None
        }
