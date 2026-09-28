"use server";

import * as core from "@akindo/shared/api/pedidos";
import * as coreEntregas from "@akindo/shared/api/entregas";
import { conSesion, sesionRequerida } from "@/lib/sesion";
import type { EstadoPedido, FiltrosOrdenes, FiltrosPedidos } from "@akindo/shared/types/pedidos";

export type { DatosCrearOrden } from "@akindo/shared/api/pedidos";

async function tokenCliente(): Promise<string> {
  return (await sesionRequerida("cliente")).token;
}

async function tokenDistribuidor(): Promise<string> {
  return (await sesionRequerida("distribuidor")).token;
}

// ── Pre-orden ─────────────────────────────────────────────────────────────────

export async function obtenerPreOrden(distribuidorId: string) {
  const token = await tokenCliente();
  return conSesion(() => core.obtenerPreOrden(distribuidorId, token));
}

// ── Órdenes de compra — cliente ───────────────────────────────────────────────

export async function crearOrden(data: core.DatosCrearOrden) {
  const token = await tokenCliente();
  return conSesion(() => core.crearOrden(data, token));
}

export async function pagarOrden(ordenId: string) {
  const token = await tokenCliente();
  return conSesion(() => core.pagarOrden(ordenId, token));
}

/** Devuelve el listado paginado (`{ …metadata, ordenes }`), no la lista suelta. */
export async function obtenerMisOrdenes(filtros: FiltrosOrdenes = {}) {
  const token = await tokenCliente();
  return conSesion(() => core.obtenerMisOrdenes(filtros, token));
}

/**
 * El archivo de la exportación contable, en base64.
 *
 * Es una Server Action porque el token es una cookie httpOnly: la llamada sale
 * del servidor. Quien lo convierte en descarga es `@akindo/ui/descargar` en el
 * navegador.
 */
export async function exportarOrdenes(formato: "xlsx" | "pdf" | "csv", filtros: FiltrosOrdenes = {}) {
  if (formato !== "xlsx") throw new Error("Por ahora solo se puede exportar a Excel");
  const token = await tokenCliente();
  return conSesion(() => core.exportarOrdenes(filtros, token));
}

export async function cancelarOrden(ordenId: string) {
  const token = await tokenCliente();
  return conSesion(() => core.cancelarOrden(ordenId, token));
}

export async function obtenerDetalleOrden(ordenId: string) {
  const { token } = await sesionRequerida();
  return conSesion(() => core.obtenerDetalleOrden(ordenId, token));
}

// ── Entregas ──────────────────────────────────────────────────────────────────

/**
 * La información de entrega de varios pedidos (fecha aproximada,
 * transportista y evidencias), indexada por id.
 *
 * `sesionRequerida()` sin tipo: el endpoint sirve igual al cliente y al
 * distribuidor, y él mismo comprueba que el pedido sea del usuario.
 */
export async function obtenerEntregas(pedidoIds: string[]) {
  const { token } = await sesionRequerida();
  return conSesion(() => coreEntregas.obtenerEntregas(pedidoIds, token));
}

/** Las entregas por día de la gráfica de cumplimiento. */
export async function obtenerEntregasPorDia(hasta: string | null = null, dias = 7) {
  const { token } = await sesionRequerida();
  return conSesion(() => coreEntregas.obtenerEntregasPorDia(dias, hasta, token));
}

// ── Pedidos — cliente ─────────────────────────────────────────────────────────

/** Devuelve el listado paginado (`{ …metadata, pedidos }`), no la lista suelta. */
export async function obtenerMisPedidos(filtros: FiltrosPedidos = {}) {
  const token = await tokenCliente();
  return conSesion(() => core.obtenerMisPedidos(filtros, token));
}

/** Cuántos pedidos hay en cada estado, con los filtros vigentes. */
export async function obtenerResumenPedidos(filtros: FiltrosPedidos = {}) {
  const token = await tokenCliente();
  return conSesion(() => core.obtenerResumenPedidos(filtros, token));
}

/**
 * El manifiesto de pedidos, en base64. Server Action por lo mismo que la
 * exportación de órdenes: el token es una cookie httpOnly.
 */
export async function exportarPedidos(formato: "xlsx" | "pdf" | "csv", filtros: FiltrosPedidos = {}) {
  if (formato !== "xlsx") throw new Error("Por ahora solo se puede exportar a Excel");
  const token = await tokenCliente();
  return conSesion(() => core.exportarPedidos(filtros, token));
}

export async function obtenerDetallePedido(pedidoId: string) {
  const { token, tipo } = await sesionRequerida();
  return conSesion(() => core.obtenerDetallePedido(pedidoId, tipo === "distribuidor", token));
}

export async function crearValoracion(
  pedidoId: string,
  puntuacion: number,
  comentario?: string
) {
  const token = await tokenCliente();
  return conSesion(() => core.crearValoracion(pedidoId, puntuacion, comentario, token));
}

// ── Órdenes de compra — distribuidor ─────────────────────────────────────────

/** Devuelve el listado paginado (`{ …metadata, ordenes }`), no la lista suelta. */
export async function obtenerOrdenesDistribuidor(filtros: FiltrosOrdenes = {}) {
  const token = await tokenDistribuidor();
  return conSesion(() => core.obtenerOrdenesDistribuidor(filtros, token));
}

/** Cuántas órdenes hay en cada estado, más cuántas se pueden surtir. */
export async function obtenerResumenOrdenesDistribuidor(filtros: FiltrosOrdenes = {}) {
  const token = await tokenDistribuidor();
  return conSesion(() => core.obtenerResumenOrdenesDistribuidor(filtros, token));
}

export async function aceptarOrden(ordenId: string) {
  const token = await tokenDistribuidor();
  return conSesion(() => core.aceptarOrden(ordenId, token));
}

export async function rechazarOrden(ordenId: string, motivo_rechazo?: string) {
  const token = await tokenDistribuidor();
  return conSesion(() => core.rechazarOrden(ordenId, motivo_rechazo, token));
}

// ── Pedidos — distribuidor ────────────────────────────────────────────────────

/** Devuelve el listado paginado (`{ …metadata, pedidos }`), no la lista suelta. */
export async function obtenerPedidosDistribuidor(filtros: FiltrosPedidos = {}) {
  const token = await tokenDistribuidor();
  return conSesion(() => core.obtenerPedidosDistribuidor(filtros, token));
}

/**
 * El reporte de pedidos del distribuidor, en base64. Server Action por lo
 * mismo que el manifiesto del cliente: el token es una cookie httpOnly.
 */
export async function exportarPedidosDistribuidor(formato: "xlsx" | "pdf" | "csv", filtros: FiltrosPedidos = {}) {
  if (formato !== "xlsx") throw new Error("Por ahora solo se puede exportar a Excel");
  const token = await tokenDistribuidor();
  return conSesion(() => core.exportarPedidosDistribuidor(filtros, token));
}

/** Cuántos pedidos del distribuidor hay en cada estado. */
export async function obtenerResumenPedidosDistribuidor(filtros: FiltrosPedidos = {}) {
  const token = await tokenDistribuidor();
  return conSesion(() => core.obtenerResumenPedidosDistribuidor(filtros, token));
}

export async function enviarActualizacionPedido(
  pedidoId: string,
  estado: EstadoPedido,
  descripcion?: string
) {
  const token = await tokenDistribuidor();
  return conSesion(() => core.enviarActualizacionPedido(pedidoId, estado, descripcion, token));
}

export async function obtenerValoracionesDistribuidor() {
  const token = await tokenDistribuidor();
  return conSesion(() => core.obtenerValoracionesDistribuidor(token));
}
