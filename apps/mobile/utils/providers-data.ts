import {
  obtenerCategoriasDestacadas,
  obtenerCategoriasDistribuidores,
  obtenerCategoriasProductos,
} from "@akindo/shared/api/categorias";
import {
  actualizarCantidadCarrito,
  agregarProductoCarrito,
  eliminarItemCarrito,
  obtenerCarritoCliente,
  obtenerIdsCarrito,
  vaciarCarritosCliente,
  verificarProductoEnCarrito,
} from "@akindo/shared/api/carrito";
import { listarProductosCatalogo, obtenerProductoPublico } from "@akindo/shared/api/productos";
import {
  cancelarOrden,
  crearValoracion,
  enviarActualizacionPedido,
  obtenerDetallePedido,
  obtenerMisOrdenes,
  obtenerMisPedidos,
  obtenerPedidosDistribuidor,
} from "@akindo/shared/api/pedidos";
import type { EstadoPedido } from "@akindo/shared/types/pedidos";
import { MENSAJE_CARRITO_SIN_SESION, type AddToCartInput, type AddToCartResult } from "@akindo/shared/client/carrito";
import { emitir } from "@akindo/shared/eventos";
import { actualizarImagenNegocio as subirImagenNegocio } from "@akindo/shared/api/distribuidor";
import {
  actualizarDireccion,
  actualizarImagenPerfil as subirImagenPerfil,
  actualizarPerfilCliente,
  actualizarPerfilDistribuidor as guardarPerfilDistribuidor,
  crearDireccion,
  eliminarDireccion,
  esDistribuidorDueno as esDueno,
  obtenerInformacionPerfil,
  obtenerMisDirecciones,
  obtenerPerfilDistribuidor,
  type DatosDireccion,
  type DatosDireccionParcial,
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

// ─── Carrito (grupo `(protected)`) ───────────────────────────────────────────
// Espejo de las server actions de `apps/web/src/lib/api/carrito.ts`.

export async function cargarCarrito() {
  const { token } = await sesionActual();
  return obtenerCarritoCliente(token);
}

export async function actualizarCantidad(distribuidorId: string, productoId: string, cantidad: number) {
  const { token } = await sesionActual();
  return actualizarCantidadCarrito(distribuidorId, productoId, cantidad, token);
}

export async function eliminarItem(distribuidorId: string, productoId: string) {
  const { token } = await sesionActual();
  return eliminarItemCarrito(distribuidorId, productoId, token);
}

export async function vaciarCarritos() {
  const { token } = await sesionActual();
  return vaciarCarritosCliente(token);
}

// ─── Perfil ──────────────────────────────────────────────────────────────────
// Espejo de las server actions de `apps/web/src/lib/api/usuario.ts`.

export async function cargarPerfilCliente() {
  const { token } = await sesionActual();
  return obtenerInformacionPerfil(token);
}

export async function cargarPerfilDistribuidor() {
  const { token } = await sesionActual();
  return obtenerPerfilDistribuidor(token);
}

export async function guardarPerfilCliente(datos: { nombre?: string; telefono?: string; email?: string }) {
  const { token } = await sesionActual();
  return actualizarPerfilCliente(datos, token);
}

export async function cargarDirecciones() {
  const { token } = await sesionActual();
  return obtenerMisDirecciones(token);
}

export async function agregarDireccion(datos: DatosDireccion) {
  const { token } = await sesionActual();
  return crearDireccion(datos, token);
}

export async function guardarDireccion(id: string, datos: DatosDireccionParcial) {
  const { token } = await sesionActual();
  return actualizarDireccion(id, datos, token);
}

export async function quitarDireccion(id: string) {
  const { token } = await sesionActual();
  return eliminarDireccion(id, token);
}

// ─── Pedidos ─────────────────────────────────────────────────────────────────
// Espejo de `apps/web/src/lib/api/pedidos.ts` y de lo que arma el `page.tsx`
// de web antes de pintar la pantalla.

export async function cargarPedidos() {
  const { token } = await sesionActual();
  const [activosEnEnvio, pendientes, entregados, cancelados, ordenes] = await Promise.all([
    obtenerMisPedidos("en envio", token),
    obtenerMisPedidos("pendiente de envio", token),
    obtenerMisPedidos("entregado", token),
    obtenerMisPedidos("cancelado", token),
    obtenerMisOrdenes(undefined, token),
  ]);
  return { activos: [...pendientes, ...activosEnEnvio], entregados, cancelados, ordenes };
}

/** Las órdenes de compra del cliente, para `/pedidos/ordenes`. */
export async function cargarOrdenes() {
  const { token } = await sesionActual();
  return obtenerMisOrdenes(undefined, token);
}

export async function cancelarOrdenCompra(ordenId: string) {
  const { token } = await sesionActual();
  return cancelarOrden(ordenId, token);
}

/** El detalle de un pedido, para `/pedidos/<id>`. */
export async function cargarDetallePedido(pedidoId: string) {
  const { token, tipo } = await sesionActual();
  return obtenerDetallePedido(pedidoId, tipo === "distribuidor", token);
}

export async function valorarPedido(pedidoId: string, puntuacion: number, comentario?: string) {
  const { token } = await sesionActual();
  return crearValoracion(pedidoId, puntuacion, comentario, token);
}

// ─── Pedidos del distribuidor ────────────────────────────────────────────────

export async function cargarPedidosDistribuidor() {
  const { token } = await sesionActual();
  const [pendientes, enEnvio, entregados, cancelados] = await Promise.all([
    obtenerPedidosDistribuidor("pendiente de envio", token),
    obtenerPedidosDistribuidor("en envio", token),
    obtenerPedidosDistribuidor("entregado", token),
    obtenerPedidosDistribuidor("cancelado", token),
  ]);
  return { activos: [...pendientes, ...enEnvio], historial: [...entregados, ...cancelados] };
}

export async function actualizarEstadoPedido(pedidoId: string, estado: EstadoPedido, descripcion?: string) {
  const { token } = await sesionActual();
  return enviarActualizacionPedido(pedidoId, estado, descripcion, token);
}
