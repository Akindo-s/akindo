"use server";

import * as core from "@akindo/shared/api/productos";
import { conSesion, tokenRequerido } from "@/lib/sesion";

export type {
    UnidadMedida,
    NivelPrecio,
    DatosCrearProducto,
    ProductoResponse,
    ProductoCatalogoResponse,
    CatalogoPaginatedResponse,
    DatosActualizarProducto,
    CategoriaProductos,
} from "@akindo/shared/api/productos";

// ─── Funciones públicas (sin auth) ───────────────────────────────────────────

export async function obtenerCategoriasDisponibles() {
    return core.obtenerCategoriasDisponibles();
}

/**
 * Lista el catálogo global de productos de forma paginada. Público, sin autenticación.
 */
export async function listarProductosCatalogo(
    pagina: number = 1,
    cantidad: number = 12,
    nombre: string = "",
    categorias?: string[],
    opciones?: { revalidate?: number | false }
) {
    return core.listarProductosCatalogo(pagina, cantidad, nombre, categorias, opciones);
}

/**
 * Obtiene los detalles completos de un producto por su ID. Público, sin autenticación.
 */
export async function obtenerProductoPublico(productoId: string) {
    return core.obtenerProductoPublico(productoId);
}

/**
 * Obtiene el catálogo de unidades de medida disponibles para productos.
 */
export async function obtenerUnidadesMedida() {
    return core.obtenerUnidadesMedida();
}

// ─── Funciones autenticadas ──────────────────────────────────────────────────

/**
 * Publica un producto en el catálogo del distribuidor autenticado.
 */
export async function crearProducto(
    datos: core.DatosCrearProducto,
    es_borrador: boolean = false
) {
    const token = await tokenRequerido();
    return conSesion(() => core.crearProducto(datos, es_borrador, token));
}

/**
 * Guarda un producto como borrador (no disponible al público).
 */
export async function guardarBorradorProducto(datos: core.DatosCrearProducto) {
    const token = await tokenRequerido();
    return conSesion(() => core.guardarBorradorProducto(datos, token));
}

/**
 * Sube una imagen para un producto existente.
 */
export async function subirImagenProducto(productoId: string, file: File) {
    const token = await tokenRequerido();
    return conSesion(() => core.subirImagenProducto(productoId, file, token));
}

// ─── Catálogo e Inventario ────────────────────────────────────────────────────

/**
 * Obtiene el catálogo paginado de productos de un distribuidor.
 */
export async function obtenerCatalogoDistribuidor(
    distribuidorId: string,
    pagina: number = 1,
    cantidad: number = 20,
    nombre: string = "",
    categorias: string[] | null = null,
) {
    const token = await tokenRequerido();
    return conSesion(() =>
        core.obtenerCatalogoDistribuidor(distribuidorId, pagina, cantidad, nombre, categorias, token)
    );
}

/**
 * Obtiene los datos completos de un producto por su ID.
 */
export async function obtenerProducto(productoId: string) {
    const token = await tokenRequerido();
    return conSesion(() => core.obtenerProducto(productoId, token));
}

/**
 * Actualiza toda la información de un producto existente.
 */
export async function actualizarProducto(
    productoId: string,
    datos: core.DatosActualizarProducto,
) {
    const token = await tokenRequerido();
    return conSesion(() => core.actualizarProducto(productoId, datos, token));
}

/**
 * Archiva un producto (borrado lógico).
 */
export async function archivarProducto(productoId: string) {
    const token = await tokenRequerido();
    return conSesion(() => core.archivarProducto(productoId, token));
}
