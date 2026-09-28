"""
Schemas Pydantic para la información de entrega de un pedido.

Es lo que la pantalla de pedidos necesita para el seguimiento del envío y que
no vive en la tabla `pedido`: cuándo se espera que llegue, quién lo lleva y qué
evidencia quedó de la entrega.
"""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class TransportistaEntrega(BaseModel):
    """Quién lleva el pedido."""
    nombre: str
    chofer: str | None = None
    #: "GPS certificado", "Refrigerado", etc.
    certificacion: str | None = None
    telefono: str | None = None


class EvidenciaEntrega(BaseModel):
    """Una prueba de cómo fue la entrega: una foto, una firma o una nota."""
    id: UUID
    #: "foto" | "firma" | "nota". La UI decide si la pinta como imagen o texto.
    tipo: str
    #: Dónde está el archivo. `None` en las notas, que no tienen imagen.
    url: str | None = None
    descripcion: str
    creado_at: datetime


class EntregaResponse(BaseModel):
    """Todo lo de la entrega de un pedido, en una sola respuesta."""
    pedido_id: UUID
    #: De dónde sale la mercancía: "Naucalpan Hub".
    almacen_origen: str | None = None
    #: Qué unidad conviene: "Camión 3.5 Ton".
    transporte_sugerido: str | None = None
    #: El folio de la guía de remisión: "CP-554920".
    guia: str | None = None
    #: Cuándo se espera que llegue. `None` si todavía no hay compromiso.
    fecha_entrega_aproximada: datetime | None = None
    #: La franja del día comprometida: "09:00 – 14:00".
    ventana_horaria: str | None = None
    transportista: TransportistaEntrega | None = None
    #: Vacía mientras el pedido no se haya entregado.
    evidencias: list[EvidenciaEntrega] = []


class DiaEntregas(BaseModel):
    """Las entregas de un día, partidas por puntualidad.

    Las tres se comparan contra la fecha comprometida del pedido: `antes` llegó
    antes de ese día, `a_tiempo` ese mismo día y `con_retraso` después. Suman
    el total de entregas del día.
    """
    fecha: date
    #: El rótulo del eje: "Lun".
    etiqueta: str
    antes: int
    a_tiempo: int
    con_retraso: int
