import { fetchWithAuth } from "./fetch";
import type {
  PreOrdenResponse,
  OrdenPedidoResponse,
  OrdenPedidoListItem,
  ListadoOrdenes,
  ResumenOrdenes,
  FiltrosOrdenes,
  PedidoResponse,
  PedidoListItem,
  ListadoPedidos,
  FiltrosPedidos,
  ResumenPedidos,
  PedidoActionResult,
  EstadoPedido,
  ValoracionResponse,
} from "../types/pedidos";

export interface DatosCrearOrden {
  distribuidor_id: string;
  direccion_id: string;
  paquetes: { producto_id: string; cantidad: number }[];
  pre_autorizado: boolean;
}

async function parseError(res: Response): Promise<{ error: string; status: number }> {
  try {
    const body = await res.json() as { detail?: string };
    return { error: body.detail ?? "Error desconocido", status: res.status };
  } catch {
    return { error: "Error de red", status: res.status };
  }
}

// ── Pre-orden ─────────────────────────────────────────────────────────────────

export async function obtenerPreOrden(
  distribuidorId: string,
  token?: string
): Promise<PreOrdenResponse | null> {
  try {
    const res = await fetchWithAuth(
      `/pedidos/preorden?distribuidor_id=${distribuidorId}`,
      { method: "GET" },
      token
    );
    if (!res.ok) return null;
    return await res.json() as PreOrdenResponse;
  } catch {
    return null;
  }
}

// ── Órdenes de compra — cliente ───────────────────────────────────────────────

export async function crearOrden(
  data: DatosCrearOrden,
  token?: string
): Promise<PedidoActionResult<OrdenPedidoResponse>> {
  try {
    const res = await fetchWithAuth(
      "/pedidos/ordenes",
      { method: "POST", body: JSON.stringify(data) },
      token
    );
    if (!res.ok) return { ok: false, ...(await parseError(res)) };
    return { ok: true, data: await res.json() as OrdenPedidoResponse };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al crear la orden" };
  }
}

export async function pagarOrden(
  ordenId: string,
  token?: string
): Promise<PedidoActionResult<OrdenPedidoResponse>> {
  try {
    const res = await fetchWithAuth(
      `/pedidos/ordenes/${ordenId}/pagar`,
      { method: "POST" },
      token
    );
    if (!res.ok) return { ok: false, ...(await parseError(res)) };
    return { ok: true, data: await res.json() as OrdenPedidoResponse };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al pagar" };
  }
}

const LISTADO_ORDENES_VACIO: ListadoOrdenes = {
  total_ordenes: 0,
  total_paginas: 0,
  pagina_actual: 1,
  tiene_siguiente: false,
  tiene_anterior: false,
  siguiente_url: null,
  anterior_url: null,
  ordenes: [],
};

/** Los filtros, tal como los espera el endpoint. */
function paramsOrdenes(filtros: FiltrosOrdenes, conPaginacion: boolean): URLSearchParams {
  const params = new URLSearchParams();
  if (conPaginacion) {
    params.set("numero_pagina", String(filtros.pagina ?? 1));
    params.set("cantidad_pagina", String(filtros.cantidad ?? 10));
  }
  if (filtros.estado) params.set("estado", filtros.estado);
  if (filtros.q?.trim()) params.set("q", filtros.q.trim());
  if (filtros.distribuidorId) params.set("distribuidor_id", filtros.distribuidorId);
  if (filtros.clienteId) params.set("cliente_id", filtros.clienteId);
  if (filtros.fechaDesde) params.set("fecha_desde", filtros.fechaDesde);
  if (filtros.fechaHasta) params.set("fecha_hasta", filtros.fechaHasta);
  if (filtros.montoMin != null) params.set("monto_min", String(filtros.montoMin));
  if (filtros.montoMax != null) params.set("monto_max", String(filtros.montoMax));
  if (filtros.orden) params.set("orden", filtros.orden);
  return params;
}

/**
 * Página de órdenes del cliente. El endpoint devuelve el objeto con la
 * metadata de paginación, no la lista suelta: quien solo quiera las órdenes
 * usa `.ordenes`.
 */
export async function obtenerMisOrdenes(
  filtros: FiltrosOrdenes = {},
  token?: string
): Promise<ListadoOrdenes> {
  try {
    const params = paramsOrdenes(filtros, true);
    const res = await fetchWithAuth(`/pedidos/mis-ordenes?${params.toString()}`, { method: "GET" }, token);
    if (!res.ok) return LISTADO_ORDENES_VACIO;
    const datos = await res.json() as Partial<ListadoOrdenes>;
    return { ...LISTADO_ORDENES_VACIO, ...datos, ordenes: datos.ordenes ?? [] };
  } catch {
    return LISTADO_ORDENES_VACIO;
  }
}

/** Un archivo ya generado por la API, listo para guardarse o compartirse. */
export interface ArchivoExportado {
  nombre: string;
  /**
   * El contenido en base64.
   *
   * No es un `Blob` porque en web esto viaja por una Server Action (el token es
   * una cookie httpOnly, así que la llamada sale del servidor) y por ahí solo
   * pasan valores serializables. Quien lo convierte en archivo es
   * `@akindo/ui/descargar`, que tiene una versión por plataforma.
   */
  base64: string;
  tipo: string;
}

const ALFABETO_B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Base64 sin depender de `Buffer` (Node) ni de `btoa` (navegador). */
function aBase64(bytes: Uint8Array): string {
  let salida = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    salida += ALFABETO_B64[a >> 2];
    salida += ALFABETO_B64[((a & 3) << 4) | ((b ?? 0) >> 4)];
    salida += b === undefined ? "=" : ALFABETO_B64[((b & 15) << 2) | ((c ?? 0) >> 6)];
    salida += c === undefined ? "=" : ALFABETO_B64[c & 63];
  }
  return salida;
}

const TIPO_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Pide el libro de Excel de las órdenes con los mismos filtros del listado.
 *
 * Devuelve el contenido y no una URL porque el endpoint pide `Authorization`:
 * un `<a href>` o un `Linking.openURL` no llevarían el token.
 */
export async function exportarOrdenes(
  filtros: FiltrosOrdenes = {},
  token?: string
): Promise<ArchivoExportado> {
  const params = paramsOrdenes(filtros, false);
  const res = await fetchWithAuth(`/pedidos/mis-ordenes/exportar?${params.toString()}`, { method: "GET" }, token);
  if (!res.ok) throw new Error("No se pudo generar la exportación");

  // El nombre lo manda el servidor en el Content-Disposition; si el header no
  // viaja (CORS), se arma uno con la fecha.
  const disposicion = res.headers.get("Content-Disposition") ?? "";
  const nombre = /filename="?([^";]+)"?/.exec(disposicion)?.[1]
    ?? `ordenes-de-compra-${new Date().toISOString().slice(0, 10)}.xlsx`;

  const bytes = new Uint8Array(await res.arrayBuffer());
  return { nombre, base64: aBase64(bytes), tipo: res.headers.get("Content-Type") ?? TIPO_XLSX };
}

export async function cancelarOrden(
  ordenId: string,
  token?: string
): Promise<PedidoActionResult<OrdenPedidoResponse>> {
  try {
    const res = await fetchWithAuth(
      `/pedidos/ordenes/${ordenId}/cancelar`,
      { method: "PATCH" },
      token
    );
    if (!res.ok) return { ok: false, ...(await parseError(res)) };
    return { ok: true, data: await res.json() as OrdenPedidoResponse };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al cancelar la orden" };
  }
}

export async function obtenerDetalleOrden(
  ordenId: string,
  token?: string
): Promise<OrdenPedidoResponse | null> {
  try {
    const res = await fetchWithAuth(`/pedidos/ordenes/${ordenId}`, { method: "GET" }, token);
    if (!res.ok) return null;
    return await res.json() as OrdenPedidoResponse;
  } catch {
    return null;
  }
}

// ── Pedidos — cliente ─────────────────────────────────────────────────────────

const LISTADO_PEDIDOS_VACIO: ListadoPedidos = {
  total_pedidos: 0,
  total_paginas: 0,
  pagina_actual: 1,
  tiene_siguiente: false,
  tiene_anterior: false,
  siguiente_url: null,
  anterior_url: null,
  pedidos: [],
};

/** Los filtros de pedidos, tal como los espera el endpoint. */
function paramsPedidos(filtros: FiltrosPedidos, conPaginacion: boolean): URLSearchParams {
  const params = new URLSearchParams();
  if (conPaginacion) {
    params.set("numero_pagina", String(filtros.pagina ?? 1));
    params.set("cantidad_pagina", String(filtros.cantidad ?? 10));
  }
  if (filtros.estado) params.set("estado", filtros.estado);
  if (filtros.q?.trim()) params.set("q", filtros.q.trim());
  if (filtros.distribuidorId) params.set("distribuidor_id", filtros.distribuidorId);
  // La contraparte: el endpoint del cliente ignora `cliente_id` y el del
  // distribuidor ignora `distribuidor_id`, así que mandar los dos no molesta.
  if (filtros.clienteId) params.set("cliente_id", filtros.clienteId);
  if (filtros.fechaDesde) params.set("fecha_desde", filtros.fechaDesde);
  if (filtros.fechaHasta) params.set("fecha_hasta", filtros.fechaHasta);
  if (filtros.orden) params.set("orden", filtros.orden);
  return params;
}

/**
 * Página de pedidos del cliente. Como en órdenes, el endpoint devuelve el
 * objeto con la metadata de paginación y no la lista suelta: quien solo quiera
 * los pedidos usa `.pedidos`.
 */
export async function obtenerMisPedidos(
  filtros: FiltrosPedidos = {},
  token?: string
): Promise<ListadoPedidos> {
  try {
    const params = paramsPedidos(filtros, true);
    const res = await fetchWithAuth(`/pedidos/?${params.toString()}`, { method: "GET" }, token);
    if (!res.ok) return LISTADO_PEDIDOS_VACIO;
    const datos = await res.json() as Partial<ListadoPedidos>;
    return { ...LISTADO_PEDIDOS_VACIO, ...datos, pedidos: datos.pedidos ?? [] };
  } catch {
    return LISTADO_PEDIDOS_VACIO;
  }
}

const RESUMEN_PEDIDOS_VACIO: ResumenPedidos = {
  total: 0,
  por_estado: { "pendiente de envio": 0, "en envio": 0, entregado: 0, cancelado: 0 },
};

/**
 * Cuántos pedidos hay en cada estado.
 *
 * El `estado` de los filtros se ignora a propósito —lo ignora el endpoint—
 * porque estos conteos son los de las pestañas: cada una dice cuántos hay en
 * ella sin importar cuál esté activa.
 */
export async function obtenerResumenPedidos(
  filtros: FiltrosPedidos = {},
  token?: string
): Promise<ResumenPedidos> {
  try {
    const params = paramsPedidos({ ...filtros, estado: null }, false);
    const res = await fetchWithAuth(`/pedidos/resumen?${params.toString()}`, { method: "GET" }, token);
    if (!res.ok) return RESUMEN_PEDIDOS_VACIO;
    const datos = await res.json() as Partial<ResumenPedidos>;
    return {
      total: datos.total ?? 0,
      por_estado: { ...RESUMEN_PEDIDOS_VACIO.por_estado, ...(datos.por_estado ?? {}) },
    };
  } catch {
    return RESUMEN_PEDIDOS_VACIO;
  }
}

/**
 * El manifiesto en Excel de los pedidos, con los mismos filtros del listado.
 * Igual que `exportarOrdenes`: devuelve el contenido y no una URL, porque el
 * endpoint pide `Authorization`.
 */
export async function exportarPedidos(
  filtros: FiltrosPedidos = {},
  token?: string
): Promise<ArchivoExportado> {
  const params = paramsPedidos(filtros, false);
  const res = await fetchWithAuth(`/pedidos/exportar?${params.toString()}`, { method: "GET" }, token);
  if (!res.ok) throw new Error("No se pudo generar el manifiesto");

  const disposicion = res.headers.get("Content-Disposition") ?? "";
  const nombre = /filename="?([^";]+)"?/.exec(disposicion)?.[1]
    ?? `manifiesto-de-pedidos-${new Date().toISOString().slice(0, 10)}.xlsx`;

  const bytes = new Uint8Array(await res.arrayBuffer());
  return { nombre, base64: aBase64(bytes), tipo: res.headers.get("Content-Type") ?? TIPO_XLSX };
}

/**
 * @param esDistribuidor cambia el endpoint al de distribuidor. Lo decide la app
 * a partir del tipo de usuario de la sesion.
 */
export async function obtenerDetallePedido(
  pedidoId: string,
  esDistribuidor: boolean,
  token?: string
): Promise<PedidoResponse | null> {
  try {
    const endpoint = esDistribuidor
      ? `/pedidos/distribuidor/pedidos/${pedidoId}`
      : `/pedidos/${pedidoId}`;

    const res = await fetchWithAuth(endpoint, { method: "GET" }, token);

    if (!res.ok) {
      const errorData = await parseError(res);
      console.error(`Error fetching pedido ${pedidoId}:`, errorData);
      return null;
    }

    return await res.json() as PedidoResponse;
  } catch (error) {
    console.error(`Exception in obtenerDetallePedido for ${pedidoId}:`, error);
    return null;
  }
}

export async function crearValoracion(
  pedidoId: string,
  puntuacion: number,
  comentario?: string,
  token?: string
): Promise<PedidoActionResult> {
  try {
    const res = await fetchWithAuth(
      `/pedidos/${pedidoId}/valoracion`,
      { method: "POST", body: JSON.stringify({ puntuacion, comentario }) },
      token
    );
    if (!res.ok) return { ok: false, ...(await parseError(res)) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al valorar" };
  }
}

// ── Órdenes de compra — distribuidor ─────────────────────────────────────────

/**
 * La bandeja de órdenes del distribuidor. Cada orden pendiente llega con lo
 * que hace falta para decidir sin abrirla: si el inventario alcanza
 * (`cobertura` y `existencias` por partida), si el cliente ya compró antes y a
 * dónde hay que entregar.
 */
export async function obtenerOrdenesDistribuidor(
  filtros: FiltrosOrdenes = {},
  token?: string
): Promise<ListadoOrdenes> {
  try {
    const params = paramsOrdenes(filtros, true);
    const res = await fetchWithAuth(`/pedidos/distribuidor/ordenes?${params.toString()}`, { method: "GET" }, token);
    if (!res.ok) return LISTADO_ORDENES_VACIO;
    const datos = await res.json() as Partial<ListadoOrdenes>;
    return { ...LISTADO_ORDENES_VACIO, ...datos, ordenes: datos.ordenes ?? [] };
  } catch {
    return LISTADO_ORDENES_VACIO;
  }
}

const RESUMEN_ORDENES_VACIO: ResumenOrdenes = {
  total: 0,
  por_estado: { pendiente: 0, aceptada: 0, rechazada: 0, cancelada: 0 },
  surtibles: 0,
  con_faltantes: 0,
};

/** Cuántas órdenes del distribuidor hay en cada estado. */
export async function obtenerResumenOrdenesDistribuidor(
  filtros: FiltrosOrdenes = {},
  token?: string
): Promise<ResumenOrdenes> {
  try {
    const params = paramsOrdenes({ ...filtros, estado: null }, false);
    const res = await fetchWithAuth(`/pedidos/distribuidor/ordenes/resumen?${params.toString()}`, { method: "GET" }, token);
    if (!res.ok) return RESUMEN_ORDENES_VACIO;
    const datos = await res.json() as Partial<ResumenOrdenes>;
    return {
      ...RESUMEN_ORDENES_VACIO,
      ...datos,
      por_estado: { ...RESUMEN_ORDENES_VACIO.por_estado, ...(datos.por_estado ?? {}) },
    };
  } catch {
    return RESUMEN_ORDENES_VACIO;
  }
}

export async function aceptarOrden(
  ordenId: string,
  token?: string
): Promise<PedidoActionResult<OrdenPedidoResponse>> {
  try {
    const res = await fetchWithAuth(
      `/pedidos/distribuidor/ordenes/${ordenId}/aceptar`,
      { method: "PATCH" },
      token
    );
    if (!res.ok) return { ok: false, ...(await parseError(res)) };
    return { ok: true, data: await res.json() as OrdenPedidoResponse };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al aceptar" };
  }
}

export async function rechazarOrden(
  ordenId: string,
  motivo_rechazo?: string,
  token?: string
): Promise<PedidoActionResult<OrdenPedidoResponse>> {
  try {
    const res = await fetchWithAuth(
      `/pedidos/distribuidor/ordenes/${ordenId}/rechazar`,
      { method: "PATCH", body: JSON.stringify({ motivo_rechazo }) },
      token
    );
    if (!res.ok) return { ok: false, ...(await parseError(res)) };
    return { ok: true, data: await res.json() as OrdenPedidoResponse };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al rechazar" };
  }
}

// ── Pedidos — distribuidor ────────────────────────────────────────────────────

/**
 * Página de pedidos del distribuidor. Misma forma que la del cliente: lo
 * único que cambia es de qué lado de la orden se mira.
 */
export async function obtenerPedidosDistribuidor(
  filtros: FiltrosPedidos = {},
  token?: string
): Promise<ListadoPedidos> {
  try {
    const params = paramsPedidos(filtros, true);
    const res = await fetchWithAuth(`/pedidos/distribuidor/pedidos?${params.toString()}`, { method: "GET" }, token);
    if (!res.ok) return LISTADO_PEDIDOS_VACIO;
    const datos = await res.json() as Partial<ListadoPedidos>;
    return { ...LISTADO_PEDIDOS_VACIO, ...datos, pedidos: datos.pedidos ?? [] };
  } catch {
    return LISTADO_PEDIDOS_VACIO;
  }
}

/**
 * El reporte en Excel de los pedidos del distribuidor, con los mismos filtros
 * del listado. Igual que el manifiesto del cliente: devuelve el contenido y no
 * una URL, porque el endpoint pide `Authorization`.
 */
export async function exportarPedidosDistribuidor(
  filtros: FiltrosPedidos = {},
  token?: string
): Promise<ArchivoExportado> {
  const params = paramsPedidos(filtros, false);
  const res = await fetchWithAuth(`/pedidos/distribuidor/pedidos/exportar?${params.toString()}`, { method: "GET" }, token);
  if (!res.ok) throw new Error("No se pudo generar el reporte");

  const disposicion = res.headers.get("Content-Disposition") ?? "";
  const nombre = /filename="?([^";]+)"?/.exec(disposicion)?.[1]
    ?? `reporte-de-pedidos-${new Date().toISOString().slice(0, 10)}.xlsx`;

  const bytes = new Uint8Array(await res.arrayBuffer());
  return { nombre, base64: aBase64(bytes), tipo: res.headers.get("Content-Type") ?? TIPO_XLSX };
}

/** Cuántos pedidos del distribuidor hay en cada estado. */
export async function obtenerResumenPedidosDistribuidor(
  filtros: FiltrosPedidos = {},
  token?: string
): Promise<ResumenPedidos> {
  try {
    const params = paramsPedidos({ ...filtros, estado: null }, false);
    const res = await fetchWithAuth(`/pedidos/distribuidor/pedidos/resumen?${params.toString()}`, { method: "GET" }, token);
    if (!res.ok) return RESUMEN_PEDIDOS_VACIO;
    const datos = await res.json() as Partial<ResumenPedidos>;
    return {
      total: datos.total ?? 0,
      por_estado: { ...RESUMEN_PEDIDOS_VACIO.por_estado, ...(datos.por_estado ?? {}) },
    };
  } catch {
    return RESUMEN_PEDIDOS_VACIO;
  }
}

export async function enviarActualizacionPedido(
  pedidoId: string,
  estado: EstadoPedido,
  descripcion?: string,
  token?: string
): Promise<PedidoActionResult<PedidoResponse>> {
  try {
    const res = await fetchWithAuth(
      `/pedidos/distribuidor/pedidos/${pedidoId}/estado`,
      { method: "PATCH", body: JSON.stringify({ estado, descripcion }) },
      token
    );
    if (!res.ok) return { ok: false, ...(await parseError(res)) };
    return { ok: true, data: await res.json() as PedidoResponse };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al actualizar" };
  }
}

export async function obtenerValoracionesDistribuidor(
  token?: string
): Promise<ValoracionResponse[]> {
  try {
    const res = await fetchWithAuth(
      "/pedidos/distribuidor/valoraciones",
      { method: "GET" },
      token
    );
    if (!res.ok) return [];
    return await res.json() as ValoracionResponse[];
  } catch {
    return [];
  }
}
