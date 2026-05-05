"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchWithAuth } from "./fetch";
import { obtenerProductoPublico } from "./productos";
import { obtenerDistribuidor } from "./distribuidor";
import {
  CarritoActionResult,
  CarritoUiGrupo,
  CarritoUiData,
  CarritoUiItem,
  NivelPrecio,
} from "@/lib/types/carrito";

type ApiErrorBody = { detail?: string; code?: string };

interface RawCarritoItem {
  id?: string;
  producto_id?: string;
  cantidad?: number;
  cantidad_minima?: number;
}

interface RawCarrito {
  id?: string;
  distribuidor_id?: string;
  items?: RawCarritoItem[];
}

interface ProductoDetalle {
  nombre: string;
  costo: number;
  imagen: string | null;
  unidad: string;
  nivelesPrecio?: NivelPrecio[];
}

/**
 * Calcula el precio unitario basado en los niveles de precio (tiers).
 * Lógica: "si el cliente pide menos que esta cantidad le cobro esto".
 */
function calcularPrecioUnitario(
  baseCosto: number,
  niveles: NivelPrecio[] | undefined,
  cantidad: number
): number {
  if (!niveles || niveles.length === 0) return baseCosto;

  // Ordenar por cantidad mínima ascendente
  const sortedTiers = [...niveles].sort((a, b) => a.cantidad_minima - b.cantidad_minima);

  for (const tier of sortedTiers) {
    if (cantidad < tier.cantidad_minima) {
      return tier.costo_por_medida;
    }
  }

  // Si no es menor que ningún nivel, se aplica el precio del último nivel.
  return sortedTiers[sortedTiers.length - 1].costo_por_medida;
}

async function getToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const tipoUsuario = cookieStore.get("tipo_usuario")?.value;
  if (!token || tipoUsuario !== "cliente") {
    redirect("/login");
  }
  return token;
}

function isRetryableStatus(status: number): boolean {
  if ([400, 401, 403, 404, 409, 422].includes(status)) return false;
  if ([408, 429].includes(status)) return true;
  if (status >= 500) return true;
  return false;
}

async function parseError(
  res: Response
): Promise<Pick<CarritoActionResult, "error" | "status" | "code" | "retryable">> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return {
      error: body.detail ?? "No se pudo completar la operacion",
      status: res.status,
      code: body.code,
      retryable: isRetryableStatus(res.status),
    };
  } catch {
    return {
      error: "No se pudo completar la operacion",
      status: res.status,
      retryable: isRetryableStatus(res.status),
    };
  }
}

export async function fetchCarritosRaw(): Promise<RawCarrito[]> {
  const token = await getToken();
  const res = await fetchWithAuth("/carrito/", { method: "GET" }, token);
  if (!res.ok) {
    const apiError = await parseError(res);
    throw new Error(apiError.error ?? "No se pudo completar la operacion");
  }
  const data = (await res.json()) as RawCarrito[];
  return Array.isArray(data) ? data : [];
}

export async function obtenerIdsCarrito(): Promise<string[]> {
  const carrito: RawCarrito[] = await fetchCarritosRaw();
  return carrito.flatMap(c => 
    (c.items ?? []).flatMap(item => item.producto_id ?? [])
  );
}

async function getProductosDetalle(
  productosIds: string[]
): Promise<Map<string, ProductoDetalle>> {
  const uniqueIds = Array.from(new Set(productosIds));
  const detalleMap = new Map<string, ProductoDetalle>();

  await Promise.all(
    uniqueIds.map(async (productoId) => {
      const detalle = await obtenerProductoPublico(productoId);
      if (!detalle) return;

      // Extraer niveles de precio de atributos_extra
      const nivelesPrecio = (detalle.atributos_extra?.niveles_precio as NivelPrecio[]) ?? [];

      detalleMap.set(productoId, {
        nombre: detalle.nombre ?? "Producto",
        costo: Number(detalle.costo ?? 0),
        imagen: detalle.imagen ?? null,
        unidad: detalle.medida?.unidad ?? "pz",
        nivelesPrecio: nivelesPrecio,
      });
    })
  );

  return detalleMap;
}

async function toUiData(rawCarritos: RawCarrito[]): Promise<CarritoUiData> {
  const productoIds = rawCarritos.flatMap((carrito) =>
    (carrito.items ?? []).map((item) => item.producto_id).filter(Boolean) as string[]
  );
  const detalleMap = await getProductosDetalle(productoIds);

  const items: CarritoUiItem[] = rawCarritos.flatMap((carrito) =>
    (carrito.items ?? []).map((item, idx) => {
      const productoId = item.producto_id ?? "";
      const detalle = detalleMap.get(productoId);
      const cantidad = Math.max(1, Number(item.cantidad ?? 1));
      const carritoId = carrito.id ?? "";
      const distribuidorId = carrito.distribuidor_id ?? "";
      
      const precioUnitario = calcularPrecioUnitario(
        detalle?.costo ?? 0,
        detalle?.nivelesPrecio,
        cantidad
      );

      return {
        key: item.id ?? `${carritoId}-${productoId}-${idx}`,
        carritoId,
        distribuidorId,
        productoId,
        cantidad,
        nombre: detalle?.nombre ?? "Producto del carrito",
        precioUnitario,
        precioBase: detalle?.costo ?? 0,
        nivelesPrecio: detalle?.nivelesPrecio,
        imagen: detalle?.imagen ?? null,
        unidad: detalle?.unidad ?? "pz",
        cantidadMinima: Math.max(1, Number(item.cantidad_minima ?? 1)),
      };
    })
  );

  const gruposMap = new Map<string, CarritoUiGrupo>();
  for (const item of items) {
    const grupoKey = item.distribuidorId || "sin-distribuidor";
    if (!gruposMap.has(grupoKey)) {
      const distribuidor = item.distribuidorId
        ? await obtenerDistribuidor(item.distribuidorId)
        : null;
      gruposMap.set(grupoKey, {
        carritoId: item.carritoId,
        distribuidorId: item.distribuidorId,
        distribuidorNombre: distribuidor?.nombre_negocio ?? "Distribuidor",
        distribuidorImagenPerfil: distribuidor?.imagen_perfil ?? null,
        items: [],
        subtotal: 0,
        totalArticulos: 0,
      });
    }

    const grupo = gruposMap.get(grupoKey)!;
    grupo.items.push(item);
    grupo.subtotal += item.precioUnitario * item.cantidad;
    grupo.totalArticulos += item.cantidad;
  }

  const grupos = Array.from(gruposMap.values()).sort((a, b) =>
    a.distribuidorNombre.localeCompare(b.distribuidorNombre)
  );
  const subtotal = grupos.reduce((acc, grupo) => acc + grupo.subtotal, 0);
  const envio = 0;
  const impuestos = 0;
  const total = subtotal + envio + impuestos;
  const totalArticulos = items.reduce((acc, item) => acc + item.cantidad, 0);

  return {
    grupos,
    items,
    subtotal,
    envio,
    impuestos,
    total,
    totalArticulos,
  };
}

export async function obtenerCarritoCliente(): Promise<CarritoUiData> {
  const carritos = await fetchCarritosRaw();
  return toUiData(carritos);
}

export async function verificarProductoEnCarrito(productoId: string): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const tipoUsuario = cookieStore.get("tipo_usuario")?.value;

    if (!token || tipoUsuario !== "cliente") return false;

    const res = await fetchWithAuth(`/carrito/items/${productoId}`, { method: "GET" }, token);
    if (!res.ok) return false;

    const data = await res.json();
    return data.en_carrito === true;
  } catch {
    return false;
  }
}

export async function actualizarCantidadCarrito(
  distribuidorId: string,
  productoId: string,
  cantidad: number
): Promise<CarritoActionResult> {
  try {
    const token = await getToken();
    const res = await fetchWithAuth(
      `/carrito/${distribuidorId}/items/${productoId}`,
      {
        method: "PUT",
        body: JSON.stringify({ cantidad: Math.max(0, cantidad) }),
      },
      token
    );

    if (!res.ok) return { ok: false, ...(await parseError(res)) };

    const data = await obtenerCarritoCliente();
    return { ok: true, data, message: "Carrito actualizado correctamente" };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el carrito",
      retryable: true,
    };
  }
}

export async function agregarProductoCarrito(
  distribuidorId: string,
  productoId: string,
  cantidad = 1
): Promise<CarritoActionResult> {
  try {
    const token = await getToken();
    const res = await fetchWithAuth(
      `/carrito/${distribuidorId}/items/${productoId}`,
      {
        method: "PUT",
        body: JSON.stringify({ cantidad: Math.max(1, cantidad) }),
      },
      token
    );
    if (!res.ok) return { ok: false, ...(await parseError(res)) };

    const data = await obtenerCarritoCliente();
    return { ok: true, data, message: "Producto agregado al carrito" };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo agregar el producto al carrito",
      retryable: true,
    };
  }
}

export async function eliminarItemCarrito(
  distribuidorId: string,
  productoId: string
): Promise<CarritoActionResult> {
  try {
    const token = await getToken();
    const res = await fetchWithAuth(
      `/carrito/${distribuidorId}/items/${productoId}`,
      { method: "DELETE" },
      token
    );
    if (!res.ok) return { ok: false, ...(await parseError(res)) };

    const data = await obtenerCarritoCliente();
    return { ok: true, data, message: "Articulo eliminado correctamente" };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "No se pudo eliminar el item",
      retryable: true,
    };
  }
}

export async function vaciarCarritosCliente(): Promise<CarritoActionResult> {
  try {
    const token = await getToken();
    const carritos = await fetchCarritosRaw();

    for (const carrito of carritos) {
      const distribuidorId = carrito.distribuidor_id;
      if (!distribuidorId) continue;

      for (const item of carrito.items ?? []) {
        if (!item.producto_id) continue;
        await fetchWithAuth(
          `/carrito/${distribuidorId}/items/${item.producto_id}`,
          { method: "DELETE" },
          token
        );
      }
    }

    const data = await obtenerCarritoCliente();
    return { ok: true, data, message: "Carritos vaciados correctamente" };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "No se pudo vaciar el carrito",
      retryable: true,
    };
  }
}
