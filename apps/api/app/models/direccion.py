"""
Aggregate root — Direccion_cliente
"""

from app.models.base import Aggregate
from datetime import datetime
from dataclasses import dataclass


@dataclass(kw_only = True)
class DireccionCliente(Aggregate):
    calle:str
    ciudad:str
    estado:str
    codigo_postal:str
    es_predeterminada:bool = False

    def check(self) -> None:
        """Verifica que los campos obligatorios de la dirección no estén vacíos."""

        # TODO : Deberiamos de implementar validacion de si es direccion real o no
        from app.core.exceptions.base import AggregateNoValido
        if not self.calle or not str(self.calle).strip():
            raise AggregateNoValido("La calle no puede estar vacia")
        if not self.ciudad or not str(self.ciudad).strip():
            raise AggregateNoValido("La ciudad no puede estar vacia")
        if not self.estado or not str(self.estado).strip():
            raise AggregateNoValido("El estado no puede estar vacio")
        if not self.codigo_postal or not str(self.codigo_postal).strip():
            raise AggregateNoValido("El codigo postal no puede estar vacio")

    @classmethod


    def crear(cls,calle:str,estado:str,ciudad:str,codigo_postal:str,es_predeterminada:bool=False)->'DireccionCliente':
        return DireccionCliente(
            calle=calle,
            ciudad=ciudad,
            codigo_postal=codigo_postal,
            es_predeterminada=es_predeterminada,
            estado=estado
        )

    
    def to_dict(self) -> dict:
        """Serializa la dirrecion del cliente a un diccionario plano."""
        return {
            "calle":self.calle,
            'ciudad':self.ciudad,
            'estado':self.estado,
            'codigo_postal':self.codigo_postal,
            'es_predeterminada':self.es_predeterminada
        }