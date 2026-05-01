"""
Aggregate base + enums compartidos del dominio.
"""

import enum
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime


@dataclass(kw_only=True)
class Aggregate(ABC):
    """
    Clase base para todos los aggregates del dominio.
    Define el contrato que cada aggregate root debe cumplir.
    """

    id: uuid.UUID = field(default_factory=uuid.uuid4) # TODO : esto puede darme problemas si genera el id desde aqui.
    fecha_creacion: datetime | None = None

    def __post_init__(self):
        """Validación automática después de la inicialización de la dataclass."""
        self.check()

    @abstractmethod
    def check(self) -> None:
        """Verifica los invariantes del aggregate. Lanza AggregateNoValido si falla."""
        ...

    @classmethod
    @abstractmethod
    def crear(cls, **kwargs) -> "Aggregate":
        """Factory method — crea una nueva instancia del aggregate."""
        ...

    @abstractmethod
    def to_dict(self) -> dict:
        """Serializa el aggregate a un diccionario plano."""
        ...


class TipoUsuario(str, enum.Enum):
    """Refleja el enum tipo_usuario de PostgreSQL."""

    CLIENTE = "cliente"
    DISTRIBUIDOR = "distribuidor"
    ADMIN = 'admin'