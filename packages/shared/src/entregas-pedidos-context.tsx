"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { EntregaPedido } from "./types/entregas";

/**
 * La información de entrega de los pedidos de una página, lista para que la
 * tarjeta la pinte.
 *
 * Todo lo que hay acá sale de `GET /entregas/pedidos/{id}`. Antes este módulo
 * también traía un mock local —nombre de la ruta, un paso de "preparado",
 * lote, último reporte satelital, notas de inspección—; se borró: eran datos
 * que no existían en ninguna parte y que la pantalla presentaba como ciertos.
 * Si alguno hace falta, el camino es agregarlo al endpoint, no volver a
 * inventarlo acá.
 */

export interface EntregaDePedido {
  /** Cuándo se espera que llegue; si ya llegó, cuándo llegó. ISO. */
  fechaEntregaAproximada: string | null;
  /** La franja comprometida: "09:00 – 14:00". */
  ventanaHoraria: string | null;
  /** "Castores Prime". */
  transportista: string | null;
  /** Ya formateado para el pie del bloque: "Chofer: Marcos E. (GPS certificado)". */
  chofer: string | null;
  /** De dónde sale la mercancía: "Naucalpan Hub". */
  almacenOrigen: string | null;
  /** Qué unidad conviene: "Camión 3.5 Ton". */
  transporteSugerido: string | null;
  /** El folio de la guía de remisión. */
  guia: string | null;
  /** Cómo fue la entrega. Vacía mientras el pedido no se haya entregado. */
  evidencias: EntregaPedido["evidencias"];
}

/** Sin datos: la tarjeta omite cada campo que falte. */
export const SIN_ENTREGA: EntregaDePedido = {
  fechaEntregaAproximada: null,
  ventanaHoraria: null,
  transportista: null,
  chofer: null,
  almacenOrigen: null,
  transporteSugerido: null,
  guia: null,
  evidencias: [],
};

/**
 * Trae la entrega de cada pedido desde la API. La inyecta la app, porque
 * necesita la sesión (regla 13): en web es una Server Action y en mobile una
 * llamada con el token.
 */
export type CargarEntregas = (pedidoIds: string[]) => Promise<Record<string, EntregaPedido>>;

/** Pasa lo que devuelve el endpoint a lo que la tarjeta pinta. */
function deEntrega(entrega: EntregaPedido): EntregaDePedido {
  const t = entrega.transportista;
  return {
    fechaEntregaAproximada: entrega.fecha_entrega_aproximada,
    ventanaHoraria: entrega.ventana_horaria,
    transportista: t?.nombre ?? null,
    // El chofer y su certificación son un solo renglón en la tarjeta.
    chofer: t?.chofer
      ? `Chofer: ${t.chofer}${t.certificacion ? ` (${t.certificacion})` : ""}`
      : null,
    almacenOrigen: entrega.almacen_origen,
    transporteSugerido: entrega.transporte_sugerido,
    guia: entrega.guia,
    evidencias: entrega.evidencias,
  };
}

interface EstadoEntregas {
  /** Nunca devuelve `undefined`: sin dato entrega `SIN_ENTREGA`. */
  entregaDe: (pedidoId: string) => EntregaDePedido;
  cargando: boolean;
}

const EntregasContext = createContext<EstadoEntregas>({
  entregaDe: () => SIN_ENTREGA,
  cargando: false,
});

/**
 * @param pedidoIds los pedidos de la página que se está viendo.
 * @param cargarEntregas de dónde salen los datos. Sin esta prop la tarjeta se
 * pinta sin ellos.
 */
export function EntregasPedidosProvider({
  children,
  pedidoIds,
  cargarEntregas,
}: {
  children: ReactNode;
  pedidoIds: string[];
  cargarEntregas?: CargarEntregas;
}) {
  const [entregas, setEntregas] = useState<Record<string, EntregaPedido>>({});
  const [cargando, setCargando] = useState(false);

  // `join`: la lista cambia de identidad en cada render de la pantalla, pero
  // lo que importa es qué pedidos son.
  const clave = pedidoIds.join(",");

  useEffect(() => {
    if (!cargarEntregas || pedidoIds.length === 0) { setEntregas({}); return; }
    let vigente = true;
    setCargando(true);
    cargarEntregas(pedidoIds)
      .then((recibido) => { if (vigente) setEntregas(recibido); })
      // Es información de apoyo: si falla, las tarjetas se pintan con lo que
      // ya traía el listado.
      .catch(() => { if (vigente) setEntregas({}); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [clave, cargarEntregas]);

  const entregaDe = (pedidoId: string): EntregaDePedido => {
    const entrega = entregas[pedidoId];
    return entrega ? deEntrega(entrega) : SIN_ENTREGA;
  };

  return (
    <EntregasContext.Provider value={{ entregaDe, cargando }}>
      {children}
    </EntregasContext.Provider>
  );
}

export function useEntregasPedidos(): EstadoEntregas {
  return useContext(EntregasContext);
}
