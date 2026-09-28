/**
 * Tarjetas del resumen: la fila que scrollea arriba de los listados largos
 * (órdenes de compra, pedidos, y mañana los del distribuidor).
 *
 * Viven acá y no en el provider porque el mismo renderer
 * (`@akindo/ui/components/ui/TarjetasResumen`) las pinta para todas las
 * pantallas: cada provider arma **su** lista con los tipos de acá, y la
 * pantalla solo las recorre.
 */

/** Lo común a todas las tarjetas. */
export interface TarjetaBase {
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

/**
 * La paleta de las tarjetas de estado. Es un nombre y no un color: el mapa de
 * colores vive en la UI, así el provider no decide estilos.
 */
export type TonoTarjeta = "ambar" | "azul" | "verde" | "rojo";

/**
 * Cuántos hay en un estado, sobre fondo de color. Es la tarjeta del resumen de
 * pedidos: "En tránsito 4", "Entregados 1", "Con incidencias 0".
 */
export interface TarjetaEstado extends TarjetaBase {
  tipo: "estado";
  cantidad: number;
  /** El renglón debajo del número: "En tránsito". */
  etiqueta: string;
  /** El pie de la tarjeta: "2 Entregas en 48hrs". */
  detalle: string | null;
  tono: TonoTarjeta;
  /**
   * Si esta tarjeta filtra el listado al tocarla, el estado que aplica. `null`
   * la deja como puro indicador.
   */
  filtraEstado?: string | null;
}

export type TarjetaResumen =
  | TarjetaMonto
  | TarjetaAlerta
  | TarjetaProceso
  | TarjetaConteo
  | TarjetaEstado;
