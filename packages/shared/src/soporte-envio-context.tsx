"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { DiaEntregas } from "./types/entregas";

/**
 * La columna de apoyo de la pantalla de pedidos: los accesos de soporte de
 * envío y las entregas por día que alimentan la gráfica de cumplimiento.
 *
 * Las **entregas son reales**: salen de `GET /entregas/resumen`, que compara
 * la fecha de entrega de cada pedido contra la comprometida. Los **enlaces
 * siguen siendo de muestra**: no hay nada detrás de la póliza de seguro ni de
 * las cartas porte todavía.
 */

/** Un acceso de la tarjeta de soporte. */
export interface EnlaceSoporte {
  id: string;
  etiqueta: string;
  /** A dónde lleva. Sin `href` el acceso se pinta como fila informativa. */
  href?: string | null;
  /** Una marca a la derecha: "En línea". */
  insignia?: string | null;
  /** `true` pinta la insignia en verde (algo activo). */
  activo?: boolean;
}

/**
 * Trae las entregas de una ventana. La inyecta la app, porque necesita la
 * sesión. `hasta` es el último día del periodo, o `null` para el actual.
 */
export type CargarEntregasPorDia = (hasta: string | null) => Promise<DiaEntregas[]>;

/**
 * Los accesos, todavía de muestra. El de asistencia sí lleva a una ruta que
 * existe; los otros dos no llevan a ninguna parte a propósito, y por eso van
 * sin `href`: se pintan como fila informativa en vez de prometer una
 * navegación que no hay.
 */
const ENLACES_MUESTRA: EnlaceSoporte[] = [
  { id: "poliza", etiqueta: "Póliza de seguro activa", href: null },
  { id: "cartas-porte", etiqueta: "Cartas porte digitales (SAT)", href: null },
  { id: "asistencia", etiqueta: "Asistencia en línea", href: "/perfil/soporte", insignia: "En línea", activo: true },
];

interface EstadoSoporte {
  enlaces: EnlaceSoporte[];
  entregas: DiaEntregas[];
  cargando: boolean;
  /** Retrocede un periodo. */
  irAnterior: () => void;
  /** Avanza un periodo. No hace nada si ya estás en el actual. */
  irSiguiente: () => void;
  /** `false` cuando el periodo que ves es el que termina hoy. */
  puedeSiguiente: boolean;
}

const SIN_SOPORTE: EstadoSoporte = {
  enlaces: [],
  entregas: [],
  cargando: false,
  irAnterior: () => {},
  irSiguiente: () => {},
  puedeSiguiente: false,
};

const SoporteEnvioContext = createContext<EstadoSoporte>(SIN_SOPORTE);

/**
 * @param cargarEntregas de dónde salen los días de la gráfica. Sin esta prop
 * la gráfica no se pinta.
 * @param enlaces los accesos de soporte. Por defecto, los de muestra.
 */
export function SoporteEnvioProvider({
  children,
  cargarEntregas,
  dias = 7,
  enlaces = ENLACES_MUESTRA,
}: {
  children: ReactNode;
  cargarEntregas?: CargarEntregasPorDia;
  /** Tamaño de la ventana de la gráfica, en días. */
  dias?: number;
  enlaces?: EnlaceSoporte[];
}) {
  const [entregas, setEntregas] = useState<DiaEntregas[]>([]);
  const [cargando, setCargando] = useState(cargarEntregas !== undefined);
  // Cuántos periodos atrás está el que se está viendo. 0 es el actual.
  const [atras, setAtras] = useState(0);

  useEffect(() => {
    if (!cargarEntregas) { setCargando(false); return; }
    let vigente = true;
    setCargando(true);
    cargarEntregas(finDelPeriodo(atras, dias))
      .then((recibidas) => { if (vigente) setEntregas(recibidas); })
      // Es información de apoyo: si falla, la pantalla se queda con su
      // listado y sin la gráfica.
      .catch(() => { if (vigente) setEntregas([]); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [cargarEntregas, atras, dias]);

  return (
    <SoporteEnvioContext.Provider
      value={{
        enlaces,
        entregas,
        cargando,
        irAnterior: () => setAtras((n) => n + 1),
        irSiguiente: () => setAtras((n) => Math.max(0, n - 1)),
        puedeSiguiente: atras > 0,
      }}
    >
      {children}
    </SoporteEnvioContext.Provider>
  );
}

/**
 * El último día del periodo que está `atras` periodos antes del actual, en
 * ISO. `null` para el actual, así el backend usa su propio "hoy" y no el del
 * dispositivo.
 */
function finDelPeriodo(atras: number, dias: number): string | null {
  if (atras === 0) return null;
  const fin = new Date();
  fin.setDate(fin.getDate() - atras * dias);
  return fin.toISOString().slice(0, 10);
}

export function useSoporteEnvio(): EstadoSoporte {
  return useContext(SoporteEnvioContext);
}
