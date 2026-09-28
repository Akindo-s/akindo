/** @jsxImportSource nativewind */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, TextInput, View } from "react-native";
import {
  ArrowRight,
  Boxes,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Package2,
  ShieldCheck,
  Truck,
  Upload,
  User,
  Warehouse,
} from "lucide-react-native";
import type {
  EstadoPedido,
  FiltrosPedidos,
  ListadoPedidos,
  PedidoActionResult,
  PedidoListItem,
  PedidoResponse,
  ResumenPedidos,
} from "@akindo/shared/types/pedidos";
import { MONEDA } from "@akindo/shared/constants";
import { tarjetasDeConteos } from "@akindo/shared/resumen-pedidos";
import { SoporteEnvioProvider, useSoporteEnvio } from "@akindo/shared/soporte-envio-context";
import {
  EntregasPedidosProvider,
  useEntregasPedidos,
  type CargarEntregas,
  type EntregaDePedido,
} from "@akindo/shared/entregas-pedidos-context";
import type { DiaEntregas } from "@akindo/shared/types/entregas";
import type { ArchivoExportado } from "@akindo/shared/api/pedidos";
import {
  ExportacionProvider,
  type FormatoExportacion,
  type OpcionExportacion,
} from "@akindo/shared/exportacion-context";
import { H1, H2, H3, Header, P, Pressable, Section, Span } from "@akindo/ui/html";
import { Boton, Link } from "@akindo/ui/components";
import { Tarjeta } from "@akindo/ui/components/ui/Tarjeta";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { Spinner } from "@akindo/ui/components/ui/Animaciones";
import { useAviso } from "@akindo/ui/components/ui/Avisos";
import { TarjetasResumen } from "@akindo/ui/components/ui/TarjetasResumen";
import { GraficaEntregas } from "@akindo/ui/components/ui/GraficaEntregas";
import { BarraFiltros, type DesplegableFiltro, type PestanaFiltro } from "@akindo/ui/components/ui/BarraFiltros";
import { Selector, type OpcionSelector } from "@akindo/ui/components/ui/Selector";
import { ExportacionMasiva } from "@akindo/ui/components/ui/ExportacionMasiva";
import { descargarArchivo } from "@akindo/ui/descargar";

// ── Utils ─────────────────────────────────────────────────────────────────────

function formatMoney(v: number) {
  return v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatFechaHora(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatFechaCorta(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

/** El identificador que ve el distribuidor: el arranque del id del pedido. */
function idCorto(id: string) {
  return id.slice(0, 8).toUpperCase();
}

/** "12 × Cucharas desechables" — la primera partida, que es la que cabe. */
function partidaPrincipal(pedido: PedidoListItem) {
  const primero = pedido.productos[0];
  if (!primero) return "Sin partidas";
  const cantidad = primero.cantidad.toLocaleString("es-MX", { maximumFractionDigits: 2 });
  return `${cantidad}${primero.unidad ? ` ${primero.unidad}` : "×"} ${primero.nombre ?? "Producto"}`;
}

function restoDePartidas(pedido: PedidoListItem) {
  const n = pedido.total_partidas - 1;
  if (n <= 0) return null;
  return `+${n} ${n === 1 ? "partida más" : "partidas más"}`;
}

// ── Estados ───────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<EstadoPedido, { label: string; hex: string; bg: string; texto: string }> = {
  "pendiente de envio": { label: "En preparación", hex: "#B45309", bg: "bg-amber-50", texto: "text-amber-700" },
  "en envio": { label: "En camino", hex: "#1D4ED8", bg: "bg-blue-50", texto: "text-blue-700" },
  entregado: { label: "Entregado", hex: "#047857", bg: "bg-emerald-50", texto: "text-emerald-700" },
  cancelado: { label: "Cancelado", hex: "#DC2626", bg: "bg-red-50", texto: "text-red-600" },
};

const PESTANAS: PestanaFiltro[] = [
  { valor: null, etiqueta: "Todos" },
  { valor: "pendiente de envio", etiqueta: "En preparación" },
  { valor: "en envio", etiqueta: "En camino" },
  { valor: "entregado", etiqueta: "Entregados" },
  { valor: "cancelado", etiqueta: "Cancelados" },
];

const ORDEN_FECHA: OpcionSelector[] = [
  { valor: "desc", etiqueta: "Más reciente primero" },
  { valor: "asc", etiqueta: "Más antiguo primero" },
];

/** Rangos del desplegable de fecha, en días hacia atrás. `null` es "todo". */
const RANGOS_FECHA: Record<string, number | null> = { todo: null, "7": 7, "30": 30, "90": 90 };

function desdeHace(dias: number | null): string | null {
  if (dias === null) return null;
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

// ── Modal de actualización ────────────────────────────────────────────────────

/**
 * El modal de siempre: selector de estado más el mensaje que le llega al
 * cliente en el timeline. Se conserva porque ese mensaje es real y un
 * desplegable simple lo perdería.
 */
function ActualizarEstadoModal({
  pedido,
  onClose,
  onConfirm,
  loading,
}: {
  pedido: PedidoListItem;
  onClose: () => void;
  onConfirm: (estado: EstadoPedido, desc: string) => void;
  loading: boolean;
}) {
  // Solo se puede transicionar "hacia adelante" o cancelar.
  const opciones: OpcionSelector<EstadoPedido>[] =
    pedido.estado === "pendiente de envio"
      ? [{ valor: "en envio", etiqueta: "En camino" }, { valor: "cancelado", etiqueta: "Cancelar pedido" }]
      : [{ valor: "entregado", etiqueta: "Entregado" }, { valor: "cancelado", etiqueta: "Cancelar pedido" }];

  const [estadoSelect, setEstadoSelect] = useState<EstadoPedido>(opciones[0].valor);
  const [desc, setDesc] = useState("");

  return (
    // `fixed` no existe en nativo: ahí `absolute` cubre el área de la pantalla
    // (debajo del Header y arriba del BottomNav).
    <View className="absolute web:fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 elevation-[50]">
      <Tarjeta className="w-full max-w-md shadow-2xl">
        <H3 peso="bold" className="text-lg text-stone-900 mb-2">Actualizar pedido</H3>
        <P className="text-sm text-stone-500 mb-4">
          Actualiza el estado del pedido{" "}
          <Span peso="bold" className="text-sm text-stone-500">#{idCorto(pedido.id)}</Span> de{" "}
          <Span peso="bold" className="text-sm text-stone-500">{pedido.cliente_nombre}</Span>.
        </P>

        <View className="flex flex-col gap-4 mb-6">
          <Selector
            modo="simple"
            opciones={opciones}
            valor={estadoSelect}
            onChange={setEstadoSelect}
            accessibilityLabel="Estado del pedido"
            claseCaja="p-3 bg-white border border-stone-200 rounded-xl"
            claseTexto="text-sm text-stone-800"
          />

          <TextInput
            value={desc}
            onChangeText={setDesc}
            multiline
            placeholder="Mensaje para el cliente (ej. Tu pedido va en camino por DHL...)"
            placeholderTextColor="#A8A29E"
            className="w-full p-3 bg-white border border-stone-200 rounded-xl text-[17px] leading-6 min-h-[80px]"
          />
        </View>

        <View className="flex flex-row gap-3">
          <Boton variante="secundario" onClick={onClose} className="w-full flex-1">
            Volver
          </Boton>
          {/* El botón va rojo relleno cuando la opción es cancelar (la variante
              peligro es de borde). El texto va por `claseTexto` (regla 25). */}
          <Boton
            variante={estadoSelect === "cancelado" ? "peligro" : "primario"}
            onClick={() => onConfirm(estadoSelect, desc)}
            loading={loading}
            className={estadoSelect === "cancelado" ? "w-full flex-1 bg-red-600 hover:bg-red-700 border-transparent" : "w-full flex-1"}
            claseTexto={estadoSelect === "cancelado" ? "text-white" : undefined}
          >
            Actualizar
          </Boton>
        </View>
      </Tarjeta>
    </View>
  );
}

// ── Piezas de la tarjeta ──────────────────────────────────────────────────────

function BadgeEstado({ estado }: { estado: EstadoPedido }) {
  const cfg = ESTADO_CONFIG[estado];
  return (
    <View className={`flex flex-row items-center gap-1.5 px-2.5 py-1 rounded-full ${cfg.bg} w-fit native:w-auto shrink`}>
      <View className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.hex }} />
      <Span peso="semibold" numberOfLines={1} className={`text-[10px] leading-4 uppercase tracking-[0.4px] shrink ${cfg.texto}`}>
        {cfg.label}
      </Span>
    </View>
  );
}

function AvatarCliente({ pedido }: { pedido: PedidoListItem }) {
  return (
    <View className="w-9 h-9 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center shrink-0">
      {pedido.cliente_imagen ? (
        <Image
          source={{ uri: pedido.cliente_imagen }}
          accessibilityLabel={pedido.cliente_nombre ?? "Cliente"}
          resizeMode="cover"
          className="w-full h-full"
        />
      ) : (
        <User size={16} color="#A8A29E" />
      )}
    </View>
  );
}

/** Un dato con su rótulo en versalitas, un ícono y una segunda línea gris. */
function BloqueDato({
  rotulo,
  Icono,
  principal,
  secundario,
}: {
  rotulo: string;
  Icono?: React.ComponentType<{ size?: number; color?: string }>;
  principal: string;
  secundario?: string | null;
}) {
  return (
    <View className="flex-1 min-w-[150px] shrink">
      <Span peso="semibold" numberOfLines={1} className="text-[9px] leading-4 uppercase tracking-[0.6px] text-stone-400">
        {rotulo}
      </Span>
      <View className="flex flex-row items-center gap-1.5 mt-1">
        {Icono && <Icono size={13} color="#78716C" />}
        <P peso="semibold" numberOfLines={1} className="text-xs leading-5 text-stone-800 shrink">{principal}</P>
      </View>
      {secundario && <P numberOfLines={1} className="text-[10px] leading-4 text-stone-400">{secundario}</P>}
    </View>
  );
}

// ── Tarjeta de pedido ─────────────────────────────────────────────────────────

/**
 * Una orden de la bandeja del distribuidor.
 *
 * Lo del despacho —almacén de origen, transporte sugerido y guía— sale de
 * `GET /entregas/pedidos/{id}`; el resto, del listado. Lo que el diseño
 * inventaba (tipo de venta, método de pago, fecha de entrega requerida) no se
 * pinta: no existe en ninguna parte.
 */
function TarjetaPedido({
  pedido,
  onActualizar,
}: {
  pedido: PedidoListItem;
  onActualizar: () => void;
}) {
  const { entregaDe } = useEntregasPedidos();
  const entrega = entregaDe(pedido.id);
  // Un pedido cerrado ya no se puede mover: no hay transición hacia adelante.
  const cerrado = pedido.estado === "entregado" || pedido.estado === "cancelado";

  return (
    <View className="bg-white border border-stone-200/70 rounded-2xl p-4 md:p-5 drop-shadow-sm">
      <View className="flex flex-row items-start justify-between gap-3 flex-wrap">
        <View className="flex flex-row items-center gap-2 shrink flex-wrap">
          <H3 peso="bold" numberOfLines={1} className="text-base leading-6 text-stone-900">
            #{idCorto(pedido.id)}
          </H3>
          <BadgeEstado estado={pedido.estado} />
        </View>
        <View className="flex flex-row items-center gap-1.5 shrink">
          <CalendarDays size={12} color="#A8A29E" />
          <Span numberOfLines={1} className="text-[11px] leading-4 text-stone-500 shrink">
            Confirmado: {formatFechaHora(pedido.confirmado_at)}
          </Span>
        </View>
      </View>

      {/* El cliente: es lo que el distribuidor busca primero. */}
      <View className="flex flex-row items-center gap-2.5 mt-3">
        <AvatarCliente pedido={pedido} />
        <View className="shrink">
          <P peso="semibold" numberOfLines={1} className="text-sm leading-5 text-stone-900">
            {pedido.cliente_nombre ?? "Cliente"}
          </P>
          <P numberOfLines={1} className="text-[11px] leading-4 text-stone-400">
            Orden #{idCorto(pedido.orden_id)}
          </P>
        </View>
      </View>

      <View className="flex flex-row items-center gap-2 mt-3">
        <Package2 size={14} color="#78716C" />
        <P peso="medium" numberOfLines={2} className="text-xs leading-5 text-stone-700 shrink">
          {partidaPrincipal(pedido)}
        </P>
        {restoDePartidas(pedido) && (
          <Span className="text-[10px] leading-4 text-stone-400 shrink-0">{restoDePartidas(pedido)}</Span>
        )}
      </View>

      {/* Despacho: solo se pinta lo que el endpoint de entregas devolvió. */}
      <View className="bg-[#FAF7F2] rounded-xl px-3 py-2.5 mt-3 flex flex-row flex-wrap gap-4">
        <BloqueDato rotulo="Destino" Icono={Warehouse} principal={pedido.destino ?? "—"} />
        {entrega.almacenOrigen && (
          <BloqueDato
            rotulo="Almacén de origen"
            Icono={Boxes}
            principal={entrega.almacenOrigen}
            secundario={entrega.transporteSugerido}
          />
        )}
        {entrega.transportista && (
          <BloqueDato
            rotulo="Transportista"
            Icono={ShieldCheck}
            principal={entrega.transportista}
            secundario={entrega.guia ? `Guía: #${entrega.guia}` : entrega.chofer}
          />
        )}
      </View>

      <View className="flex flex-row items-end justify-between gap-3 mt-4 pt-3 border-t border-stone-100 flex-wrap">
        <View className="shrink">
          <Span peso="semibold" className="text-[9px] leading-4 uppercase tracking-[0.5px] text-stone-400">Total de la orden</Span>
          <P peso="bold" className="text-lg leading-7 text-stone-900">
            ${formatMoney(pedido.total)}
            <Span className="text-[10px] leading-4 text-stone-400"> {MONEDA}</Span>
          </P>
        </View>

        <View className="flex flex-row items-center gap-2 flex-wrap shrink-0">
          <Boton
            variante="secundario"
            href={`/pedidos/${pedido.id}`}
            claseTexto="text-xs leading-5"
            className="py-2 px-4 rounded-xl border-solid border border-stone-200 bg-white"
          >
            Ver detalle
          </Boton>
          {!cerrado && (
            <Boton onClick={onActualizar} claseTexto="text-xs leading-5" className="py-2 px-4 rounded-xl">
              Actualizar estado
            </Boton>
          )}
        </View>
      </View>
    </View>
  );
}

// ── Columna de apoyo ──────────────────────────────────────────────────────────

function ColumnaApoyo({ className = "" }: { className?: string }) {
  const { enlaces, entregas, cargando, irAnterior, irSiguiente, puedeSiguiente } = useSoporteEnvio();

  return (
    <View className={`flex flex-col gap-4 ${className}`}>
      {enlaces.length > 0 && (
        <Section className="bg-white border border-stone-100 rounded-2xl p-5 drop-shadow-sm">
          <View className="flex flex-row items-center gap-2">
            <Truck size={14} color="#B45309" />
            <H2 peso="semibold" className="text-[10px] leading-4 uppercase tracking-[0.6px] text-[#B45309]">
              Soporte de envío
            </H2>
          </View>
          <P className="text-xs leading-5 text-stone-500 mt-2">
            Resolución prioritaria de incidencias, seguro de mercancías y discrepancias de entrega.
          </P>

          <View className="flex flex-col gap-2 mt-4">
            {enlaces.map((enlace) => (
              <View
                key={enlace.id}
                className="border border-stone-100 rounded-xl px-3 py-2.5 flex flex-row items-center justify-between gap-2"
              >
                <Span peso="medium" numberOfLines={1} className="text-xs leading-5 text-stone-700 shrink">
                  {enlace.etiqueta}
                </Span>
                {enlace.insignia ? (
                  <Span
                    peso="semibold"
                    numberOfLines={1}
                    className="text-[10px] leading-4 shrink-0"
                    style={{ color: enlace.activo ? "#047857" : "#A8A29E" }}
                  >
                    {enlace.insignia}
                  </Span>
                ) : (
                  <ChevronRight size={14} color="#A8A29E" />
                )}
              </View>
            ))}
          </View>

          <Boton
            href="/perfil/soporte"
            claseTexto="text-xs leading-5"
            className="py-2.5 px-4 rounded-xl mt-4 w-full"
          >
            Contactar soporte
          </Boton>
        </Section>
      )}

      {/* Mismo componente que en la pantalla del cliente: `/entregas/resumen`
          sirve a los dos y distingue solo por quién pregunta. */}
      {entregas.length === 0 && cargando ? (
        <View className="bg-stone-100 rounded-2xl min-h-[150px]" />
      ) : (
        <GraficaEntregas
          dias={entregas}
          titulo="Cumplimiento de entregas"
          onAnterior={irAnterior}
          onSiguiente={irSiguiente}
          puedeSiguiente={puedeSiguiente}
          cargando={cargando}
        />
      )}
    </View>
  );
}

// ── Paginación ────────────────────────────────────────────────────────────────

function Flecha({
  Icono,
  etiqueta,
  activa,
  onPress,
}: {
  Icono: React.ComponentType<{ size?: number; color?: string }>;
  etiqueta: string;
  activa: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      role="button"
      accessibilityLabel={etiqueta}
      disabled={!activa}
      onPress={onPress}
      style={{ opacity: activa ? 1 : 0.4 }}
      className="w-8 h-8 rounded-lg border border-stone-200 bg-white flex items-center justify-center cursor-pointer"
    >
      <Icono size={14} color="#57534E" />
    </Pressable>
  );
}

function Paginador({ listado, onPagina }: { listado: ListadoPedidos; onPagina: (pagina: number) => void }) {
  const { pagina_actual, total_paginas, total_pedidos, pedidos } = listado;
  if (total_pedidos === 0) return null;

  const desde = Math.max(1, Math.min(pagina_actual - 2, total_paginas - 4));
  const paginas = Array.from({ length: Math.min(5, total_paginas) }, (_, i) => desde + i);

  return (
    <View className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-4">
      <P className="text-xs leading-5 text-stone-400 text-center md:text-left">
        Mostrando <Span peso="semibold" className="text-xs leading-5 text-stone-600">{pedidos.length}</Span> de{" "}
        <Span peso="semibold" className="text-xs leading-5 text-stone-600">{total_pedidos}</Span> pedidos
      </P>

      <View className="flex flex-row items-center justify-center gap-1.5">
        <Flecha Icono={ChevronLeft} etiqueta="Página anterior" activa={listado.tiene_anterior} onPress={() => onPagina(pagina_actual - 1)} />
        {paginas.map((n) => (
          <Pressable
            key={n}
            role="button"
            accessibilityLabel={`Página ${n}`}
            onPress={() => onPagina(n)}
            style={{ backgroundColor: n === pagina_actual ? "#DAA520" : "#FFFFFF", borderColor: n === pagina_actual ? "#DAA520" : "#E7E5E4" }}
            className="w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer"
          >
            <Span peso="semibold" className="text-xs leading-5" style={{ color: n === pagina_actual ? "#FFFFFF" : "#57534E" }}>
              {n}
            </Span>
          </Pressable>
        ))}
        <Flecha Icono={ChevronRight} etiqueta="Página siguiente" activa={listado.tiene_siguiente} onPress={() => onPagina(pagina_actual + 1)} />
      </View>
    </View>
  );
}

// ── Pantalla ──────────────────────────────────────────────────────────────────

export interface PedidosDistribuidorProps {
  /** Primera página ya cargada. Web la trae del servidor; mobile pasa `null`. */
  listado: ListadoPedidos | null;
  /** Vuelve a pedir el listado cuando cambian los filtros o la página. */
  cargarPedidos: (filtros: FiltrosPedidos) => Promise<ListadoPedidos>;
  /** Conteos por estado, para las tarjetas y los contadores de las pestañas. */
  cargarResumen?: (filtros: FiltrosPedidos) => Promise<ResumenPedidos>;
  /** Datos de entrega de los pedidos de la página. */
  cargarEntregas?: CargarEntregas;
  /** Las entregas por día de la gráfica de cumplimiento. */
  cargarEntregasPorDia?: (hasta: string | null) => Promise<DiaEntregas[]>;
  /** Genera el reporte de pedidos con los filtros de la pantalla. */
  exportarAction?: (formato: FormatoExportacion, filtros: FiltrosPedidos) => Promise<ArchivoExportado>;
  /** Cambia el estado de un pedido. Necesita la sesión (regla 13). */
  actualizarAction: (id: string, estado: EstadoPedido, desc?: string) => Promise<PedidoActionResult<PedidoResponse>>;
  /** Cuántas órdenes de compra esperan aprobación, para la insignia del acceso. */
  ordenesPendientes?: number;
}

/** Lo que se ofrece hoy del reporte: solo Excel está implementado. */
const OPCIONES_REPORTE: OpcionExportacion[] = [
  { formato: "xlsx", etiqueta: "Excel (.xlsx)", descripcion: "Una fila por partida", disponible: true },
  { formato: "pdf", etiqueta: "Reporte PDF", descripcion: "Con resumen por cliente", disponible: false },
];

const POR_PAGINA = 10; // pedidos

export default function PedidosDistribuidor(props: PedidosDistribuidorProps) {
  return (
    <SoporteEnvioProvider cargarEntregas={props.cargarEntregasPorDia}>
      <PantallaPedidosDistribuidor {...props} />
    </SoporteEnvioProvider>
  );
}

function PantallaPedidosDistribuidor({
  listado: listadoInicial,
  cargarPedidos,
  cargarResumen,
  cargarEntregas,
  exportarAction,
  actualizarAction,
  ordenesPendientes = 0,
}: PedidosDistribuidorProps) {
  const [listado, setListado] = useState<ListadoPedidos | null>(listadoInicial);
  const [cargando, setCargando] = useState(listadoInicial === null);
  const [errorCarga, setErrorCarga] = useState(false);
  const [resumen, setResumen] = useState<ResumenPedidos | null>(null);

  const [estado, setEstado] = useState<EstadoPedido | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [clienteId, setClienteId] = useState("todos");
  const [rangoFecha, setRangoFecha] = useState("todo");
  const [orden, setOrden] = useState<"asc" | "desc">("desc");
  const [pagina, setPagina] = useState(1);
  const [intento, setIntento] = useState(0);

  const [pedidoAActualizar, setPedidoAActualizar] = useState<PedidoListItem | null>(null);
  const [guardando, setGuardando] = useState(false);
  // El error lo pinta la `VentanaEmergente` del layout (ver Avisos.tsx).
  const avisar = useAviso();

  const filtros = useMemo<FiltrosPedidos>(() => ({
    estado,
    q: busqueda,
    clienteId: clienteId === "todos" ? null : clienteId,
    fechaDesde: desdeHace(RANGOS_FECHA[rangoFecha] ?? null),
    fechaHasta: null,
    orden,
    pagina,
    cantidad: POR_PAGINA,
  }), [estado, busqueda, clienteId, rangoFecha, orden, pagina]);

  // La primera carga de web ya viene del servidor: solo se vuelve a pedir
  // cuando el usuario toca un filtro o la paginación.
  const primeraCarga = useRef(listadoInicial !== null);
  useEffect(() => {
    if (primeraCarga.current) {
      primeraCarga.current = false;
      return;
    }
    let vigente = true;
    setCargando(true);
    setErrorCarga(false);
    cargarPedidos(filtros).then(
      (recibido) => { if (vigente) { setListado(recibido); setCargando(false); } },
      () => { if (vigente) { setErrorCarga(true); setCargando(false); } },
    );
    return () => { vigente = false; };
  }, [filtros, intento]);

  /**
   * El resumen no depende de la pestaña ni de la página —los conteos son los
   * mismos, solo cambia cuál estás mirando— pero sí de **todos** los demás
   * filtros. Si faltara alguno, las pestañas contarían pedidos que el listado
   * ya no muestra.
   */
  const filtrosResumen = useMemo<FiltrosPedidos>(
    () => ({
      q: busqueda,
      clienteId: clienteId === "todos" ? null : clienteId,
      fechaDesde: desdeHace(RANGOS_FECHA[rangoFecha] ?? null),
      fechaHasta: null,
    }),
    [busqueda, clienteId, rangoFecha],
  );

  useEffect(() => {
    if (!cargarResumen) return;
    let vigente = true;
    cargarResumen(filtrosResumen).then(
      (recibido) => { if (vigente) setResumen(recibido); },
      () => { if (vigente) setResumen(null); },
    );
    return () => { vigente = false; };
  }, [filtrosResumen, cargarResumen, intento]);

  /**
   * Un filtro recorta el listado, así que la página en la que estabas deja de
   * tener sentido y se vuelve a la 1. Los desplegables de orden (`tipo:
   * "orden"`) no: reordenan lo mismo y respetan la página actual.
   */
  const cambiarFiltro = useCallback((aplicar: () => void, reiniciarPagina = true) => {
    if (reiniciarPagina) setPagina(1);
    aplicar();
  }, []);

  /**
   * Los clientes del desplegable **se acumulan entre cargas**. Salen de los
   * pedidos de la página porque la API todavía no expone "mis clientes"; si
   * solo se miraran los de la página actual, al filtrar por uno la lista se
   * quedaría con ese solo y no habría forma de cambiar de cliente sin limpiar
   * el filtro. El valor es el id, que es lo que el endpoint espera.
   */
  const clientesVistos = useRef(new Map<string, string>());

  const desplegables: DesplegableFiltro[] = useMemo(() => {
    for (const p of listado?.pedidos ?? []) {
      if (p.cliente_id && p.cliente_nombre) clientesVistos.current.set(p.cliente_id, p.cliente_nombre);
    }
    return [
      {
        id: "cliente",
        valor: clienteId,
        className: "md:w-52",
        opciones: [
          { valor: "todos", etiqueta: "Todos los clientes" },
          ...[...clientesVistos.current].map(([id, nombre]) => ({ valor: id, etiqueta: nombre })),
        ],
      },
      {
        id: "fecha",
        valor: rangoFecha,
        className: "md:w-44",
        opciones: [
          { valor: "todo", etiqueta: "Cualquier fecha" },
          { valor: "7", etiqueta: "Últimos 7 días" },
          { valor: "30", etiqueta: "Últimos 30 días" },
          { valor: "90", etiqueta: "Últimos 90 días" },
        ],
      },
      { id: "orden", tipo: "orden", valor: orden, className: "md:w-48", opciones: ORDEN_FECHA },
    ];
  }, [listado, clienteId, rangoFecha, orden]);

  const pestanas = useMemo<PestanaFiltro[]>(
    () => PESTANAS.map((p) => ({
      ...p,
      cantidad: !resumen
        ? null
        : p.valor === null
          ? resumen.total
          : resumen.por_estado[p.valor as EstadoPedido] ?? 0,
    })),
    [resumen],
  );

  const tarjetas = useMemo(() => (resumen ? tarjetasDeConteos(resumen) : []), [resumen]);

  const pedidos = listado?.pedidos ?? [];
  const idsPedidos = useMemo(() => pedidos.map((p) => p.id), [listado]);

  async function confirmarActualizacion(estadoNuevo: EstadoPedido, desc: string) {
    if (!pedidoAActualizar) return;
    setGuardando(true);
    const res = await actualizarAction(pedidoAActualizar.id, estadoNuevo, desc);
    setGuardando(false);

    if (!res.ok) {
      avisar(res.error || "No se pudo actualizar el pedido");
      return;
    }
    setPedidoAActualizar(null);
    // Se recarga en vez de parchear el estado local: el cambio mueve el
    // pedido de pestaña y cambia los conteos, y `intento` rehace las dos
    // consultas de un tirón.
    setIntento((n) => n + 1);
  }

  const exportar = useCallback(
    async (formato: FormatoExportacion) => {
      if (!exportarAction) throw new Error("La exportación no está disponible");
      const archivo = await exportarAction(formato, filtros);
      await descargarArchivo(archivo);
      return archivo.nombre;
    },
    [exportarAction, filtros],
  );

  return (
    <ExportacionProvider opciones={exportarAction ? OPCIONES_REPORTE : []} onDescargar={exportar}>
    <EntregasPedidosProvider pedidoIds={idsPedidos} cargarEntregas={cargarEntregas}>
      <ContenedorPantalla key="distribuidor-pedidos" className="mx-auto w-full px-0 lg:px-16 lg:pt-8 pb-24 bg-[#FAF7F2] min-h-screen">
        <Header className="px-4 pt-5 pb-4">
          <Link href="/distribuidor" bloque>
            <Span peso="semibold" className="text-[10px] leading-4 uppercase tracking-[0.8px] text-[#B45309]">
              Panel · Despachos y pedidos
            </Span>
          </Link>
          <H1 peso="bold" className="text-2xl md:text-3xl leading-9 text-stone-900 mt-1">
            Gestión de pedidos de clientes
          </H1>
          <P className="text-xs md:text-sm leading-5 text-stone-500 mt-1">
            Actualiza el estado de los pedidos activos para mantener informados a tus clientes.
          </P>

          {exportarAction && (
            <View className="flex flex-col md:flex-row gap-2 md:gap-3 mt-4 md:mt-0 md:absolute md:right-4 md:top-5">
              {/* `border-solid`: la variante trae `border-none` y las dos
                  clases sobreviven al twMerge, porque son grupos distintos. */}
              <Boton
                variante="secundario"
                Icono={Upload}
                iconoSize={16}
                onClick={() => exportar("xlsx")}
                claseTexto="text-xs leading-5"
                className="py-2.5 px-4 rounded-xl border-solid border border-stone-200 w-full md:w-auto bg-white"
              >
                Descargar reporte
              </Boton>
            </View>
          )}
        </Header>

        {/* El acceso a las órdenes de compra, que siguen en su propia pantalla. */}
        <Section className="px-4">
          <Link href="/distribuidor/ordenes" bloque>
            <View className="bg-white border border-amber-100 rounded-2xl px-4 py-3 flex flex-row items-center justify-between gap-3">
              <View className="flex flex-row items-center gap-3 shrink">
                <View className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <ClipboardList size={16} color="#D97706" />
                </View>
                <View className="shrink">
                  <H3 peso="semibold" className="text-sm leading-5 text-stone-800">Órdenes de compra</H3>
                  <P numberOfLines={1} className="text-[11px] leading-4 text-stone-500">
                    Pendientes de tu aprobación
                  </P>
                </View>
              </View>
              <View className="flex flex-row items-center gap-2 shrink-0">
                {ordenesPendientes > 0 && (
                  <View className="bg-amber-500 px-2 py-0.5 rounded-full">
                    <Span peso="bold" className="text-white text-[10px] leading-4">{ordenesPendientes}</Span>
                  </View>
                )}
                <ArrowRight size={16} color="#A8A29E" />
              </View>
            </View>
          </Link>
        </Section>

        <Section className="mt-5">
          <TarjetasResumen
            tarjetas={tarjetas}
            cargando={cargarResumen !== undefined && resumen === null}
            onSeleccionar={(valor) => cambiarFiltro(() => setEstado(valor as EstadoPedido | null))}
          />
        </Section>

        <View className="px-4 mt-5 flex flex-col lg:flex-row gap-4 items-start">
          <View className="w-full lg:flex-1">
            {/* `z-20`: en react-native-web cada View es un contexto de
                apilamiento, así que el desplegable abierto no puede salirse de
                su padre y las tarjetas de abajo lo taparían. */}
            <View className="bg-white border border-stone-100 rounded-2xl p-4 md:p-5 z-20">
              <BarraFiltros
                placeholder="Filtrar por ID de pedido o producto..."
                busqueda={busqueda}
                onBuscar={(q) => cambiarFiltro(() => setBusqueda(q))}
                pestanas={pestanas}
                pestanaActiva={estado}
                onPestana={(valor) => cambiarFiltro(() => setEstado(valor as EstadoPedido | null))}
                desplegables={desplegables}
                onDesplegable={(id, valor) =>
                  cambiarFiltro(
                    () => {
                      if (id === "cliente") setClienteId(valor);
                      else if (id === "fecha") setRangoFecha(valor);
                      else setOrden(valor as "asc" | "desc");
                    },
                    desplegables.find((d) => d.id === id)?.tipo !== "orden",
                  )
                }
              />
            </View>

            {cargando ? (
              <View className="flex items-center justify-center py-16">
                <Spinner tamano={32} />
              </View>
            ) : errorCarga ? (
              <View className="flex items-center justify-center py-16">
                <P className="text-sm leading-6 text-stone-500 text-center">No se pudieron cargar los pedidos.</P>
                <Boton variante="secundario" className="mt-3" onClick={() => setIntento((n) => n + 1)}>
                  Volver a intentar
                </Boton>
              </View>
            ) : pedidos.length === 0 ? (
              <View className="flex items-center justify-center py-16">
                <View className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                  <Truck size={24} color="#A8A29E" />
                </View>
                <H2 peso="semibold" className="text-base leading-6 text-stone-700 text-center">
                  Sin pedidos que mostrar
                </H2>
                <P className="text-xs leading-5 text-stone-400 text-center mt-1">
                  Prueba con otro filtro o revisa tus órdenes de compra.
                </P>
              </View>
            ) : (
              <View className="flex flex-col gap-3 mt-4">
                {pedidos.map((p) => (
                  <TarjetaPedido key={p.id} pedido={p} onActualizar={() => setPedidoAActualizar(p)} />
                ))}
              </View>
            )}

            {listado && !cargando && !errorCarga && (
              <Paginador listado={listado} onPagina={(n) => setPagina(Math.max(1, n))} />
            )}
          </View>

          <ColumnaApoyo className="w-full lg:w-80 shrink-0" />
        </View>
        {exportarAction && (
          <Section className="px-4 mt-5">
            <ExportacionMasiva
              className="md:max-w-md"
              titulo="Reporte de pedidos"
              rotulo="Documentación logística"
              descripcion="Descarga el detalle de tus pedidos con cliente, destino, partidas y totales, tal como los estás filtrando."
            />
          </Section>
        )}
      </ContenedorPantalla>

      {/* El modal, fuera del ContenedorPantalla (regla 54). */}
      {pedidoAActualizar && (
        <ActualizarEstadoModal
          pedido={pedidoAActualizar}
          onClose={() => !guardando && setPedidoAActualizar(null)}
          onConfirm={confirmarActualizacion}
          loading={guardando}
        />
      )}
    </EntregasPedidosProvider>
    </ExportacionProvider>
  );
}
