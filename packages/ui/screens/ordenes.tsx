/** @jsxImportSource nativewind */
"use client";

import { useEffect, useState } from "react";
import { Image, View } from "react-native";
import {
  Clock,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Package2,
} from "lucide-react-native";
import type {
  EstadoOrden,
  OrdenPedidoListItem,
  OrdenPedidoResponse,
  PedidoActionResult,
} from "@akindo/shared/types/pedidos";
import { H2, P, Pressable, Section, Span } from "@akindo/ui/html";
import { Boton } from "@akindo/ui/components";
import { Tarjeta } from "@akindo/ui/components/ui/Tarjeta";
import { EncabezadoPagina } from "@akindo/ui/components/ui/EncabezadoPagina";
import { ModalConfirmacion } from "@akindo/ui/components/ui/ModalConfirmacion";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { Spinner } from "@akindo/ui/components/ui/Animaciones";

// ── Utils ─────────────────────────────────────────────────────────────────────

function formatMoney(v: number) {
  return v.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Estado config ─────────────────────────────────────────────────────────────

type EstadoConfig = {
  label: string;
  description: string;
  color: string;
  /** El mismo color del texto, para los íconos: en nativo no hay currentColor. */
  hex: string;
  bg: string;
  border: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
};

// `accentBar` del original no se usa en ningún elemento, así que no se copió.
const ESTADO_CONFIG: Record<EstadoOrden, EstadoConfig> = {
  pendiente: {
    label: "Esperando respuesta",
    description: "El distribuidor aún no ha revisado tu orden.",
    color: "text-amber-700",
    hex: "#B45309",
    bg: "bg-amber-50",
    border: "border-amber-200",
    Icon: Clock,
  },
  aceptada: {
    label: "Aceptada",
    description: "El distribuidor aceptó tu orden. Se está procesando.",
    color: "text-emerald-700",
    hex: "#047857",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    Icon: CheckCircle2,
  },
  rechazada: {
    label: "Rechazada",
    description: "El distribuidor no pudo procesar tu orden.",
    color: "text-red-600",
    hex: "#DC2626",
    bg: "bg-red-50",
    border: "border-red-200",
    Icon: XCircle,
  },
  cancelada: {
    label: "Cancelada",
    description: "Has cancelado esta orden de compra.",
    color: "text-stone-500",
    hex: "#78716C",
    bg: "bg-stone-50",
    border: "border-stone-200",
    Icon: XCircle,
  },
};

/** El texto explicativo del pie, según el estado. */
function ExplicacionEstado({ estado }: { estado: EstadoOrden }) {
  if (estado === "pendiente") {
    return (
      <P className="text-xs text-stone-600 shrink">
        Tu orden está en cola. El tiempo promedio de respuesta es de{" "}
        <Span peso="bold" className="text-xs text-stone-600">1-2 días hábiles</Span>.
      </P>
    );
  }
  const textos: Record<Exclude<EstadoOrden, "pendiente">, string> = {
    aceptada: "¡Tu orden fue aceptada! Se generó un pedido de envío. Puedes seguirlo en la sección de pedidos.",
    rechazada: "El distribuidor no pudo procesar tu orden. Puedes crear una nueva orden o contactar directamente.",
    cancelada: "Has cancelado esta orden. Si fue un error, deberás agregar los productos al carrito nuevamente.",
  };
  return <P className="text-xs text-stone-600 shrink">{textos[estado]}</P>;
}

// ── OrdenCard ─────────────────────────────────────────────────────────────────

function OrdenCard({
  orden,
  error,
  onPedirCancelar,
}: {
  orden: OrdenPedidoListItem;
  /** El error de la última cancelación de esta orden, si falló. */
  error?: string;
  /** Abre la confirmación. El modal vive en la pantalla, no en la tarjeta. */
  onPedirCancelar: (orden: OrdenPedidoListItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  // Los hover de color de texto van por estado, no por clases (regla 5).
  const [cancelarEnHover, setCancelarEnHover] = useState(false);
  const [verEnHover, setVerEnHover] = useState(false);

  const cfg = ESTADO_CONFIG[orden.estado] ?? ESTADO_CONFIG.pendiente;
  const Icon = cfg.Icon;

  return (
    // `flex-1`: el grid del original estiraba todas las tarjetas de una fila a
    // la altura de la más alta, y una fila que envuelve (regla 26) no lo hace
    // sola; con esto la tarjeta llena la celda, que sí se estira.
    <View className={`rounded-2xl border overflow-hidden transition-all bg-white shadow-sm flex-1 ${cfg.border}`}>
      {/* Fila principal — siempre visible */}
      <View className="p-4">
        {/* Distribuidor */}
        <View className="flex flex-row items-center gap-2.5 mb-3">
          <View className="w-9 h-9 rounded-full bg-amber-100 overflow-hidden flex items-center justify-center shrink-0">
            {orden.distribuidor_imagen ? (
              <Image
                source={{ uri: orden.distribuidor_imagen }}
                accessibilityLabel={orden.distribuidor_nombre ?? "Distribuidor"}
                resizeMode="cover"
                className="w-full h-full"
              />
            ) : (
              <Span peso="bold" className="text-sm text-amber-700">
                {orden.distribuidor_nombre?.charAt(0) ?? "D"}
              </Span>
            )}
          </View>
          <View className="flex-1 min-w-0 shrink">
            <P peso="bold" numberOfLines={1} className="text-xs text-stone-800 leading-tight">
              {orden.distribuidor_nombre ?? "Distribuidor"}
            </P>
            <P className="text-[10px] leading-normal text-stone-400">
              {formatFecha(orden.created_at)}
            </P>
          </View>
          {/* Badge del estado */}
          <View className={`flex flex-row items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0 ${cfg.bg}`}>
            <Icon size={11} color={cfg.hex} />
            <Span peso="bold" className={`text-[11px] leading-normal ${cfg.color}`}>{cfg.label}</Span>
          </View>
        </View>

        {/* Descripción del estado */}
        <P peso="medium" className={`text-xs ${cfg.color}`}>{cfg.description}</P>

        {/* Pie: total + desplegar + cancelar */}
        <View className="flex flex-row items-center justify-between mt-3 pt-3 border-t border-stone-100">
          <View className="flex-1">
            <P peso="semibold" className="text-[10px] leading-normal uppercase tracking-[0.25px] text-stone-400">
              Total de la orden
            </P>
            <P peso="extrabold" className="text-lg text-stone-900">
              ${formatMoney(orden.total)} <Span className="text-xs text-stone-400">MXN</Span>
            </P>
          </View>

          <View className="flex flex-row items-center gap-2">
            {orden.estado === "pendiente" && (
              <Pressable
                role="button"
                onPress={() => onPedirCancelar(orden)}
                onHoverIn={() => setCancelarEnHover(true)}
                onHoverOut={() => setCancelarEnHover(false)}
                className="px-3 py-1.5 rounded-lg transition-colors hover:bg-red-50"
              >
                <Span peso="bold" className={`text-[11px] leading-normal ${cancelarEnHover ? "text-red-600" : "text-red-500"}`}>
                  Cancelar
                </Span>
              </Pressable>
            )}
            <Pressable
              role="button"
              onPress={() => setExpanded((e) => !e)}
              onHoverIn={() => setVerEnHover(true)}
              onHoverOut={() => setVerEnHover(false)}
              className="flex flex-row items-center gap-1 transition-colors py-1.5 px-3 rounded-lg hover:bg-stone-100"
            >
              <Span peso="semibold" className={`text-xs ${verEnHover ? "text-stone-800" : "text-stone-500"}`}>
                {expanded ? "Ocultar" : "Ver productos"}
              </Span>
              {expanded ? (
                <ChevronUp size={14} color={verEnHover ? "#292524" : "#78716C"} />
              ) : (
                <ChevronDown size={14} color={verEnHover ? "#292524" : "#78716C"} />
              )}
            </Pressable>
          </View>
        </View>

        {error && (
          <P peso="medium" className="text-[10px] leading-normal text-red-500 mt-2">{error}</P>
        )}
      </View>

      {/* Desplegado: lista de productos + explicación del estado */}
      {expanded && (
        <View className={`border-t ${cfg.border}`}>
          {orden.paquetes.length > 0 && (
            <View>
              {orden.paquetes.map((p, i) => {
                const nombre = p.nombre_producto ?? p.medida_snapshot?.nombre ?? "Producto";
                const imagen = p.imagen_producto ?? null;
                const unidad = p.medida_snapshot?.unidad ?? "pz";
                return (
                  // El `divide-y` del original: nativewind no lo tiene, así que
                  // el borde lo pone cada fila menos la primera (regla 44).
                  <View
                    key={String(p.producto_id)}
                    className={`flex flex-row items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-stone-100" : ""}`}
                  >
                    <View className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden flex items-center justify-center shrink-0">
                      {imagen ? (
                        <Image
                          source={{ uri: imagen }}
                          accessibilityLabel={nombre}
                          resizeMode="cover"
                          className="w-full h-full"
                        />
                      ) : (
                        <Package2 size={20} color="#A8A29E" />
                      )}
                    </View>
                    <View className="flex-1 min-w-0 shrink">
                      <P peso="semibold" numberOfLines={1} className="text-sm text-stone-800">{nombre}</P>
                      <P className="text-xs text-stone-400">
                        {p.cantidad} {unidad} x ${p.costo_unitario}MXN/{unidad}
                      </P>
                    </View>
                    <P peso="bold" className="text-sm text-stone-900 shrink-0">
                      ${formatMoney(p.subtotal)}
                    </P>
                  </View>
                );
              })}
            </View>
          )}

          {/* Pie explicativo */}
          <View className={`${cfg.bg} px-4 py-3 flex flex-row items-start gap-2`}>
            <View className="mt-0.5 shrink-0">
              <AlertCircle size={14} color={cfg.hex} />
            </View>
            <ExplicacionEstado estado={orden.estado} />
          </View>
        </View>
      )}
    </View>
  );
}

// ── Pantalla ──────────────────────────────────────────────────────────────────

interface OrdenesProps {
  /** Datos ya cargados. Web los trae del servidor; mobile pasa `null`. */
  ordenes: OrdenPedidoListItem[] | null;
  /** Solo mobile: las pide al montar, porque no hay servidor que las precargue. */
  cargarOrdenes?: () => Promise<OrdenPedidoListItem[]>;
  /** Cancela una orden. Necesita la sesión, así que la inyecta la app (regla 13). */
  cancelarAction: (ordenId: string) => Promise<PedidoActionResult<OrdenPedidoResponse>>;
}

export default function Ordenes({ ordenes: ordenesIniciales, cargarOrdenes, cancelarAction }: OrdenesProps) {
  const [ordenes, setOrdenes] = useState<OrdenPedidoListItem[] | null>(ordenesIniciales);
  const [errorCarga, setErrorCarga] = useState(false);
  const [intento, setIntento] = useState(0);
  // La confirmación de cancelar vive acá y no en la tarjeta: en nativo un
  // `absolute` se mide contra el ancestro posicionado más cercano (taparía solo
  // la tarjeta), y en web cada View de react-native-web es `position: relative`
  // con `z-index: 0`, así que es un contexto de apilamiento y el `z-50` del
  // modal quedaba encerrado en su tarjeta: las tarjetas siguientes se pintaban
  // encima.
  const [ordenACancelar, setOrdenACancelar] = useState<OrdenPedidoListItem | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [erroresCancelar, setErroresCancelar] = useState<Record<string, string>>({});

  useEffect(() => {
    if (ordenesIniciales || !cargarOrdenes) return;
    let vigente = true;
    setErrorCarga(false);
    cargarOrdenes().then(
      (recibidas) => { if (vigente) setOrdenes(recibidas); },
      () => { if (vigente) setErrorCarga(true); },
    );
    return () => { vigente = false; };
  }, [intento]);

  if (!ordenes) {
    // El encabezado va también acá: si no, en mobile no habría cómo volver
    // mientras carga. `key` propia para que React no reutilice el nodo del
    // ContenedorPantalla entre las dos ramas (regla 37).
    return (
      <ContenedorPantalla key="ordenes-cargando" indiceFijo={0} className="mx-auto w-full max-w-6xl pb-24">
        <EncabezadoPagina titulo="Órdenes de Compra" href="/pedidos" />
        <Section className="px-4 pt-6">
          {errorCarga ? (
            <Tarjeta>
              <P className="text-sm text-stone-500 text-center">No se pudieron cargar tus órdenes.</P>
              <Boton variante="secundario" className="mt-3 w-full" onClick={() => setIntento((n) => n + 1)}>
                Volver a intentar
              </Boton>
            </Tarjeta>
          ) : (
            <View className="flex items-center justify-center py-20">
              <Spinner tamano={32} />
            </View>
          )}
        </Section>
      </ContenedorPantalla>
    );
  }

  // El original reordena: primero las pendientes y después el resto.
  const pendientes = ordenes.filter((o) => o.estado === "pendiente");
  const otras = ordenes.filter((o) => o.estado !== "pendiente");

  async function confirmarCancelar() {
    if (!ordenACancelar) return;
    const { id } = ordenACancelar;
    setCancelando(true);
    const res = await cancelarAction(id);
    setCancelando(false);
    if (!res.ok) {
      setErroresCancelar((previos) => ({ ...previos, [id]: res.error ?? "No se pudo cancelar la orden" }));
      return;
    }
    setOrdenACancelar(null);
    setErroresCancelar(({ [id]: _, ...resto }) => resto);
    // El original hacía `router.refresh()` para que el servidor devolviera la
    // orden ya cancelada; acá lo resuelve la pantalla, que es la que tiene la
    // lista (en nativo no hay servidor que la vuelva a pintar).
    setOrdenes((actuales) =>
      (actuales ?? []).map((o) => (o.id === id ? { ...o, estado: "cancelada" as EstadoOrden } : o)),
    );
  }

  return (
    <>
    {/* indiceFijo 0: el encabezado. */}
    <ContenedorPantalla key="ordenes" indiceFijo={0} className="mx-auto w-full max-w-6xl pb-24">
      <EncabezadoPagina titulo="Órdenes de Compra" href="/pedidos" />

      <View className="pt-4">
        {/* Sin órdenes el original no pintaba nada (devolvía null), solo queda
            el encabezado. */}
        {ordenes.length > 0 && (
          <Section className="px-4 mb-6">
            {/* Encabezado de la sección */}
            <View className="flex flex-row items-center gap-2 mb-3">
              <ShoppingBag size={16} color="#DAA520" />
              <H2 peso="bold" className="text-sm text-stone-700 uppercase tracking-[0.7px]">
                Órdenes de Compra
              </H2>
              {pendientes.length > 0 && (
                <View className="bg-amber-400 px-2 py-0.5 rounded-full">
                  <Span peso="bold" className="text-[10px] leading-normal text-stone-900">
                    {pendientes.length} pendiente{pendientes.length > 1 ? "s" : ""}
                  </Span>
                </View>
              )}
            </View>

            {/* El grid responsive es una fila que envuelve (regla 26). */}
            <View className="flex flex-row flex-wrap -m-2">
              {[...pendientes, ...otras].map((o) => (
                <View key={o.id} className="w-full md:w-1/2 xl:w-1/3 p-2">
                  <OrdenCard orden={o} error={erroresCancelar[o.id]} onPedirCancelar={setOrdenACancelar} />
                </View>
              ))}
            </View>
          </Section>
        )}
      </View>
    </ContenedorPantalla>

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
    </>
  );
}