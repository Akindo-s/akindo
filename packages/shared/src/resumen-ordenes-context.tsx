"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Tarjetas del resumen de órdenes de compra (la fila que scrollea arriba de la
 * pantalla).
 *
 * El provider devuelve una **lista**: la pantalla no sabe cuántas tarjetas hay
 * ni de qué tipo son, solo las recorre y pinta la que corresponde según
 * `tipo`. Así el día que el backend mande otras métricas (o menos), la
 * pantalla no cambia.
 *
 * Hoy el cargador por defecto devuelve datos de muestra: cuando exista el
 * endpoint, se le pasa el loader real por prop, igual que en el resto de los
 * providers (web: server action; mobile: llamada con el token).
 */

/** Lo común a todas las tarjetas. */
interface TarjetaBase {
  /** Identificador estable, para las `key` y para el scroll. */
  id: string;
  /** El rótulo de arriba, en versalitas. */
  titulo: string;
}

/** Un importe con su comparación contra el ciclo anterior. */
export interface TarjetaMonto extends TarjetaBase {
  tipo: "monto";
  monto: number;
  moneda: string;
  /** Variación en porcentaje: positiva sube, negativa baja. */
  variacion: number | null;
  /** Contra qué se compara ("vs ciclo previo"). */
  comparacion: string | null;
}

/** Un importe que necesita atención: se pinta en rojo. */
export interface TarjetaAlerta extends TarjetaBase {
  tipo: "alerta";
  monto: number;
  moneda: string;
  /** "2 por vencer". */
  detalle: string | null;
  /** "Prioridad Alta". */
  etiqueta: string | null;
}

/** Algo en curso, con su tiempo de respuesta comprometido. */
export interface TarjetaProceso extends TarjetaBase {
  tipo: "proceso";
  monto: number;
  moneda: string;
  /** "3 órdenes en firma". */
  detalle: string | null;
  /** "SLA 4 horas". */
  sla: string | null;
}

/** Un conteo (no un importe) con dos notas al pie. */
export interface TarjetaConteo extends TarjetaBase {
  tipo: "conteo";
  cantidad: number;
  /** "órdenes". */
  unidad: string;
  /** "100% SAT CFDI 4.0". */
  nota: string | null;
  /** "$45.2k liquidados". */
  notaSecundaria: string | null;
}

export type TarjetaResumen = TarjetaMonto | TarjetaAlerta | TarjetaProceso | TarjetaConteo;

/** Lo que tendrá que implementar cada app cuando exista el endpoint. */
export type CargarResumenOrdenes = () => Promise<TarjetaResumen[]>;

/** Datos de muestra mientras el backend no los calcula. */
const RESUMEN_MOCK: TarjetaResumen[] = [
  {
    id: "total-comprometido",
    tipo: "monto",
    titulo: "Total comprometido (mes)",
    monto: 184500,
    moneda: "MXN",
    variacion: 12.4,
    comparacion: "vs ciclo previo",
  },
  {
    id: "pendientes-de-pago",
    tipo: "alerta",
    titulo: "Pendientes de pago",
    monto: 53400,
    moneda: "MXN",
    detalle: "2 por vencer",
    etiqueta: "Prioridad Alta",
  },
  {
    id: "en-aprobacion",
    tipo: "proceso",
    titulo: "En aprobación / firma",
    monto: 85900,
    moneda: "MXN",
    detalle: "3 órdenes en firma",
    sla: "SLA 4 horas",
  },
  {
    id: "completadas",
    tipo: "conteo",
    titulo: "Completadas & timbradas",
    cantidad: 12,
    unidad: "órdenes",
    nota: "100% SAT CFDI 4.0",
    notaSecundaria: "$45.2k liquidados",
  },
];

const cargarMock: CargarResumenOrdenes = async () => RESUMEN_MOCK;

interface EstadoResumen {
  tarjetas: TarjetaResumen[];
  cargando: boolean;
}

const ResumenOrdenesContext = createContext<EstadoResumen>({ tarjetas: [], cargando: false });

/**
 * @param cargar de dónde salen las tarjetas. Sin esta prop devuelve el mock.
 */
export function ResumenOrdenesProvider({
  children,
  cargar = cargarMock,
}: {
  children: ReactNode;
  cargar?: CargarResumenOrdenes;
}) {
  const [tarjetas, setTarjetas] = useState<TarjetaResumen[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    cargar()
      .then((recibidas) => { if (vigente) setTarjetas(recibidas); })
      // Si el resumen falla, la pantalla se queda sin tarjetas pero con su
      // listado: es información de apoyo, no el contenido principal.
      .catch(() => { if (vigente) setTarjetas([]); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [cargar]);

  return (
    <ResumenOrdenesContext.Provider value={{ tarjetas, cargando }}>
      {children}
    </ResumenOrdenesContext.Provider>
  );
}

export function useResumenOrdenes(): EstadoResumen {
  return useContext(ResumenOrdenesContext);
}
