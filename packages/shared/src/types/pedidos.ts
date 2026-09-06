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

export interface OrdenPedidoListItem {
  id: string;
  estado: EstadoOrden;
  total: number;
  pre_autorizado: boolean;
  cliente_nombre: string | null;
  distribuidor_nombre: string | null;
  distribuidor_imagen: string | null;
  created_at: string | null;
  paquetes: PaquetePedidoResponse[];
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

export interface PedidoListItem {
  id: string;
  orden_id: string;
  estado: EstadoPedido;
  total: number;
  confirmado_at: string | null;
  entregado_at: string | null;
  cliente_nombre: string | null;
  distribuidor_nombre: string | null;
  primer_producto_nombre: string | null;
}

// ── Action Results ────────────────────────────────────────────────────────────

export interface PedidoActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
}
