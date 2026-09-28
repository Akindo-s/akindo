/** @jsxImportSource nativewind */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Image, Platform, ScrollView, Text, View } from "react-native";
import {
  ArrowRight,
  Ban,
  Boxes,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Headset,
  LifeBuoy,
  Package2,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Upload,
  Warehouse,
} from "lucide-react-native";
import type {
  EstadoPedido,
  FiltrosPedidos,
  ListadoPedidos,
  PedidoListItem,
  PedidoProductoListItem,
  ResumenPedidos,
} from "@akindo/shared/types/pedidos";
import type { ArchivoExportado } from "@akindo/shared/api/pedidos";
import { MONEDA } from "@akindo/shared/constants";
import { tarjetasDeConteos } from "@akindo/shared/resumen-pedidos";
import { SoporteEnvioProvider, useSoporteEnvio } from "@akindo/shared/soporte-envio-context";
import {
  EntregasPedidosProvider,
  useEntregasPedidos,
  type CargarEntregas,
  type EntregaDePedido,
} from "@akindo/shared/entregas-pedidos-context";
import {
  ExportacionProvider,
  type FormatoExportacion,
  type OpcionExportacion,
} from "@akindo/shared/exportacion-context";
import { H1, H2, H3, Header, P, Pressable, Section, Span } from "@akindo/ui/html";
import { Boton, Link } from "@akindo/ui/components";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { Spinner } from "@akindo/ui/components/ui/Animaciones";
import { TarjetasResumen } from "@akindo/ui/components/ui/TarjetasResumen";
import { GraficaEntregas } from "@akindo/ui/components/ui/GraficaEntregas";
import { ExportacionMasiva } from "@akindo/ui/components/ui/ExportacionMasiva";
import { BarraFiltros, type DesplegableFiltro, type PestanaFiltro } from "@akindo/ui/components/ui/BarraFiltros";
import type { OpcionSelector } from "@akindo/ui/components/ui/Selector";
import type { DiaEntregas } from "@akindo/shared/types/entregas";
import { descargarArchivo } from "@akindo/ui/descargar";
import { HR } from "@expo/html-elements";

// ── Utils ─────────────────────────────────────────────────────────────────────

function formatMoney(v: number) {
  return v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatFecha(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

function formatFechaCorta(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

/**
 * El identificador que ve el usuario. El diseño usa folios cortos tipo
 * `#TRK-5521-X`, así que se pinta el arranque del id del pedido en mayúsculas:
 * es lo mismo que muestra el detalle y alcanza para reconocerlo.
 */
function idCorto(id: string) {
  return id.slice(0, 8).toUpperCase();
}

/** Para los filtros y la exportación de una sola fila hace falta el id entero. */
function idDe(pedido: PedidoListItem) {
  return String(pedido.id);
}

/** "15 Oct, 16:45" — el pie de cada paso de la ruta. */
function formatFechaHora(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  const fecha = d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  const hora = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${fecha}, ${hora}`;
}

/** "149 kg" — la cantidad de una partida con su unidad. */
function cantidadDe(prod: PedidoProductoListItem) {
  const cantidad = prod.cantidad.toLocaleString("es-MX", { maximumFractionDigits: 2 });
  return prod.unidad ? `${cantidad} ${prod.unidad}` : cantidad;
}

/**
 * El resumen de carga del diseño ("8 Tarimas ISO • 4,200 kg"), con lo que sí
 * existe: cuántos produtos y cuánto suman. Si todas comparten unidad se
 * totalizan; si no, solo se dice cuántas son.
 */
function cargaDe(pedido: PedidoListItem) {
  const n = pedido.total_partidas;
  const partidas = `${n} ${n === 1 ? "producto" : "productos"}`;
  const unidades = new Set(pedido.productos.map((p) => p.unidad ?? ""));
  if (unidades.size !== 1) return partidas;
  const total = pedido.productos.reduce((suma, p) => suma + p.cantidad, 0);
  const unidad = pedido.productos[0]?.unidad;
  return `${partidas} • ${total.toLocaleString("es-MX", { maximumFractionDigits: 2 })}${unidad ? ` ${unidad}` : ""}`;
}

/** El título de la tarjeta: el primer producto del pedido. */
function descripcionDe(pedido: PedidoListItem) {
  return pedido.primer_producto_nombre ?? pedido.distribuidor_nombre ?? "Pedido";
}

// ── Estados ───────────────────────────────────────────────────────────────────

type EstadoConfig = {
  label: string;
  /** Color del texto y del punto del badge. */
  hex: string;
  bg: string;
  border: string;
  texto: string;
  /** El `border-l-4` de la tarjeta. */
  borde: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
};

const ESTADO_CONFIG: Record<EstadoPedido, EstadoConfig> = {
  "pendiente de envio": {
    label: "Preparando envío",
    hex: "#1D4ED8",
    bg: "bg-blue-50",
    border: "border-blue-200",
    texto: "text-blue-700",
    borde: "border-l-blue-400",
    Icon: Package2,
  },
  "en envio": {
    label: "En camino",
    hex: "#B45309",
    bg: "bg-amber-50",
    border: "border-amber-200",
    texto: "text-amber-700",
    borde: "border-l-amber-400",
    Icon: Truck,
  },
  entregado: {
    label: "Entregado",
    hex: "#047857",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    texto: "text-emerald-700",
    borde: "border-l-emerald-400",
    Icon: CheckCircle2,
  },
  cancelado: {
    label: "Cancelado",
    hex: "#DC2626",
    bg: "bg-red-50",
    border: "border-red-200",
    texto: "text-red-600",
    borde: "border-l-red-400",
    Icon: Ban,
  },
};

/** Las pestañas de la barra de filtros: los estados que devuelve la API. */
const PESTANAS: PestanaFiltro[] = [
  { valor: null, etiqueta: "Todos" },
  { valor: "en envio", etiqueta: "En camino" },
  { valor: "pendiente de envio", etiqueta: "En preparación" },
  { valor: "entregado", etiqueta: "Entregados" },
  { valor: "cancelado", etiqueta: "Cancelados" },
];

/** Opciones del desplegable de ordenamiento. */
const ORDEN_FECHA: OpcionSelector[] = [
  { valor: "desc", etiqueta: "Más reciente primero" },
  { valor: "asc", etiqueta: "Más antiguo primero" },
];

/**
 * Rangos del desplegable de fecha, en días hacia atrás. `null` es "todo".
 * Se resuelven a una fecha ISO al armar los filtros, no acá: si la pantalla
 * queda abierta a medianoche, el rango se recalcula solo.
 */
const RANGOS_FECHA: Record<string, number | null> = {
  todo: null,
  "7": 7,
  "30": 30,
  "90": 90,
};

/** La fecha ISO de hace `dias` días, o `null` si el rango es "todo". */
function desdeHace(dias: number | null): string | null {
  if (dias === null) return null;
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

/**
 * Desde cuándo el pedido está en el estado en el que está.
 *
 * Es lo que va en el pill del encabezado. Sale del timeline real, no de una
 * fecha de llegada estimada: esa no existe en la API y la que había era
 * inventada.
 */
const DESDE: Record<EstadoPedido, string> = {
  "pendiente de envio": "En preparación desde",
  "en envio": "En camino desde",
  entregado: "Entregado el",
  cancelado: "Cancelado el",
};

function estadoDesde(pedido: PedidoListItem): string | null {
  // El último registro de ese estado: si un pedido volvió a un estado, vale
  // la vez más reciente.
  const registro = [...pedido.seguimiento].reverse().find((s) => s.estado_nuevo === pedido.estado);
  const fecha = formatFechaCorta(
    registro?.creado_at
    ?? (pedido.estado === "entregado" ? pedido.entregado_at : pedido.confirmado_at),
  );
  return fecha ? `${DESDE[pedido.estado]} ${fecha}` : null;
}

/** A dónde lleva "Ver detalle". Lo comparten las cuatro variantes. */
function detalleDe(pedido: PedidoListItem) {
  return `/pedidos/${pedido.id}`;
}

// ── Piezas de la tarjeta ──────────────────────────────────────────────────────

/** El badge de estado: el estado del pedido, tal cual. */
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

/** El pill gris de la orden de compra: `OC-` más el inicio de su id. */
function PillOrden({ ordenId }: { ordenId: string }) {
  return (
    <View className="px-2 py-0.5 rounded-md bg-stone-100 w-fit native:w-auto shrink-0">
      <Span peso="semibold" numberOfLines={1} className="text-[10px] leading-4 text-stone-500 tracking-[0.3px]">
        OC-{ordenId.slice(0, 8).toUpperCase()}
      </Span>
    </View>
  );
}

/** El pill de contorno de la derecha: "Prioridad Alta", "Llegada: 21 Oct". */
function PillInfo({ texto, Icono }: { texto: string; Icono?: React.ComponentType<{ size?: number; color?: string }> }) {
  return (
    <View className="flex flex-row items-center gap-1.5 px-2.5 py-1 rounded-full border border-stone-200 bg-white w-fit native:w-auto shrink">
      {Icono && <Icono size={11} color="#A8A29E" />}
      <Span peso="medium" numberOfLines={1} className="text-[10px] leading-4 text-stone-500 shrink">{texto}</Span>
    </View>
  );
}

function Miniatura({ uri, etiqueta, tamano = "grande" }: { uri: string | null; etiqueta: string; tamano?: "grande" | "chica" }) {
  const clase = tamano === "grande" ? "w-11 h-11 rounded-xl" : "w-10 h-10 rounded-lg";
  return (
    <View className={`${clase} bg-stone-100 overflow-hidden flex items-center justify-center shrink-0`}>
      {uri ? (
        <Image source={{ uri }} accessibilityLabel={etiqueta} resizeMode="cover" className="w-full h-full" />
      ) : (
        <Package2 size={tamano === "grande" ? 18 : 16} color="#A8A29E" />
      )}
    </View>
  );
}

/**
 * El encabezado, idéntico en las cuatro tarjetas: miniatura, `#ID`, el pill de
 * la orden y el distribuidor a la izquierda; el estado y un pill de contorno a
 * la derecha.
 */
function EncabezadoPedido({
  pedido,
  pillDerecha,
  IconoPill,
}: {
  pedido: PedidoListItem;
  pillDerecha?: string | null;
  IconoPill?: React.ComponentType<{ size?: number; color?: string }>;
}) {
  return (
    <View className="flex flex-row items-start justify-between gap-3 flex-wrap">
      <View className="flex flex-row items-start gap-3 shrink">
        <Miniatura uri={pedido.primer_producto_imagen} etiqueta={descripcionDe(pedido)} />
        <View className="shrink">
          <View className="flex flex-row items-center gap-2 flex-wrap">
            <H3 peso="bold" numberOfLines={1} className="text-base leading-6 text-stone-900">
              #{idCorto(pedido.id)}
            </H3>
            <PillOrden ordenId={pedido.orden_id} />
          </View>
          <View className="flex flex-row items-center gap-1.5 flex-wrap">
            <P numberOfLines={1} className="text-xs leading-5 text-stone-500 shrink">
              Distribuidor: {pedido.distribuidor_nombre ?? "—"}
            </P>
            {pedido.distribuidor_id && (
              <Span peso="medium" numberOfLines={1} className="text-[10px] leading-4 text-stone-400">
                · {idCorto(pedido.distribuidor_id)}
              </Span>
            )}
          </View>
        </View>
      </View>

      <View className="flex flex-row items-center gap-2 shrink flex-wrap">
        <BadgeEstado estado={pedido.estado} />
        {pillDerecha && <PillInfo texto={pillDerecha} Icono={IconoPill} />}
      </View>
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
      {secundario && (
        <P numberOfLines={1} className="text-[10px] leading-4 text-stone-400">{secundario}</P>
      )}
    </View>
  );
}

// ── Botones ───────────────────────────────────────────────────────────────────

/**
 * Los botones de la tarjeta son `Pressable` y no `Boton`: llevan ícono y texto
 * como hermanos, y `Boton` envuelve sus children en un `Text` (regla 70).
 */
function BotonChip({
  texto,
  Icono,
  onPress,
  href,
}: {
  texto: string;
  Icono?: React.ComponentType<{ size?: number; color?: string }>;
  onPress?: () => void;
  href?: string;
}) {
  const contenido = (
    <View className="flex flex-row items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-white cursor-pointer">
      {Icono && <Icono size={13} color="#57534E" />}
      <Span peso="semibold" numberOfLines={1} className="text-[11px] leading-4 text-stone-700">{texto}</Span>
    </View>
  );
  if (href) return <Link href={href} bloque>{contenido}</Link>;
  return (
    <Pressable role="button" accessibilityLabel={texto} onPress={onPress}>
      {contenido}
    </Pressable>
  );
}

/** El botón sólido: dorado, verde (confirmar) o casi negro (rastrear). */
function BotonSolido({
  texto,
  Icono,
  color,
  onPress,
  href,
  className = "",
}: {
  texto: string;
  Icono?: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  onPress?: () => void;
  href?: string;
  className?: string;
}) {
  const contenido = (
    <View
      style={{ backgroundColor: color }}
      className={`flex flex-row items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl cursor-pointer ${className}`}
    >
      {Icono && <Icono size={13} color="#FFFFFF" />}
      <Span peso="bold" numberOfLines={1} className="text-[11px] leading-4 uppercase tracking-[0.5px] text-white">
        {texto}
      </Span>
    </View>
  );
  if (href) return <Link href={href} bloque className={className}>{contenido}</Link>;
  return (
    <Pressable role="button" accessibilityLabel={texto} onPress={onPress} className={className}>
      {contenido}
    </Pressable>
  );
}

// ── La ruta del envío ─────────────────────────────────────────────────────────

/**
 * Los pasos de la ruta. Son los tres estados por los que pasa un pedido en la
 * API, ni uno más: cada uno se marca cumplido cuando aparece en el timeline
 * (`seguimiento`) y la fecha que se muestra es la de ese registro.
 *
 * El diseño traía un cuarto, "Preparado", que no existe como estado y salía de
 * un mock; se quitó. Si hace falta, el camino es agregarlo al enum de
 * `pedido`, no volver a inventarlo en el front.
 */
const PASOS: { clave: string; etiqueta: string; estado: EstadoPedido }[] = [
  { clave: "confirmado", etiqueta: "Confirmado", estado: "pendiente de envio" },
  { clave: "transito", etiqueta: "En camino", estado: "en envio" },
  { clave: "entregado", etiqueta: "Entregado", estado: "entregado" },
];

interface PasoRuta {
  clave: string;
  etiqueta: string;
  /** La segunda línea: la fecha si ya pasó, el destino si no. */
  detalle: string | null;
  cumplido: boolean;
}

function pasosDe(pedido: PedidoListItem): PasoRuta[] {
  return PASOS.map((paso) => {
    const registro = pedido.seguimiento.find((s) => s.estado_nuevo === paso.estado);
    // El primer paso vale por la fecha de confirmación aunque no haya
    // timeline: un pedido existe porque se confirmó.
    const fecha = registro?.creado_at ?? (paso.clave === "confirmado" ? pedido.confirmado_at : null);
    const cumplido = Boolean(registro) || (paso.clave === "confirmado" && Boolean(pedido.confirmado_at));
    return {
      clave: paso.clave,
      etiqueta: paso.etiqueta,
      // Los cumplidos dicen cuándo pasaron; el que falta, a dónde va.
      detalle: cumplido ? formatFechaHora(fecha) : pedido.destino,
      cumplido,
    };
  });
}

/**
 * Cuál es el paso en curso: el **último cumplido**, que es donde está el
 * envío ahora. Si el último de todos ya se cumplió (entregado) no hay paso en
 * curso y se pintan todos con palomita.
 */
function indiceEnCurso(pasos: PasoRuta[]): number {
  let ultimo = -1;
  pasos.forEach((paso, i) => { if (paso.cumplido) ultimo = i; });
  return ultimo === pasos.length - 1 ? -1 : ultimo;
}

function CirculoPaso({ paso, indice, esActual }: { paso: PasoRuta; indice: number; esActual: boolean }) {
  // Tres formas: el que está en curso (oscuro con el camión), los que ya
  // pasaron (dorado con palomita) y los pendientes (gris con su número). Los
  // colores van por `style` porque cambian con el dato (regla 50).
  const fondo = esActual ? "#1C1917" : paso.cumplido ? "#DAA520" : "#E7E5E4";
  return (
    <View className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: fondo }}>
      {esActual ? (
        <Truck size={12} color="#FFFFFF" />
      ) : paso.cumplido ? (
        <Check size={12} color="#FFFFFF" />
      ) : (
        <Span peso="semibold" className="text-[10px] leading-4 text-stone-400">{indice + 1}</Span>
      )}
    </View>
  );
}

function RutaEnvio({ pedido, entrega }: { pedido: PedidoListItem; entrega: EntregaDePedido }) {
  const pasos = pasosDe(pedido);
  const indiceActual = indiceEnCurso(pasos);
  // La barra llega al centro del paso en curso; entregado la llena entera.
  const avance = (indiceActual === -1 ? 1 : indiceActual / (pasos.length - 1)) * 100;

  return (
    <View className="bg-[#FDFCFA] border border-stone-100 rounded-xl px-4 py-3.5 mt-4">
      <View className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <Span peso="semibold" numberOfLines={1} className="text-[9px] leading-4 uppercase tracking-[0.7px] text-stone-400 shrink">
          Seguimiento del envío
        </Span>
        {/* Solo mientras el pedido no haya llegado: ya entregado, la fecha
            real la dice el propio paso de la ruta. */}
        {pedido.estado !== "entregado" && entrega.fechaEntregaAproximada && (
          <View className="flex flex-row items-center gap-1.5 shrink">
            <Clock size={11} color="#B45309" />
            <Span peso="semibold" numberOfLines={1} className="text-[10px] leading-4 text-[#B45309] shrink">
              Entrega aproximada: {formatFecha(entrega.fechaEntregaAproximada)}
              {entrega.ventanaHoraria ? ` · ${entrega.ventanaHoraria}` : ""}
            </Span>
          </View>
        )}
      </View>

      {/* La barra y, debajo, la fila de pasos. El ancho del avance va por
          `style` porque cambia con el dato (regla 50). */}
      <View className="h-1.5 rounded-full bg-stone-200 w-full mt-3.5">
        <View style={{ width: `${avance}%` }} className="h-1.5 rounded-full bg-[#DAA520]" />
      </View>

      <View className="flex flex-row items-start justify-between gap-1 mt-3">
        {pasos.map((paso, i) => (
          <View key={paso.clave} className="flex-1 flex flex-col items-center">
            <CirculoPaso paso={paso} indice={i} esActual={i === indiceActual} />
            <Span
              peso={paso.cumplido || i === indiceActual ? "semibold" : "medium"}
              numberOfLines={1}
              className="text-[10px] leading-4 mt-1.5"
              style={{ color: paso.cumplido || i === indiceActual ? "#292524" : "#A8A29E" }}
            >
              {paso.etiqueta}
            </Span>
            <Span numberOfLines={1} className="text-[9px] leading-3 text-stone-400 mt-0.5">
              {paso.detalle ?? "—"}
            </Span>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Cuerpos por estado ────────────────────────────────────────────────────────

/** La lista de productos, con su miniatura. Es el cuerpo de "preparando envío". */
function ProductosEnvio({ pedido }: { pedido: PedidoListItem }) {
  // El diseño muestra dos y el resto se resume, para que la tarjeta no crezca.
  const visibles = pedido.productos.slice(0, 2);
  const restantes = pedido.productos.length - visibles.length;

  return (
    <View className="flex flex-row items-center gap-4 mt-4 flex-wrap">
      {visibles.map((prod, i) => (
        <View key={`${prod.nombre}-${i}`} className="flex flex-row items-center gap-2.5 flex-1 min-w-[180px] shrink">
          <Miniatura uri={prod.imagen} etiqueta={prod.nombre ?? "Producto"} tamano="chica" />
          <View className="shrink">
            <P peso="semibold" numberOfLines={1} className="text-xs leading-5 text-stone-800">
              {cantidadDe(prod)} {prod.nombre ?? "Producto"}
            </P>
            <P numberOfLines={1} className="text-[10px] leading-4 text-stone-400">
              {formatMoney(prod.subtotal)} {MONEDA}
            </P>
          </View>
        </View>
      ))}
      {restantes > 0 && (
        <Span peso="medium" className="text-[10px] leading-4 text-stone-400">
          +{restantes} {restantes === 1 ? "producto más" : "productos más"}
        </Span>
      )}
      {pedido.destino && (
        <View className="shrink-0">
          <Span peso="semibold" className="text-[9px] leading-4 uppercase tracking-[0.6px] text-stone-400">Destino</Span>
          <View className="flex flex-row items-center gap-1.5 mt-1">
            <Truck size={13} color="#78716C" />
            <P peso="semibold" numberOfLines={1} className="text-xs leading-5 text-stone-800">{pedido.destino}</P>
          </View>
        </View>
      )}
    </View>
  );
}

/** El panel crema de la tarjeta compacta cuando el pedido va en camino. */
function PanelEnvio({ pedido }: { pedido: PedidoListItem }) {
  const primero = pedido.productos[0];
  return (
    <View className="bg-[#FAF7F2] rounded-xl px-4 py-3 mt-4 flex flex-row items-center justify-between gap-3 flex-wrap">
      <BloqueDato
        rotulo="Artículos en envío"
        principal={primero ? `${cantidadDe(primero)} ${primero.nombre ?? "Producto"}` : cargaDe(pedido)}
        secundario={cargaDe(pedido)}
      />
      <BloqueDato rotulo="Punto de entrega" principal={pedido.destino ?? "—"} />
    </View>
  );
}

/**
 * Cómo fue la entrega: las fotos que dejó el transportista y las notas.
 *
 * Solo aparece cuando el pedido está entregado, porque es lo único que puede
 * tener evidencias. Las fotos van en un carrusel horizontal (en nativo no hay
 * `overflow-x-auto`, regla 17) y lo que no es foto —una firma, una nota— se
 * lista abajo como texto.
 */
function EvidenciasEntrega({ evidencias }: { evidencias: EntregaDePedido["evidencias"] }) {
  if (evidencias.length === 0) return null;
  const fotos = evidencias.filter((e) => e.tipo === "foto" && e.url);
  const notas = evidencias.filter((e) => e.tipo !== "foto" || !e.url);

  return (
    <View className="mt-4 pt-4 border-t border-stone-100">
      <Span peso="semibold" className="text-[9px] leading-4 uppercase tracking-[0.6px] text-stone-400">
        Evidencias de la entrega
      </Span>

      {fotos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 py-1" className="mt-2">
          {fotos.map((ev) => (
            <View key={ev.id} className="w-[180px]">
              <View className="w-full h-[110px] rounded-xl bg-stone-100 overflow-hidden">
                <Image
                  source={{ uri: ev.url! }}
                  accessibilityLabel={ev.descripcion}
                  resizeMode="cover"
                  className="w-full h-full"
                />
              </View>
              <P numberOfLines={3} className="text-[10px] leading-4 text-stone-500 mt-1.5">
                {ev.descripcion}
              </P>
            </View>
          ))}
        </ScrollView>
      )}

      {notas.map((ev) => (
        <View key={ev.id} className="flex flex-row items-start gap-1.5 mt-2">
          <CheckCircle2 size={12} color="#047857" />
          <P numberOfLines={3} className="text-[11px] leading-4 text-stone-600 shrink">{ev.descripcion}</P>
        </View>
      ))}
    </View>
  );
}

// ── Tarjeta de pedido ─────────────────────────────────────────────────────────

/**
 * La tarjeta de un pedido.
 *
 * Colapsada muestra el encabezado y el cuerpo que corresponde a su estado
 * (productos, panel de envío, folio o el motivo de la cancelación). Expandida
 * cambia ese cuerpo por el desglose completo: la ruta del envío y los bloques
 * de destino, carga y transportista. La primera del listado arranca expandida,
 * que es el envío que el usuario está siguiendo.
 */
function TarjetaPedido({ pedido, inicialExpandida }: { pedido: PedidoListItem; inicialExpandida: boolean }) {
  const { entregaDe } = useEntregasPedidos();
  const entrega = entregaDe(pedido.id);
  const [expandida, setExpandida] = useState(inicialExpandida);

  // Un pedido cancelado no tiene ruta ni desglose que mostrar: se corta donde
  // se cortó, así que tampoco se puede expandir.
  const cancelado = pedido.estado === "cancelado";

  return (
    <View className=" bg-white border border-stone-200/70 rounded-2xl p-4 md:p-5 drop-shadow-md  w-[350px] md:w-full mr-[12px] md:mr-0 mb-6">
      <EncabezadoPedido pedido={pedido} pillDerecha={estadoDesde(pedido)} IconoPill={CalendarDays} />

      {cancelado ? (
        <MotivoCancelacion pedido={pedido} />
      ) : expandida ? (
        <>
          <RutaEnvio pedido={pedido} entrega={entrega} />

          <View className="flex flex-row flex-wrap gap-4 mt-4">
            <BloqueDato rotulo="Destino de entrega" Icono={Warehouse} principal={pedido.destino ?? "—"} />
            <BloqueDato rotulo="Carga & embalaje" Icono={Boxes} principal={cargaDe(pedido)} />
            {entrega.transportista && (
              <BloqueDato
                rotulo="Transportista"
                Icono={ShieldCheck}
                principal={entrega.transportista}
                secundario={entrega.chofer}
              />
            )}
          </View>

          <EvidenciasEntrega evidencias={entrega.evidencias} />
        </>
      ) : pedido.estado === "pendiente de envio" ? (
        <ProductosEnvio pedido={pedido} />
      ) : pedido.estado === "en envio" ? (
        <PanelEnvio pedido={pedido} />
      ) : null}

      <View className="flex flex-row items-center justify-end gap-3 mt-4 flex-wrap">
        <View className="flex flex-row items-center gap-2 flex-wrap shrink-0">
          {!cancelado && (
            <BotonChip
              texto={expandida ? "Ocultar detalle" : "Ver seguimiento"}
              Icono={expandida ? ChevronUp : ChevronDown}
              onPress={() => setExpandida((abierta) => !abierta)}
            />
          )}
          <BotonSolido texto="Ver detalle" color="#C79A2B" href={detalleDe(pedido)} />
        </View>
      </View>
    </View>
  );
}

function MotivoCancelacion({ pedido }: { pedido: PedidoListItem }) {
  const cancelacion = pedido.seguimiento.find((s) => s.estado_nuevo === "cancelado");
  return (
    <View className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 mt-4 flex flex-row items-center gap-2">
      <Ban size={14} color="#DC2626" />
      <Span peso="medium" numberOfLines={3} className="text-[11px] leading-4 text-red-600 shrink">
        {cancelacion?.descripcion || `Pedido cancelado el ${formatFecha(cancelacion?.creado_at ?? null)}`}
      </Span>
    </View>
  );
}

// ── Columna de apoyo ──────────────────────────────────────────────────────────

/**
 * Soporte de envío y cumplimiento de entregas. Los dos salen de
 * `SoporteEnvioProvider`, que hoy devuelve datos de muestra.
 */
function ColumnaApoyo({ className = "" }: { className?: string }) {
  const { enlaces, entregas, cargando, irAnterior, irSiguiente, puedeSiguiente } = useSoporteEnvio();

  const timeOutRef = useRef< ReturnType<typeof setTimeout> | null >(null);

  const handleTimeout = useCallback((fun:CallableFunction)=>{
    if (timeOutRef.current){
      clearTimeout(timeOutRef.current);
    }
    timeOutRef.current = setTimeout(()=>{
      fun();
    },100)
  },[irSiguiente]);

  return (
    <View className={`flex flex-col gap-4 ${className}`}>
      {/* Los enlaces son locales, así que esta tarjeta no espera a nadie. */}
      {enlaces.length > 0 && (
        <Section className="bg-white border border-stone-100 rounded-2xl p-5 drop-shadow-sm">
          <View className="flex flex-row items-center gap-2">
            <LifeBuoy size={14} color="#B45309" />
            <H2 peso="semibold" className="text-[10px] leading-4 uppercase tracking-[0.6px] text-[#B45309]">
              Soporte de envío
            </H2>
          </View>
          <P className="text-xs leading-5 text-stone-500 mt-2">
            Resolución prioritaria de incidencias, seguro de mercancías y discrepancias de entrega.
          </P>
          
          <View className="flex flex-col gap-2 mt-4">
            {enlaces.map((enlace) => (
              // Sin `href` no es un enlace: se pinta como fila informativa en
              // vez de prometer una navegación que no existe.
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
            Icono={Headset}
            iconoSize={16}
            href="/perfil/soporte"
            claseTexto="text-xs leading-5"
            className="py-2.5 px-4 rounded-xl mt-4 w-full"
          >
            Contactar soporte
          </Boton>
        </Section>
      )}

      {/* El esqueleto es solo para la primera carga. Al cambiar de periodo la
          gráfica se queda montada y ella sola baja las barras a cero (regla
          85): reemplazarla por un bloque gris hace saltar toda la columna. */}
      {entregas.length === 0 && cargando ? (
        <View className="bg-stone-100 rounded-2xl min-h-[150px]" />
      ) : (
        <GraficaEntregas
          dias={entregas}
          titulo="Cumplimiento de entregas"
          onAnterior={()=>handleTimeout(irAnterior)}
          onSiguiente={()=>handleTimeout(irSiguiente)}
          puedeSiguiente={puedeSiguiente}
          cargando={cargando}
        />
      )}
      <Section className="px-4 mt-5">
            <ExportacionMasiva
              className="md:max-w-md"
              titulo="Manifiesto de envíos"
              rotulo="Documentación logística"
              descripcion="Descarga el detalle de tus pedidos con destino, productos y totales, tal como los estás filtrando."
            />
          </Section>
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

  // Como mucho cinco números, centrados en la página actual.
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

/** Lo que se ofrece hoy del manifiesto: solo Excel está implementado. */
const OPCIONES_MANIFIESTO: OpcionExportacion[] = [
  { formato: "xlsx", etiqueta: "Excel (.xlsx)", descripcion: "Manifiesto con una fila por producto", disponible: true },
  { formato: "pdf", etiqueta: "Manifiesto PDF", descripcion: "Con acuses de recibo", disponible: false },
];

export interface PedidosProps {
  /** Primera página ya cargada. Web la trae del servidor; mobile pasa `null`. */
  listado: ListadoPedidos | null;
  /** Vuelve a pedir el listado cuando cambian los filtros o la página. */
  cargarPedidos: (filtros: FiltrosPedidos) => Promise<ListadoPedidos>;
  /** Genera el manifiesto con los filtros de la pantalla. */
  exportarAction: (formato: FormatoExportacion, filtros: FiltrosPedidos) => Promise<ArchivoExportado>;
  /**
   * Trae la entrega de los pedidos de la página (fecha aproximada,
   * transportista y evidencias). Necesita la sesión, así que la inyecta la
   * app (regla 13). Sin ella, la tarjeta se pinta sin esos datos.
   */
  cargarEntregas?: CargarEntregas;
  /**
   * Cuántos pedidos hay en cada estado, con los filtros vigentes. Alimenta a
   * la vez las tarjetas del resumen y los contadores de las pestañas, así que
   * los dos números siempre coinciden.
   */
  cargarResumen?: (filtros: FiltrosPedidos) => Promise<ResumenPedidos>;
  /**
   * Las entregas por día de la gráfica de cumplimiento. Sin esta prop la
   * gráfica no se pinta.
   */
  cargarEntregasPorDia?: (hasta: string | null) => Promise<DiaEntregas[]>;
  /** Cuántas órdenes de compra están pendientes, para la insignia del acceso. */
  ordenesPendientes?: number;
}

const POR_PAGINA = 10;

export default function Pedidos(props: PedidosProps) {
  // Los providers van acá y no en cada ruta: son parte de esta pantalla y así
  // web y mobile la montan igual, con un solo componente.
  return (
    <SoporteEnvioProvider cargarEntregas={props.cargarEntregasPorDia}>
      <PantallaPedidos {...props} />
    </SoporteEnvioProvider>
  );
}

function PantallaPedidos({
  listado: listadoInicial,
  cargarPedidos,
  exportarAction,
  cargarEntregas,
  cargarResumen,
  ordenesPendientes = 0,
}: PedidosProps) {
  const [listado, setListado] = useState<ListadoPedidos | null>(listadoInicial);
  const [cargando, setCargando] = useState(listadoInicial === null);
  const [errorCarga, setErrorCarga] = useState(false);

  const [estado, setEstado] = useState<EstadoPedido | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [distribuidorId, setDistribuidorId] = useState("todos");
  const [rangoFecha, setRangoFecha] = useState("todo");
  const [orden, setOrden] = useState<"asc" | "desc">("desc");
  const [pagina, setPagina] = useState(1);
  const [intento, setIntento] = useState(0);


  const [resumen, setResumen] = useState<ResumenPedidos | null>(null);

  const filtros = useMemo<FiltrosPedidos>(() => ({
    estado,
    q: busqueda,
    distribuidorId: distribuidorId === "todos" ? null : distribuidorId,
    fechaDesde: desdeHace(RANGOS_FECHA[rangoFecha] ?? null),
    fechaHasta: null,
    orden,
    pagina,
    cantidad: POR_PAGINA,
  }), [estado, busqueda, distribuidorId, rangoFecha, orden, pagina]);

  /**
   * El resumen se recarga cuando cambia un filtro, pero **no** cuando cambias
   * de pestaña ni de página: los conteos son los mismos, solo cambia cuál
   * estás mirando. Sin esto, cada clic en una pestaña pediría lo mismo otra
   * vez. Lo que sí tiene que estar son **todos** los demás filtros: si faltara
   * alguno, las pestañas contarían pedidos que el listado ya no muestra.
   */
  const filtrosResumen = useMemo<FiltrosPedidos>(
    () => ({
      q: busqueda,
      distribuidorId: distribuidorId === "todos" ? null : distribuidorId,
      fechaDesde: desdeHace(RANGOS_FECHA[rangoFecha] ?? null),
      fechaHasta: null,
    }),
    [busqueda, distribuidorId, rangoFecha],
  );

  useEffect(() => {
    if (!cargarResumen) return;
    let vigente = true;
    cargarResumen(filtrosResumen).then(
      (recibido) => { if (vigente) setResumen(recibido); },
      // Es información de apoyo: si falla, las tarjetas no se pintan y las
      // pestañas se quedan sin número, pero el listado sigue.
      () => { if (vigente) setResumen(null); },
    );
    return () => { vigente = false; };
  }, [filtrosResumen, cargarResumen, intento]);

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
   * Un filtro recorta el listado, así que la página en la que estabas deja de
   * tener sentido y se vuelve a la 1. Los desplegables de orden (`tipo:
   * "orden"`) no: reordenan lo mismo y respetan la página actual.
   */
  const cambiarFiltro = useCallback((aplicar: () => void, reiniciarPagina = true) => {
    if (reiniciarPagina) setPagina(1);
    aplicar();
  }, []);

  /**
   * Los distribuidores del desplegable **se acumulan entre cargas**. Salen de
   * los pedidos de la página porque la API todavía no expone "mis
   * distribuidores"; si solo se miraran los de la página actual, al filtrar
   * por uno la lista se quedaría con ese solo y no habría forma de cambiar sin
   * limpiar el filtro. El valor es el id, que es lo que el endpoint espera.
   */
  const distribuidoresVistos = useRef(new Map<string, string>());

  const desplegables: DesplegableFiltro[] = useMemo(() => {
    for (const p of listado?.pedidos ?? []) {
      if (p.distribuidor_id && p.distribuidor_nombre) {
        distribuidoresVistos.current.set(p.distribuidor_id, p.distribuidor_nombre);
      }
    }
    return [
      {
        id: "distribuidor",
        valor: distribuidorId,
        className: "md:w-52",
        opciones: [
          { valor: "todos", etiqueta: "Todos los distribuidores" },
          ...[...distribuidoresVistos.current].map(([id, nombre]) => ({ valor: id, etiqueta: nombre })),
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
  }, [listado, distribuidorId, rangoFecha, orden]);

  const pestanas = useMemo<PestanaFiltro[]>(
    // Todas las pestañas llevan su número, no solo la activa: los conteos
    // vienen de `/pedidos/resumen`, que los devuelve para los cuatro estados.
    // "Todos" lleva el total.
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

  // Las tarjetas salen de los mismos conteos que las pestañas, así que nunca
  // se contradicen.
  const tarjetas = useMemo(() => (resumen ? tarjetasDeConteos(resumen) : []), [resumen]);

  const exportar = useCallback(
    async (formato: FormatoExportacion) => {
      const archivo = await exportarAction(formato, filtros);
      await descargarArchivo(archivo);
      return archivo.nombre;
    },
    [exportarAction, filtros],
  );

  const pedidos = listado?.pedidos ?? [];
  // Los ids de la página que se está viendo: es lo que el provider de
  // logística necesita para traer (hoy, inventar) los datos de cada envío.
  const idsPedidos = useMemo(() => pedidos.map((p) => p.id), [listado]);
 const ITEM_MARGIN = 12;
  const SNAP_INTERVAL = 350 + ITEM_MARGIN;
  const snapOffsets = pedidos.map((_, i) => i * SNAP_INTERVAL);
  return (
    <ExportacionProvider opciones={OPCIONES_MANIFIESTO} onDescargar={exportar}>
      <EntregasPedidosProvider pedidoIds={idsPedidos} cargarEntregas={cargarEntregas}>
        <ContenedorPantalla key="pedidos" className="mx-auto w-full px-0 lg:px-16 lg:pt-8 pb-24 bg-[#FAF7F2] min-h-screen">
          <Header className="px-4 pt-5 pb-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <View className="shrink">
              <H1 peso="bold" className="text-2xl md:text-3xl leading-9 text-stone-900">
                Mis pedidos y envíos
              </H1>
              <P className="text-xs md:text-sm leading-5 text-stone-500 mt-1">
                Da seguimiento a tus envíos en curso y consulta el historial de entregas.
              </P>
            </View>
            <View className="flex flex-col md:flex-row gap-2 md:gap-3 shrink-0">
              {/* `border-solid`: la variante trae `border-none` y las dos clases
                sobreviven al twMerge, porque son grupos distintos. */}
              <Boton
                variante="oscuro"
                Icono={Upload}
                iconoSize={16}
                onClick={() => exportar("xlsx")}
                claseTexto="text-xs leading-5"
                className="py-2.5 px-4 rounded-xl w-full md:w-auto"

              >
                Descargar manifiesto
              </Boton>
              <Boton
                variante="chip"
                Icono={ShoppingBag}
                iconoSize={16}
                onClick={() => exportar("xlsx")}
                claseTexto="text-xs leading-5"
                className="py-2.5 px-4 rounded-xl w-full md:w-auto"
                href="/pedidos/ordenes"
              >

                <View className="flex flex-row gap-2 flex-wrap items-center">
                  <Text>Órdenes de compra</Text>
                  <View className="flex flex-row items-center gap-2 shrink-0 ">
                    {ordenesPendientes > 0 && (
                      <View className="bg-amber-500 px-2 py-0.5 rounded-full">
                        <Span peso="bold" className="text-white text-[10px] leading-4">{ordenesPendientes}</Span>
                      </View>
                    )}
                    <ArrowRight size={16} color="#A8A29E" />
                  </View>
                </View>
              </Boton>

            </View>
          </Header>
        <HR className="my-8 w-full" />


          {/* Resumen: cuántas tarjetas y de qué tipo lo decide el provider. Las
            que traen `filtraEstado` filtran el listado al tocarlas. */}
          <Section className="mt-5">
            <TarjetasResumen
              tarjetas={tarjetas}
              cargando={cargarResumen !== undefined && resumen === null}
              onSeleccionar={(valor) => cambiarFiltro(() => setEstado(valor as EstadoPedido | null))}
            />
          </Section>

          {/* Dos columnas desde lg: el listado y la columna de apoyo. */}
          <View className="px-4 mt-5 flex flex-col lg:flex-row gap-4 items-start">
            <View className="w-full lg:flex-1">
              {/* `z-20`: en react-native-web cada View es `position: relative` con
                `z-index: 0`, o sea un contexto de apilamiento, así que el `z-40`
                del desplegable no puede salirse de su padre y las tarjetas de
                abajo (que van después en el DOM) lo taparían. */}
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
                        if (id === "distribuidor") setDistribuidorId(valor);
                        else if (id === "fecha") setRangoFecha(valor);
                        else setOrden(valor as "asc" | "desc");
                      },
                      desplegables.find((d) => d.id === id)?.tipo !== "orden",
                    )
                  }
                />
              </View>
{listado && !cargando && !errorCarga && (
                <Paginador listado={listado} onPagina={(n) => setPagina(Math.max(1, n))} />
              )}
              {cargando ? (
                <View className="flex items-center justify-center py-16">
                  <Spinner tamano={32} />
                </View>
              ) : errorCarga ? (
                <View className="flex items-center justify-center py-16">
                  <P className="text-sm leading-6 text-stone-500 text-center">No se pudieron cargar tus pedidos.</P>
                  <Boton variante="secundario" className="mt-3" onClick={() => setIntento((n) => n + 1)}>
                    Volver a intentar
                  </Boton>
                </View>
              ) : pedidos.length === 0 ? (
                <View className="flex items-center justify-center py-16">
                  <View className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                    <Package2 size={24} color="#A8A29E" />
                  </View>
                  <H2 peso="semibold" className="text-base leading-6 text-stone-700 text-center">
                    Sin pedidos que mostrar
                  </H2>
                  <P className="text-xs leading-5 text-stone-400 text-center mt-1">
                    Prueba con otro filtro o explora el mercado.
                  </P>
                  <Link href="/mercado" bloque className="mt-3">
                    <Span peso="semibold" className="text-sm leading-5 text-[#C1901D]">Explorar productos →</Span>
                  </Link>
                </View>
              ) : (
                
                  

                  <FlatList
                                  data={pedidos}
                                  keyExtractor={(item) => `anuncio-${item.id}`}
                                  horizontal={!(Platform.OS==='web')}
                                  showsHorizontalScrollIndicator={false}
                                  snapToInterval={SNAP_INTERVAL}
                                  snapToAlignment="start"
                                  decelerationRate="fast"
                                  disableIntervalMomentum
                                  snapToOffsets={snapOffsets}
                                  className=" w-full max-w-full "
                                  renderItem={({ item, index }) => (
                    <TarjetaPedido key={item.id} pedido={item} inicialExpandida={index === 0} />
                                  )}
                />
                

                
              )}

              {listado && !cargando && !errorCarga && (
                <Paginador listado={listado} onPagina={(n) => setPagina(Math.max(1, n))} />
              )}
            </View>

            <ColumnaApoyo className="w-full lg:w-80 shrink-0" />
          </View>

          
        </ContenedorPantalla>
      </EntregasPedidosProvider>
    </ExportacionProvider>
  );
}
