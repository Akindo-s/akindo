"""
Entidad base — Usuario.
Refleja la tabla `usuario` como dataclass puro (sin ORM).
Clase abstracta: no se instancia directamente, se usa vía herencia (class table).
"""

from datetime import datetime
from dataclasses import dataclass

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
    fehca_creacion:datetime | None = None
