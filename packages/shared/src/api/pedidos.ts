import { fetchWithAuth } from "./fetch";
import type {
  PreOrdenResponse,
  OrdenPedidoResponse,
  OrdenPedidoListItem,
  ListadoOrdenes,
  FiltrosOrdenes,
  PedidoResponse,
  PedidoListItem,
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

export async function obtenerMisPedidos(
  estado?: EstadoPedido,
  token?: string
): Promise<PedidoListItem[]> {
  try {
    const params = estado ? `?estado=${encodeURIComponent(estado)}` : "";
    const res = await fetchWithAuth(`/pedidos/${params}`, { method: "GET" }, token);
    if (!res.ok) return [];
    return await res.json() as PedidoListItem[];
  } catch {
    return [];
  }
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

export async function obtenerOrdenesDistribuidor(
  estado?: string,
  token?: string
): Promise<OrdenPedidoListItem[]> {
  try {
    const params = estado ? `?estado=${estado}` : "";
    const res = await fetchWithAuth(
      `/pedidos/distribuidor/ordenes${params}`,
      { method: "GET" },
      token
    );
    if (!res.ok) return [];
    return await res.json() as OrdenPedidoListItem[];
  } catch {
    return [];
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

export async function obtenerPedidosDistribuidor(
  estado?: EstadoPedido,
  token?: string
): Promise<PedidoListItem[]> {
  try {
    const params = estado ? `?estado=${encodeURIComponent(estado)}` : "";
    const res = await fetchWithAuth(
      `/pedidos/distribuidor/pedidos${params}`,
      { method: "GET" },
      token
    );
    if (!res.ok) return [];
    return await res.json() as PedidoListItem[];
  } catch {
    return [];
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
