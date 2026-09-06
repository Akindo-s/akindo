"use server";

import * as core from "@akindo/shared/api/usuario";
import { conSesion, sesionOpcional, tokenRequerido } from "@/lib/sesion";

export type {
    DatosPerfilCliente,
    DatosPerfilDistribuidor,
    DatosDireccion,
    DatosDireccionParcial,
} from "@akindo/shared/api/usuario";

// === IMAGEN DE PERFIL ===

/**
 * Actualiza la imagen de perfil del usuario autenticado (cliente o distribuidor).
 */
export async function actualizarImagenPerfil(file: File): Promise<boolean> {
    const token = await tokenRequerido();
    return conSesion(() => core.actualizarImagenPerfil(file, token));
}

// === CLIENTES ===

export async function obtenerInformacionPerfil(): Promise<any> {
    const token = await tokenRequerido();
    return conSesion(() => core.obtenerInformacionPerfil(token));
}

export async function actualizarPerfilCliente(
    datos: { nombre?: string; telefono?: string; email?: string }
): Promise<boolean> {
    const token = await tokenRequerido();
    return conSesion(() => core.actualizarPerfilCliente(datos, token));
}

// === DISTRIBUIDORES ===

export async function obtenerPerfilDistribuidor(): Promise<any> {
    const token = await tokenRequerido();
    return conSesion(() => core.obtenerPerfilDistribuidor(token));
}

export async function actualizarPerfilDistribuidor(
    distribuidorId: string,
    datos: { nombre_negocio?: string; telefono?: string; descripcion?: string }
): Promise<boolean> {
    const token = await tokenRequerido();
    return conSesion(() => core.actualizarPerfilDistribuidor(distribuidorId, datos, token));
}

/**
 * Verifica si el usuario actual es el dueño de un perfil de distribuidor, sin redirigir si no está autenticado.
 */
export async function esDistribuidorDueno(distribuidorId: string): Promise<boolean> {
    const { token, tipo } = await sesionOpcional();
    return core.esDistribuidorDueno(distribuidorId, token, tipo);
}

// === DIRECCIONES ===

export async function obtenerMisDirecciones(): Promise<any[]> {
    const token = await tokenRequerido();
    return conSesion(() => core.obtenerMisDirecciones(token));
}

export async function crearDireccion(datos: {
    calle: string;
    ciudad: string;
    estado: string;
    codigo_postal: string;
    es_predeterminada?: boolean;
}): Promise<boolean> {
    const token = await tokenRequerido();
    return conSesion(() => core.crearDireccion(datos, token));
}

export async function actualizarDireccion(direccionId: string, datos: {
    calle?: string;
    ciudad?: string;
    estado?: string;
    codigo_postal?: string;
    es_predeterminada?: boolean;
}): Promise<boolean> {
    const token = await tokenRequerido();
    return conSesion(() => core.actualizarDireccion(direccionId, datos, token));
}

export async function eliminarDireccion(direccionId: string): Promise<boolean> {
    const token = await tokenRequerido();
    return conSesion(() => core.eliminarDireccion(direccionId, token));
}
