/**
 * Entregas por día: lo que pinta `GraficaEntregas`.
 *
 * Vive acá, y no en el provider de pedidos del cliente, porque la misma
 * gráfica se usa en la pantalla de pedidos del distribuidor: quien tenga los
 * datos arma la lista y se la pasa al componente.
 */
export interface DiaEntregas {
  /** El día, ISO (`2026-09-21`). Se usa como `key`. */
  fecha: string;
  /** El rótulo del eje: "Lun". */
  etiqueta: string;
  /**
   * Las tres se comparan contra la fecha comprometida del pedido y suman el
   * total de entregas del día: `antes` llegó antes de ese día, `a_tiempo` ese
   * mismo día y `con_retraso` después.
   */
  antes: number;
  a_tiempo: number;
  con_retraso: number;
}

/** Cuántas entregas hubo ese día, sin importar la puntualidad. */
export function totalDelDia(dia: DiaEntregas): number {
  return dia.antes + dia.a_tiempo + dia.con_retraso;
}

/**
 * El porcentaje de entregas que **no** llegaron tarde, 0–100. `null` si no
 * hubo entregas en el periodo.
 */
export function puntualidadDe(dias: DiaEntregas[]): number | null {
  const total = dias.reduce((n, d) => n + totalDelDia(d), 0);
  if (total === 0) return null;
  const tarde = dias.reduce((n, d) => n + d.con_retraso, 0);
  return ((total - tarde) / total) * 100;
}

// ── Entrega de un pedido ──────────────────────────────────────────────────────
// Lo que devuelve `GET /entregas/pedidos/{id}`. Los datos de ese endpoint hoy
// son de muestra, pero la forma ya es la definitiva.

/** Quién lleva el pedido. */
export interface TransportistaEntrega {
  nombre: string;
  chofer: string | null;
  /** "GPS certificado", "Refrigerado". */
  certificacion: string | null;
  telefono: string | null;
}

/** Una prueba de cómo fue la entrega. */
export interface EvidenciaEntrega {
  id: string;
  /** La UI pinta `foto` como imagen y el resto como texto. */
  tipo: "foto" | "firma" | "nota";
  /** `null` en las que no tienen imagen. */
  url: string | null;
  descripcion: string;
  creado_at: string;
}

export interface EntregaPedido {
  pedido_id: string;
  /** De dónde sale la mercancía: "Naucalpan Hub". */
  almacen_origen: string | null;
  /** Qué unidad conviene: "Camión 3.5 Ton". */
  transporte_sugerido: string | null;
  /** El folio de la guía de remisión: "CP-554920". */
  guia: string | null;
  /** Cuándo se espera que llegue; si ya llegó, cuándo llegó. */
  fecha_entrega_aproximada: string | null;
  /** La franja comprometida: "09:00 – 14:00". */
  ventana_horaria: string | null;
  transportista: TransportistaEntrega | null;
  /** Vacía mientras el pedido no se haya entregado. */
  evidencias: EvidenciaEntrega[];
}
