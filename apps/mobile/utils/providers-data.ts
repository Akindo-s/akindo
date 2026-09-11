import {
  obtenerCategoriasDestacadas,
  obtenerCategoriasDistribuidores,
  obtenerCategoriasProductos,
} from "@akindo/shared/api/categorias";
import { agregarProductoCarrito, obtenerIdsCarrito, verificarProductoEnCarrito } from "@akindo/shared/api/carrito";
import { listarProductosCatalogo, obtenerProductoPublico } from "@akindo/shared/api/productos";
import { MENSAJE_CARRITO_SIN_SESION, type AddToCartInput, type AddToCartResult } from "@akindo/shared/client/carrito";
import { emitir } from "@akindo/shared/eventos";
import { actualizarImagenNegocio as subirImagenNegocio } from "@akindo/shared/api/distribuidor";
import {
  actualizarImagenPerfil as subirImagenPerfil,
  actualizarPerfilDistribuidor as guardarPerfilDistribuidor,
  esDistribuidorDueno as esDueno,
} from "@akindo/shared/api/usuario";
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

/** Espejo de `verificarProductoEnCarrito` de web: solo los clientes tienen carrito. */
export async function verificarEnCarrito(productoId: string): Promise<boolean> {
  const { token, tipo } = await sesionActual();
  if (!token || tipo !== "cliente") return false;
  return verificarProductoEnCarrito(productoId, token);
}

/** Primeros productos del catálogo global (el "sustituto temporal" de las recomendaciones de web). */
export async function cargarRecomendaciones() {
  return (await listarProductosCatalogo(1, 8)).productos;
}

/**
 * Espejo de lo que en web hacen juntos `agregarProductoCliente` y la route
 * handler `POST /api/carrito`: sin sesión avisa, busca el distribuidor del
 * producto si no viene, lo agrega y emite `carrito:updated`.
 */
export async function agregarAlCarrito({ productoId, distribuidorId, cantidad = 1 }: AddToCartInput): Promise<AddToCartResult> {
  const { token } = await sesionActual();
  if (!token) return { ok: false, error: MENSAJE_CARRITO_SIN_SESION };

  const idDistribuidor = distribuidorId ?? (await obtenerProductoPublico(productoId))?.distribuidor_id;
  if (!idDistribuidor) return { ok: false, error: "No se encontro el distribuidor para el producto" };

  const resultado = await agregarProductoCarrito(idDistribuidor, productoId, cantidad, token);
  if (!resultado.ok) return { ok: false, error: resultado.error ?? "No se pudo agregar al carrito" };

  emitir("carrito:updated");
  return { ok: true, message: resultado.message ?? "Producto agregado al carrito" };
}

// ─── Tienda del distribuidor ─────────────────────────────────────────────────
// Espejo de las server actions de `apps/web/src/lib/api/{distribuidor,usuario}.ts`.

/** Si el usuario actual es el dueño del perfil, sin redirigir si no hay sesión. */
export async function esDistribuidorDueno(distribuidorId: string): Promise<boolean> {
  const { token, tipo } = await sesionActual();
  return esDueno(distribuidorId, token, tipo);
}

export async function actualizarImagenNegocio(distribuidorId: string, archivo: Blob): Promise<boolean> {
  const { token } = await sesionActual();
  return subirImagenNegocio(distribuidorId, archivo, token);
}

export async function actualizarImagenPerfil(archivo: Blob): Promise<boolean> {
  const { token } = await sesionActual();
  return subirImagenPerfil(archivo, token);
}

export async function actualizarPerfilDistribuidor(
  distribuidorId: string,
  datos: { descripcion?: string },
): Promise<boolean> {
  const { token } = await sesionActual();
  return guardarPerfilDistribuidor(distribuidorId, datos, token);
}
