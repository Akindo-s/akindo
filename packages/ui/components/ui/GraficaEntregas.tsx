/** @jsxImportSource nativewind */
"use client";

import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { twMerge } from "tailwind-merge";
import { puntualidadDe, totalDelDia, type DiaEntregas } from "@akindo/shared/types/entregas";
import { Pressable, Section, Span } from "../html-elements";

/**
 * Cumplimiento de entregas por día.
 *
 * Una barra por día, de altura proporcional a las entregas de ese día, producto
 * en tres tramos según cómo llegó cada una respecto a la fecha comprometida:
 * verde las que se adelantaron, ámbar las que llegaron el día acordado y rojo
 * las que se retrasaron. Los tramos se apilan de abajo hacia arriba en ese
 * orden, así que el rojo siempre queda arriba y se ve de un vistazo.
 *
 * No lee ningún contexto: los días entran por props. Así la misma gráfica
 * sirve para los pedidos del cliente y para los del distribuidor, que los
 * sacan de lugares distintos.
 */

/** Alto del área de barras, en px. La escala se reparte sobre esto. */
const ALTO = 72;
/** Alto mínimo de un tramo con al menos una entrega, para que se vea. */
const ALTO_MINIMO = 3;

/** Los tres tramos, de abajo hacia arriba, con su color y su nombre. */
const TRAMOS = [
  { clave: "antes", etiqueta: "Se adelantó", color: "#047857" },
  { clave: "a_tiempo", etiqueta: "A tiempo", color: "#DAA520" },
  { clave: "con_retraso", etiqueta: "Con retraso", color: "#DC2626" },
] as const;

/** Cuánto tarda una barra en llegar a su nueva altura. */
const DURACION = 280;

/**
 * Un tramo de la barra, con su altura animada.
 *
 * El `Animated.View` va sin `className` —nativewind no puede registrarlo
 * (regla 7)— y con `useNativeDriver: false`, porque el driver nativo solo sabe
 * animar `transform` y `opacity`, no `height`.
 *
 * El componente **no se desmonta** cuando el tramo vale cero: se queda con
 * altura 0. Si se devolviera `null`, el `Animated.Value` se perdería y al
 * volver a haber datos la barra aparecería de golpe en vez de crecer.
 */
function Tramo({ alto, color }: { alto: number; color: string }) {
  const animado = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animado, { toValue: alto, duration: DURACION, useNativeDriver: false }).start();
  }, [alto, animado]);

  return <Animated.View style={{ height: animado, width: "100%", backgroundColor: color }} />;
}

function Barra({
  dia,
  maximo,
  conEtiqueta,
  cargando,
}: {
  dia: DiaEntregas;
  maximo: number;
  conEtiqueta: boolean;
  /** Mientras se piden los datos del periodo nuevo, la barra baja a cero. */
  cargando: boolean;
}) {
  const total = totalDelDia(dia);
  const altoDe = (cantidad: number) =>
    cargando || cantidad === 0 ? 0 : Math.max(ALTO_MINIMO, (cantidad / maximo) * ALTO);

  return (
    <View className="flex-1 flex flex-col items-center gap-1">
      {/* `justify-end` apoya la barra en la base del área, que es lo que hace
          que todas arranquen del mismo piso. `flex-col-reverse` apila los
          tramos de abajo hacia arriba en el orden de `TRAMOS`. */}
      <View style={{ height: ALTO }} className="w-full flex flex-col justify-end items-center">
        <View className="w-full max-w-[14px] flex flex-col-reverse">
          {TRAMOS.map(({ clave, color }) => (
            <Tramo key={clave} alto={altoDe(dia[clave])} color={color} />
          ))}
        </View>
      </View>
      {/* El renglón del rótulo va siempre, aunque esté vacío: si se omitiera,
          las columnas con y sin etiqueta medirían distinto y las barras
          dejarían de estar alineadas. */}
      <View style={{ height: 12 }} className="flex items-center justify-center">
        {conEtiqueta && (
          <Span
            numberOfLines={1}
            peso={total > 0 ? "semibold" : "medium"}
            className="text-[9px] leading-3"
            style={{ color: total > 0 ? "#57534E" : "#A8A29E" }}
          >
            {dia.etiqueta}
          </Span>
        )}
      </View>
    </View>
  );
}

/**
 * Qué días llevan rótulo. Con una semana caben todos; con un mes se
 * amontonan, así que se rotula uno de cada cinco —y siempre los que tienen
 * entregas, que son los que alguien va a querer ubicar—.
 */
function conEtiquetas(dias: DiaEntregas[]): boolean[] {
  const paso = dias.length <= 10 ? 1 : 5;
  return dias.map((d, i) => i % paso === 0 || totalDelDia(d) > 0);
}

/**
 * "31 ago – 6 sep 2026". El año va una sola vez al final, salvo que el periodo
 * cruce de un año a otro; el mes tampoco se repite si los dos días caen en el
 * mismo.
 */
function rangoDe(dias: DiaEntregas[]): string | null {
  if (dias.length === 0) return null;
  const inicio = new Date(`${dias[0].fecha}T00:00:00`);
  const fin = new Date(`${dias[dias.length - 1].fecha}T00:00:00`);
  const mismoAnio = inicio.getFullYear() === fin.getFullYear();
  const mismoMes = mismoAnio && inicio.getMonth() === fin.getMonth();

  const formato = (d: Date, conMes: boolean, conAnio: boolean) =>
    d.toLocaleDateString("es-MX", {
      day: "numeric",
      ...(conMes ? { month: "short" } : {}),
      ...(conAnio ? { year: "numeric" } : {}),
    });

  return `${formato(inicio, !mismoMes, !mismoAnio)} – ${formato(fin, true, true)}`;
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
      style={{ opacity: activa ? 1 : 0.35 }}
      className="w-7 h-7 rounded-lg border border-stone-200 bg-white flex items-center justify-center cursor-pointer"
    >
      <Icono size={13} color="#57534E" />
    </Pressable>
  );
}

export function GraficaEntregas({
  dias,
  titulo = "Cumplimiento de entregas",
  onAnterior,
  onSiguiente,
  puedeSiguiente = false,
  cargando = false,
  className = "",
}: {
  dias: DiaEntregas[];
  titulo?: string;
  /**
   * `true` mientras se piden los datos de otro periodo. La gráfica **no se
   * desmonta**: baja las barras a cero y deja el rango anterior hasta que
   * llegan los datos nuevos, que es cuando todo se mueve a la vez.
   */
  cargando?: boolean;
  /**
   * Retroceder y avanzar un periodo. Sin `onAnterior` no se pintan las
   * flechas: quien no pagine —el distribuidor, por ahora— usa la gráfica
   * igual que antes.
   */
  onAnterior?: () => void;
  onSiguiente?: () => void;
  /** `false` deshabilita la flecha de avanzar (ya estás en el periodo actual). */
  puedeSiguiente?: boolean;
  className?: string;
}) {
  if (dias.length === 0) return null;

  // La escala la marca el día más movido; con la semana en cero no se divide
  // entre cero y quedan todas las barras en el piso.
  const maximo = Math.max(...dias.map(totalDelDia), 1);
  const puntualidad = puntualidadDe(dias);
  // Solo se explican los colores que de verdad aparecen.
  const presentes = TRAMOS.filter((t) => dias.some((d) => d[t.clave] > 0));
  const etiquetas = conEtiquetas(dias);
  const rango = rangoDe(dias);

  return (
    <Section className={twMerge("bg-white border border-stone-100 rounded-2xl p-4 drop-shadow-sm", className)}>
      <View className="flex flex-row items-start justify-between gap-2">
        <Span peso="semibold" numberOfLines={2} className="text-[10px] leading-4 uppercase tracking-[0.6px] text-stone-400 shrink">
          {titulo}
        </Span>
        {puntualidad !== null && !cargando && (
          <Span peso="bold" className="text-[11px] leading-4 text-emerald-700 shrink-0">
            {puntualidad.toFixed(1)}% a tiempo
          </Span>
        )}
      </View>

      {/* El rango y, si la pantalla lo pidió, las flechas para moverse entre
          periodos. */}
      <View className="flex flex-row items-center justify-between gap-2 mt-2">
        <Span peso="medium" numberOfLines={1} className="text-xs leading-5 text-stone-600 shrink">
          {rango ?? ""}
        </Span>
        {onAnterior && (
          <View className="flex flex-row items-center gap-1.5 shrink-0">
            <Flecha Icono={ChevronLeft} etiqueta="Periodo anterior" activa onPress={onAnterior} />
            <Flecha
              Icono={ChevronRight}
              etiqueta="Periodo siguiente"
              activa={puedeSiguiente}
              onPress={() => onSiguiente?.()}
            />
          </View>
        )}
      </View>

      {/* `gap` chico: con un mes son treinta barras y tienen que caber. */}
      <View className="flex flex-row items-end gap-1 mt-3">
        {/* La `key` es la posición y no la fecha: al cambiar de periodo las
            fechas cambian todas, y con ellas como key cada barra se
            remontaría y perdería su animación. */}
        {dias.map((d, i) => (
          <Barra key={i} dia={d} maximo={maximo} conEtiqueta={etiquetas[i]} cargando={cargando} />
        ))}
      </View>

      {presentes.length > 0 && (
        <View className="flex flex-row flex-wrap items-center gap-3 mt-3 pt-3 border-t border-stone-100">
          {presentes.map((t) => (
            <View key={t.clave} className="flex flex-row items-center gap-1.5">
              <View className="w-2 h-2 rounded-sm" style={{ backgroundColor: t.color }} />
              <Span className="text-[10px] leading-4 text-stone-400">{t.etiqueta}</Span>
            </View>
          ))}
        </View>
      )}

      {puntualidad === null && !cargando && (
        <Span className="text-[10px] leading-4 text-stone-400 mt-3">
          Sin entregas en este periodo.
        </Span>
      )}
    </Section>
  );
}
