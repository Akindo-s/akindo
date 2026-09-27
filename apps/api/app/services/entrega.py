"""
EntregaService — información de entrega de un pedido.

**Los datos son un mock.** Nada de lo que devuelve este servicio existe todavía
en la base: no hay tabla de transportistas, ni fecha comprometida en `pedido`,
ni evidencias de entrega. El mock vive acá abajo, en `_MOCK`, y se arma en
`_entrega_mock`.

Lo que sí es real es el pedido: el servicio lo busca, comprueba que sea del
usuario que pregunta y calcula la fecha aproximada a partir de su
`confirmado_at`. Así la respuesta es coherente con lo que el usuario ve en el
listado aunque el contenido sea de muestra.

Cuando exista el backend de verdad, lo único que cambia es de dónde salen los
datos: la forma de la respuesta (`EntregaResponse`) ya es la definitiva.
"""

import uuid
from datetime import date, datetime, timedelta, timezone

from app.core.exceptions import ForbiddenException, NotFoundException
from app.infrastructure.database import DatabaseSession
from app.schemas.entrega import (
    DiaEntregas,
    EntregaResponse,
    EvidenciaEntrega,
    TransportistaEntrega,
)

#: Días entre la confirmación del pedido y la entrega comprometida. Cuando
#: exista el dato real, esto se va con el resto del mock.
_DIAS_COMPROMISO = 5


#: Transportistas de muestra. El pedido cae siempre en el mismo, para que la
#: pantalla no cambie de datos entre peticiones.
_MOCK_TRANSPORTISTAS = [
    {
        "nombre": "Castores Prime",
        "chofer": "Marcos E.",
        "certificacion": "GPS certificado",
        "telefono": "800 123 4567",
    },
    {
        "nombre": "Transportes del Bajío",
        "chofer": "Ana R.",
        "certificacion": "Refrigerado",
        "telefono": "800 765 4321",
    },
    {
        "nombre": "Empaques Express",
        "chofer": "Luis M.",
        "certificacion": "GPS certificado",
        "telefono": "800 222 8899",
    },
]

_MOCK_VENTANAS = ["09:00 – 14:00", "12:00 – 18:00", "08:00 – 11:00"]

#: Evidencias de muestra. Solo se devuelven cuando el pedido está entregado.
#: Las imágenes son de `picsum` con semilla: devuelve siempre la misma foto,
#: así la pantalla no cambia entre peticiones.
_MOCK_EVIDENCIAS = [
    {
        "tipo": "foto",
        "url": "https://media.prod-cms.cuidadoconelperro.com.mx/ccep-prod-cms-media/blur_ed58427a27.jpg",
        "descripcion": "Paquete recibido en buen estado, sin golpes ni abolladuras.",
    },
    {
        "tipo": "foto",
        "url": "https://media.prod-cms.cuidadoconelperro.com.mx/ccep-prod-cms-media/blur_ed58427a27.jpg",
        "descripcion": "Sellos de las cajas intactos al momento de la recepción.",
    },
    {
        "tipo": "firma",
        "url": None,
        "descripcion": "Recibido de conformidad por personal del negocio. Firmado en el momento.",
    },
]


class EntregaService:
    """Información de entrega de un pedido. Hoy devuelve datos de muestra."""

    def __init__(self, db: DatabaseSession):
        self.db = db

    async def obtener_entrega(
        self,
        pedido_id: uuid.UUID,
        usuario_id: uuid.UUID,
    ) -> EntregaResponse:
        """La entrega de un pedido del usuario que pregunta.

        Sirve igual al cliente que lo compró y al distribuidor que lo vende:
        el pedido cuelga de una orden que tiene a los dos, así que basta con
        que el usuario sea uno de ellos.
        """
        filas = await self.db.select(
            "pedido",
            "id, estado, confirmado_at, entregado_at, orden_pedido!inner(cliente_id, distribuidor_id)",
            {"id": str(pedido_id)},
        )
        if not filas:
            raise NotFoundException("Pedido no encontrado")

        pedido = filas[0]
        orden = pedido.get("orden_pedido") or {}
        if isinstance(orden, list):
            orden = orden[0] if orden else {}

        # `cliente.usuario_id` y `distribuidor.usuario_id` son la PK de esas
        # tablas, así que el id del usuario es el que viaja en la orden.
        propietarios = {str(orden.get("cliente_id")), str(orden.get("distribuidor_id"))}
        if str(usuario_id) not in propietarios:
            raise ForbiddenException("Este pedido no es tuyo")

        return self._entrega_mock(pedido)

    # ── Cumplimiento de entregas ──────────────────────────────────────

    #: Los rótulos del eje de la gráfica, por `weekday()` de Python (0 = lunes).
    _DIAS_SEMANA = ("Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom")

    #: Hasta acá el eje se rotula con el día de la semana; pasando de ahí se
    #: repetirían los nombres, así que se usa el día del mes.
    _MAX_DIAS_CON_NOMBRE = 10

    async def entregas_por_dia(
        self,
        usuario_id: uuid.UUID,
        dias: int = 7,
        hasta: date | None = None,
    ) -> list[DiaEntregas]:
        """Las entregas de los últimos `dias` días, partidas por puntualidad.

        Cada pedido entregado se compara contra su fecha comprometida: llegó
        antes, el mismo día o después. La comparación es **por día**, no por
        hora: entregar a las 9 o a las 18 del día comprometido es igual de
        puntual.

        Esto sí sale de datos reales (`confirmado_at` y `entregado_at`). Lo
        que todavía es de muestra es el compromiso, que hoy se calcula como
        `confirmado_at + _DIAS_COMPROMISO`; el día que sea una columna del
        pedido, solo cambia `_fecha_compromiso`.

        `hasta` es el último día del periodo (hoy por defecto): con él la
        pantalla pagina hacia atrás sin cambiar el tamaño de la ventana.
        """
        # `hasta` es el último día de la ventana; sin él, hoy. Es lo que deja
        # paginar hacia atrás: la pantalla pide la semana que termina N días
        # antes.
        fin = hasta or datetime.now(timezone.utc).date()
        desde = fin - timedelta(days=dias - 1)

        filas = await self._pedidos_entregados(usuario_id)

        # Un acumulador por día, ya en el orden del eje.
        cubos: dict = {
            desde + timedelta(days=i): {"antes": 0, "a_tiempo": 0, "con_retraso": 0}
            for i in range(dias)
        }

        for fila in filas:
            entregado = _a_fecha(fila.get("entregado_at"))
            if not entregado:
                continue
            dia = entregado.date()
            if dia not in cubos:
                continue
            compromiso = self._fecha_compromiso(fila)
            if not compromiso:
                # Sin compromiso no se puede juzgar: cuenta como a tiempo en
                # vez de inventar un retraso.
                cubos[dia]["a_tiempo"] += 1
                continue
            if dia < compromiso.date():
                cubos[dia]["antes"] += 1
            elif dia == compromiso.date():
                cubos[dia]["a_tiempo"] += 1
            else:
                cubos[dia]["con_retraso"] += 1

        con_nombre = dias <= self._MAX_DIAS_CON_NOMBRE
        return [
            DiaEntregas(
                fecha=dia,
                etiqueta=self._DIAS_SEMANA[dia.weekday()] if con_nombre else str(dia.day),
                **conteos,
            )
            for dia, conteos in cubos.items()
        ]

    async def _pedidos_entregados(self, usuario_id: uuid.UUID) -> list[dict]:
        """Los pedidos entregados del usuario, sea cliente o distribuidor.

        Son dos consultas porque PostgREST no hace un `or` entre dos columnas
        de un recurso embebido. Un usuario es una cosa o la otra, así que una
        de las dos vuelve vacía.
        """
        columnas = "id, confirmado_at, entregado_at, orden_pedido!inner(cliente_id, distribuidor_id)"
        filas: list[dict] = []
        for columna in ("orden_pedido.cliente_id", "orden_pedido.distribuidor_id"):
            filas += await self.db.select(
                "pedido",
                columnas,
                {"estado": "entregado", columna: str(usuario_id)},
            ) or []
        return filas

    @staticmethod
    def _fecha_compromiso(pedido: dict) -> datetime | None:
        """Cuándo se comprometió la entrega.

        **Es el dato de muestra**: hoy es la confirmación más un plazo fijo.
        Cuando `pedido` tenga su propia columna, se lee de ahí y la gráfica
        pasa a ser real de punta a punta.
        """
        confirmado = _a_fecha(pedido.get("confirmado_at"))
        return confirmado + timedelta(days=_DIAS_COMPROMISO) if confirmado else None

    # ── Mock ──────────────────────────────────────────────────────────

    def _entrega_mock(self, pedido: dict) -> EntregaResponse:
        """Arma la respuesta de muestra para un pedido real.

        El reparto es estable: el mismo pedido cae siempre en el mismo
        transportista y en la misma ventana, porque el índice sale de su id.
        """
        pedido_id = uuid.UUID(str(pedido["id"]))
        indice = pedido_id.int % len(_MOCK_TRANSPORTISTAS)

        transportista = _MOCK_TRANSPORTISTAS[indice]
        entregado = pedido.get("estado") == "entregado"

        return EntregaResponse(
            pedido_id=pedido_id,
            fecha_entrega_aproximada=self._fecha_aproximada(pedido),
            ventana_horaria=_MOCK_VENTANAS[indice],
            transportista=TransportistaEntrega(**transportista),
            # Un pedido que no llegó no tiene cómo tener evidencias de entrega.
            evidencias=self._evidencias_mock(pedido) if entregado else [],
        )

    @staticmethod
    def _fecha_aproximada(pedido: dict) -> datetime | None:
        """Si ya se entregó, la fecha real; si no, la confirmación más el
        compromiso. Así la fecha nunca contradice lo que muestra el listado."""
        if pedido.get("entregado_at"):
            return _a_fecha(pedido["entregado_at"])
        confirmado = _a_fecha(pedido.get("confirmado_at"))
        return confirmado + timedelta(days=_DIAS_COMPROMISO) if confirmado else None

    @staticmethod
    def _evidencias_mock(pedido: dict) -> list[EvidenciaEntrega]:
        momento = _a_fecha(pedido.get("entregado_at")) or datetime.now()
        pedido_id = uuid.UUID(str(pedido["id"]))
        return [
            EvidenciaEntrega(
                # Un id estable por evidencia, derivado del pedido: sirve de
                # `key` en la UI y no cambia entre peticiones.
                id=uuid.uuid5(pedido_id, f"evidencia-{i}"),
                tipo=ev["tipo"],
                url=ev["url"],
                descripcion=ev["descripcion"],
                creado_at=momento,
            )
            for i, ev in enumerate(_MOCK_EVIDENCIAS)
        ]


def _a_fecha(valor) -> datetime | None:
    """PostgREST devuelve las fechas como texto ISO."""
    if not valor:
        return None
    if isinstance(valor, datetime):
        return valor
    return datetime.fromisoformat(str(valor).replace("Z", "+00:00"))
