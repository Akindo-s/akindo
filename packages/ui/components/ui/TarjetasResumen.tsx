/** @jsxImportSource nativewind */
"use client";

import { ScrollView, View } from "react-native";
import {
  CreditCard,
  CalendarClock,
  SlidersHorizontal,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Clock,
  Truck,
  PackageCheck,
  AlertTriangle,
} from "lucide-react-native";
import { useResumenOrdenes } from "@akindo/shared/resumen-ordenes-context";
import type {
  TarjetaAlerta,
  TarjetaConteo,
  TarjetaEstado,
  TarjetaMonto,
  TarjetaProceso,
  TarjetaResumen,
  TonoTarjeta,
} from "@akindo/shared/types/resumen";
import { P, Pressable, Span } from "../html-elements";
import { Degradado } from "./Degradado";

/** Ancho de cada tarjeta. Es también el paso del snap. */
const ANCHO = 236;
const SEPARACION = 12;

function importe(monto: number) {
  const [enteros, decimales] = monto
    .toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .split(".");
  return { enteros, decimales };
}

/** El marco común: mismo alto, borde y rótulo en todas. */
function Marco({
  titulo,
  children,
  Icono,
  colorIcono,
  fondoIcono,
  tituloColor = "text-stone-400",
}: {
  titulo: string;
  children: React.ReactNode;
  Icono: React.ComponentType<{ size?: number; color?: string }>;
  colorIcono: string;
  fondoIcono: string;
  tituloColor?: string;
}) {
  return (
    <View
      style={{ width: ANCHO }}
      className="bg-white border border-stone-100 rounded-2xl p-4 flex flex-col justify-between min-h-[132px] drop-shadow-sm"
    >
      <View className="flex flex-row items-start justify-between gap-2">
        <Span peso="semibold" numberOfLines={2} className={`text-[10px] leading-4 uppercase tracking-[0.6px] shrink ${tituloColor}`}>
          {titulo}
        </Span>
        <View className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${fondoIcono}`}>
          <Icono size={14} color={colorIcono} />
        </View>
      </View>
      {children}
    </View>
  );
}

/** El importe grande, con los centavos más chicos como en el diseño. */
function Importe({ monto, moneda, color }: { monto: number; moneda: string; color: string }) {
  const { enteros, decimales } = importe(monto);
  return (
    <P peso="bold" className={`text-2xl leading-8 ${color}`}>
      ${enteros}
      <Span peso="medium" className={`text-xs leading-4 ${color}`}>.{decimales} {moneda}</Span>
    </P>
  );
}

function Monto({ tarjeta }: { tarjeta: TarjetaMonto }) {
  const sube = (tarjeta.variacion ?? 0) >= 0;
  const Flecha = sube ? TrendingUp : TrendingDown;
  return (
    <Marco titulo={tarjeta.titulo} Icono={CreditCard} colorIcono="#B45309" fondoIcono="bg-amber-50">
      <Importe monto={tarjeta.monto} moneda={tarjeta.moneda} color="text-stone-900" />

      <View className="flex flex-row items-center justify-between gap-2 mt-3 pt-3 border-t border-stone-100">
        {tarjeta.variacion !== null && (
          <View className="flex flex-row items-center gap-1 shrink">
            <Flecha size={12} color={sube ? "#047857" : "#DC2626"} />
            <Span peso="semibold" className={`text-[11px] leading-4 ${sube ? "text-emerald-700" : "text-red-600"}`}>
              {sube ? "+" : ""}{tarjeta.variacion}%
            </Span>
          </View>
        )}
        {tarjeta.comparacion && (
          <Span numberOfLines={1} className="text-[10px] leading-4 text-stone-400 shrink">{tarjeta.comparacion}</Span>
        )}
      </View>
    </Marco>
  );
}

function Alerta({ tarjeta }: { tarjeta: TarjetaAlerta }) {
  return (
    <Marco
      titulo={tarjeta.titulo}
      Icono={CalendarClock}
      colorIcono="#DC2626"
      fondoIcono="bg-red-50"
      tituloColor="text-red-500"
    >
      <Importe monto={tarjeta.monto} moneda={tarjeta.moneda} color="text-red-600" />
      <View className="flex flex-row items-center justify-between gap-2 mt-3 pt-3 border-t border-stone-100">
        {tarjeta.detalle && (
          <View className="flex flex-row items-center gap-1.5 shrink">
            <View className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <Span peso="medium" numberOfLines={1} className="text-[11px] leading-4 text-red-600 shrink">{tarjeta.detalle}</Span>
          </View>
        )}
        {tarjeta.etiqueta && (
          <Span peso="semibold" numberOfLines={1} className="text-[10px] leading-4 text-red-400 shrink">{tarjeta.etiqueta}</Span>
        )}
      </View>
    </Marco>
  );
}

function Proceso({ tarjeta }: { tarjeta: TarjetaProceso }) {
  return (
    <Marco titulo={tarjeta.titulo} Icono={SlidersHorizontal} colorIcono="#57534E" fondoIcono="bg-stone-100">
      <Importe monto={tarjeta.monto} moneda={tarjeta.moneda} color="text-stone-900" />
      <View className="flex flex-row items-center justify-between gap-2 mt-3 pt-3 border-t border-stone-100">
        {tarjeta.detalle && (
          <View className="flex flex-row items-center gap-1.5 shrink">
            <Clock size={12} color="#A8A29E" />
            <Span numberOfLines={1} className="text-[10px] leading-4 text-stone-400 shrink">{tarjeta.detalle}</Span>
          </View>
        )}
        {tarjeta.sla && (
          <Span peso="medium" numberOfLines={1} className="text-[10px] leading-4 text-stone-400 shrink">{tarjeta.sla}</Span>
        )}
      </View>
    </Marco>
  );
}

function Conteo({ tarjeta }: { tarjeta: TarjetaConteo }) {
  return (
    <Marco titulo={tarjeta.titulo} Icono={CheckCircle2} colorIcono="#047857" fondoIcono="bg-emerald-50">
      <P peso="bold" className="text-2xl leading-8 text-stone-900">
        {tarjeta.cantidad}
        <Span peso="medium" className="text-xs leading-4 text-stone-500"> {tarjeta.unidad}</Span>
      </P>
      <View className="flex flex-row items-center justify-between gap-2 mt-3 pt-3 border-t border-stone-100">
        {tarjeta.nota && (
          <View className="flex flex-row items-center gap-1.5 shrink">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <Span numberOfLines={1} className="text-[10px] leading-4 text-emerald-700 shrink">{tarjeta.nota}</Span>
          </View>
        )}
        {tarjeta.notaSecundaria && (
          <Span numberOfLines={1} className="text-[10px] leading-4 text-stone-400 shrink">{tarjeta.notaSecundaria}</Span>
        )}
      </View>
    </Marco>
  );
}

/**
 * La paleta de las tarjetas de estado. El provider manda un nombre de tono y
 * los colores se resuelven acá: así decidir "esto va en ámbar" no obliga a
 * conocer los hex de la app.
 */
const TONOS: Record<TonoTarjeta, {
  fondo: string;
  borde: string;
  titulo: string;
  numero: string;
  detalle: string;
  hex: string;
  Icono: React.ComponentType<{ size?: number; color?: string }>;
}> = {
  ambar: {
    fondo: "bg-amber-50", borde: "border-amber-200", titulo: "text-[#3E2C0C]",
    numero: "text-[#3E2C0C]", detalle: "text-[#3E2C0C]", hex: "#FFB600", Icono: Truck,
  },
  azul: {
    fondo: "bg-blue-50", borde: "border-blue-200", titulo: "text-[#3E2C0C]",
    numero: "text-[#3E2C0C]", detalle: "text-[#3E2C0C]", hex: "#0033FF", Icono: PackageCheck,
  },
  verde: {
    fondo: "bg-emerald-50", borde: "border-emerald-200", titulo: "text-[#3E2C0C]",
    numero: "text-[#3E2C0C]", detalle: "text-[#3E2C0C]", hex: "#00FF73", Icono: CheckCircle2,
  },
  rojo: {
    fondo: "bg-red-50", borde: "border-red-200", titulo: "text-[#3E2C0C]",
    numero: "text-[#3E2C0C]", detalle: "text-[#3E2C0C]", hex: "#FF3300", Icono: AlertTriangle,
  },
};

/**
 * Un conteo sobre fondo de color: la tarjeta del resumen de pedidos.
 *
 * Si la tarjeta trae `filtraEstado` y la pantalla pasó `onSeleccionar`, tocarla
 * filtra el listado. Si no, es un `View` y no un `Pressable`: una tarjeta que
 * se ve tocable y no hace nada es peor que una que no lo parece.
 */
function Estado({ tarjeta, onSeleccionar }: { tarjeta: TarjetaEstado; onSeleccionar?: (estado: string | null) => void }) {
  const tono = TONOS[tarjeta.tono];
  const interactiva = onSeleccionar !== undefined && tarjeta.filtraEstado !== undefined;

  const contenido = (
    <>
      <Degradado

          direccion="to-br"
          paradas={[
          { offset: 0, color: tono.hex, opacity: 1 },
          { offset: 0.5, color: tono.hex, opacity: 0.25 },
          { offset: 1, color: tono.hex, opacity: 0 },
        ]}
        />
      <View className="flex flex-row items-start justify-between gap-2">
        <Span peso="semibold" numberOfLines={2} className={`text-[10px] leading-4 uppercase tracking-[0.6px] shrink ${tono.titulo}`}>
          {tarjeta.titulo}
        </Span>
        <View className="w-7 h-7 rounded-lg bg-white/70 flex items-center justify-center shrink-0">
          <tono.Icono size={14} color={tono.hex} />
        </View>
      </View>
      <P peso="bold" className={`text-3xl leading-9 mt-2 ${tono.numero}`}>
        {tarjeta.cantidad}
      </P>
      <Span peso="medium" numberOfLines={1} className={`text-xs leading-5 ${tono.titulo}`}>
        {tarjeta.etiqueta}
      </Span>
      {tarjeta.detalle && (
        <Span numberOfLines={2} className={`text-[10px] leading-4 mt-2 ${tono.detalle}`}>
          {tarjeta.detalle}
        </Span>
      )}
    </>
  );

  const clases = `border rounded-2xl p-4 flex flex-col justify-between min-h-[132px] ${tono.fondo} ${tono.borde}`;

  if (!interactiva) {
    return <View style={{ width: ANCHO }} className={clases}>{contenido}</View>;
  }
  return (
    <Pressable
      role="button"
      accessibilityLabel={`Filtrar por ${tarjeta.titulo}`}
      onPress={() => onSeleccionar?.(tarjeta.filtraEstado ?? null)}
      style={{ width: ANCHO }}
      className={`${clases} cursor-pointer overflow-hidden`}
    >
      {contenido}
    </Pressable>
  );
}

/** El `switch` que decide qué tarjeta se pinta. Es lo único que hay que tocar
 *  para agregar un tipo nuevo al provider. */
function Tarjeta({ tarjeta, onSeleccionar }: { tarjeta: TarjetaResumen; onSeleccionar?: (estado: string | null) => void }) {
  switch (tarjeta.tipo) {
    case "monto":
      return <Monto tarjeta={tarjeta} />;
    case "alerta":
      return <Alerta tarjeta={tarjeta} />;
    case "proceso":
      return <Proceso tarjeta={tarjeta} />;
    case "conteo":
      return <Conteo tarjeta={tarjeta} />;
    case "estado":
      return <Estado tarjeta={tarjeta} onSeleccionar={onSeleccionar} />;
  }
}

function Esqueleto() {
  return (
    <View style={{ width: ANCHO }} className="bg-stone-100 rounded-2xl min-h-[132px]" />
  );
}

/**
 * La fila de tarjetas del resumen, que scrollea de tarjeta en tarjeta.
 *
 * `snapToInterval` es el ancho de la tarjeta más su separación, así cada
 * gesto deja una tarjeta alineada con el borde izquierdo (en nativo lo hace el
 * ScrollView; en web, react-native-web lo traduce a `scroll-snap`). Cuántas
 * tarjetas hay y de qué tipo lo decide el provider: acá solo se recorren.
 *
 * Sin props lee `ResumenOrdenesProvider`, que es de donde salió. Pasándole
 * `tarjetas` sirve para cualquier otro provider —pedidos, o los del
 * distribuidor— sin duplicar el renderer.
 */
export function TarjetasResumen({
  tarjetas: tarjetasProp,
  cargando: cargandoProp,
  onSeleccionar,
  className = "",
}: {
  tarjetas?: TarjetaResumen[];
  cargando?: boolean;
  /** Si una tarjeta trae `filtraEstado`, tocarla llama a esto. */
  onSeleccionar?: (estado: string | null) => void;
  className?: string;
}) {
  // El hook se llama siempre —no puede ir dentro de un `if`— y lo que devuelve
  // solo se usa cuando la pantalla no pasó su propia lista. Sin provider
  // alrededor devuelve la lista vacía, así que no molesta.
  const deOrdenes = useResumenOrdenes();
  const tarjetas = tarjetasProp ?? deOrdenes.tarjetas;
  const cargando = cargandoProp ?? deOrdenes.cargando;

  // if (!cargando && tarjetas.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={ANCHO + SEPARACION}
      snapToAlignment="start"
      decelerationRate="fast"
      className={`w-full max-w-full ${className}`}
      contentContainerClassName="gap-3 px-4 py-1"
    >
      {cargando
        ? [0, 1, 2, 3].map((i) => <Esqueleto key={i} />)
        : tarjetas.map((t) => <Tarjeta key={t.id} tarjeta={t} onSeleccionar={onSeleccionar} />)} 
        
    </ScrollView>
  );
}
