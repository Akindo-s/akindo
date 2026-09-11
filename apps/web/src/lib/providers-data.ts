"use server";

import { obtenerCategoriasProductos, obtenerCategoriasDistribuidores } from "@/lib/api/categorias";
import { obtenerIdsCarrito } from "@/lib/api/carrito";
import { sesionOpcional } from "@/lib/sesion";
import { estadoLayoutPublico } from "@akindo/shared/layoutsBehaviors/public";

/**
 * Loaders que los providers compartidos (`@akindo/shared/*-context`) reciben por
 * prop. Los contexts ya no importan la capa de datos: cada plataforma inyecta la
 * suya. En web son server actions que leen la cookie de sesion; en Expo seran
 * llamadas directas a la API con el token de SecureStore.
 */

export async function cargarCategorias() {
  const [productos, distribuidores] = await Promise.all([
    obtenerCategoriasProductos(),
    obtenerCategoriasDistribuidores(),
  ]);
  return { productos, distribuidores };
}

export async function cargarIdsCarrito(): Promise<string[]> {
  // Sin esto `obtenerIdsCarrito` redirigia a /login y el home no se podia ver sin sesion.
  if (!estadoLayoutPublico(await sesionOpcional()).tieneCarrito) return [];
  return obtenerIdsCarrito();
}
