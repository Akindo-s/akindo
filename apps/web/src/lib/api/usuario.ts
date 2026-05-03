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

    const respuesta = await fetchWithAuth('/clientes/me/imagen-perfil', {
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

export async function actualizarPerfilCliente(datos: { nombre?: string; telefono?: string }): Promise<boolean> {
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

export async function actualizarPerfilDistribuidor(distribuidorId: string, datos: { nombre_negocio?: string; telefono?: string }): Promise<boolean> {
    const token = await getToken();
    const respuesta = await fetchWithAuth(`/distribuidores/${distribuidorId}`, {
        method: "PATCH",
        body: JSON.stringify(datos)
    }, token);

    return respuesta.status === 200;
}