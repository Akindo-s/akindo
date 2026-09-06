"use server";

import * as core from "@akindo/shared/api/distribuidor";
import { conSesion, tokenRequerido } from "@/lib/sesion";

export type {
    MiniDistribuidorResponse,
    DistribuidoresPaginatedResponse,
    DistribuidorPublicoResponse,
    ProductoCatalogoPublico,
    CatalogoDistribuidorPublico,
    ResumenMensual,
    AlertaExistencia,
    PedidoActivo,
} from "@akindo/shared/api/distribuidor";

// ─── Funciones autenticadas ──────────────────────────────────────────────────

export async function obtenerResumenMensual(umbral_stock: number = 67) {
    const token = await tokenRequerido();
    return conSesion(() => core.obtenerResumenMensual(token, umbral_stock));
}

export async function actualizarImagenNegocio(distribuidorId: string, file: File) {
    const token = await tokenRequerido();
    return conSesion(() => core.actualizarImagenNegocio(distribuidorId, file, token));
}

export async function obtenerProductosPocasExistencias(umbral_stock: number = 67) {
    const token = await tokenRequerido();
    return conSesion(() => core.obtenerProductosPocasExistencias(token, umbral_stock));
}

export async function obtenerPedidosActivos() {
    const token = await tokenRequerido();
    return conSesion(() => core.obtenerPedidosActivos(token));
}

// ─── Funciones públicas del mercado (sin auth) ────────────────────────────────

/**
 * Lista distribuidores de forma paginada. Público, sin autenticación requerida.
 */
export async function listarDistribuidores(
    pagina: number = 1,
    cantidad: number = 12,
    categorias?: string[],
    valoracionMin?: number,
    valoracionMax?: number,
) {
    return core.listarDistribuidores(pagina, cantidad, categorias, valoracionMin, valoracionMax);
}

/**
 * Obtiene el perfil completo de un distribuidor. Público, sin autenticación.
 */
export async function obtenerDistribuidor(id: string) {
    return core.obtenerDistribuidor(id);
}

/**
 * Obtiene el catálogo de productos de un distribuidor. Público, sin autenticación.
 */
export async function obtenerCatalogoDistribuidorPublico(
    distribuidorId: string,
    pagina: number = 1,
    cantidad: number = 20,
) {
    return core.obtenerCatalogoDistribuidorPublico(distribuidorId, pagina, cantidad);
}
