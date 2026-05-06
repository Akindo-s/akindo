"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchWithAuth } from "./fetch";
import type {
  PreOrdenResponse,
  OrdenPedidoResponse,
  OrdenPedidoListItem,
  PedidoResponse,
  PedidoListItem,
  PedidoActionResult,
  EstadoPedido,
  ValoracionResponse,
} from "@/lib/types/pedidos";

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function getAuthToken(): Promise<{ token: string; tipo: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const tipo = cookieStore.get("tipo_usuario")?.value;
  if (!token || !tipo) redirect("/login");
  return { token, tipo };
}

async function getClienteToken(): Promise<string> {
  const { token, tipo } = await getAuthToken();
  if (tipo !== "cliente") redirect("/login");
  return token;
}

async function getDistribuidorToken(): Promise<string> {
  const { token, tipo } = await getAuthToken();
  if (tipo !== "distribuidor") redirect("/login");
  return token;
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
  distribuidorId: string
): Promise<PreOrdenResponse | null> {
  try {
    const token = await getClienteToken();
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

export async function crearOrden(data: {
  distribuidor_id: string;
  direccion_id: string;
  paquetes: { producto_id: string; cantidad: number }[];
  pre_autorizado: boolean;
}): Promise<PedidoActionResult<OrdenPedidoResponse>> {
  try {
    const token = await getClienteToken();
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
  ordenId: string
): Promise<PedidoActionResult<OrdenPedidoResponse>> {
  try {
    const token = await getClienteToken();
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

export async function obtenerMisOrdenes(
  estado?: string
): Promise<OrdenPedidoListItem[]> {
  try {
    const token = await getClienteToken();
    const params = estado ? `?estado=${estado}` : "";
    const res = await fetchWithAuth(`/pedidos/mis-ordenes${params}`, { method: "GET" }, token);
    if (!res.ok) return [];
    return await res.json() as OrdenPedidoListItem[];
  } catch {
    return [];
  }
}

export async function cancelarOrden(
  ordenId: string
): Promise<PedidoActionResult<OrdenPedidoResponse>> {
  try {
    const token = await getClienteToken();
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
  ordenId: string
): Promise<OrdenPedidoResponse | null> {
  try {
    const { token } = await getAuthToken();
    const res = await fetchWithAuth(`/pedidos/ordenes/${ordenId}`, { method: "GET" }, token);
    if (!res.ok) return null;
    return await res.json() as OrdenPedidoResponse;
  } catch {
    return null;
  }
}

// ── Pedidos — cliente ─────────────────────────────────────────────────────────

export async function obtenerMisPedidos(
  estado?: EstadoPedido
): Promise<PedidoListItem[]> {
  try {
    const token = await getClienteToken();
    const params = estado ? `?estado=${encodeURIComponent(estado)}` : "";
    const res = await fetchWithAuth(`/pedidos/${params}`, { method: "GET" }, token);
    if (!res.ok) return [];
    return await res.json() as PedidoListItem[];
  } catch {
    return [];
  }
}

export async function obtenerDetallePedido(
  pedidoId: string
): Promise<PedidoResponse | null> {
  try {
    const { token, tipo } = await getAuthToken();
    const endpoint = tipo === "distribuidor" 
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
  comentario?: string
): Promise<PedidoActionResult> {
  try {
    const token = await getClienteToken();
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
  estado?: string
): Promise<OrdenPedidoListItem[]> {
  try {
    const token = await getDistribuidorToken();
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
  ordenId: string
): Promise<PedidoActionResult<OrdenPedidoResponse>> {
  try {
    const token = await getDistribuidorToken();
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
  motivo_rechazo?: string
): Promise<PedidoActionResult<OrdenPedidoResponse>> {
  try {
    const token = await getDistribuidorToken();
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
  estado?: EstadoPedido
): Promise<PedidoListItem[]> {
  try {
    const token = await getDistribuidorToken();
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
  descripcion?: string
): Promise<PedidoActionResult<PedidoResponse>> {
  try {
    const token = await getDistribuidorToken();
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

export async function obtenerValoracionesDistribuidor(): Promise<ValoracionResponse[]> {
  try {
    const token = await getDistribuidorToken();
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
