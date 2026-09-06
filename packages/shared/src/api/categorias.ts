import { fetchWithAuth } from "./fetch";

export interface CategoriaResponse {
    id: string;
    nombre: string;
    imagen: string | null;
}

export interface CategoriaDestacada {
    categoria_id: string;
    nombre: string;
    imagen: string | null;
    total_compras: number;
}

export interface ResultadoCategoria<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

// === OBTENER CATEGORÍAS ===

export async function obtenerCategoriasDestacadas(
    token?: string,
    clienteId?: string,
    limite: number = 10
): Promise<CategoriaDestacada[]> {
    let url = `/categorias/productos/destacadas?limite=${limite}`;
    if (clienteId) url += `&cliente_id=${clienteId}`;

    const respuesta = await fetchWithAuth(url, { method: "GET" }, token);

    if (respuesta.status === 200) {
        return await respuesta.json();
    }
    return [];
}

export async function obtenerCategoriasProductos(token?: string): Promise<CategoriaResponse[]> {
    const respuesta = await fetchWithAuth('/categorias/productos', { method: "GET" }, token, 60);

    if (respuesta.status === 200) {
        return await respuesta.json();
    }
    return [];
}

export async function obtenerCategoriasDistribuidores(token?: string): Promise<CategoriaResponse[]> {
    const respuesta = await fetchWithAuth('/categorias/distribuidores', { method: "GET" }, token);

    if (respuesta.status === 200) {
        return await respuesta.json();
    }
    return [];
}

// === CREAR CATEGORÍAS ===

async function crearCategoria(
    endpoint: string,
    formData: FormData,
    token: string | undefined,
    mensajeError: string
): Promise<ResultadoCategoria> {
    // formData debe contener 'nombre' y opcionalmente 'imagen' (archivo)
    // No enviamos Content-Type para que fetch lo calcule automáticamente con los boundaries del FormData
    const respuesta = await fetchWithAuth(endpoint, { method: "POST", body: formData }, token);

    if (respuesta.status === 201) {
        return { success: true, data: await respuesta.json() };
    }

    let errorMsg = mensajeError;
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

export async function crearCategoriaProducto(
    formData: FormData,
    token?: string
): Promise<ResultadoCategoria> {
    return crearCategoria(
        '/categorias/productos',
        formData,
        token,
        "Error al crear la categoría de producto"
    );
}

export async function crearCategoriaDistribuidor(
    formData: FormData,
    token?: string
): Promise<ResultadoCategoria> {
    return crearCategoria(
        '/categorias/distribuidores',
        formData,
        token,
        "Error al crear la categoría de distribuidor"
    );
}

// === ELIMINAR CATEGORÍAS ===

export async function eliminarCategoriaProducto(
    id: string,
    token?: string
): Promise<ResultadoCategoria> {
    const respuesta = await fetchWithAuth(`/categorias/productos/${id}`, { method: "DELETE" }, token);

    if (respuesta.status === 204) {
        return { success: true };
    }
    return { success: false, error: "Error al eliminar la categoría de producto" };
}

export async function eliminarCategoriaDistribuidor(
    id: string,
    token?: string
): Promise<ResultadoCategoria> {
    const respuesta = await fetchWithAuth(`/categorias/distribuidores/${id}`, { method: "DELETE" }, token);

    if (respuesta.status === 204) {
        return { success: true };
    }
    return { success: false, error: "Error al eliminar la categoría de distribuidor" };
}
