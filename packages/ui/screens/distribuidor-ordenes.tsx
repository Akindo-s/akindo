/** @jsxImportSource nativewind */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, TextInput, View } from "react-native";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  MapPin,
  Package2,
  Repeat,
  Sparkles,
  User,
  X,
} from "lucide-react-native";
import type {
  CoberturaStock,
  EstadoOrden,
  FiltrosOrdenes,
  ListadoOrdenes,
  OrdenPedidoListItem,
  OrdenPedidoResponse,
  PaquetePedidoResponse,
  PedidoActionResult,
  ResumenOrdenes,
} from "@akindo/shared/types/pedidos";
import { MONEDA } from "@akindo/shared/constants";
import { tarjetasDeOrdenes } from "@akindo/shared/resumen-ordenes-distribuidor";
import { H1, H2, H3, Header, P, Pressable, Section, Span } from "@akindo/ui/html";
import { Boton, Link } from "@akindo/ui/components";
import { Tarjeta } from "@akindo/ui/components/ui/Tarjeta";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { Spinner } from "@akindo/ui/components/ui/Animaciones";
import { useAviso } from "@akindo/ui/components/ui/Avisos";
import { TarjetasResumen } from "@akindo/ui/components/ui/TarjetasResumen";
import { BarraFiltros, type DesplegableFiltro, type PestanaFiltro } from "@akindo/ui/components/ui/BarraFiltros";
import type { OpcionSelector } from "@akindo/ui/components/ui/Selector";

// ── Utils ─────────────────────────────────────────────────────────────────────

function formatMoney(v: number) {
  return v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "$12,400" — sin centavos, para las cifras de apoyo. */
function formatMoneyCorto(v: number) {
  return v.toLocaleString("es-MX", { maximumFractionDigits: 0 });
}

function formatFechaHora(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function idCorto(id: string) {
  return id.slice(0, 8).toUpperCase();
}

/** "12 kg" o "12 ×" cuando la partida no trae unidad. */
function cantidadDe(paq: PaquetePedidoResponse) {
  const cantidad = paq.cantidad.toLocaleString("es-MX", { maximumFractionDigits: 2 });
  const unidad = paq.medida_snapshot?.unidad;
  return unidad ? `${cantidad} ${unidad}` : `${cantidad} ×`;
}

// ── Estados y cobertura ───────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<EstadoOrden, { label: string; hex: string; bg: string; texto: string }> = {
  pendiente: { label: "Pendiente", hex: "#B45309", bg: "bg-amber-50", texto: "text-amber-700" },
  aceptada: { label: "Aceptada", hex: "#047857", bg: "bg-emerald-50", texto: "text-emerald-700" },
  rechazada: { label: "Rechazada", hex: "#DC2626", bg: "bg-red-50", texto: "text-red-600" },
  cancelada: { label: "Cancelada", hex: "#57534E", bg: "bg-stone-100", texto: "text-stone-600" },
};

/**
 * Cómo se ve el veredicto de inventario. El texto es el que el vendedor
 * necesita leer para decidir, no el nombre técnico del estado.
 */
const COBERTURA_CONFIG: Record<CoberturaStock, {
  label: string;
  hex: string;
  bg: string;
  borde: string;
  texto: string;
  Icono: React.ComponentType<{ size?: number; color?: string }>;
}> = {
  completo: {
    label: "Puedes surtirla",
    hex: "#047857",
    bg: "bg-emerald-50",
    borde: "border-emerald-200",
    texto: "text-emerald-700",
    Icono: CheckCircle2,
  },
  parcial: {
    label: "Alcanza solo para parte",
    hex: "#B45309",
    bg: "bg-amber-50",
    borde: "border-amber-200",
    texto: "text-amber-700",
    Icono: AlertTriangle,
  },
  sin_stock: {
    label: "Sin inventario",
    hex: "#DC2626",
    bg: "bg-red-50",
    borde: "border-red-200",
    texto: "text-red-600",
    Icono: AlertTriangle,
  },
};

const PESTANAS: PestanaFiltro[] = [
  { valor: null, etiqueta: "Todas" },
  { valor: "pendiente", etiqueta: "Pendientes" },
  { valor: "aceptada", etiqueta: "Aceptadas" },
  { valor: "rechazada", etiqueta: "Rechazadas" },
  { valor: "cancelada", etiqueta: "Canceladas" },
];

const ORDEN_FECHA: OpcionSelector[] = [
  { valor: "desc", etiqueta: "Más reciente primero" },
  { valor: "asc", etiqueta: "Más antigua primero" },
];

const RANGOS_FECHA: Record<string, number | null> = { todo: null, "7": 7, "30": 30, "90": 90 };

function desdeHace(dias: number | null): string | null {
  if (dias === null) return null;
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

// ── Modal de rechazo ──────────────────────────────────────────────────────────

function RechazarModal({
  orden,
  onClose,
  onConfirm,
  loading,
}: {
  orden: OrdenPedidoListItem;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
  loading: boolean;
}) {
  const [motivo, setMotivo] = useState("");

  return (
    // `fixed` no existe en nativo: ahí `absolute` cubre el área de la pantalla.
    <View className="absolute web:fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 elevation-[50]">
      <Tarjeta className="w-full max-w-md shadow-2xl">
        <H3 peso="bold" className="text-lg text-stone-900 mb-2">Rechazar orden de compra</H3>
        <P className="text-sm text-stone-500 mb-4">
          Estás a punto de rechazar la orden de{" "}
          <Span peso="bold" className="text-sm text-stone-500">{orden.cliente_nombre}</Span>.
          El motivo es opcional, pero es lo único que va a ver el cliente:
        </P>

        <TextInput
          value={motivo}
          onChangeText={setMotivo}
          multiline
          placeholder="Ej: Sin stock suficiente..."
          placeholderTextColor="#A8A29E"
          className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-[17px] leading-6 mb-6 min-h-[100px]"
        />

        <View className="flex flex-row gap-3">
          {/* `w-full shrink`: el original es `w-full` y lo achica el
              `flex-shrink: 1` que CSS trae por defecto y RN no (regla 24). */}
          <Boton variante="secundario" onClick={onClose} className="w-full shrink">
            Cancelar
          </Boton>
          {/* `border-0` y no `border-transparent`: el `border-none` del
              original quita el borde, no lo pinta transparente. El texto va
              por `claseTexto` (regla 25). */}
          <Boton
            variante="peligro"
            onClick={() => onConfirm(motivo)}
            loading={loading}
            className="w-full shrink border-0 bg-red-600 hover:bg-red-700"
            claseTexto="text-white"
          >
            Confirmar rechazo
          </Boton>
        </View>
      </Tarjeta>
    </View>
  );
}

// ── Modal de aceptación ───────────────────────────────────────────────────────

/**
 * La confirmación de aceptar.
 *
 * Existe sobre todo por el caso incómodo: aceptar una orden que el inventario
 * no cubre. No lo impide —el vendedor puede tener stock que el sistema no
 * sabe— pero lo dice con nombre y apellido antes de escribir.
 */
function AceptarModal({
  orden,
  onClose,
  onConfirm,
  loading,
}: {
  orden: OrdenPedidoListItem;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const faltantes = orden.paquetes.filter((p) => p.suficiente === false);

  return (
    <View className="absolute web:fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 elevation-[50]">
      <Tarjeta className="w-full max-w-md shadow-2xl">
        <H3 peso="bold" className="text-lg text-stone-900 mb-2">Aceptar orden de compra</H3>
        <P className="text-sm text-stone-500 mb-4">
          Al aceptarla se confirma el cobro a{" "}
          <Span peso="bold" className="text-sm text-stone-500">{orden.cliente_nombre}</Span>{" "}
          y la orden se convierte en un pedido que tendrás que surtir.
        </P>

        {faltantes.length > 0 && (
          <View className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-3 mb-4">
            <View className="flex flex-row items-center gap-2">
              <AlertTriangle size={14} color="#B45309" />
              <Span peso="semibold" className="text-xs leading-5 text-amber-800">
                Tu inventario no alcanza para {faltantes.length === 1 ? "una partida" : `${faltantes.length} partidas`}
              </Span>
            </View>
            <View className="flex flex-col gap-1 mt-2">
              {faltantes.map((p) => (
                <Span key={p.id} numberOfLines={2} className="text-[11px] leading-4 text-amber-700">
                  · {p.nombre_producto ?? "Producto"}: piden {cantidadDe(p)} y te quedan {p.existencias ?? 0}
                </Span>
              ))}
            </View>
            <Span className="text-[11px] leading-4 text-amber-700 mt-2">
              Puedes aceptarla de todas formas si tienes existencias que no están registradas.
            </Span>
          </View>
        )}

        <View className="flex flex-row gap-3">
          <Boton variante="secundario" onClick={onClose} className="w-full shrink">
            Cancelar
          </Boton>
          <Boton onClick={onConfirm} loading={loading} className="w-full shrink">
            Sí, aceptar
          </Boton>
        </View>
      </Tarjeta>
    </View>
  );
}

// ── Piezas de la tarjeta ──────────────────────────────────────────────────────

function BadgeEstado({ estado }: { estado: EstadoOrden }) {
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

/** El veredicto de inventario: la respuesta a "¿puedo surtirla?". */
function BadgeCobertura({ cobertura }: { cobertura: CoberturaStock }) {
  const cfg = COBERTURA_CONFIG[cobertura];
  return (
    <View className={`flex flex-row items-center gap-1.5 px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.borde} w-fit native:w-auto shrink`}>
      <cfg.Icono size={11} color={cfg.hex} />
      <Span peso="semibold" numberOfLines={1} className={`text-[10px] leading-4 uppercase tracking-[0.4px] shrink ${cfg.texto}`}>
        {cfg.label}
      </Span>
    </View>
  );
}

function AvatarCliente({ orden }: { orden: OrdenPedidoListItem }) {
  return (
    <View className="w-9 h-9 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center shrink-0">
      {orden.cliente_imagen ? (
        <Image
          source={{ uri: orden.cliente_imagen }}
          accessibilityLabel={orden.cliente_nombre ?? "Cliente"}
          resizeMode="cover"
          className="w-full h-full"
        />
      ) : (
        <User size={16} color="#A8A29E" />
      )}
    </View>
  );
}

/**
 * La respuesta a "¿este cliente ya me ha pedido antes?".
 *
 * Cuenta solo las órdenes que este distribuidor **aceptó**: una orden
 * rechazada no dice nada bueno ni malo del cliente.
 */
function SelloCliente({ orden }: { orden: OrdenPedidoListItem }) {
  const previas = orden.cliente_ordenes_previas ?? 0;
  const monto = orden.cliente_monto_historico ?? 0;

  if (previas === 0) {
    return (
      <View className="flex flex-row items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 w-fit native:w-auto">
        <Sparkles size={11} color="#1D4ED8" />
        <Span peso="semibold" className="text-[10px] leading-4 text-blue-700">Cliente nuevo</Span>
      </View>
    );
  }

  return (
    <View className="flex flex-row items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-100 w-fit native:w-auto">
      <Repeat size={11} color="#57534E" />
      <Span peso="semibold" numberOfLines={1} className="text-[10px] leading-4 text-stone-600">
        {previas + 1}ª orden · ${formatMoneyCorto(monto)} antes
      </Span>
    </View>
  );
}

/**
 * Las partidas con su disponibilidad.
 *
 * Cada renglón dice cuánto piden y cuánto queda. Las que no alcanzan se
 * marcan: son las que el vendedor tiene que mirar antes de decidir.
 */
function Partidas({ orden }: { orden: OrdenPedidoListItem }) {
  const evaluadas = orden.estado === "pendiente";

  return (
    <View className="bg-[#FAF7F2] rounded-xl px-3 py-2.5 mt-3 flex flex-col gap-2">
      {orden.paquetes.map((paq) => {
        const falta = paq.suficiente === false;
        return (
          <View key={paq.id} className="flex flex-row items-center justify-between gap-2 flex-wrap">
            <View className="flex flex-row items-center gap-2 shrink">
              <Package2 size={12} color="#A8A29E" />
              <Span peso="medium" numberOfLines={1} className="text-xs leading-5 text-stone-700 shrink">
                {cantidadDe(paq)} {paq.nombre_producto ?? "Producto"}
              </Span>
            </View>
            {evaluadas && paq.existencias != null && (
              // El color va por `style` porque cambia con el dato (regla 50).
              <Span
                peso={falta ? "semibold" : "medium"}
                numberOfLines={1}
                className="text-[10px] leading-4 shrink-0"
                style={{ color: falta ? "#DC2626" : "#78716C" }}
              >
                {falta ? `Solo quedan ${paq.existencias}` : `Quedan ${paq.existencias}`}
              </Span>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ── Tarjeta de orden ──────────────────────────────────────────────────────────

/**
 * Una orden de la bandeja.
 *
 * Está armada para contestar, sin abrirla, las cuatro cosas que el vendedor
 * necesita: en qué estado está, si el inventario le alcanza, si el cliente ya
 * le compró antes y a dónde hay que entregar.
 */
function TarjetaOrden({
  orden,
  onAceptar,
  onRechazar,
  ocupada,
}: {
  orden: OrdenPedidoListItem;
  onAceptar: () => void;
  onRechazar: () => void;
  ocupada: boolean;
}) {
  const pendiente = orden.estado === "pendiente";

  return (
    <View className="bg-white border border-stone-200/70 rounded-2xl p-4 md:p-5 drop-shadow-sm flex-1">
      <View className="flex flex-row items-start justify-between gap-3 flex-wrap">
        <View className="flex flex-row items-center gap-2 shrink flex-wrap">
          <H3 peso="bold" numberOfLines={1} className="text-base leading-6 text-stone-900">
            #{idCorto(orden.id)}
          </H3>
          <BadgeEstado estado={orden.estado} />
          {orden.pre_autorizado && (
            <View className="flex flex-row items-center gap-1 px-2 py-0.5 rounded-md bg-[#FDF2E3] border border-[#E8DEC1] w-fit native:w-auto">
              <BadgeCheck size={11} color="#9A7B24" />
              <Span peso="semibold" className="text-[9px] leading-4 uppercase tracking-[0.4px] text-[#9A7B24]">
                Pre pagada
              </Span>
            </View>
          )}
        </View>
        <Span numberOfLines={1} className="text-[11px] leading-4 text-stone-500 shrink">
          {formatFechaHora(orden.created_at)}
        </Span>
      </View>

      {/* El cliente y su historial: "¿ya me ha pedido antes?". */}
      <View className="flex flex-row items-center gap-2.5 mt-3 flex-wrap">
        <AvatarCliente orden={orden} />
        <View className="shrink">
          <P peso="semibold" numberOfLines={1} className="text-sm leading-5 text-stone-900">
            {orden.cliente_nombre ?? "Cliente"}
          </P>
          <SelloCliente orden={orden} />
        </View>
      </View>

      {/* El veredicto de inventario: "¿puedo surtirla?". Solo tiene sentido
          mientras la orden siga pendiente. */}
      {pendiente && orden.cobertura && (
        <View className="mt-3">
          <BadgeCobertura cobertura={orden.cobertura} />
        </View>
      )}

      <Partidas orden={orden} />

      {/* El destino, sin juzgar si se cubre o no: no hay zonas declaradas. */}
      {orden.destino && (
        <View className="flex flex-row items-center gap-1.5 mt-3">
          <MapPin size={12} color="#78716C" />
          <Span numberOfLines={1} className="text-[11px] leading-4 text-stone-600 shrink">
            Entregar en {orden.destino}
          </Span>
        </View>
      )}

      <View className="flex flex-row items-end justify-between gap-3 mt-auto pt-3 border-t border-stone-100 flex-wrap">
        <View className="shrink">
          <Span peso="semibold" className="text-[9px] leading-4 uppercase tracking-[0.5px] text-stone-400">
            Total a cobrar
          </Span>
          <P peso="bold" className="text-lg leading-7 text-stone-900">
            ${formatMoney(orden.total)}
            <Span className="text-[10px] leading-4 text-stone-400"> {MONEDA}</Span>
          </P>
        </View>

        <View className="flex flex-row items-center gap-2 flex-wrap shrink-0">
          <Boton
            variante="secundario"
            href={`/distribuidor/ordenes/${orden.id}`}
            claseTexto="text-xs leading-5"
            className="py-2 px-4 rounded-xl border-solid border border-stone-200 bg-white"
          >
            Ver detalle
          </Boton>
          {pendiente && (
            <>
              <Boton
                variante="secundario"
                Icono={X}
                iconoSize={14}
                onClick={onRechazar}
                disabled={ocupada}
                claseTexto="text-xs leading-5 text-red-600"
                className="py-2 px-4 rounded-xl border-solid border border-red-200 bg-white"
              >
                Rechazar
              </Boton>
              <Boton
                Icono={Check}
                iconoSize={14}
                onClick={onAceptar}
                disabled={ocupada}
                claseTexto="text-xs leading-5"
                className="py-2 px-4 rounded-xl"
              >
                Aceptar
              </Boton>
            </>
          )}
        </View>
      </View>
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

function Paginador({ listado, onPagina }: { listado: ListadoOrdenes; onPagina: (pagina: number) => void }) {
  const { pagina_actual, total_paginas, total_ordenes, ordenes } = listado;
  if (total_ordenes === 0) return null;

  const desde = Math.max(1, Math.min(pagina_actual - 2, total_paginas - 4));
  const paginas = Array.from({ length: Math.min(5, total_paginas) }, (_, i) => desde + i);

  return (
    <View className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-4">
      <P className="text-xs leading-5 text-stone-400 text-center md:text-left">
        Mostrando <Span peso="semibold" className="text-xs leading-5 text-stone-600">{ordenes.length}</Span> de{" "}
        <Span peso="semibold" className="text-xs leading-5 text-stone-600">{total_ordenes}</Span> órdenes
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

export interface DistribuidorOrdenesProps {
  /** Primera página ya cargada. Web la trae del servidor; mobile pasa `null`. */
  listado: ListadoOrdenes | null;
  /** Vuelve a pedir el listado cuando cambian los filtros o la página. */
  cargarOrdenes: (filtros: FiltrosOrdenes) => Promise<ListadoOrdenes>;
  /** Conteos por estado, más cuántas pendientes se pueden surtir. */
  cargarResumen?: (filtros: FiltrosOrdenes) => Promise<ResumenOrdenes>;
  aceptarAction: (id: string) => Promise<PedidoActionResult<OrdenPedidoResponse>>;
  rechazarAction: (id: string, motivo?: string) => Promise<PedidoActionResult<OrdenPedidoResponse>>;
}

const POR_PAGINA = 10;

export default function DistribuidorOrdenes({
  listado: listadoInicial,
  cargarOrdenes,
  cargarResumen,
  aceptarAction,
  rechazarAction,
}: DistribuidorOrdenesProps) {
  const [listado, setListado] = useState<ListadoOrdenes | null>(listadoInicial);
  const [cargando, setCargando] = useState(listadoInicial === null);
  const [errorCarga, setErrorCarga] = useState(false);
  const [resumen, setResumen] = useState<ResumenOrdenes | null>(null);

  // La bandeja abre en pendientes: es la pregunta con la que el vendedor
  // entra a esta pantalla.
  const [estado, setEstado] = useState<EstadoOrden | null>("pendiente");
  const [busqueda, setBusqueda] = useState("");
  const [clienteId, setClienteId] = useState("todos");
  const [rangoFecha, setRangoFecha] = useState("todo");
  const [orden, setOrden] = useState<"asc" | "desc">("desc");
  const [pagina, setPagina] = useState(1);
  const [intento, setIntento] = useState(0);

  const [ordenAAceptar, setOrdenAAceptar] = useState<OrdenPedidoListItem | null>(null);
  const [ordenARechazar, setOrdenARechazar] = useState<OrdenPedidoListItem | null>(null);
  const [guardando, setGuardando] = useState(false);
  // El error lo pinta la `VentanaEmergente` del layout (ver Avisos.tsx).
  const avisar = useAviso();

  const filtros = useMemo<FiltrosOrdenes>(() => ({
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
    cargarOrdenes(filtros).then(
      (recibido) => { if (vigente) { setListado(recibido); setCargando(false); } },
      () => { if (vigente) { setErrorCarga(true); setCargando(false); } },
    );
    return () => { vigente = false; };
  }, [filtros, intento]);

  /** El resumen depende de todos los filtros menos el estado y la página. */
  const filtrosResumen = useMemo<FiltrosOrdenes>(
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

  const cambiarFiltro = useCallback((aplicar: () => void, reiniciarPagina = true) => {
    if (reiniciarPagina) setPagina(1);
    aplicar();
  }, []);

  /**
   * Los clientes del desplegable se acumulan entre cargas: salen de las
   * órdenes de la página porque la API no expone "mis clientes", y si solo se
   * miraran las de la página actual, al filtrar por uno la lista se quedaría
   * con ese solo.
   */
  const clientesVistos = useRef(new Map<string, string>());

  const desplegables: DesplegableFiltro[] = useMemo(() => {
    for (const o of listado?.ordenes ?? []) {
      if (o.cliente_id && o.cliente_nombre) clientesVistos.current.set(o.cliente_id, o.cliente_nombre);
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
          : resumen.por_estado[p.valor as EstadoOrden] ?? 0,
    })),
    [resumen],
  );

  const tarjetas = useMemo(() => (resumen ? tarjetasDeOrdenes(resumen) : []), [resumen]);
  const ordenes = listado?.ordenes ?? [];

  /**
   * Aceptar y rechazar recargan en vez de parchear el estado local: las dos
   * cosas mueven la orden de pestaña, cambian los conteos **y** liberan o
   * comprometen inventario, así que el veredicto de las demás órdenes puede
   * cambiar. `intento` rehace las dos consultas de un tirón.
   */
  async function confirmarAceptar() {
    if (!ordenAAceptar) return;
    setGuardando(true);
    const res = await aceptarAction(ordenAAceptar.id);
    setGuardando(false);
    if (!res.ok) {
      avisar(res.error || "No se pudo aceptar la orden");
      return;
    }
    setOrdenAAceptar(null);
    setIntento((n) => n + 1);
  }

  async function confirmarRechazar(motivo: string) {
    if (!ordenARechazar) return;
    setGuardando(true);
    const res = await rechazarAction(ordenARechazar.id, motivo);
    setGuardando(false);
    if (!res.ok) {
      avisar(res.error || "No se pudo rechazar la orden");
      return;
    }
    setOrdenARechazar(null);
    setIntento((n) => n + 1);
  }

  return (
    <>
      <ContenedorPantalla key="distribuidor-ordenes" className="mx-auto w-full px-0 lg:px-16 lg:pt-8 pb-24 bg-[#FAF7F2] min-h-screen">
        <Header className="px-4 pt-5 pb-4">
          <Link href="/distribuidor" bloque>
            <Span peso="semibold" className="text-[10px] leading-4 uppercase tracking-[0.8px] text-[#B45309]">
              Panel · Órdenes de compra
            </Span>
          </Link>
          <H1 peso="bold" className="text-2xl md:text-3xl leading-9 text-stone-900 mt-1">
            Órdenes de compra
          </H1>
          <P className="text-xs md:text-sm leading-5 text-stone-500 mt-1">
            Las órdenes son propuestas de tus clientes. Al aceptarlas se confirma el cobro y se convierten en pedidos.
          </P>
        </Header>

        {/* El acceso a los pedidos, que es a donde van las órdenes aceptadas. */}
        <Section className="px-4">
          <Link href="/distribuidor/pedidos" bloque>
            <View className="bg-white border border-stone-100 rounded-2xl px-4 py-3 flex flex-row items-center justify-between gap-3">
              <View className="flex flex-row items-center gap-3 shrink">
                <View className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                  <Inbox size={16} color="#78716C" />
                </View>
                <View className="shrink">
                  <H3 peso="semibold" className="text-sm leading-5 text-stone-800">Pedidos en curso</H3>
                  <P numberOfLines={1} className="text-[11px] leading-4 text-stone-500">
                    Lo que ya aceptaste y toca surtir
                  </P>
                </View>
              </View>
              <ArrowRight size={16} color="#A8A29E" />
            </View>
          </Link>
        </Section>

        {/* El resumen contesta las dos primeras preguntas de un vistazo:
            cuántas esperan respuesta y cuántas se pueden surtir. */}
        <Section className="mt-5">
          <TarjetasResumen
            tarjetas={tarjetas}
            cargando={cargarResumen !== undefined && resumen === null}
            onSeleccionar={(valor) => cambiarFiltro(() => setEstado(valor as EstadoOrden | null))}
          />
        </Section>

        <Section className="px-4 mt-5">
          {/* `z-20`: en react-native-web cada View es un contexto de
              apilamiento, así que el desplegable abierto no puede salirse de
              su padre y las tarjetas de abajo lo taparían. */}
          <View className="bg-white border border-stone-100 rounded-2xl p-4 md:p-5 z-20">
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
              <P className="text-sm leading-6 text-stone-500 text-center">No se pudieron cargar las órdenes.</P>
              <Boton variante="secundario" className="mt-3" onClick={() => setIntento((n) => n + 1)}>
                Volver a intentar
              </Boton>
            </View>
          ) : ordenes.length === 0 ? (
            <View className="flex items-center justify-center py-16">
              <View className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                <Inbox size={24} color="#A8A29E" />
              </View>
              <H2 peso="semibold" className="text-base leading-6 text-stone-700 text-center">
                Sin órdenes que mostrar
              </H2>
              <P className="text-xs leading-5 text-stone-400 text-center mt-1">
                Prueba con otro filtro o revisa tus pedidos en curso.
              </P>
            </View>
          ) : (
            // Dos columnas desde `lg`. El grid responsive es una fila que
            // envuelve (regla 26); los márgenes negativos compensan el padding
            // de cada celda para que la primera y la última queden a ras.
            <View className="flex flex-row flex-wrap -mx-1.5 mt-4">
              {ordenes.map((o) => (
                // `flex flex-col` en la celda y `flex-1` en la tarjeta: las dos
                // de un renglón quedan del alto de la más alta (regla 55).
                <View key={o.id} className="w-full lg:w-1/2 px-1.5 pb-3 flex flex-col">
                  <TarjetaOrden
                    orden={o}
                    ocupada={guardando}
                    onAceptar={() => setOrdenAAceptar(o)}
                    onRechazar={() => setOrdenARechazar(o)}
                  />
                </View>
              ))}
            </View>
          )}

          {listado && !cargando && !errorCarga && (
            <Paginador listado={listado} onPagina={(n) => setPagina(Math.max(1, n))} />
          )}
        </Section>
      </ContenedorPantalla>

      {/* Los modales, fuera del ContenedorPantalla: dentro de una tarjeta
          quedarían encerrados en ella (regla 54). */}
      {ordenAAceptar && (
        <AceptarModal
          orden={ordenAAceptar}
          onClose={() => !guardando && setOrdenAAceptar(null)}
          onConfirm={confirmarAceptar}
          loading={guardando}
        />
      )}
      {ordenARechazar && (
        <RechazarModal
          orden={ordenARechazar}
          onClose={() => !guardando && setOrdenARechazar(null)}
          onConfirm={confirmarRechazar}
          loading={guardando}
        />
      )}
    </>
  );
}
