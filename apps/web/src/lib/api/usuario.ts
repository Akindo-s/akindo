"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchWithAuth } from "./fetch";

// === Función interna para obtener el token una sola vez ===
async function getToken(): Promise<string | undefined> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) redirect("/login");
    return token;
}

// === IMAGEN DE PERFIL ===

/**
 * Actualiza la imagen de perfil del usuario autenticado (cliente o distribuidor).
 */
export async function actualizarImagenPerfil(file: File): Promise<boolean> {
    const token = await getToken();
    const formData = new FormData();
    formData.append('file', file);

    const respuesta = await fetchWithAuth('/usuarios/me/imagen-perfil', {
        method: 'PUT',
        body: formData
    }, token);

    return respuesta.status === 200;
}

// === CLIENTES ===

export async function obtenerInformacionPerfil(): Promise<any> {
    const token = await getToken();
    const respuesta = await fetchWithAuth('/clientes/me', { method: "GET" }, token);

    if (respuesta.status === 200) {
        return await respuesta.json();
    }
    return null;
}

export async function actualizarPerfilCliente(datos: { nombre?: string; telefono?: string; email?: string }): Promise<boolean> {
    const token = await getToken();
    const respuesta = await fetchWithAuth('/clientes/me', {
        method: "PATCH",
        body: JSON.stringify(datos)
    }, token);

    return respuesta.status === 200;
}

// === DISTRIBUIDORES ===

export async function obtenerPerfilDistribuidor(): Promise<any> {
    const token = await getToken();
    const respuesta = await fetchWithAuth('/distribuidores/me', { method: "GET" }, token);

    if (respuesta.status === 200) {
        return await respuesta.json();
    }
    return null;
}

export async function actualizarPerfilDistribuidor(distribuidorId: string, datos: { nombre_negocio?: string; telefono?: string; descripcion?: string }): Promise<boolean> {
    const token = await getToken();
    const respuesta = await fetchWithAuth(`/distribuidores/${distribuidorId}`, {
        method: "PATCH",
        body: JSON.stringify(datos)
    }, token);

    return respuesta.status === 200;
}

/**
 * Verifica si el usuario actual es el dueño de un perfil de distribuidor, sin redirigir si no está autenticado.
 */
export async function esDistribuidorDueno(distribuidorId: string): Promise<boolean> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const tipoUsuario = cookieStore.get("tipo_usuario")?.value;

    if (!token || tipoUsuario !== "distribuidor") {
        return false;
    }

    try {
        const respuesta = await fetchWithAuth('/distribuidores/me', { method: "GET" }, token);
        if (respuesta.status === 200) {
            const data = await respuesta.json();
            return data.id === distribuidorId;
        }
    } catch (e) {
        console.error("Error verificando dueño del distribuidor", e);
    }
    
    return false;
}

// === DIRECCIONES ===

export async function obtenerMisDirecciones(): Promise<any[]> {
    const token = await getToken();
    const respuesta = await fetchWithAuth('/clientes/me/direcciones', { method: "GET" }, token);

    if (respuesta.status === 200) {
        return await respuesta.json();
    }
    return [];
}

export async function crearDireccion(datos: {
    calle: string;
    ciudad: string;
    estado: string;
    codigo_postal: string;
    es_predeterminada?: boolean;
}): Promise<boolean> {
    const token = await getToken();
    const respuesta = await fetchWithAuth('/clientes/me/direcciones', {
        method: "POST",
        body: JSON.stringify(datos)
    }, token);

    return respuesta.status === 200 || respuesta.status === 201;
}

export async function actualizarDireccion(direccionId: string, datos: {
    calle?: string;
    ciudad?: string;
    estado?: string;
    codigo_postal?: string;
    es_predeterminada?: boolean;
}): Promise<boolean> {
    const token = await getToken();
    const respuesta = await fetchWithAuth(`/clientes/me/direcciones/${direccionId}`, {
        method: "PATCH",
        body: JSON.stringify(datos)
    }, token);

    return respuesta.status === 200;
}

export async function eliminarDireccion(direccionId: string): Promise<boolean> {
    const token = await getToken();
    const respuesta = await fetchWithAuth(`/clientes/me/direcciones/${direccionId}`, {
        method: "DELETE"
    }, token);

    return respuesta.status === 204;
}