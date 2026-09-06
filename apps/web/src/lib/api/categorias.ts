"use server";

import * as core from "@akindo/shared/api/categorias";
import { conSesion, tokenOpcional } from "@/lib/sesion";

export type {
    CategoriaResponse,
    CategoriaDestacada,
    ResultadoCategoria,
} from "@akindo/shared/api/categorias";

// === OBTENER CATEGORÍAS ===

export async function obtenerCategoriasDestacadas(clienteId?: string, limite: number = 10) {
    const token = await tokenOpcional();
    return conSesion(() => core.obtenerCategoriasDestacadas(token, clienteId, limite));
}

export async function obtenerCategoriasProductos() {
    const token = await tokenOpcional();
    return conSesion(() => core.obtenerCategoriasProductos(token));
}

export async function obtenerCategoriasDistribuidores() {
    const token = await tokenOpcional();
    return conSesion(() => core.obtenerCategoriasDistribuidores(token));
}

// === CREAR CATEGORÍAS ===

export async function crearCategoriaProducto(formData: FormData) {
    const token = await tokenOpcional();
    return conSesion(() => core.crearCategoriaProducto(formData, token));
}

export async function crearCategoriaDistribuidor(formData: FormData) {
    const token = await tokenOpcional();
    return conSesion(() => core.crearCategoriaDistribuidor(formData, token));
}

// === ELIMINAR CATEGORÍAS ===

export async function eliminarCategoriaProducto(id: string) {
    const token = await tokenOpcional();
    return conSesion(() => core.eliminarCategoriaProducto(id, token));
}

export async function eliminarCategoriaDistribuidor(id: string) {
    const token = await tokenOpcional();
    return conSesion(() => core.eliminarCategoriaDistribuidor(id, token));
}
