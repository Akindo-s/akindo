/** @jsxImportSource nativewind */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Image, ScrollView, View } from "react-native";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  ChevronLeft,
  ChevronRight,
  Package2,
  FileText,
  Upload,
  Plus,
  BadgeCheck,
  ArrowLeft,
} from "lucide-react-native";
import type {
  EstadoOrden,
  FiltrosOrdenes,
  ListadoOrdenes,
  OrdenPedidoListItem,
  OrdenPedidoResponse,
  PedidoActionResult,
} from "@akindo/shared/types/pedidos";
import type { ArchivoExportado } from "@akindo/shared/api/pedidos";
import { MONEDA } from "@akindo/shared/constants";
import { ResumenOrdenesProvider } from "@akindo/shared/resumen-ordenes-context";
import { ExportacionProvider, type FormatoExportacion } from "@akindo/shared/exportacion-context";
import { H1, H2, Header, P, Pressable, Section, Span } from "@akindo/ui/html";
import { Boton, Link } from "@akindo/ui/components";
import { EncabezadoPagina } from "@akindo/ui/components/ui/EncabezadoPagina";
import { ModalConfirmacion } from "@akindo/ui/components/ui/ModalConfirmacion";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { Spinner } from "@akindo/ui/components/ui/Animaciones";
import { TarjetasResumen } from "@akindo/ui/components/ui/TarjetasResumen";
import { BarraFiltros, type DesplegableFiltro, type PestanaFiltro } from "@akindo/ui/components/ui/BarraFiltros";
import type { OpcionSelector } from "@akindo/ui/components/ui/Selector";
import { ExportacionMasiva } from "@akindo/ui/components/ui/ExportacionMasiva";
import { descargarArchivo } from "@akindo/ui/descargar";
import { HR } from "@expo/html-elements";

// ── Utils ─────────────────────────────────────────────────────────────────────

function formatMoney(v: number) {
  return v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * El identificador que ve el usuario: el id de la orden, tal cual. Se pinta
 * con `numberOfLines={1}`, así que en las columnas angostas se recorta solo.
 */
function idDe(orden: OrdenPedidoListItem) {
  return String(orden.id);
}

/** El título de la fila: el primer producto de la orden. */
function descripcionDe(orden: OrdenPedidoListItem) {
  const primero = orden.paquetes[0];
  const nombre = primero?.nombre_producto ?? primero?.medida_snapshot?.nombre;
  return nombre ?? "Orden de compra";
}

function partidasDe(orden: OrdenPedidoListItem) {
  const n = orden.paquetes.length;
  return `${n} ${n === 1 ? "partida" : "partidas"}`;
}

// ── Estados ───────────────────────────────────────────────────────────────────

type EstadoConfig = {
  label: string;
  /** Color del texto y del punto del badge. */
  hex: string;
  bg: string;
  border: string;
  texto: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
};

const ESTADO_CONFIG: Record<EstadoOrden, EstadoConfig> = {
  pendiente: {
    label: "Pendiente",
    hex: "#B45309",
    bg: "bg-amber-50",
    border: "border-amber-200",
    texto: "text-amber-700",
    Icon: Clock,
  },
  aceptada: {
    label: "Aceptada",
    hex: "#047857",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    texto: "text-emerald-700",
    Icon: CheckCircle2,
  },
  rechazada: {
    label: "Rechazada",
    hex: "#DC2626",
    bg: "bg-red-50",
    border: "border-red-200",
    texto: "text-red-600",
    Icon: XCircle,
  },
  cancelada: {
    label: "Cancelada",
    hex: "#57534E",
    bg: "bg-stone-100",
    border: "border-stone-200",
    texto: "text-stone-600",
    Icon: Ban,
  },
};

/** Las pestañas de la barra de filtros: los estados que devuelve la API. */
const PESTANAS: PestanaFiltro[] = [
  { valor: null, etiqueta: "Todas" },
  { valor: "pendiente", etiqueta: "Pendientes" },
  { valor: "aceptada", etiqueta: "Aceptadas" },
  { valor: "rechazada", etiqueta: "Rechazadas" },
  { valor: "cancelada", etiqueta: "Canceladas" },
];

/** Opciones del desplegable de fecha. */
const ORDEN_FECHA: OpcionSelector[] = [
  { valor: "desc", etiqueta: "Más recientes" },
  { valor: "asc", etiqueta: "Más antiguas" },
];

/** Rangos del desplegable de monto, en pesos. */
const RANGOS_MONTO: Record<string, { min?: number; max?: number }> = {
  todos: {},
  "0-1000": { max: 1000 },
  "1000-10000": { min: 1000, max: 10000 },
  "10000+": { min: 10000 },
};

// ── Acción principal por estado ───────────────────────────────────────────────

/**
 * Qué botón ve el usuario en cada estado. Una entrada por estado, y el valor
 * es la función que decide la acción con la orden en la mano (hace falta
 * porque una orden aceptada ya pagada —`pre_autorizado`— no se vuelve a pagar).
 */
interface AccionOrden {
  etiqueta: string;
  /** `peligro` pinta el botón rojo de borde; `primario`, el dorado. */
  variante: "primario" | "secundario" | "peligro";
  /** Navega, en vez de ejecutar algo. */
  href?: string;
  onPress?: () => void;
}

interface ContextoAccion {
  orden: OrdenPedidoListItem;
  pedirCancelar: (orden: OrdenPedidoListItem) => void;
  pagar: (orden: OrdenPedidoListItem) => void;
  descargar: (orden: OrdenPedidoListItem) => void;
}

const ACCIONES: Record<EstadoOrden, (ctx: ContextoAccion) => AccionOrden> = {
  pendiente: ({ orden, pedirCancelar }) => ({
    etiqueta: "Cancelar orden",
    variante: "peligro",
    onPress: () => pedirCancelar(orden),
  }),
  aceptada: ({ orden, pagar }) => {
    // Si ya se pagó hay pedido, y el botón lleva a su detalle. Una orden pre
    // autorizada se pagó al crearla, así que normalmente trae `pedido_id`; si
    // por lo que sea no viene, el botón cae en la lista de pedidos.
    if (orden.pedido_id) {
      return { etiqueta: "Ver pedido", variante: "secundario", href: `/pedidos/${orden.pedido_id}` };
    }
    if (orden.pre_autorizado) {
      return { etiqueta: "Ver pedido", variante: "secundario", href: "/pedidos" };
    }
    return { etiqueta: "Pagar", variante: "primario", onPress: () => pagar(orden) };
  },
  rechazada: ({ orden, descargar }) => ({
    etiqueta: "Descargar documento",
    variante: "secundario",
    onPress: () => descargar(orden),
  }),
  cancelada: ({ orden, descargar }) => ({
    etiqueta: "Descargar documento",
    variante: "secundario",
    onPress: () => descargar(orden),
  }),
};

// ── Piezas compartidas entre la tabla y las tarjetas ──────────────────────────

function BadgeEstado({ estado }: { estado: EstadoOrden }) {
  const cfg = ESTADO_CONFIG[estado];
  return (
    <View className={`flex flex-row items-center gap-1.5 px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border} w-fit native:w-auto`}>
      <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.hex }} />
      <Span peso="semibold" numberOfLines={1} className={`text-[10px] leading-4 uppercase tracking-[0.4px] ${cfg.texto}`}>
        {cfg.label}
      </Span>
    </View>
  );
}

/** El sello de "pre autorizado", que sí existe en la API. */
function BadgePreAutorizado() {
  return (
    <View className="flex flex-row items-center gap-1 px-2 py-0.5 rounded-md bg-[#FDF2E3] border border-[#E8DEC1] w-fit native:w-auto">
      <BadgeCheck size={11} color="#9A7B24" />
      <Span peso="semibold" className="text-[9px] leading-4 uppercase tracking-[0.4px] text-[#9A7B24]">
        Pre pagada
      </Span>
    </View>
  );
}

function Distribuidor({ orden }: { orden: OrdenPedidoListItem }) {
  return (
    <View className="flex flex-row items-center gap-2 shrink">
      <View className="w-7 h-7 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center shrink-0">
        {orden.distribuidor_imagen ? (
          <Image
            source={{ uri: orden.distribuidor_imagen }}
            accessibilityLabel={orden.distribuidor_nombre ?? "Distribuidor"}
            resizeMode="cover"
            className="w-full h-full"
          />
        ) : (
          <Package2 size={14} color="#A8A29E" />
        )}
      </View>
      <View className="shrink">
        <P peso="semibold" numberOfLines={1} className="text-xs leading-5 text-stone-800">
          {orden.distribuidor_nombre ?? "Distribuidor"}
        </P>
      </View>
    </View>
  );
}

function BotonAccion({ accion, className = "" }: { accion: AccionOrden; className?: string }) {
  return (
    <Boton
      variante={accion.variante}
      href={accion.href}
      onClick={accion.onPress}
      claseTexto="text-xs leading-5"
      className={`py-2 px-4 rounded-xl ${className}`}
    >
      {accion.etiqueta}
    </Boton>
  );
}

// ── Fila de la tabla (desde md) ───────────────────────────────────────────────

const COLUMNAS = [
  { etiqueta: "Orden & descripción", clase: "flex-[2.2]" },
  { etiqueta: "Distribuidor", clase: "flex-1" },
  { etiqueta: "Emisión", clase: "flex-1" },
  { etiqueta: "Monto total", clase: "flex-1" },
  { etiqueta: "Estado", clase: "flex-1" },
  { etiqueta: "Acción", clase: "flex-1" },
];

function CabeceraTabla() {
  return (
    <View className="hidden md:flex flex-row items-center gap-3 px-5 py-3 border-b border-stone-100">
      {COLUMNAS.map((c) => (
        <View key={c.etiqueta} className={c.clase}>
          <Span peso="semibold" className="text-[10px] leading-4 uppercase tracking-[0.6px] text-stone-400">
            {c.etiqueta}
          </Span>
        </View>
      ))}
    </View>
  );
}

function FilaOrden({ orden, accion, error }: { orden: OrdenPedidoListItem; accion: AccionOrden; error?: string }) {
  return (
    <View className="hidden md:flex flex-col border-b border-stone-100">
      <View className="flex flex-row items-center gap-3 px-5 py-4">
        <View className="flex-[2.2] shrink">
          <View className="flex flex-row items-center gap-2 flex-wrap">
            <Span peso="bold" numberOfLines={1} className="text-[11px] leading-5 text-stone-500 shrink">{idDe(orden)}</Span>
            {orden.pre_autorizado && <BadgePreAutorizado />}
          </View>
          <P peso="semibold" numberOfLines={1} className="text-sm leading-6 text-stone-800 mt-0.5">
            {descripcionDe(orden)}
          </P>
          <P numberOfLines={1} className="text-[10px] leading-4 text-stone-400">{partidasDe(orden)}</P>
        </View>

        <View className="flex-1 shrink"><Distribuidor orden={orden} /></View>

        <View className="flex-1 shrink">
          <P className="text-xs leading-5 text-stone-600">{formatFecha(orden.created_at)}</P>
        </View>

        <View className="flex-1 shrink">
          <P peso="bold" className="text-sm leading-6 text-stone-900">
            ${formatMoney(orden.total)}
            <Span className="text-[10px] leading-4 text-stone-400"> {MONEDA}</Span>
          </P>
        </View>

        <View className="flex-1 shrink"><BadgeEstado estado={orden.estado} /></View>

        <View className="flex-1 shrink"><BotonAccion accion={accion} /></View>
      </View>
      {error && (
        <P peso="medium" className="text-[11px] leading-4 text-red-600 px-5 pb-3">{error}</P>
      )}
    </View>
  );
}

// ── Tarjeta (hasta md) ────────────────────────────────────────────────────────

function TarjetaOrden({ orden, accion, error, classNameBox }: { orden: OrdenPedidoListItem; accion: AccionOrden; error?: string, classNameBox?: string }) {
  return (
    <View className={`md:hidden bg-white border border-stone-100 rounded-2xl p-4 shadow shadow-black/10 ${classNameBox}`}>

      <View className="flex flex-row items-start justify-between gap-2 flex-wrap">
        <View className="flex flex-row items-center gap-2 shrink flex-wrap">
          <Span peso="bold" numberOfLines={1} className="text-[11px] leading-5 text-stone-500 shrink">{idDe(orden)}</Span>
          {orden.pre_autorizado && <BadgePreAutorizado />}
        </View>
        <BadgeEstado estado={orden.estado} />
      </View>

      <P peso="semibold" numberOfLines={2} className="text-base leading-6 text-stone-900 mt-2">
        {descripcionDe(orden)}
      </P>
      <P className="text-xs leading-5 text-stone-400">{partidasDe(orden)}</P>

      <View className="bg-[#FAF7F2] rounded-xl px-3 py-2.5 mt-3 flex flex-row items-center justify-between gap-3">
        <View className="shrink">
          <Span peso="semibold" className="text-[9px] leading-4 uppercase tracking-[0.5px] text-stone-400">Distribuidor</Span>
          <Distribuidor orden={orden} />
        </View>
        <View className="shrink items-end">
          <Span peso="semibold" className="text-[9px] leading-4 uppercase tracking-[0.5px] text-stone-400">Emisión</Span>
          <P className="text-xs leading-5 text-stone-700">{formatFecha(orden.created_at)}</P>
        </View>
      </View>

      <View className="flex flex-row items-end justify-between gap-3 mt-3 flex-wrap">
        <View className="shrink">
          <Span peso="semibold" className="text-[9px] leading-4 uppercase tracking-[0.5px] text-stone-400">Monto total</Span>
          <P peso="bold" className="text-lg leading-7 text-stone-900">
            ${formatMoney(orden.total)}
            <Span className="text-[10px] leading-4 text-stone-400"> {MONEDA}</Span>
          </P>
        </View>
        <BotonAccion accion={accion} />
      </View>

      {error && <P peso="medium" className="text-[11px] leading-4 text-red-600 mt-2">{error}</P>}
    </View>
  );
}

// ── Paginación ────────────────────────────────────────────────────────────────

function Paginador({
  listado,
  onPagina,
}: {
  listado: ListadoOrdenes;
  onPagina: (pagina: number) => void;
}) {
  const { pagina_actual, total_paginas, total_ordenes, ordenes } = listado;
  if (total_ordenes === 0) return null;

  // Como mucho cinco números, centrados en la página actual.
  const desde = Math.max(1, Math.min(pagina_actual - 2, total_paginas - 4));
  const paginas = Array.from({ length: Math.min(5, total_paginas) }, (_, i) => desde + i);

  return (
    <View className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 py-4`}>
      <P className="text-xs leading-5 text-stone-400 text-center md:text-left">
        Mostrando <Span peso="semibold" className="text-xs leading-5 text-stone-600">{ordenes.length}</Span> de{" "}
        <Span peso="semibold" className="text-xs leading-5 text-stone-600">{total_ordenes}</Span> órdenes registradas
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

// ── Pantalla ──────────────────────────────────────────────────────────────────

export interface OrdenesProps {
  /** Primera página ya cargada. Web la trae del servidor; mobile pasa `null`. */
  listado: ListadoOrdenes | null;
  /** Vuelve a pedir el listado cuando cambian los filtros o la página. */
  cargarOrdenes: (filtros: FiltrosOrdenes) => Promise<ListadoOrdenes>;
  /** Cancela una orden. Necesita la sesión, así que la inyecta la app (regla 13). */
  cancelarAction: (ordenId: string) => Promise<PedidoActionResult<OrdenPedidoResponse>>;
  /** Paga una orden aceptada. */
  pagarAction: (ordenId: string) => Promise<PedidoActionResult<OrdenPedidoResponse>>;
  /** Genera el archivo de la exportación contable con los filtros de la pantalla. */
  exportarAction: (formato: FormatoExportacion, filtros: FiltrosOrdenes) => Promise<ArchivoExportado>;
}

const POR_PAGINA = 10;

export default function Ordenes(props: OrdenesProps) {
  // Los providers van acá y no en cada ruta: son parte de esta pantalla y así
  // web y mobile la montan igual, con un solo componente.
  return (
    <ResumenOrdenesProvider>
      <PantallaOrdenes {...props} />
    </ResumenOrdenesProvider>
  );
}

function PantallaOrdenes({ listado: listadoInicial, cargarOrdenes, cancelarAction, pagarAction, exportarAction }: OrdenesProps) {
  const [listado, setListado] = useState<ListadoOrdenes | null>(listadoInicial);
  const [cargando, setCargando] = useState(listadoInicial === null);
  const [errorCarga, setErrorCarga] = useState(false);

  const [estado, setEstado] = useState<EstadoOrden | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [distribuidorId, setDistribuidorId] = useState("todos");
  const [rangoMonto, setRangoMonto] = useState("todos");
  const [orden, setOrden] = useState<"asc" | "desc">("desc");
  const [pagina, setPagina] = useState(1);
  const [intento, setIntento] = useState(0);

  const [ordenACancelar, setOrdenACancelar] = useState<OrdenPedidoListItem | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [erroresFila, setErroresFila] = useState<Record<string, string>>({});

  const filtros = useMemo<FiltrosOrdenes>(() => {
    const rango = RANGOS_MONTO[rangoMonto] ?? {};
    return {
      estado,
      q: busqueda,
      distribuidorId: distribuidorId === "todos" ? null : distribuidorId,
      montoMin: rango.min ?? null,
      montoMax: rango.max ?? null,
      orden,
      pagina,
      cantidad: POR_PAGINA,
    };
  }, [estado, busqueda, distribuidorId, rangoMonto, orden, pagina]);

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
    cargarOrdenes(filtros).then(
      (recibido) => { if (vigente) { setListado(recibido); setCargando(false); } },
      () => { if (vigente) { setErrorCarga(true); setCargando(false); } },
    );
    return () => { vigente = false; };
  }, [filtros, intento]);

  /**
   * Un filtro recorta el listado, así que la página en la que estabas deja de
   * tener sentido y se vuelve a la 1. Los desplegables de orden (`tipo:
   * "orden"`) no: reordenan lo mismo y respetan la página actual.
   */
  const cambiarFiltro = useCallback((aplicar: () => void, reiniciarPagina = true) => {
    if (reiniciarPagina) setPagina(1);
    aplicar();
  }, []);

  // Los distribuidores del desplegable salen de lo que hay en la página: la
  // API todavía no expone "mis distribuidores".
  const desplegables: DesplegableFiltro[] = useMemo(() => {
    const vistos = new Map<string, string>();
    for (const o of listado?.ordenes ?? []) {
      if (o.distribuidor_nombre) vistos.set(o.distribuidor_nombre, o.distribuidor_nombre);
    }
    return [
      {
        id: "distribuidor",
        valor: distribuidorId,
        className: "md:w-52",
        opciones: [
          { valor: "todos", etiqueta: "Todos los distribuidores" },
          ...[...vistos.keys()].map((n) => ({ valor: n, etiqueta: n })),
        ],
      },
      {
        id: "monto",
        valor: rangoMonto,
        className: "md:w-44",
        opciones: [
          { valor: "todos", etiqueta: "Cualquier monto" },
          { valor: "0-1000", etiqueta: "Hasta $1,000" },
          { valor: "1000-10000", etiqueta: "$1,000 – $10,000" },
          { valor: "10000+", etiqueta: "Más de $10,000" },
        ],
      },
      { id: "fecha", tipo: "orden", valor: orden, className: "md:w-40", opciones: ORDEN_FECHA },
    ];
  }, [listado, distribuidorId, rangoMonto, orden]);

  const pestanas = useMemo<PestanaFiltro[]>(
    // El conteo solo se sabe del filtro activo: es lo que devuelve el endpoint.
    () => PESTANAS.map((p) => ({ ...p, cantidad: p.valor === estado ? listado?.total_ordenes ?? null : null })),
    [estado, listado],
  );

  async function confirmarCancelar() {
    if (!ordenACancelar) return;
    const { id } = ordenACancelar;
    setCancelando(true);
    const res = await cancelarAction(id);
    setCancelando(false);
    if (!res.ok) {
      setErroresFila((previos) => ({ ...previos, [id]: res.error || "No se pudo cancelar la orden" }));
      return;
    }
    setOrdenACancelar(null);
    setErroresFila(({ [id]: _, ...resto }) => resto);
    setIntento((n) => n + 1);
  }

  async function pagar(orden: OrdenPedidoListItem) {
    const res = await pagarAction(orden.id);
    if (!res.ok) {
      setErroresFila((previos) => ({ ...previos, [orden.id]: res.error || "No se pudo pagar la orden" }));
      return;
    }
    setIntento((n) => n + 1);
  }

  /** El documento de una sola orden: la exportación filtrada por su folio. */
  async function descargarOrden(orden: OrdenPedidoListItem) {
    try {
      await descargarArchivo(await exportarAction("xlsx", { q: idDe(orden) }));
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : "No se pudo generar el documento";
      setErroresFila((previos) => ({ ...previos, [orden.id]: mensaje }));
    }
  }

  const accionDe = (orden: OrdenPedidoListItem) =>
    ACCIONES[orden.estado]({ orden, pedirCancelar: setOrdenACancelar, pagar, descargar: descargarOrden });

  const exportar = useCallback(
    async (formato: FormatoExportacion) => {
      const archivo = await exportarAction(formato, filtros);
      await descargarArchivo(archivo);
      return archivo.nombre;
    },
    [exportarAction, filtros],
  );

  const ordenes = listado?.ordenes ?? [];
  // horizontal scroll
  const ITEM_MARGIN = 12;
  const SNAP_INTERVAL = 300 + ITEM_MARGIN;
  const snapOffsets = ordenes.map((_, i) => i * SNAP_INTERVAL);

  return (
    <ExportacionProvider onDescargar={exportar}>
      {/* Sin `indiceFijo` no hay hijo fijo: toda la pantalla scrollea. Si se
        vuelve a poner, el hijo que quede fijo necesita fondo propio o las
        tarjetas se ven pasar por debajo en nativo. */}
      <ContenedorPantalla key="ordenes" className="mx-auto w-full px-0 lg:px-16 lg:pt-8 pb-24 bg-[#FAF7F2] md:bg-[#FAF7F2] min-h-screen">
        {/* <EncabezadoPagina titulo="Órdenes de Compra" href="/pedidos" /> */}

        <Header className="px-4 pt-5 pb-4 bg-[#FAF7F2] flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <View className="shrink">
            <Link href="/pedidos" className="text-sm flex items-center my-4 gap-2 text-[#DAA520]"> <ArrowLeft size={12} />  Pedidos</Link>
            <H1 peso="bold" className="text-2xl md:text-3xl leading-9 text-stone-900">Órdenes de Compra</H1>
            <P className="text-xs md:text-sm leading-5 text-stone-500 mt-1">
              Administra órdenes comerciales, confirmación de pedidos y liquidación con trazabilidad.
            </P>
          </View>
          <View className="flex flex-col md:flex-row gap-2 md:gap-3 shrink-0">
            <Boton Icono={Plus} iconoSize={16} href="/mercado" claseTexto="text-xs leading-5" className="py-2.5 px-4 rounded-xl w-full md:w-auto">
              Nueva Orden
            </Boton>
            {/* `border-solid`: la variante trae `border-none` y las dos clases
              sobreviven al twMerge, porque son grupos distintos. */}
            <Boton
              variante="secundario"
              Icono={Upload}
              iconoSize={16}
              onClick={() => exportar("xlsx")}
              claseTexto="text-xs leading-5"
              className="py-2.5 px-4 rounded-xl border-solid border border-stone-200 w-full md:w-auto bg-white"
            >
              Exportar Lotes
            </Boton>
          </View>
        </Header>
        <HR className="my-8 w-full" />
        {/* Resumen: cuántas tarjetas y de qué tipo lo decide el provider. */}
        <Section className="mt-5">
          <TarjetasResumen />
        </Section>

        <Section className="px-4 mt-5">
          <View className="bg-white border border-stone-100 rounded-2xl drop-shadow-sm">
            {/* `z-20`: en react-native-web cada View es `position: relative` con
              `z-index: 0`, o sea un contexto de apilamiento, así que el `z-40`
              del desplegable no puede salirse de su padre y las filas de abajo
              (que van después en el DOM) lo tapaban. Se levanta el bloque
              entero de filtros. */}
            <View className="p-4 md:p-5 border-b border-stone-100 z-20">
              <BarraFiltros
                placeholder="Filtrar por ID de orden o producto..."
                busqueda={busqueda}
                onBuscar={(q) => cambiarFiltro(() => setBusqueda(q))}
                pestanas={pestanas}
                pestanaActiva={estado}
                onPestana={(valor) => cambiarFiltro(() => setEstado(valor as EstadoOrden | null))}
                desplegables={desplegables}
                onDesplegable={(id, valor) =>
                  cambiarFiltro(
                    () => {
                      if (id === "distribuidor") setDistribuidorId(valor);
                      else if (id === "monto") setRangoMonto(valor);
                      else setOrden(valor as "asc" | "desc");
                    },
                    desplegables.find((d) => d.id === id)?.tipo !== "orden",
                  )
                }
              />
            </View>

            <CabeceraTabla />

            {cargando ? (
              <View className="flex items-center justify-center py-16">
                <Spinner tamano={32} />
              </View>
            ) : errorCarga ? (
              <View className="flex items-center justify-center py-16 px-5">
                <P className="text-sm leading-6 text-stone-500 text-center">No se pudieron cargar tus órdenes.</P>
                <Boton variante="secundario" className="mt-3" onClick={() => setIntento((n) => n + 1)}>
                  Volver a intentar
                </Boton>
              </View>
            ) : ordenes.length === 0 ? (
              <View className="flex items-center justify-center py-16 px-5">
                <View className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                  <FileText size={24} color="#A8A29E" />
                </View>
                <H2 peso="semibold" className="text-base leading-6 text-stone-700 text-center">Sin órdenes que mostrar</H2>
                <P className="text-xs leading-5 text-stone-400 text-center mt-1">
                  Prueba con otro filtro o crea una orden desde el mercado.
                </P>
              </View>
            ) : (
              <>
                {/* Tabla desde md, tarjetas abajo de md: el mismo dato, dos
                  formas. Las dos ramas se pintan siempre y se esconde una con
                  `hidden md:flex` / `md:hidden` (regla 28). */}
                {ordenes.map((o) => (
                  <FilaOrden key={`fila-${o.id}`} orden={o} accion={accionDe(o)} error={erroresFila[o.id]} />
                ))}

                <FlatList
                  data={ordenes}
                  keyExtractor={(item) => `anuncio-${item.id}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={SNAP_INTERVAL}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  disableIntervalMomentum
                  snapToOffsets={snapOffsets}
                  className="md:hidden  p-2 w-full max-w-full"
                  renderItem={({ item, index }) => (
                    <TarjetaOrden key={`tarjeta-${item.id}`} orden={item} accion={accionDe(item)} error={erroresFila[item.id]} classNameBox="w-[300px] mr-[12px]" />
                  )}
                />


                {/* <View className="md:hidden flex flex-col gap-3 p-4">
                {ordenes.map((o) => (
                  <TarjetaOrden key={`tarjeta-${o.id}`} orden={o} accion={accionDe(o)} error={erroresFila[o.id]} />
                ))}
              </View> */}
              </>
            )}

            {listado && !cargando && !errorCarga && (
              <Paginador listado={listado} onPagina={(n) => setPagina(Math.max(1, n))} />
            )}
          </View>
        </Section>

        <Section className="px-4 mt-5">
          <ExportacionMasiva
            className="md:max-w-md"
            descripcion="Descarga libros auxiliares de compras B2B con validación fiscal del SAT, retenciones desglosadas y conciliación bancaria directa."
          />
        </Section>
      </ContenedorPantalla>

      {/* El modal, fuera del ContenedorPantalla (regla 54). */}
      <ModalConfirmacion
        isOpen={ordenACancelar !== null}
        onClose={() => !cancelando && setOrdenACancelar(null)}
        onConfirm={confirmarCancelar}
        titulo="Cancelar Orden"
        mensaje="¿Estás seguro de que deseas cancelar esta orden de compra? Esta acción no se puede deshacer."
        textoConfirmar="Sí, cancelar orden"
        textoCancelar="No, mantener"
        isConfirming={cancelando}
      />
    </ExportacionProvider>
  );
}
