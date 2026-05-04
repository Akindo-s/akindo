"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchWithAuth } from "./fetch";
import { API_URL } from "./constants";

// === Token helper ===
async function getToken(): Promise<string | undefined> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) redirect("/login");
    return token;
}

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface UnidadMedida {
    id: string;
    unidad: string;  // ej. "kg"
    nombre: string;  // ej. "Kilogramo"
}

export interface NivelPrecio {
    cantidad_minima: number;
    costo_por_medida: number;
}

export interface DatosCrearProducto {
    nombre: string;
    /** UUID de la unidad de medida */
    medida: string;
    costo: number;
    existencias: number;
    descripcion?: string;
    /** TODO: Conectar con endpoint GET /categorias cuando el backend lo implemente */
    categoria?: string;
    niveles_precio?: NivelPrecio[];
}

export interface ProductoResponse {
    id: string;
    distribuidor_id: string;
    nombre: string;
    costo: number;
    medida: string;
    existencias: number;
    disponible: boolean;
    atributos_extra: Record<string, unknown> | null;
}

// ─── Funciones ───────────────────────────────────────────────────────────────

/**
 * Obtiene el catálogo de unidades de medida disponibles para productos.
 * No requiere autenticación.
 */
export async function obtenerUnidadesMedida(): Promise<UnidadMedida[]> {
    try {
        const respuesta = await fetch(`${API_URL}/productos/unidades-medida`, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
        });
        
        if (respuesta.ok) {
            const body = await respuesta.json();
            console.log(body)
            return body;
        }
        return [];
    } catch (e) {
        console.error("Error fetching unidades de medida:", e);
        return [];
    }
}

/**
 * Publica un producto en el catálogo del distribuidor autenticado.
 * Envía categoría y niveles de precio en `atributos_extra`.
 * La imagen del producto se maneja por separado (pendiente de endpoint en backend).
 */
export async function crearProducto(datos: DatosCrearProducto,es_borrador:boolean=false): Promise<ProductoResponse | null> {
    const token = await getToken();

    const body = {
        nombre: datos.nombre,
        costo: datos.costo,
        medida: datos.medida,
        existencias: datos.existencias,
        atributos_extra: {
            // TODO: Reemplazar por campo real cuando el backend implemente categorías
            ...(datos.categoria ? { categoria: datos.categoria } : {}),
            // Niveles de precio por volumen — almacenados hasta que el backend los procese
            ...(datos.niveles_precio?.length ? { niveles_precio: datos.niveles_precio } : {}),
            ...(datos.descripcion ? { descripcion: datos.descripcion } : {}),
        },
        es_borrador:es_borrador
    };

    const respuesta = await fetchWithAuth("/productos/", {
        method: "POST",
        body: JSON.stringify(body),
    }, token);

    if (respuesta.status === 201) {
        return await respuesta.json();
    }
    return null;
}

/**
 * Guarda un producto como borrador (no disponible al público).
 * NOTA: El backend actual no tiene campo `disponible` en ProductoCreateRequest.
 * Por ahora llama a `crearProducto` normalmente.
 * TODO: Actualizar cuando el backend soporte `disponible: false` en la creación.
 */
export async function guardarBorradorProducto(datos: DatosCrearProducto): Promise<ProductoResponse | null> {
    // TODO: Pasar { disponible: false } cuando el backend lo soporte en POST /productos/
    return crearProducto(datos,true);
}

/**
 * Sube una imagen para un producto existente.
 * Envía el archivo como multipart/form-data a POST /productos/{productoId}/imagen.
 * @param productoId UUID del producto al que se asociará la imagen.
 * @param file Archivo de imagen (PNG, JPG, WebP, max 5MB).
 * @returns URL pública de la imagen subida, o null si falló.
 */
export async function subirImagenProducto(productoId: string, file: File): Promise<string | null> {
    const token = await getToken();

    const formData = new FormData();
    formData.append("file", file);

    const respuesta = await fetchWithAuth(`/productos/${productoId}/imagen`, {
        method: "POST",
        body: formData,
    }, token);

    if (respuesta.ok) {
        const data = await respuesta.json();
        return data.imagen_url ?? data.url ?? null;
    }
    return null;
}
