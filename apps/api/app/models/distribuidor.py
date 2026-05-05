"""
Aggregate root — Distribuidor.
Extiende Usuario usando herencia class table (tabla `usuario` + tabla `distribuidor`).
"""

from datetime import datetime
from dataclasses import dataclass, field
import uuid

from app.core.exceptions.base import AggregateNoValido
from app.core.hashing import Hasher

from .base import TipoUsuario
from .usuario import Usuario
from app.models.categoria import CategoriaDistribuidor


@dataclass(kw_only=True)
class DireccionDistribuidor:
    """Value object/Entity local para la dirección del distribuidor."""
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    calle: str
    ciudad: str
    estado: str
    codigo_postal: str
    es_predeterminada: bool = False
    
    def check(self) -> None:
        if not self.calle or not self.calle.strip():
            raise AggregateNoValido("La calle no puede estar vacía")
        if not self.ciudad or not self.ciudad.strip():
            raise AggregateNoValido("La ciudad no puede estar vacía")
        if not self.estado or not self.estado.strip():
            raise AggregateNoValido("El estado no puede estar vacío")
        if not self.codigo_postal or not self.codigo_postal.strip():
            raise AggregateNoValido("El código postal no puede estar vacío")


@dataclass(kw_only=True)
class Distribuidor(Usuario):
    """
    Aggregate root del contexto de Distribuidor.
    Hereda de Usuario y encapsula su información específica.
    """
    rfc: str
    nombre_negocio: str
    direcciones: list[DireccionDistribuidor] = field(default_factory=list)
    imagen_fondo: str | None = None
    valoracion_promedio: float = 0.0
    total_valoraciones: int = 0
    categorias: list[CategoriaDistribuidor] = field(default_factory=list)
    descripcion: str | None = None

    def check(self) -> None:
        """Verifica los invariantes específicos de Distribuidor, y los de Usuario."""
        super().check()
        
        if self.tipo != TipoUsuario.DISTRIBUIDOR:
            raise AggregateNoValido("El tipo de usuario debe ser distribuidor")
        
        if not self.rfc or not str(self.rfc).strip():
            raise AggregateNoValido("El RFC no puede estar vacío")
            
        if not self.nombre_negocio or not str(self.nombre_negocio).strip():
            raise AggregateNoValido("El nombre del negocio no puede estar vacío")
            
        if not self.direcciones:
            raise AggregateNoValido("Debe tener al menos una dirección asignada")
        
        for direccion in self.direcciones:
            direccion.check()

    @classmethod
    def crear(
        cls,
        nombre: str,
        email: str,
        password: str,
        rfc: str,
        nombre_negocio: str,
        direccion: DireccionDistribuidor,
        telefono: str | None = None,
        fecha_creacion: datetime | None = None
    ) -> "Distribuidor":
        """
        Factory method — crea un nuevo Distribuidor con password hasheado.
        """
        return cls(
            nombre=nombre,
            email=email,
            password_hash=Hasher.hash(password),
            telefono=telefono,
            tipo=TipoUsuario.DISTRIBUIDOR,
            fecha_creacion=fecha_creacion,
            rfc=rfc,
            nombre_negocio=nombre_negocio,
            direcciones=[direccion],
            categorias=[],
        )

    def to_dict(self) -> dict:
        """Serializa el aggregate a un diccionario plano combinando usuario y distribuidor."""
        base_dict = super().to_dict()
        base_dict.update({
            "rfc": self.rfc,
            "nombre_negocio": self.nombre_negocio,
            "direcciones": [
                {
                    "id": str(d.id),
                    "calle": d.calle,
                    "ciudad": d.ciudad,
                    "estado": d.estado,
                    "codigo_postal": d.codigo_postal,
                    "es_predeterminada": d.es_predeterminada
                } for d in self.direcciones
            ],
            "imagen_fondo": self.imagen_fondo,
            "valoracion_promedio": self.valoracion_promedio,
            "total_valoraciones": self.total_valoraciones,
            "categorias": [c.to_dict() for c in self.categorias] if self.categorias else [],
            "descripcion": self.descripcion,
        })
        return base_dict

    def actualizar_informacion_negocio(self, rfc: str | None = None, nombre_negocio: str | None = None, descripcion: str | None = None) -> None:
        if rfc is not None:
            self.rfc = rfc
        if nombre_negocio is not None:
            self.nombre_negocio = nombre_negocio
        if descripcion is not None:
            self.descripcion = descripcion
        self.check()
