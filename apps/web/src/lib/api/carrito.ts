"use server";

import * as core from "@akindo/shared/api/carrito";
import { conSesion, sesionOpcional, sesionRequerida } from "@/lib/sesion";

async function tokenCarrito(): Promise<string> {
  // El carrito lo puede consultar cualquier usuario autenticado
  return (await sesionRequerida()).token;
}

export async function fetchCarritosRaw() {
  const token = await tokenCarrito();
  return conSesion(() => core.fetchCarritosRaw(token));
}

export async function obtenerIdsCarrito(): Promise<string[]> {
  const token = await tokenCarrito();
  return conSesion(() => core.obtenerIdsCarrito(token));
}

export async function obtenerCarritoCliente() {
  const token = await tokenCarrito();
  return conSesion(() => core.obtenerCarritoCliente(token));
}

export async function verificarProductoEnCarrito(productoId: string): Promise<boolean> {
  const { token, tipo } = await sesionOpcional();
  if (!token || tipo !== "cliente") return false;
  return core.verificarProductoEnCarrito(productoId, token);
}

export async function actualizarCantidadCarrito(
  distribuidorId: string,
  productoId: string,
  cantidad: number
) {
  const token = await tokenCarrito();
  return conSesion(() =>
    core.actualizarCantidadCarrito(distribuidorId, productoId, cantidad, token)
  );
}

export async function agregarProductoCarrito(
  distribuidorId: string,
  productoId: string,
  cantidad = 1
) {
  const token = await tokenCarrito();
  return conSesion(() =>
    core.agregarProductoCarrito(distribuidorId, productoId, cantidad, token)
  );
}

export async function eliminarItemCarrito(distribuidorId: string, productoId: string) {
  const token = await tokenCarrito();
  return conSesion(() => core.eliminarItemCarrito(distribuidorId, productoId, token));
}

export async function vaciarCarritosCliente() {
  const token = await tokenCarrito();
  return conSesion(() => core.vaciarCarritosCliente(token));
}
