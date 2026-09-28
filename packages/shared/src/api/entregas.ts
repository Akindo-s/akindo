import { fetchWithAuth } from "./fetch";
import type { DiaEntregas, EntregaPedido } from "../types/entregas";

/**
 * La información de entrega de un pedido: fecha aproximada, transportista y
 * evidencias.
 *
 * El endpoint sirve igual al cliente y al distribuidor —comprueba que el
 * pedido sea del usuario que pregunta—, así que las dos pantallas usan esta
 * misma función.
 */
export async function obtenerEntregaPedido(
  pedidoId: string,
  token?: string
): Promise<EntregaPedido | null> {
  try {
    const res = await fetchWithAuth(`/entregas/pedidos/${pedidoId}`, { method: "GET" }, token);
    if (!res.ok) return null;
    return await res.json() as EntregaPedido;
  } catch {
    return null;
  }
}

/**
 * Las entregas de varios pedidos, indexadas por id.
 *
 * Son N peticiones en paralelo porque el endpoint es por pedido; con una
 * página de diez, que es lo que muestra el listado, sale barato. Si un pedido
 * falla se omite del mapa en vez de tumbar a los demás: la tarjeta se pinta
 * sin esos datos.
 */
export async function obtenerEntregas(
  pedidoIds: string[],
  token?: string
): Promise<Record<string, EntregaPedido>> {
  const entregas = await Promise.all(pedidoIds.map((id) => obtenerEntregaPedido(id, token)));
  const mapa: Record<string, EntregaPedido> = {};
  entregas.forEach((entrega) => { if (entrega) mapa[entrega.pedido_id] = entrega; });
  return mapa;
}


/**
 * Cuántas entregas hubo cada día en una ventana de `dias`, partidas entre las
 * que llegaron antes, a tiempo y tarde.
 *
 * `hasta` es el último día de la ventana (hoy si se omite). Mueve el periodo
 * sin cambiar su tamaño: es lo que usa la gráfica para paginar hacia atrás.
 *
 * El endpoint sirve igual al cliente (sus compras) que al distribuidor (sus
 * ventas).
 */
export async function obtenerEntregasPorDia(
  dias = 7,
  hasta: string | null = null,
  token?: string
): Promise<DiaEntregas[]> {
  try {
    const params = new URLSearchParams({ dias: String(dias) });
    if (hasta) params.set("hasta", hasta);
    const res = await fetchWithAuth(`/entregas/resumen?${params.toString()}`, { method: "GET" }, token);
    if (!res.ok) return [];
    return await res.json() as DiaEntregas[];
  } catch {
    return [];
  }
}
