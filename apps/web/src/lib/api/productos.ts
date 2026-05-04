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
    imagen?: string | null;
    categorias?:Record<string,string>[]
}

export interface ProductoCatalogoResponse {
    producto_id: string;
    nombre: string;
    costo: number;
    disponible: boolean;
    unidad: string;
    existencias:number,
    imagen:string
}

export interface CatalogoPaginatedResponse {
    total_productos: number;
    total_paginas: number;
    pagina_actual: number;
    tiene_siguiente: boolean;
    tiene_anterior: boolean;
    siguiente_url: string | null;
    anterior_url: string | null;
    productos: ProductoCatalogoResponse[];
}

export interface DatosActualizarProducto {
    nombre: string;
    costo: number;
    medida: string;
    existencias: number;
    atributos_extra?: Record<string, unknown> | null;
    categorias?: string[] | null;
}
export interface CategoriaProductos{
    id:string;
    nombre:string;
    imagen:string;
}

// ─── Funciones ───────────────────────────────────────────────────────────────

export async function obtenerCategoriasDisponibles():Promise<CategoriaProductos[]>{
    try{
        const respuesta = await fetch(`${API_URL}/categorias/productos`);
        if (respuesta.ok){
            return await respuesta.json()
        }
        if (respuesta.status === 500){
            throw Error("Error del servidor, intente mas tarde")
        }

    }catch(e){
        console.log("Error fetching obtener unidades medida")
    }
    return []
}

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
    console.log(datos.categoria)
    const body = {
        nombre: datos.nombre,
        costo: datos.costo,
        medida: datos.medida,
        existencias: datos.existencias,
        atributos_extra: {
            // Niveles de precio por volumen — almacenados hasta que el backend los procese
            ...(datos.niveles_precio?.length ? { niveles_precio: datos.niveles_precio } : {}),
            ...(datos.descripcion ? { descripcion: datos.descripcion } : {}),
        },
        es_borrador:es_borrador,
        categorias:datos.categoria
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

// ─── Catálogo e Inventario ────────────────────────────────────────────────────

/**
 * Obtiene el catálogo paginado de productos de un distribuidor.
 * Soporta búsqueda por nombre y filtrado por categorías.
 * @param distribuidorId UUID del distribuidor.
 * @param pagina Número de página (1-indexed).
 * @param cantidad Cantidad de productos por página.
 * @param nombre Filtro de búsqueda por nombre.
 * @param categorias UUIDs de categorías para filtrar.
 */
export async function obtenerCatalogoDistribuidor(
    distribuidorId: string,
    pagina: number = 1,
    cantidad: number = 20,
    nombre: string = "",
    categorias: string[] | null = null,
): Promise<CatalogoPaginatedResponse> {
    const token = await getToken();
    const params = new URLSearchParams({
        distribuidor_id: distribuidorId,
        numero_pagina: String(pagina),
        cantidad_pagina: String(cantidad),
        nombre,
    });

    const options: RequestInit = {
        method: categorias && categorias.length > 0 ? "POST" : "GET",
        ...(categorias && categorias.length > 0
            ? { body: JSON.stringify(categorias) }
            : {}),
    };

    // GET /productos/catalogo usa query params; categorías van en body como POST
    const respuesta = await fetchWithAuth(`/productos/catalogo?${params.toString()}`, options, token);

    if (respuesta.ok) {
        return await respuesta.json();
    }
    return {
        total_productos: 0,
        total_paginas: 0,
        pagina_actual: 1,
        tiene_siguiente: false,
        tiene_anterior: false,
        siguiente_url: null,
        anterior_url: null,
        productos: [],
    };
}

/**
 * Obtiene los datos completos de un producto por su ID.
 * TODO: Conectar cuando el backend exponga GET /productos/{producto_id}
 * @param productoId UUID del producto.
 */
export async function obtenerProducto(productoId: string): Promise<ProductoResponse | null> {
    const token = await getToken();
    // TODO: Implementar cuando el backend tenga GET /productos/{producto_id}
    const respuesta = await fetchWithAuth(`/productos/${productoId}`, {
        method: "GET",
    }, token);

    if (respuesta.ok) {
        return await respuesta.json();
    }
    return null;
}

/**
 * Actualiza toda la información de un producto existente.
 * @param productoId UUID del producto a actualizar.
 * @param datos Datos actualizados del producto.
 */
export async function actualizarProducto(
    productoId: string,
    datos: DatosActualizarProducto,
): Promise<ProductoResponse | null> {
    const token = await getToken();
    console.log(datos)
    const respuesta = await fetchWithAuth(`/productos/${productoId}`, {
        method: "PUT",
        body: JSON.stringify(datos),
    }, token);

    if (respuesta.ok) {
        return await respuesta.json();
    }
    return null;
}

/**
 * Archiva un producto (borrado lógico).
 * El producto deja de aparecer en el catálogo pero no se elimina permanentemente.
 * @param productoId UUID del producto a archivar.
 */
export async function archivarProducto(productoId: string): Promise<boolean> {
    const token = await getToken();

    const respuesta = await fetchWithAuth(`/productos/${productoId}`, {
        method: "DELETE",
    }, token);

    return respuesta.status === 204;
}
