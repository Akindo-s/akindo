'use server'

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchWithAuth } from "./fetch";
import { API_URL } from "./constants";

async function getToken(): Promise<string | undefined> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) redirect("/login");
    return token;
}
export interface ResumenMensual {
    volumen_bruto_mes: number;
    pedidos_activos: number;
    productos_poco_stock: number;
}

export const obtenerResumenMensual = async (umbral_stock: number = 67): Promise<ResumenMensual | null> => {
    const token = await getToken();

    const respuesta = await fetchWithAuth(`/distribuidores/me/resumen?umbral_stock=${umbral_stock}`, {
        method: 'GET',
    }, token);
    
    if (respuesta.ok) {
        return await respuesta.json();
    }
    return null;
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

export const obtenerProductosPocasExistencias = async (umbral_stock: number = 67): Promise<AlertaExistencia[]> => {
    const token = await getToken();

    const respuesta = await fetchWithAuth(`/distribuidores/me/alertas-existencias?umbral_stock=${umbral_stock}`, {
        method: 'GET',
    }, token);
    
    if (respuesta.ok) {
        return await respuesta.json();
    }
    return [];
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

export const obtenerPedidosActivos = async (): Promise<PedidoActivo[]> => {
    const token = await getToken();

    const respuesta = await fetchWithAuth(`/distribuidores/me/pedidos-activos`, {
        method: 'GET',
    }, token);
    
    if (respuesta.ok) {
        return await respuesta.json();
    }
    return [];
}