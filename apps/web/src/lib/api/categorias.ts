"use server";

import { cookies } from "next/headers";
import { fetchWithAuth } from "./fetch";

async function getToken(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get("token")?.value;
}

// === OBTENER CATEGORÍAS ===

export async function obtenerCategoriasProductos(): Promise<any[]> {
    const token = await getToken();
    const respuesta = await fetchWithAuth('/categorias/productos', { method: "GET" }, token);
    
    if (respuesta.status === 200) {
        return await respuesta.json();
    }
    return [];
}

export async function obtenerCategoriasDistribuidores(): Promise<any[]> {
    const token = await getToken();
    const respuesta = await fetchWithAuth('/categorias/distribuidores', { method: "GET" }, token);
    
    if (respuesta.status === 200) {
        return await respuesta.json();
    }
    return [];
}

// === CREAR CATEGORÍAS ===

export async function crearCategoriaProducto(formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
    const token = await getToken();
    
    // formData debe contener 'nombre' y opcionalmente 'imagen' (archivo)
    const respuesta = await fetchWithAuth('/categorias/productos', {
        method: "POST",
        body: formData,
        // No enviamos Content-Type para que fetch lo calcule automáticamente con los boundaries del FormData
    }, token);

    if (respuesta.status === 201) {
        return { success: true, data: await respuesta.json() };
    }
    
    let errorMsg = "Error al crear la categoría de producto";
    try {
        const errorData = await respuesta.json();
        if (errorData.detail) {
            errorMsg = Array.isArray(errorData.detail) ? errorData.detail[0].msg : errorData.detail;
        }
    } catch (e) {
        // Fallback si no es JSON
    }
    
    return { success: false, error: errorMsg };
}

export async function crearCategoriaDistribuidor(formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
    const token = await getToken();
    
    const respuesta = await fetchWithAuth('/categorias/distribuidores', {
        method: "POST",
        body: formData,
    }, token);

    if (respuesta.status === 201) {
        return { success: true, data: await respuesta.json() };
    }
    
    let errorMsg = "Error al crear la categoría de distribuidor";
    try {
        const errorData = await respuesta.json();
        if (errorData.detail) {
            errorMsg = Array.isArray(errorData.detail) ? errorData.detail[0].msg : errorData.detail;
        }
    } catch (e) {
        // Fallback si no es JSON
    }
    
    return { success: false, error: errorMsg };
}

// === ELIMINAR CATEGORÍAS ===

export async function eliminarCategoriaProducto(id: string): Promise<{ success: boolean; error?: string }> {
    const token = await getToken();
    const respuesta = await fetchWithAuth(`/categorias/productos/${id}`, { method: "DELETE" }, token);
    
    if (respuesta.status === 204) {
        return { success: true };
    }
    return { success: false, error: "Error al eliminar la categoría de producto" };
}

export async function eliminarCategoriaDistribuidor(id: string): Promise<{ success: boolean; error?: string }> {
    const token = await getToken();
    const respuesta = await fetchWithAuth(`/categorias/distribuidores/${id}`, { method: "DELETE" }, token);
    
    if (respuesta.status === 204) {
        return { success: true };
    }
    return { success: false, error: "Error al eliminar la categoría de distribuidor" };
}
