/** @jsxImportSource nativewind */
"use client";

import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { ArrowRight, Package2, Clock, CheckCircle2, XCircle, ShoppingBag } from "lucide-react-native";
import type { PedidoListItem, EstadoPedido, OrdenPedidoListItem } from "@akindo/shared/types/pedidos";
import { H1, H3, P, Pressable, Section, Span } from "@akindo/ui/html";
import { Boton, Link } from "@akindo/ui/components";
import { Tarjeta } from "@akindo/ui/components/ui/Tarjeta";
import { Degradado } from "@akindo/ui/components/ui/Degradado";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { Spinner } from "@akindo/ui/components/ui/Animaciones";

const MONEDA = "MXN";

function formatMoney(v: number) {
  return v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/**
 * Estado badge. El color del texto va en el `Span` y el del ícono por prop:
 * en nativo un Text no hereda el color del contenedor y `currentColor` sale
 * negro (reglas 3 y 4).
 */
const ESTADO_CONFIG: Record<EstadoPedido, {
  label: string;
  color: string;
  hex: string;
  bg: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}> = {
  "pendiente de envio": { label: "Procesando", color: "text-amber-700", hex: "#B45309", bg: "bg-amber-100", Icon: Clock },
  "en envio": { label: "En Tránsito", color: "text-blue-700", hex: "#1D4ED8", bg: "bg-blue-100", Icon: ArrowRight },
  "entregado": { label: "Entregado", color: "text-green-700", hex: "#15803D", bg: "bg-green-100", Icon: CheckCircle2 },
  "cancelado": { label: "Cancelado", color: "text-red-600", hex: "#DC2626", bg: "bg-red-100", Icon: XCircle },
};

const ESTADO_POR_DEFECTO = { label: "", color: "text-stone-600", hex: "#57534E", bg: "bg-stone-100", Icon: Package2 };

function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  const cfg = ESTADO_CONFIG[estado] ?? { ...ESTADO_POR_DEFECTO, label: estado };
  return (
    <View className={`flex flex-row items-center gap-1 px-2.5 py-1 rounded-full shrink-0 ${cfg.bg}`}>
      <cfg.Icon size={12} color={cfg.hex} />
      {/* `leading-normal`: el `text-[11px]` no trae interlineado y en web heredaba
          el 1.5 del body (regla 19). */}
      <Span peso="semibold" className={`text-[11px] leading-normal ${cfg.color}`}>{cfg.label}</Span>
    </View>
  );
}

/** El `border-l-4` de color según el estado. */
const BORDE_ESTADO: Record<string, string> = {
  "en envio": "border-l-blue-400",
  "pendiente de envio": "border-l-amber-400",
  "entregado": "border-l-green-400",
};

function PedidoCard({ pedido }: { pedido: PedidoListItem }) {
  return (
    <Tarjeta className={`relative border-l-4 ${BORDE_ESTADO[pedido.estado] ?? "border-l-stone-300"}`}>
      <View className="flex flex-row items-start justify-between gap-2">
        <View className="flex-1 min-w-0">
          <P peso="semibold" className="text-[10px] leading-normal text-stone-400 uppercase tracking-[1.5px]">
            PEDIDO #{pedido.id.slice(0, 8).toUpperCase()}
          </P>
          <H3 peso="bold" className="text-base text-stone-900 mt-0.5 leading-tight">
            {pedido.primer_producto_nombre ?? pedido.distribuidor_nombre ?? "Pedido"}
          </H3>
        </View>
        <EstadoBadge estado={pedido.estado} />
      </View>

      <View className="flex flex-row gap-6 mt-3">
        <View>
          <P peso="semibold" className="text-[10px] leading-normal uppercase tracking-[0.5px] text-stone-400">Fecha de Pedido</P>
          <P peso="medium" className="text-xs text-stone-700 mt-0.5">{formatFecha(pedido.confirmado_at)}</P>
        </View>
        {pedido.entregado_at && (
          <View>
            <P peso="semibold" className="text-[10px] leading-normal uppercase tracking-[0.5px] text-stone-400">Entregado</P>
            <P peso="medium" className="text-xs text-stone-700 mt-0.5">{formatFecha(pedido.entregado_at)}</P>
          </View>
        )}
      </View>

      <View className="flex flex-row items-center justify-between mt-3 pt-3 border-t border-stone-100">
        <View>
          <P peso="semibold" className="text-[10px] leading-normal uppercase tracking-[0.5px] text-stone-400">Total</P>
          <P peso="extrabold" className="text-xl text-stone-900">
            ${formatMoney(pedido.total)} <Span className="text-xs text-stone-400">{MONEDA}</Span>
          </P>
        </View>
        <Link href={`/pedidos/${pedido.id}`} bloque className="flex flex-row items-center gap-1 hover:underline">
          <Span peso="semibold" className="text-xs text-[#C1901D]">Ver Detalles</Span>
          <ArrowRight size={14} color="#C1901D" />
        </Link>
      </View>
    </Tarjeta>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = ["Activos", "Entregados", "Cancelados"] as const;
type Tab = (typeof TABS)[number];

export interface DatosPedidos {
  activos: PedidoListItem[];
  entregados: PedidoListItem[];
  cancelados: PedidoListItem[];
  ordenes: OrdenPedidoListItem[];
}

interface PedidosProps {
  /** Datos ya cargados. Web los trae del servidor; mobile pasa `null`. */
  datos: DatosPedidos | null;
  /** Solo mobile: los pide al montar, porque no hay servidor que los precargue. */
  cargarDatos?: () => Promise<DatosPedidos>;
}

export default function Pedidos({ datos: datosIniciales, cargarDatos }: PedidosProps) {
  const [tab, setTab] = useState<Tab>("Activos");
  const [datos, setDatos] = useState<DatosPedidos | null>(datosIniciales);
  const [errorCarga, setErrorCarga] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (datosIniciales || !cargarDatos) return;
    let vigente = true;
    setErrorCarga(false);
    cargarDatos().then(
      (recibidos) => { if (vigente) setDatos(recibidos); },
      () => { if (vigente) setErrorCarga(true); },
    );
    return () => { vigente = false; };
  }, [intento]);

  if (!datos) {
    return (
      <Section className="mx-auto w-full max-w-6xl px-4 pt-6">
        {errorCarga ? (
          <Tarjeta>
            <P className="text-sm text-stone-500 text-center">No se pudieron cargar tus pedidos.</P>
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
    );
  }

  const { activos, entregados, cancelados, ordenes } = datos;
  const pedidosMostrados = tab === "Activos" ? activos : tab === "Entregados" ? entregados : cancelados;
  const ordenesPendientes = ordenes.filter((o) => o.estado === "pendiente").length;

  return (
    <ContenedorPantalla key="pedidos" className="mx-auto w-full max-w-6xl pb-20">
      {/* Header */}
      <View className="px-4 pt-6 pb-4">
        <H1 peso="extrabold" className="text-2xl text-stone-900">Pedidos</H1>
        <P className="text-sm text-stone-500 mt-0.5">Gestiona y da seguimiento a tus pedidos.</P>
      </View>

      {/* Acceso a Órdenes de Compra */}
      <View className="px-4 mb-6">
        <Link href="/pedidos/ordenes" bloque>
          {/* El degradado `from-amber-50 to-white` se dibuja con SVG: en RN no
              hay `linear-gradient` (regla 17). `overflow-hidden` lo recorta al
              radio de la tarjeta. */}
          {/* Sin `p-4`: en web el `p-5` de la Tarjeta le ganaba por orden del CSS
              (la tarjeta medía 95px de alto, no 86) — ver regla 41. */}
          <Tarjeta className="border-amber-100 hover:border-amber-200 transition-colors overflow-hidden">
            <Degradado direccion="to-br" paradas={[{ offset: 0, color: "#FFFBEB" }, { offset: 1, color: "#FFFFFF" }]} />
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center gap-3 shrink">
                <View className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <ShoppingBag size={20} color="#D97706" />
                </View>
                <View className="shrink">
                  <H3 peso="bold" className="text-sm text-stone-800">Órdenes de Compra</H3>
                  <P className="text-[11px] leading-normal text-stone-500">Pendientes de aprobación por distribuidor</P>
                </View>
              </View>
              <View className="flex flex-row items-center gap-2 shrink-0">
                {ordenesPendientes > 0 && (
                  <View className="bg-amber-500 px-2 py-0.5 rounded-full">
                    <Span peso="bold" className="text-white text-[10px] leading-normal">{ordenesPendientes}</Span>
                  </View>
                )}
                <ArrowRight size={16} color="#A8A29E" />
              </View>
            </View>
          </Tarjeta>
        </Link>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-4 pb-1"
        className="mb-4"
      >
        {TABS.map((t) => {
          const activa = tab === t;
          return (
            <Pressable
              key={t}
              role="button"
              onPress={() => setTab(t)}
              // El className no cambia nunca y los colores del estado van por
              // `style`: este Pressable tiene una variante `hover:`, y cambiarle
              // la lista de clases hace que nativewind lo "mejore" en caliente
              // y en nativo reviente con "Couldn't find a navigation context"
              // (regla 37). El borde va siempre —transparente en la activa, que
              // en el original no lo tenía— porque igual medían lo mismo: la
              // fila estira todos los botones a la misma altura.
              className="flex flex-row items-center px-4 py-2 rounded-full transition-all flex-shrink-0 border hover:border-stone-300"
              style={
                activa
                  ? { backgroundColor: "#DAA520", borderColor: "transparent", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }
                  : { backgroundColor: "#FFFFFF", borderColor: "#E7E5E4" }
              }
            >
              <Span peso="semibold" className={`text-sm ${activa ? "text-white" : "text-stone-600"}`}>{t}</Span>
              {t === "Activos" && activos.length > 0 && (
                <View className={`ml-1.5 px-1.5 py-0.5 rounded-full ${activa ? "bg-white/20" : "bg-stone-100"}`}>
                  <Span peso="bold" className={`text-[10px] leading-normal ${activa ? "text-white" : "text-stone-500"}`}>
                    {activos.length}
                  </Span>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Lista. El grid responsive es una fila que envuelve (regla 26). */}
      <View className="px-4 flex flex-row flex-wrap -m-2">
        {pedidosMostrados.length === 0 ? (
          <View className="w-full p-2">
            <Tarjeta className="py-10">
              <View className="items-center mb-3">
                <Package2 size={40} color="#D6D3D1" />
              </View>
              <P peso="medium" className="text-stone-500 text-sm text-center">No tienes pedidos {tab.toLowerCase()} aún.</P>
              {tab === "Activos" && (
                <View className="items-center">
                  <Link href="/mercado" bloque className="mt-3 hover:underline">
                    <Span peso="semibold" className="text-sm text-[#C1901D]">Explorar productos →</Span>
                  </Link>
                </View>
              )}
            </Tarjeta>
          </View>
        ) : (
          pedidosMostrados.map((p) => (
            <View key={p.id} className="w-full md:w-1/2 lg:w-1/3 p-2">
              <PedidoCard pedido={p} />
            </View>
          ))
        )}
      </View>
    </ContenedorPantalla>
  );
}
