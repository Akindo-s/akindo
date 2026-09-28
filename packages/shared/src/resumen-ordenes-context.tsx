"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { TarjetaResumen } from "./types/resumen";

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

// Los tipos de tarjeta son compartidos con el resumen de pedidos: viven en
// `types/resumen` y se re-exportan acá para no romper a quien ya los importaba
// desde este módulo.
export type {
  TarjetaMonto,
  TarjetaAlerta,
  TarjetaProceso,
  TarjetaConteo,
  TarjetaEstado,
  TarjetaResumen,
  TonoTarjeta,
} from "./types/resumen";

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
