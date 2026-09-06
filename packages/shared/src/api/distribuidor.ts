import { fetchWithAuth } from "./fetch";
import { API_URL } from "../constants";

// ─── Tipos públicos del mercado ──────────────────────────────────────────────

export interface MiniDistribuidorResponse {
    distribuidor_id: string;
    nombre_negocio: string;
    imagen_fondo: string | null;
    valoracion_promedio: number | null;
    total_valoraciones: number | null;
    categorias: string[] | null;
}

export interface DistribuidoresPaginatedResponse {
    total_distribuidores: number;
    total_paginas: number;
    pagina_actual: number;
    tiene_siguiente: boolean;
    tiene_anterior: boolean;
    siguiente_url: string | null;
    anterior_url: string | null;
    distribuidores: MiniDistribuidorResponse[];
}

export interface DistribuidorPublicoResponse {
    id: string;
    nombre: string;
    nombre_negocio: string;
    rfc: string;
    imagen_perfil: string | null;
    imagen_fondo: string | null;
    valoracion_promedio: number;
    total_valoraciones: number;
    fecha_creacion: string | null;
    categorias: { id: string; nombre: string; imagen: string | null }[] | null;
    direcciones: {
        id: string;
        calle: string;
        ciudad: string;
        estado: string;
        codigo_postal: string;
        es_predeterminada: boolean;
    }[];
    es_verificado: boolean;
    descripcion: string | null;
}

export interface ProductoCatalogoPublico {
    producto_id: string;
    nombre: string;
    costo: number;
    disponible: boolean;
    unidad: string;
    existencias: number;
    imagen: string | null;
}

export interface CatalogoDistribuidorPublico {
    total_productos: number;
    total_paginas: number;
    pagina_actual: number;
    tiene_siguiente: boolean;
    tiene_anterior: boolean;
    siguiente_url: string | null;
    anterior_url: string | null;
    productos: ProductoCatalogoPublico[];
}

export interface ResumenMensual {
    volumen_bruto_mes: number;
    pedidos_activos: number;
    productos_poco_stock: number;
}

export interface AlertaExistencia {
    producto_id: string;
    nombre: string;
    sku: string;
    existencias: number;
    costo: number;
    unidad: string;
    imagen: string | null;
    disponible: boolean;
    estado_stock: string;
}

export interface PedidoActivo {
    pedido_id: string;
    orden_id: string;
    cliente_nombre: string;
    cliente_email: string;
    total: number;
    estado: string;
    confirmado_at: string;
}

// ─── Funciones autenticadas ──────────────────────────────────────────────────

export const obtenerResumenMensual = async (
    token?: string,
    umbral_stock: number = 67
): Promise<ResumenMensual | null> => {
    const respuesta = await fetchWithAuth(`/distribuidores/me/resumen?umbral_stock=${umbral_stock}`, {
        method: 'GET',
    }, token);

    if (respuesta.ok) {
        return await respuesta.json();
    }
    return null;
}

/**
 * `archivo` es un `File`/`Blob` en web; en Expo se pasa el descriptor
 * `{ uri, name, type }` que acepta el `FormData` de React Native.
 */
export async function actualizarImagenNegocio(
    distribuidorId: string,
    archivo: Blob,
    token?: string
): Promise<boolean> {
    const formData = new FormData();
    formData.append('file', archivo);

    const respuesta = await fetchWithAuth(`/distribuidores/${distribuidorId}/imagen-negocio`, {
        method: 'POST',
        body: formData
    }, token);

    return respuesta.ok;
}

export const obtenerProductosPocasExistencias = async (
    token?: string,
    umbral_stock: number = 67
): Promise<AlertaExistencia[]> => {
    const respuesta = await fetchWithAuth(`/distribuidores/me/alertas-existencias?umbral_stock=${umbral_stock}`, {
        method: 'GET',
    }, token);

    if (respuesta.ok) {
        return await respuesta.json();
    }
    return [];
}

export const obtenerPedidosActivos = async (token?: string): Promise<PedidoActivo[]> => {
    const respuesta = await fetchWithAuth(`/distribuidores/me/pedidos-activos`, {
        method: 'GET',
    }, token);

    if (respuesta.ok) {
        return await respuesta.json();
    }
    return [];
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
): Promise<DistribuidoresPaginatedResponse> {
    const params = new URLSearchParams({
        numero_pagina: String(pagina),
        cantidad_pagina: String(cantidad),
    });
    if (valoracionMin !== undefined) params.set("valoracion_min", String(valoracionMin));
    if (valoracionMax !== undefined) params.set("valoracion_max", String(valoracionMax));
    if (categorias && categorias.length > 0) {
        categorias.forEach((c) => params.append("categorias", c));
    }

    try {
        const res = await fetch(`${API_URL}/distribuidores/?${params.toString()}`, {
            cache: "no-store",
        });
        if (res.ok) return await res.json();
    } catch (e) {
        console.error("Error listando distribuidores:", e);
    }
    return {
        total_distribuidores: 0,
        total_paginas: 0,
        pagina_actual: 1,
        tiene_siguiente: false,
        tiene_anterior: false,
        siguiente_url: null,
        anterior_url: null,
        distribuidores: [],
    };
}

/**
 * Obtiene el perfil completo de un distribuidor. Público, sin autenticación.
 */
export async function obtenerDistribuidor(id: string): Promise<DistribuidorPublicoResponse | null> {
    try {
        const res = await fetch(`${API_URL}/distribuidores/other/${id}`, { cache: "no-store" });
        if (res.ok) return await res.json();
    } catch (e) {
        console.error("Error obteniendo distribuidor:", e);
    }
    return null;
}

/**
 * Obtiene el catálogo de productos de un distribuidor. Público, sin autenticación.
 */
export async function obtenerCatalogoDistribuidorPublico(
    distribuidorId: string,
    pagina: number = 1,
    cantidad: number = 20,
): Promise<CatalogoDistribuidorPublico> {
    const params = new URLSearchParams({
        numero_pagina: String(pagina),
        cantidad_pagina: String(cantidad),
    });
    try {
        const res = await fetch(
            `${API_URL}/distribuidores/${distribuidorId}/catalogo?${params.toString()}`,
            { cache: "no-store" }
        );
        if (res.ok) return await res.json();
    } catch (e) {
        console.error("Error obteniendo catálogo del distribuidor:", e);
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
