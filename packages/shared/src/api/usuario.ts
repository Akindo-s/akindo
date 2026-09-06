import { fetchWithAuth } from "./fetch";

export interface DatosPerfilCliente {
    nombre?: string;
    telefono?: string;
    email?: string;
}

export interface DatosPerfilDistribuidor {
    nombre_negocio?: string;
    telefono?: string;
    descripcion?: string;
}

export interface DatosDireccion {
    calle: string;
    ciudad: string;
    estado: string;
    codigo_postal: string;
    es_predeterminada?: boolean;
}

export type DatosDireccionParcial = Partial<DatosDireccion>;

// === IMAGEN DE PERFIL ===

/**
 * Actualiza la imagen de perfil del usuario autenticado (cliente o distribuidor).
 *
 * `archivo` es un `File`/`Blob` en web; en Expo se pasa el descriptor
 * `{ uri, name, type }` que acepta el `FormData` de React Native.
 */
export async function actualizarImagenPerfil(archivo: Blob, token?: string): Promise<boolean> {
    const formData = new FormData();
    formData.append('file', archivo);

    const respuesta = await fetchWithAuth('/usuarios/me/imagen-perfil', {
        method: 'PUT',
        body: formData
    }, token);

    return respuesta.status === 200;
}

// === CLIENTES ===

export async function obtenerInformacionPerfil(token?: string): Promise<any> {
    const respuesta = await fetchWithAuth('/clientes/me', { method: "GET" }, token);

    if (respuesta.status === 200) {
        return await respuesta.json();
    }
    return null;
}

export async function actualizarPerfilCliente(
    datos: DatosPerfilCliente,
    token?: string
): Promise<boolean> {
    const respuesta = await fetchWithAuth('/clientes/me', {
        method: "PATCH",
        body: JSON.stringify(datos)
    }, token);

    return respuesta.status === 200;
}

// === DISTRIBUIDORES ===

export async function obtenerPerfilDistribuidor(token?: string): Promise<any> {
    const respuesta = await fetchWithAuth('/distribuidores/me', { method: "GET" }, token);

    if (respuesta.status === 200) {
        return await respuesta.json();
    }
    return null;
}

export async function actualizarPerfilDistribuidor(
    distribuidorId: string,
    datos: DatosPerfilDistribuidor,
    token?: string
): Promise<boolean> {
    const respuesta = await fetchWithAuth(`/distribuidores/${distribuidorId}`, {
        method: "PATCH",
        body: JSON.stringify(datos)
    }, token);

    return respuesta.status === 200;
}

/**
 * Verifica si la sesion recibida corresponde al dueño de un perfil de distribuidor.
 * No lanza ni redirige si la sesion es invalida: devuelve `false`.
 */
export async function esDistribuidorDueno(
    distribuidorId: string,
    token?: string,
    tipoUsuario?: string
): Promise<boolean> {
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

export async function obtenerMisDirecciones(token?: string): Promise<any[]> {
    const respuesta = await fetchWithAuth('/clientes/me/direcciones', { method: "GET" }, token);

    if (respuesta.status === 200) {
        return await respuesta.json();
    }
    return [];
}

export async function crearDireccion(datos: DatosDireccion, token?: string): Promise<boolean> {
    const respuesta = await fetchWithAuth('/clientes/me/direcciones', {
        method: "POST",
        body: JSON.stringify(datos)
    }, token);

    return respuesta.status === 200 || respuesta.status === 201;
}

export async function actualizarDireccion(
    direccionId: string,
    datos: DatosDireccionParcial,
    token?: string
): Promise<boolean> {
    const respuesta = await fetchWithAuth(`/clientes/me/direcciones/${direccionId}`, {
        method: "PATCH",
        body: JSON.stringify(datos)
    }, token);

    return respuesta.status === 200;
}

export async function eliminarDireccion(direccionId: string, token?: string): Promise<boolean> {
    const respuesta = await fetchWithAuth(`/clientes/me/direcciones/${direccionId}`, {
        method: "DELETE"
    }, token);

    return respuesta.status === 204;
}
