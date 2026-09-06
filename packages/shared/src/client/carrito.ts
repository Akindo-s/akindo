import { emitir } from "../eventos";

export interface AddToCartInput {
  distribuidorId?: string;
  productoId: string;
  cantidad?: number;
}

export interface AddToCartResult {
  ok: boolean;
  message?: string;
  error?: string;
}

export interface AddToCartOptions {
  /**
   * Endpoint que recibe la peticion. Por defecto la route handler de Next
   * (`/api/carrito`). En Expo hay que pasar una URL absoluta, porque React
   * Native no resuelve rutas relativas.
   */
  endpoint?: string;
  /** Token a mandar en `Authorization`. En web lo aporta la cookie de sesion. */
  token?: string;
}

/**
 * Agrega un producto al carrito desde codigo de cliente (componente React).
 */
export async function agregarProductoCliente(
  input: AddToCartInput,
  opciones: AddToCartOptions = {}
): Promise<AddToCartResult> {
  const { endpoint = "/api/carrito", token } = opciones;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      distribuidor_id: input.distribuidorId,
      producto_id: input.productoId,
      cantidad: input.cantidad ?? 1,
    }),
  });

  const body = (await res.json()) as { ok?: boolean; message?: string; error?: string; detail?: string };
  if (!res.ok || !body.ok) {
    return { ok: false, error: body.error ?? body.detail ?? "No se pudo agregar al carrito" };
  }

  emitir("carrito:updated");

  return { ok: true, message: body.message ?? "Producto agregado al carrito" };
}
