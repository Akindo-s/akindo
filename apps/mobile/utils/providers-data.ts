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
import {
  actualizarProducto,
  archivarProducto,
  crearProducto,
  guardarBorradorProducto,
  listarProductosCatalogo,
  obtenerProducto,
  obtenerProductoPublico,
  subirImagenProducto,
  type DatosActualizarProducto,
  type DatosCrearProducto,
} from "@akindo/shared/api/productos";
import {
  aceptarOrden,
  cancelarOrden,
  crearValoracion,
  enviarActualizacionPedido,
  obtenerDetallePedido,
  obtenerMisOrdenes,
  exportarOrdenes,
  pagarOrden,
  obtenerDetalleOrden,
  obtenerMisPedidos,
  obtenerResumenPedidos,
  exportarPedidos,
  obtenerOrdenesDistribuidor,
  obtenerResumenOrdenesDistribuidor,
  obtenerPedidosDistribuidor,
  obtenerResumenPedidosDistribuidor,
  exportarPedidosDistribuidor,
  obtenerValoracionesDistribuidor,
  rechazarOrden,
  obtenerPreOrden,
  crearOrden,
  type DatosCrearOrden,
} from "@akindo/shared/api/pedidos";
import { obtenerEntregas, obtenerEntregasPorDia } from "@akindo/shared/api/entregas";
import type { EstadoPedido, FiltrosOrdenes, FiltrosPedidos } from "@akindo/shared/types/pedidos";
import type { FormatoExportacion } from "@akindo/shared/exportacion-context";
import { MENSAJE_CARRITO_SIN_SESION, type AddToCartInput, type AddToCartResult } from "@akindo/shared/client/carrito";
import { emitir } from "@akindo/shared/eventos";
import {
  actualizarImagenNegocio as subirImagenNegocio,
  obtenerPedidosActivos,
  obtenerProductosPocasExistencias,
  obtenerResumenMensual,
} from "@akindo/shared/api/distribuidor";
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

/**
 * La información de entrega de varios pedidos, indexada por id. Espejo de
 * `obtenerEntregas` de web.
 */
export async function cargarEntregasPedidos(pedidoIds: string[]) {
  const { token } = await sesionActual();
  return obtenerEntregas(pedidoIds, token);
}

/** El listado paginado de pedidos del cliente, con sus filtros. */
export async function cargarPedidos(filtros: FiltrosPedidos = {}) {
  const { token } = await sesionActual();
  return obtenerMisPedidos(filtros, token);
}

/** Las entregas por día de la gráfica de cumplimiento. */
export async function cargarEntregasPorDia(hasta: string | null = null, dias = 7) {
  const { token } = await sesionActual();
  return obtenerEntregasPorDia(dias, hasta, token);
}

/** Cuántos pedidos hay en cada estado, con los filtros vigentes. */
export async function cargarResumenPedidos(filtros: FiltrosPedidos = {}) {
  const { token } = await sesionActual();
  return obtenerResumenPedidos(filtros, token);
}

/** El manifiesto de pedidos (por ahora solo Excel). */
export async function exportarPedidosCliente(formato: FormatoExportacion, filtros: FiltrosPedidos = {}) {
  if (formato !== "xlsx") throw new Error("Por ahora solo se puede exportar a Excel");
  const { token } = await sesionActual();
  return exportarPedidos(filtros, token);
}

/** Cuántas órdenes de compra están pendientes, para la insignia del acceso. */
export async function contarOrdenesPendientes() {
  const { token } = await sesionActual();
  const listado = await obtenerMisOrdenes({ estado: "pendiente", cantidad: 1 }, token);
  return listado.total_ordenes;
}

/** El listado paginado de órdenes de compra, con sus filtros. */
export async function cargarOrdenes(filtros: FiltrosOrdenes = {}) {
  const { token } = await sesionActual();
  return obtenerMisOrdenes(filtros, token);
}

/** El archivo de la exportación contable (por ahora solo Excel). */
export async function exportarOrdenesCliente(formato: FormatoExportacion, filtros: FiltrosOrdenes = {}) {
  if (formato !== "xlsx") throw new Error("Por ahora solo se puede exportar a Excel");
  const { token } = await sesionActual();
  return exportarOrdenes(filtros, token);
}

export async function pagarOrdenCompra(ordenId: string) {
  const { token } = await sesionActual();
  return pagarOrden(ordenId, token);
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

/** El listado paginado de pedidos del distribuidor, con sus filtros. */
export async function cargarPedidosDistribuidor(filtros: FiltrosPedidos = {}) {
  const { token } = await sesionActual();
  return obtenerPedidosDistribuidor(filtros, token);
}

/** Cuántos pedidos del distribuidor hay en cada estado. */
export async function cargarResumenPedidosDistribuidor(filtros: FiltrosPedidos = {}) {
  const { token } = await sesionActual();
  return obtenerResumenPedidosDistribuidor(filtros, token);
}

/** El reporte de pedidos del distribuidor (por ahora solo Excel). */
export async function exportarPedidosDistribuidorApp(formato: FormatoExportacion, filtros: FiltrosPedidos = {}) {
  if (formato !== "xlsx") throw new Error("Por ahora solo se puede exportar a Excel");
  const { token } = await sesionActual();
  return exportarPedidosDistribuidor(filtros, token);
}

/** Cuántas órdenes de compra esperan la aprobación del distribuidor. */
export async function contarOrdenesPendientesDistribuidor() {
  const { token } = await sesionActual();
  const listado = await obtenerOrdenesDistribuidor({ estado: "pendiente", cantidad: 1 }, token);
  return listado.total_ordenes;
}

/** La bandeja paginada de órdenes del distribuidor, con sus filtros. */
export async function cargarOrdenesDistribuidor(filtros: FiltrosOrdenes = {}) {
  const { token } = await sesionActual();
  return obtenerOrdenesDistribuidor(filtros, token);
}

/** Cuántas órdenes hay en cada estado, más cuántas se pueden surtir. */
export async function cargarResumenOrdenesDistribuidor(filtros: FiltrosOrdenes = {}) {
  const { token } = await sesionActual();
  return obtenerResumenOrdenesDistribuidor(filtros, token);
}

/** Todo lo que pinta el panel de `/distribuidor`. */
/**
 * Las cuatro secciones del panel, cada una como su propia promesa: la pantalla
 * las pinta por separado con `Suspense`, así que no se esperan entre ellas.
 * Cada una trae su `catch` porque una promesa rechazada dentro de `Suspense`
 * reventaría la pantalla entera (el 498 lo atiende el manejador del layout).
 */
export function seccionesDashboardDistribuidor() {
  const token = sesionActual().then((s) => s.token);
  return {
    resumen: token.then((t) => obtenerResumenMensual(t)).catch(() => null),
    // El panel solo pinta las primeras: el listado ahora viene paginado, así
    // que se le pasa `.ordenes`.
    ordenesPendientes: token
      .then((t) => obtenerOrdenesDistribuidor({ estado: "pendiente" }, t).then((l) => l.ordenes))
      .catch(() => []),
    pedidosActivos: token.then((t) => obtenerPedidosActivos(t)).catch(() => []),
    alertas: token.then((t) => obtenerProductosPocasExistencias(t)).catch(() => []),
  };
}

export async function archivarProductoDistribuidor(productoId: string) {
  const { token } = await sesionActual();
  return archivarProducto(productoId, token);
}

/** El detalle de una orden, para `/distribuidor/ordenes/<id>`. */
export async function cargarDetalleOrden(ordenId: string) {
  const { token } = await sesionActual();
  return obtenerDetalleOrden(ordenId, token);
}

export async function aceptarOrdenCompra(ordenId: string) {
  const { token } = await sesionActual();
  return aceptarOrden(ordenId, token);
}

export async function rechazarOrdenCompra(ordenId: string, motivo?: string) {
  const { token } = await sesionActual();
  return rechazarOrden(ordenId, motivo, token);
}

export async function actualizarEstadoPedido(pedidoId: string, estado: EstadoPedido, descripcion?: string) {
  const { token } = await sesionActual();
  return enviarActualizacionPedido(pedidoId, estado, descripcion, token);
}

/** La preorden de un distribuidor del carrito, para `/carrito/preorden`. */
export async function cargarPreOrden(distribuidorId: string) {
  const { token } = await sesionActual();
  return obtenerPreOrden(distribuidorId, token);
}

export async function crearOrdenCompra(datos: DatosCrearOrden) {
  const { token } = await sesionActual();
  return crearOrden(datos, token);
}

/** Lo que pinta `/distribuidor/valoraciones`. */
export async function cargarValoracionesDistribuidor() {
  const { token } = await sesionActual();
  return obtenerValoracionesDistribuidor(token);
}

// ─── Crear / editar producto ─────────────────────────────────────────────────
// Espejo de las server actions de `apps/web/src/lib/api/productos.ts`.

/** El producto completo, para `/distribuidor/productos/<id>/editar`. */
export async function cargarProducto(productoId: string) {
  const { token } = await sesionActual();
  return obtenerProducto(productoId, token);
}

export async function crearProductoDistribuidor(datos: DatosCrearProducto) {
  const { token } = await sesionActual();
  return crearProducto(datos, false, token);
}

export async function guardarBorradorProductoDistribuidor(datos: DatosCrearProducto) {
  const { token } = await sesionActual();
  return guardarBorradorProducto(datos, token);
}

export async function actualizarProductoDistribuidor(productoId: string, datos: DatosActualizarProducto) {
  const { token } = await sesionActual();
  return actualizarProducto(productoId, datos, token);
}

export async function subirImagenProductoDistribuidor(productoId: string, archivo: Blob) {
  const { token } = await sesionActual();
  return subirImagenProducto(productoId, archivo, token);
}
