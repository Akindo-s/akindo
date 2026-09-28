// Tipos TypeScript para el flujo de órdenes de compra y pedidos

// ── Enums ─────────────────────────────────────────────────────────────────────

export type EstadoOrden = "pendiente" | "aceptada" | "rechazada" | "cancelada";
export type EstadoPedido =
  | "pendiente de envio"
  | "en envio"
  | "entregado"
  | "cancelado";

// ── Pre-orden ─────────────────────────────────────────────────────────────────

export interface PreOrdenProducto {
  producto_id: string;
  nombre: string;
  sku: string | null;
  imagen: string | null;
  cantidad: number;
  costo_unitario: number;
  subtotal: number;
  unidad: string;
}

export interface DireccionCliente {
  id: string;
  calle: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  es_predeterminada: boolean;
}

export interface PreOrdenResponse {
  distribuidor_id: string;
  distribuidor_nombre: string;
  productos: PreOrdenProducto[];
  subtotal: number;
  costo_envio: number;
  impuestos: number;
  total: number;
  direcciones_disponibles: DireccionCliente[];
}

// ── Orden de compra ───────────────────────────────────────────────────────────

export interface PaquetePedidoResponse {
  id: string;
  producto_id: string;
  cantidad: number;
  costo_unitario: number;
  subtotal: number;
  medida_snapshot: { unidad: string; nombre: string };
  nombre_producto: string | null;
  imagen_producto: string | null;
  /**
   * Solo en la bandeja del distribuidor: las existencias que le quedan al
   * producto al llegar a esta orden, ya descontado lo que comprometieron las
   * anteriores. `null` fuera de esa vista.
   */
  existencias?: number | null;
  /** Si con esas existencias alcanza para esta partida. */
  suficiente?: boolean | null;
}

export interface OrdenPedidoResponse {
  id: string;
  cliente_id: string;
  distribuidor_id: string;
  direccion_id: string;
  estado: EstadoOrden;
  pre_autorizado: boolean;
  motivo_rechazo: string | null;
  total: number;
  paquetes: PaquetePedidoResponse[];
  cliente_nombre: string | null;
  cliente_email: string | null;
  cliente_imagen: string | null;
  created_at: string | null;
}

/** Si el inventario alcanza para surtir la orden. */
export type CoberturaStock = "completo" | "parcial" | "sin_stock";

export interface OrdenPedidoListItem {
  id: string;
  estado: EstadoOrden;
  total: number;
  pre_autorizado: boolean;
  cliente_id: string | null;
  cliente_nombre: string | null;
  cliente_imagen: string | null;
  distribuidor_nombre: string | null;
  distribuidor_imagen: string | null;
  created_at: string | null;
  /** El pedido que salió de esta orden, si ya se pagó. */
  pedido_id: string | null;
  paquetes: PaquetePedidoResponse[];

  // ── Solo en la bandeja del distribuidor ────────────────────────────────
  /** Ciudad y estado de la dirección de entrega, ya formateados. */
  destino?: string | null;
  /** `null` cuando la pregunta no aplica (la orden ya no está pendiente). */
  cobertura?: CoberturaStock | null;
  /** Cuántas órdenes de este cliente aceptó antes este distribuidor. */
  cliente_ordenes_previas?: number | null;
  /** Cuánto suman esas órdenes previas. */
  cliente_monto_historico?: number | null;
}

/** Filtros del listado de órdenes. Todos opcionales y combinables. */
export interface FiltrosOrdenes {
  /** Estado exacto. `null` o ausente = todos. */
  estado?: EstadoOrden | null;
  /** Busca por el id de la orden (basta con el principio) o por producto. */
  q?: string;
  distribuidorId?: string | null;
  /** La contraparte cuando quien mira es el distribuidor. */
  clienteId?: string | null;
  /** Fecha mínima de emisión, ISO 8601 (`2026-08-18`). */
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  montoMin?: number | null;
  montoMax?: number | null;
  /** Por fecha de emisión: `desc` (lo más nuevo primero) o `asc`. */
  orden?: "asc" | "desc";
  /** 1-based, como el endpoint. */
  pagina?: number;
  cantidad?: number;
}

/**
 * Lo que devuelve `GET /pedidos/mis-ordenes`: la página de órdenes más la
 * metadata de paginación. Misma forma que el catálogo de productos y el de
 * distribuidores.
 */
/**
 * Lo que devuelve `GET /pedidos/distribuidor/ordenes/resumen`: cuántas
 * órdenes hay en cada estado. Respeta todos los filtros menos el estado.
 */
export interface ResumenOrdenes {
  total: number;
  por_estado: Record<EstadoOrden, number>;
  /**
   * De las pendientes, cuántas alcanza a surtir el distribuidor con el
   * inventario que le queda una vez descontado lo ya comprometido.
   */
  surtibles: number;
  /** Las pendientes a las que les falta algo. */
  con_faltantes: number;
}

export interface ListadoOrdenes {
  total_ordenes: number;
  total_paginas: number;
  pagina_actual: number;
  tiene_siguiente: boolean;
  tiene_anterior: boolean;
  siguiente_url: string | null;
  anterior_url: string | null;
  ordenes: OrdenPedidoListItem[];
}

// ── Pedido ────────────────────────────────────────────────────────────────────

export interface PedidoActualizacion {
  id: string;
  estado_nuevo: EstadoPedido;
  descripcion: string | null;
  creado_at: string;
}

export interface PedidoItemResponse {
  producto_id: string;
  cantidad: number;
  costo_unitario: number;
  subtotal: number;
  medida_snapshot: { unidad: string; nombre: string };
  nombre_producto: string | null;
  imagen_producto: string | null;
}

export interface ValoracionResponse {
  id: string;
  pedido_id: string;
  cliente_id: string;
  distribuidor_id: string;
  puntuacion: number;
  comentario: string | null;
  created_at: string;
}

export interface PedidoResponse {
  id: string;
  orden_id: string;
  estado: EstadoPedido;
  total: number;
  comision_servicio: number;
  confirmado_at: string | null;
  entregado_at: string | null;
  cliente_id: string | null;
  distribuidor_id: string | null;
  cliente_nombre: string | null;
  cliente_imagen: string | null;
  distribuidor_nombre: string | null;
  distribuidor_imagen: string | null;
  distribuidor_verificado: boolean | null;
  direccion_entrega: DireccionCliente | null;
  paquetes: PedidoItemResponse[];
  actualizaciones: PedidoActualizacion[];
  tiene_valoracion: boolean;
  valoracion: ValoracionResponse | null;
}

/** Un paso del timeline del envío, en la versión compacta del listado. */
export interface SeguimientoPedido {
  estado_nuevo: EstadoPedido;
  descripcion: string | null;
  creado_at: string;
}

/** Un producto del pedido, en la versión compacta del listado. */
export interface PedidoProductoListItem {
  nombre: string | null;
  imagen: string | null;
  cantidad: number;
  unidad: string | null;
  subtotal: number;
}

export interface PedidoListItem {
  id: string;
  orden_id: string;
  estado: EstadoPedido;
  total: number;
  confirmado_at: string | null;
  entregado_at: string | null;
  cliente_id: string | null;
  cliente_nombre: string | null;
  cliente_imagen: string | null;
  distribuidor_id: string | null;
  distribuidor_nombre: string | null;
  distribuidor_imagen: string | null;
  distribuidor_verificado: boolean | null;
  primer_producto_nombre: string | null;
  primer_producto_imagen: string | null;
  /** Cuántas partidas trae la orden del pedido. */
  total_partidas: number;
  /** Los productos del pedido. La tarjeta pinta los primeros y resume el resto. */
  productos: PedidoProductoListItem[];
  /** Ciudad y estado de la dirección de entrega, ya formateados. */
  destino: string | null;
  /**
   * El timeline real del envío, del paso más viejo al más nuevo. Es lo que
   * pinta la barra de progreso con fechas de verdad; llega vacío si el pedido
   * todavía no tiene actualizaciones.
   */
  seguimiento: SeguimientoPedido[];
}

/** Filtros del listado de pedidos. Todos opcionales y combinables. */
export interface FiltrosPedidos {
  /** Estado exacto. `null` o ausente = todos. */
  estado?: EstadoPedido | null;
  /** Busca por el id del pedido (basta con el principio) o por producto. */
  q?: string;
  distribuidorId?: string | null;
  /** La contraparte cuando quien mira es el distribuidor. */
  clienteId?: string | null;
  /** Fecha mínima de confirmación, ISO 8601 (`2026-08-18`). */
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  /** Por fecha de confirmación: `desc` (lo más nuevo primero) o `asc`. */
  orden?: "asc" | "desc";
  /** 1-based, como el endpoint. */
  pagina?: number;
  cantidad?: number;
}

/**
 * Lo que devuelve `GET /pedidos/resumen`: cuántos pedidos hay en cada estado.
 *
 * Respeta todos los filtros del listado **menos el estado**, porque es lo que
 * alimenta los contadores de las pestañas: una pestaña tiene que decir cuántos
 * hay en ese estado aunque ahora mismo estés viendo otro.
 */
export interface ResumenPedidos {
  total: number;
  /** Los cuatro estados siempre, con 0 cuando no hay ninguno. */
  por_estado: Record<EstadoPedido, number>;
}

/**
 * Lo que devuelve `GET /pedidos/`: la página de pedidos más la metadata de
 * paginación. Misma forma que `ListadoOrdenes`.
 */
export interface ListadoPedidos {
  total_pedidos: number;
  total_paginas: number;
  pagina_actual: number;
  tiene_siguiente: boolean;
  tiene_anterior: boolean;
  siguiente_url: string | null;
  anterior_url: string | null;
  pedidos: PedidoListItem[];
}

// ── Action Results ────────────────────────────────────────────────────────────

export interface PedidoActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
}
