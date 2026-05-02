"""
Interfaces genéricas del sistema de eventos.

Evento     — dato inmutable que describe algo que ya ocurrió.
Suscriptor — handler que reacciona a un tipo de evento.
"""

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class Evento(BaseModel, ABC):
    """Interfaz genérica de evento de dominio."""

    evento_id: UUID = Field(default_factory=uuid4)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    @abstractmethod
    def nombre(self) -> str:
        """Identificador único del tipo de evento (ej. 'cliente.registrado')."""
        ...


class Suscriptor(ABC):
    """Interfaz genérica de suscriptor de eventos."""

    @abstractmethod
    async def handle(self, evento: Evento) -> None:
        """Procesa el evento recibido."""
        ...
