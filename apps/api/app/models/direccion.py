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