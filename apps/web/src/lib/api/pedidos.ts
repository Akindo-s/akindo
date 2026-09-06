"use server";

import * as core from "@akindo/shared/api/pedidos";
import { conSesion, sesionRequerida } from "@/lib/sesion";
import type { EstadoPedido } from "@akindo/shared/types/pedidos";

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

export async function obtenerMisOrdenes(estado?: string) {
  const token = await tokenCliente();
  return conSesion(() => core.obtenerMisOrdenes(estado, token));
}

export async function cancelarOrden(ordenId: string) {
  const token = await tokenCliente();
  return conSesion(() => core.cancelarOrden(ordenId, token));
}

export async function obtenerDetalleOrden(ordenId: string) {
  const { token } = await sesionRequerida();
  return conSesion(() => core.obtenerDetalleOrden(ordenId, token));
}

// ── Pedidos — cliente ─────────────────────────────────────────────────────────

export async function obtenerMisPedidos(estado?: EstadoPedido) {
  const token = await tokenCliente();
  return conSesion(() => core.obtenerMisPedidos(estado, token));
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

export async function obtenerOrdenesDistribuidor(estado?: string) {
  const token = await tokenDistribuidor();
  return conSesion(() => core.obtenerOrdenesDistribuidor(estado, token));
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

export async function obtenerPedidosDistribuidor(estado?: EstadoPedido) {
  const token = await tokenDistribuidor();
  return conSesion(() => core.obtenerPedidosDistribuidor(estado, token));
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
