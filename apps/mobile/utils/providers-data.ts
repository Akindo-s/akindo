import {
  obtenerCategoriasDestacadas,
  obtenerCategoriasDistribuidores,
  obtenerCategoriasProductos,
} from "@akindo/shared/api/categorias";
import { obtenerIdsCarrito } from "@akindo/shared/api/carrito";
import { estadoLayoutPublico } from "@akindo/shared/layoutsBehaviors/public";
import { sesionActual } from "./session";

/**
 * Loaders que reciben los providers y pantallas compartidas. Espejo de
 * `apps/web/src/lib/providers-data.ts`: allá son server actions que leen la
 * cookie; acá llaman al núcleo con el token de AsyncStorage.
 */

export async function cargarCategorias() {
  const { token } = await sesionActual();
  const [productos, distribuidores] = await Promise.all([
    obtenerCategoriasProductos(token),
    obtenerCategoriasDistribuidores(token),
  ]);
  return { productos, distribuidores };
}

export async function cargarIdsCarrito(): Promise<string[]> {
  const sesion = await sesionActual();
  if (!estadoLayoutPublico(sesion).tieneCarrito) return [];
  return obtenerIdsCarrito(sesion.token);
}

export async function cargarDestacadas() {
  const { token } = await sesionActual();
  return obtenerCategoriasDestacadas(token);
}
